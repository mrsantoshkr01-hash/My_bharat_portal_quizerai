# app/routers/enhanced_youtube_router.py
"""
Enhanced YouTube router with multi-source transcription support
Integrates seamlessly with existing QuizerAI workflow
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Body
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional, Union
import asyncio
import logging
from datetime import datetime
import json

from pydantic import BaseModel, Field, validator

# Import your existing components
from app.services.enhanced_youtube_service import (
    EnhancedYouTubeService, 
    TranscriptionResult,
    enhanced_youtube_loader
)
from app.models.generate_quizes import (
    generate_quiz,
    generate_summary,
    youtube_search
)

logger = logging.getLogger(__name__)

# Router instance
enhanced_youtube_router = APIRouter(
    prefix="/api/enhanced-youtube",
    tags=["Enhanced YouTube"],
    responses={404: {"description": "Not found"}}
)


# Request/Response Models
class YouTubeURLRequest(BaseModel):
    """Request model for YouTube URL processing"""
    urls: Union[str, List[str]] = Field(..., description="YouTube URL(s) to process")
    language: str = Field(default="English", description="Output language")
    force_ai_transcription: bool = Field(default=False, description="Force AI transcription even if native available")
    
    @validator('urls')
    def validate_urls(cls, v):
        if isinstance(v, str):
            return [v]
        return v


class QuizGenerationRequest(BaseModel):
    """Request model for quiz generation from YouTube content"""
    urls: Union[str, List[str]]
    quiz_type: str = Field(default="mcq", description="Quiz type: mcq, short, true/false")
    language: str = Field(default="English")
    num_questions: str = Field(default="10")
    difficulty_level: str = Field(default="medium", description="easy, medium, hard")


class SummaryRequest(BaseModel):
    """Request model for content summarization"""
    urls: Union[str, List[str]]
    language: str = Field(default="English")
    no_of_words: str = Field(default="400", description="Target word count for summary")


class YouTubeSearchRequest(BaseModel):
    """Request model for YouTube search and content generation"""
    query: str = Field(..., description="Search query")
    num_videos: int = Field(default=3, ge=1, le=10, description="Number of videos to process")
    generate_quiz: bool = Field(default=False)
    generate_summary: bool = Field(default=True)
    language: str = Field(default="English")


class TranscriptionResponse(BaseModel):
    """Response model for transcription results"""
    success: bool
    message: str
    results: List[Dict[str, Any]]
    processing_stats: Dict[str, Any]


class ContentGenerationResponse(BaseModel):
    """Response model for content generation"""
    success: bool
    message: str
    transcription_results: List[Dict[str, Any]]
    content: Dict[str, Any]  # Contains quiz, summary, etc.
    processing_time: float


# Initialize service
youtube_service = EnhancedYouTubeService()


@enhanced_youtube_router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_youtube_videos(request: YouTubeURLRequest):
    """
    Enhanced YouTube transcription endpoint with multiple fallback methods
    """
    try:
        start_time = asyncio.get_event_loop().time()
        
        logger.info(f"Processing {len(request.urls)} YouTube URLs for transcription")
        
        # Process videos using enhanced service
        if request.force_ai_transcription:
            # Force AI transcription for all videos
            video_ids = [youtube_service.extract_video_id(url) for url in request.urls]
            valid_ids = [vid for vid in video_ids if vid]
            
            tasks = [
                youtube_service.get_transcript_groq_whisper(vid) 
                for vid in valid_ids
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        else:
            # Use comprehensive fallback strategy
            results = await youtube_service.process_multiple_videos(request.urls)
        
        # Format results
        formatted_results = []
        successful_transcriptions = 0
        
        for result in results:
            if isinstance(result, Exception):
                formatted_results.append({
                    "video_id": "unknown",
                    "success": False,
                    "error": str(result),
                    "transcript": None,
                    "source": "exception"
                })
            else:
                success = result.transcript is not None
                if success:
                    successful_transcriptions += 1
                
                formatted_results.append({
                    "video_id": result.video_id,
                    "success": success,
                    "transcript": result.transcript,
                    "source": result.source,
                    "confidence_score": result.confidence_score,
                    "processing_time": result.processing_time,
                    "language": result.language,
                    "has_timestamps": result.has_timestamps,
                    "metadata": result.metadata,
                    "error": result.error_message
                })
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        return TranscriptionResponse(
            success=successful_transcriptions > 0,
            message=f"Processed {len(request.urls)} videos, {successful_transcriptions} successful transcriptions",
            results=formatted_results,
            processing_stats={
                "total_videos": len(request.urls),
                "successful_transcriptions": successful_transcriptions,
                "total_processing_time": processing_time,
                "average_time_per_video": processing_time / len(request.urls) if request.urls else 0
            }
        )
        
    except Exception as e:
        logger.error(f"Error in enhanced transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@enhanced_youtube_router.post("/generate-quiz", response_model=ContentGenerationResponse)
async def generate_quiz_from_youtube(request: QuizGenerationRequest):
    """
    Generate quiz from YouTube videos using enhanced transcription
    """
    try:
        start_time = asyncio.get_event_loop().time()
        
        # Get transcriptions using enhanced loader (compatible with existing code)
        documents = await enhanced_youtube_loader(request.urls)
        
        # Extract transcription results for response
        transcription_results = []
        valid_documents = []
        
        for doc_group in documents:
            for doc in doc_group:
                transcription_results.append({
                    "video_id": doc.metadata.get('source'),
                    "success": doc.metadata.get('has_transcript', False),
                    "source": doc.metadata.get('transcription_source'),
                    "confidence_score": doc.metadata.get('confidence_score', 0.0)
                })
                
                if doc.metadata.get('has_transcript', False):
                    valid_documents.extend(doc_group)
        
        if not valid_documents:
            raise HTTPException(
                status_code=400, 
                detail="No valid transcripts obtained from provided URLs"
            )
        
        # Generate quiz using existing function
        quiz_questions = await generate_quiz(
            documents=valid_documents,
            quiz_type=request.quiz_type,
            language=request.language,
            num_questions=request.num_questions,
            difficulty_level=request.difficulty_level
        )
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        return ContentGenerationResponse(
            success=True,
            message=f"Successfully generated {len(quiz_questions)} quiz questions",
            transcription_results=transcription_results,
            content={
                "quiz": quiz_questions,
                "quiz_metadata": {
                    "type": request.quiz_type,
                    "difficulty": request.difficulty_level,
                    "language": request.language,
                    "num_questions": len(quiz_questions)
                }
            },
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error in quiz generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")


@enhanced_youtube_router.post("/generate-summary", response_model=ContentGenerationResponse)
async def generate_summary_from_youtube(request: SummaryRequest):
    """
    Generate summary from YouTube videos using enhanced transcription
    """
    try:
        start_time = asyncio.get_event_loop().time()
        
        # Get transcriptions
        documents = await enhanced_youtube_loader(request.urls)
        
        # Extract transcription results
        transcription_results = []
        valid_documents = []
        
        for doc_group in documents:
            for doc in doc_group:
                transcription_results.append({
                    "video_id": doc.metadata.get('source'),
                    "success": doc.metadata.get('has_transcript', False),
                    "source": doc.metadata.get('transcription_source'),
                    "confidence_score": doc.metadata.get('confidence_score', 0.0)
                })
                
                if doc.metadata.get('has_transcript', False):
                    valid_documents.extend(doc_group)
        
        if not valid_documents:
            raise HTTPException(
                status_code=400, 
                detail="No valid transcripts obtained from provided URLs"
            )
        
        # Generate summary using existing function
        summary = await generate_summary(
            documents=valid_documents,
            language=request.language,
            no_of_words=request.no_of_words
        )
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        return ContentGenerationResponse(
            success=True,
            message="Successfully generated summary",
            transcription_results=transcription_results,
            content={
                "summary": summary,
                "summary_metadata": {
                    "language": request.language,
                    "target_words": request.no_of_words,
                    "actual_words": len(summary.split()) if summary else 0
                }
            },
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error in summary generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")


@enhanced_youtube_router.post("/search-and-generate", response_model=ContentGenerationResponse)
async def search_youtube_and_generate_content(request: YouTubeSearchRequest):
    """
    Search YouTube, get videos, transcribe, and generate content
    """
    try:
        start_time = asyncio.get_event_loop().time()
        
        # Search YouTube using existing function
        search_results = await youtube_search(request.query)
        
        # Parse search results to extract URLs
        if isinstance(search_results, str):
            # Parse the string response to extract URLs
            import re
            urls = re.findall(r'https?://(?:www\.)?youtube\.com/watch\?v=[a-zA-Z0-9_-]{11}', search_results)
            urls = urls[:request.num_videos]  # Limit to requested number
        else:
            urls = search_results[:request.num_videos]
        
        if not urls:
            raise HTTPException(status_code=404, detail="No YouTube videos found for the query")
        
        # Get transcriptions
        documents = await enhanced_youtube_loader(urls)
        
        # Extract transcription results
        transcription_results = []
        valid_documents = []
        
        for doc_group in documents:
            for doc in doc_group:
                transcription_results.append({
                    "video_id": doc.metadata.get('source'),
                    "url": doc.metadata.get('url'),
                    "success": doc.metadata.get('has_transcript', False),
                    "source": doc.metadata.get('transcription_source'),
                    "confidence_score": doc.metadata.get('confidence_score', 0.0)
                })
                
                if doc.metadata.get('has_transcript', False):
                    valid_documents.extend(doc_group)
        
        if not valid_documents:
            raise HTTPException(
                status_code=400, 
                detail="No valid transcripts obtained from search results"
            )
        
        # Generate requested content
        content = {}
        
        if request.generate_summary:
            summary = await generate_summary(
                documents=valid_documents,
                language=request.language,
                no_of_words="500"
            )
            content["summary"] = summary
        
        if request.generate_quiz:
            quiz_questions = await generate_quiz(
                documents=valid_documents,
                quiz_type="mcq",
                language=request.language,
                num_questions="10",
                difficulty_level="medium"
            )
            content["quiz"] = quiz_questions
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        return ContentGenerationResponse(
            success=True,
            message=f"Successfully processed {len(urls)} videos from search query",
            transcription_results=transcription_results,
            content={
                **content,
                "search_metadata": {
                    "query": request.query,
                    "videos_found": len(urls),
                    "videos_processed": len([r for r in transcription_results if r["success"]])
                }
            },
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error in search and generate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search and generate failed: {str(e)}")


@enhanced_youtube_router.get("/health")
async def health_check():
    """Health check endpoint for enhanced YouTube service"""
    try:
        # Test basic functionality
        from app.config.youtube_config_enhanced import validate_environment, youtube_config
        
        validate_environment()
        
        return {
            "status": "healthy",
            "service": "Enhanced YouTube Transcription",
            "version": "2.0",
            "groq_models_available": youtube_config.groq_models,
            "max_concurrent_videos": youtube_config.max_concurrent_videos,
            "fallback_methods": youtube_config.fallback_methods,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )


@enhanced_youtube_router.get("/models")
async def get_available_models():
    """Get information about available Groq models"""
    from app.config.youtube_config_enhanced import youtube_config, get_optimal_model_for_task
    
    return {
        "available_models": youtube_config.groq_models,
        "recommendations": {
            "fastest": get_optimal_model_for_task("fast", "en"),
            "most_accurate": get_optimal_model_for_task("general", "en"), 
            "turbo": get_optimal_model_for_task("turbo", "en")
        },
        "supported_languages": youtube_config.supported_languages
    }


# Legacy compatibility endpoint
@enhanced_youtube_router.post("/legacy/youtube-loader")
async def legacy_youtube_loader_endpoint(
    urls: Union[str, List[str]] = Body(...),
    language: str = Body(default="English")
):
    """
    Legacy compatibility endpoint that returns the same format as original youtube_loader
    """
    try:
        # Use enhanced loader but return in original format
        documents = await enhanced_youtube_loader(urls)
        
        # Return in the exact same format as the original loader
        return {
            "success": True,
            "documents": documents,
            "message": f"Successfully processed {len(documents)} video(s)"
        }
        
    except Exception as e:
        logger.error(f"Error in legacy loader: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Background task for batch processing
@enhanced_youtube_router.post("/batch-process")
async def batch_process_youtube_videos(
    background_tasks: BackgroundTasks,
    urls: List[str] = Body(...),
    user_id: str = Body(...),
    notification_webhook: Optional[str] = Body(default=None)
):
    """
    Background batch processing for large numbers of YouTube videos
    """
    
    async def process_batch():
        try:
            # Process videos in batches of 10
            batch_size = 10
            all_results = []
            
            for i in range(0, len(urls), batch_size):
                batch_urls = urls[i:i + batch_size]
                batch_results = await youtube_service.process_multiple_videos(batch_urls)
                all_results.extend(batch_results)
                
                # Add delay between batches to avoid rate limiting
                if i + batch_size < len(urls):
                    await asyncio.sleep(2)
            
            # Save results or send notification
            if notification_webhook:
                # Send results to webhook
                import aiohttp
                async with aiohttp.ClientSession() as session:
                    await session.post(notification_webhook, json={
                        "user_id": user_id,
                        "status": "completed", 
                        "results": [r.dict() for r in all_results]
                    })
            
            logger.info(f"Batch processing completed for user {user_id}: {len(all_results)} videos")
            
        except Exception as e:
            logger.error(f"Batch processing failed for user {user_id}: {e}")
            
            if notification_webhook:
                import aiohttp
                async with aiohttp.ClientSession() as session:
                    await session.post(notification_webhook, json={
                        "user_id": user_id,
                        "status": "failed",
                        "error": str(e)
                    })
    
    # Add to background tasks
    background_tasks.add_task(process_batch)
    
    return {
        "message": f"Batch processing started for {len(urls)} videos",
        "user_id": user_id,
        "estimated_completion": f"{len(urls) * 10} seconds"
    }