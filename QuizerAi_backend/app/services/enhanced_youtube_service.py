# app/services/enhanced_youtube_service.py
"""
Enhanced YouTube transcription service using multi-source strategy
Implements NoteGPT-style robustness with Groq AI fallbacks
"""

import asyncio
import aiohttp
import concurrent.futures
from typing import List, Dict, Optional, Any, Union
import logging
import re
from datetime import datetime
import hashlib
import json
import os
from urllib.parse import urlparse, parse_qs

from fastapi import HTTPException
from pydantic import BaseModel, Field
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from groq import Groq
# REPLACE with:



logger = logging.getLogger(__name__)

YOUTUBE_COOKIES_PATH = os.getenv("YOUTUBE_COOKIES_PATH", "/app/config/youtube_cookies.txt")


class VideoDocument(BaseModel):
    """Data model for video documents"""
    metadata: Dict[str, Any]
    page_content: str = ""
    
    class Config:
        arbitrary_types_allowed = True
        
        
class TranscriptionResult(BaseModel):
    """Enhanced transcription result model"""
    video_id: str
    transcript: Optional[str] = None
    source: str  # 'youtube_native', 'groq_whisper', 'yt_dlp', 'fallback'
    language: str = "en"
    has_timestamps: bool = False
    confidence_score: float = 0.0
    processing_time: float = 0.0
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = {}


class EnhancedYouTubeService:
    """
    Enhanced YouTube transcription service with multiple fallback methods
    """
    
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.max_concurrent_requests = 5
        self.session_cache = {}
        
        # Groq model preferences
        self.groq_models = {
            "primary": "whisper-large-v3",
            "turbo": "whisper-large-v3-turbo", 
            "english_only": "distil-whisper-large-v3-en"
        }
    
    def extract_video_id(self, url: str) -> Optional[str]:
        """Extract video ID from various YouTube URL formats"""
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})',
            r'youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
            return url
        
        return None
    
    async def get_transcript_native(self, video_id: str) -> TranscriptionResult:
        """
        Method 3: Get transcript from YouTube native API
        """
        start_time = asyncio.get_event_loop().time()
        
        try:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            transcript_list = await loop.run_in_executor(
                None, 
                YouTubeTranscriptApi.list_transcripts,
                video_id
            )
            
            # Try to get English transcript first, then any available
            try:
                transcript = transcript_list.find_transcript(['en', 'en-US'])
            except:
                transcript = transcript_list.find_generated_transcript(['en', 'en-US'])
            
            transcript_data = await loop.run_in_executor(
                None,
                transcript.fetch
            )
            
            # Format transcript
            full_transcript = " ".join([item['text'] for item in transcript_data])
            
            processing_time = asyncio.get_event_loop().time() - start_time
            
            return TranscriptionResult(
                video_id=video_id,
                transcript=full_transcript,
                source="youtube_native",
                language="en",
                has_timestamps=True,
                confidence_score=0.9,
                processing_time=processing_time,
                metadata={
                    "segments": len(transcript_data),
                    "transcript_type": "native"
                }
            )
            
        except Exception as e:
            processing_time = asyncio.get_event_loop().time() - start_time
            logger.warning(f"Native transcript failed for {video_id}: {e}")
            
            return TranscriptionResult(
                video_id=video_id,
                source="youtube_native",
                processing_time=processing_time,
                error_message=str(e)
            )
    
    async def get_transcript_groq_whisper(self, video_id: str, model: str = None) -> TranscriptionResult:
        """
        Production-ready Groq Whisper transcription using direct file download
        """
        start_time = asyncio.get_event_loop().time()
        model = model or self.groq_models["turbo"]
        
        try:
            # Download audio file directly to disk
            audio_file_path = await self._download_audio_direct_production(video_id)
            
            if not audio_file_path:
                raise Exception("Audio download failed")
            
            # Validate file
            file_size = os.path.getsize(audio_file_path)
            if file_size > 20 * 1024 * 1024:  # 20MB limit
                os.unlink(audio_file_path)
                raise Exception(f"File too large: {file_size/1024/1024:.1f}MB")
            
            if file_size < 50000:  # 50KB minimum
                os.unlink(audio_file_path)
                raise Exception("File too small, likely corrupted")
            
            logger.info(f"Audio file ready: {file_size/1024/1024:.1f}MB")
            
            # Transcribe using Groq
            transcript = await self._transcribe_file_production(audio_file_path, model)
            
            processing_time = asyncio.get_event_loop().time() - start_time
            
            return TranscriptionResult(
                video_id=video_id,
                transcript=transcript,
                source="groq_whisper",
                language="en",
                has_timestamps=False,
                confidence_score=0.85,
                processing_time=processing_time,
                metadata={
                    "model_used": model,
                    "file_size_mb": round(file_size/(1024*1024), 2),
                    "download_method": "direct"
                }
            )
            
        except Exception as e:
            processing_time = asyncio.get_event_loop().time() - start_time
            logger.warning(f"Groq Whisper failed for {video_id}: {e}")
            
            return TranscriptionResult(
                video_id=video_id,
                source="groq_whisper",
                processing_time=processing_time,
                error_message=str(e)
            )

    async def _download_audio_direct_production(self, video_id: str) -> Optional[str]:
        """
        Production-ready direct audio download with proper resource management
        """
        audio_file_path = None
        
        try:
            import tempfile
            
            # Create temp directory if needed
            temp_dir = tempfile.gettempdir()
            groq_temp_dir = os.path.join(temp_dir, "groq_audio")
            os.makedirs(groq_temp_dir, exist_ok=True)
            
            # Clean up old files (older than 1 hour)
            await self._cleanup_old_temp_files(groq_temp_dir)
            
            # Set output path
            timestamp = int(asyncio.get_event_loop().time())
            output_template = os.path.join(groq_temp_dir, f"audio_{video_id}_{timestamp}.%(ext)s")
            
            url = f"https://www.youtube.com/watch?v={video_id}"
            
            # Optimized yt-dlp options for production
            ydl_opts = {
                'format': 'worstaudio[filesize<20M]/bestaudio[filesize<20M]/worst[filesize<20M]',
                'outtmpl': output_template,
                'quiet': True,
                'no_warnings': True,
                'cookiefile': '/path/to/youtube_cookies.txt',  # Add this line
                'http_headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                'extract_flat': False,
                'writeinfojson': False,
                'writethumbnail': False,
                'writesubtitles': False,
                'writeautomaticsub': False,
                'ignoreerrors': False,
                'retries': 2,
                'cookiefile': YOUTUBE_COOKIES_PATH if os.path.exists(YOUTUBE_COOKIES_PATH) else None,
            }
            
            loop = asyncio.get_event_loop()
            
            def download_sync():
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    try:
                        ydl.download([url])
                        
                        # Find the downloaded file
                        for ext in ['webm', 'm4a', 'mp3', 'mp4', 'opus', 'aac']:
                            potential_path = output_template.replace('%(ext)s', ext)
                            if os.path.exists(potential_path):
                                return potential_path
                        
                        return None
                        
                    except Exception as e:
                        logger.error(f"yt-dlp download error for {video_id}: {e}")
                        return None
            
            # Download with timeout and semaphore control
            semaphore = getattr(self, '_download_semaphore', None)
            if not semaphore:
                self._download_semaphore = asyncio.Semaphore(3)  # Max 3 concurrent downloads
                semaphore = self._download_semaphore
            
            async with semaphore:
                audio_file_path = await asyncio.wait_for(
                    loop.run_in_executor(None, download_sync),
                    timeout=300  # 5 minutes timeout
                )
            
            if audio_file_path and os.path.exists(audio_file_path):
                logger.info(f"Successfully downloaded: {os.path.basename(audio_file_path)}")
                return audio_file_path
            else:
                logger.error(f"Download failed: no file created for {video_id}")
                return None
                
        except asyncio.TimeoutError:
            logger.error(f"Download timeout for video {video_id}")
            if audio_file_path and os.path.exists(audio_file_path):
                try:
                    os.unlink(audio_file_path)
                except:
                    pass
            return None
            
        except Exception as e:
            logger.error(f"Download error for {video_id}: {e}")
            if audio_file_path and os.path.exists(audio_file_path):
                try:
                    os.unlink(audio_file_path)
                except:
                    pass
            return None

    async def _transcribe_file_production(self, file_path: str, model: str) -> str:
        """
        Production-ready file transcription with proper error handling
        """
        try:
            loop = asyncio.get_event_loop()
            
            def transcribe_sync():
                try:
                    with open(file_path, "rb") as audio_file:
                        response = self.groq_client.audio.transcriptions.create(
                            file=audio_file,
                            model=model,
                            response_format="text",
                            language="en"
                        )
                        return response
                except Exception as e:
                    logger.error(f"Groq API error: {e}")
                    raise
            
            # Transcribe with timeout
            transcript = await asyncio.wait_for(
                loop.run_in_executor(None, transcribe_sync),
                timeout=120  # 2 minutes timeout
            )
            
            if not transcript or len(transcript.strip()) < 10:
                raise Exception("Transcript too short or empty")
            
            logger.info(f"Transcription successful: {len(transcript)} characters")
            return transcript.strip()
            
        except asyncio.TimeoutError:
            raise Exception("Transcription timeout")
        except Exception as e:
            raise Exception(f"Transcription failed: {str(e)}")
        finally:
            # Always clean up the file
            try:
                os.unlink(file_path)
                logger.debug(f"Cleaned up: {os.path.basename(file_path)}")
            except Exception as cleanup_error:
                logger.warning(f"Cleanup failed for {file_path}: {cleanup_error}")

    async def _cleanup_old_temp_files(self, temp_dir: str, max_age_hours: int = 1):
        """
        Clean up temporary files older than max_age_hours
        """
        try:
            import time
            current_time = time.time()
            max_age_seconds = max_age_hours * 3600
            
            if not os.path.exists(temp_dir):
                return
            
            files_cleaned = 0
            for filename in os.listdir(temp_dir):
                if filename.startswith('audio_'):
                    file_path = os.path.join(temp_dir, filename)
                    try:
                        file_age = current_time - os.path.getctime(file_path)
                        if file_age > max_age_seconds:
                            os.unlink(file_path)
                            files_cleaned += 1
                    except Exception:
                        pass  # Ignore individual file errors
            
            if files_cleaned > 0:
                logger.info(f"Cleaned up {files_cleaned} old temp files")
                
        except Exception as e:
            logger.warning(f"Temp file cleanup error: {e}")
    
    async def get_transcript_yt_dlp_fallback(self, video_id: str) -> TranscriptionResult:
        """
        Method 1: Use yt-dlp as fallback with subtitle extraction
        """
        start_time = asyncio.get_event_loop().time()
        
        try:
            url = f"https://www.youtube.com/watch?v={video_id}"
            
            ydl_opts = {
                'writesubtitles': True,
                'writeautomaticsub': True,
                'subtitleslangs': ['en', 'en-US'],
                'skip_download': True,
                'quiet': True,
                'no_warnings': True
            }
            
            loop = asyncio.get_event_loop()
            
            # Extract subtitle info
            def extract_subs():
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=False)
                    
                    # Try to get subtitles
                    subtitles = info.get('subtitles', {})
                    auto_subtitles = info.get('automatic_captions', {})
                    
                    # Prefer manual subtitles, fallback to auto
                    subtitle_data = None
                    if 'en' in subtitles:
                        subtitle_data = subtitles['en']
                    elif 'en' in auto_subtitles:
                        subtitle_data = auto_subtitles['en']
                    elif subtitles:
                        # Use any available language
                        subtitle_data = list(subtitles.values())[0]
                    elif auto_subtitles:
                        subtitle_data = list(auto_subtitles.values())[0]
                    
                    return subtitle_data, info
            
            subtitle_data, video_info = await loop.run_in_executor(None, extract_subs)
            
            if not subtitle_data:
                raise Exception("No subtitles available")
            
            # Download subtitle content
            subtitle_url = None
            for subtitle in subtitle_data:
                if subtitle.get('ext') in ['vtt', 'srv3', 'ttml']:
                    subtitle_url = subtitle.get('url')
                    break
            
            if not subtitle_url:
                raise Exception("No suitable subtitle format found")
            
            # Download and parse subtitle content
            async with aiohttp.ClientSession() as session:
                async with session.get(subtitle_url) as response:
                    subtitle_content = await response.text()
            
            # Parse VTT/SRV3 content (simple extraction)
            transcript_text = self._parse_subtitle_content(subtitle_content)
            
            processing_time = asyncio.get_event_loop().time() - start_time
            
            return TranscriptionResult(
                video_id=video_id,
                transcript=transcript_text,
                source="yt_dlp",
                language="en",
                has_timestamps=True,
                confidence_score=0.75,
                processing_time=processing_time,
                metadata={
                    "title": video_info.get('title', ''),
                    "duration": video_info.get('duration', 0),
                    "subtitle_format": subtitle_data[0].get('ext', '') if subtitle_data else ''
                }
            )
            
        except Exception as e:
            processing_time = asyncio.get_event_loop().time() - start_time
            logger.warning(f"yt-dlp fallback failed for {video_id}: {e}")
            
            return TranscriptionResult(
                video_id=video_id,
                source="yt_dlp",
                processing_time=processing_time,
                error_message=str(e)
            )
    
    async def _extract_audio_url(self, video_id: str) -> Optional[str]:
        """Extract audio stream URL using yt-dlp"""
        try:
            url = f"https://www.youtube.com/watch?v={video_id}"
            
            ydl_opts = {
                'format': 'bestaudio[ext=m4a]/bestaudio/best',
                'quiet': True,
                'no_warnings': True
            }
            
            loop = asyncio.get_event_loop()
            
            def extract_audio():
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=False)
                    return info.get('url')
            
            audio_url = await loop.run_in_executor(None, extract_audio)
            return audio_url
            
        except Exception as e:
            logger.error(f"Audio extraction failed for {video_id}: {e}")
            return None
    
    async def _download_audio_stream(self, audio_url: str, max_size_mb: int = 20) -> bytes:
        """Download audio stream with size limit and optimization"""
        max_size_bytes = max_size_mb * 1024 * 1024
        
        async with aiohttp.ClientSession() as session:
            async with session.get(audio_url) as response:
                # Check content length
                if response.content_length and response.content_length > max_size_bytes:
                    # If too large, download only first portion
                    logger.info(f"Audio too large ({response.content_length}), downloading first {max_size_mb}MB")
                
                audio_data = b""
                async for chunk in response.content.iter_chunked(8192):
                    audio_data += chunk
                    if len(audio_data) > max_size_bytes:
                        break  # Stop at size limit
                
                return audio_data
    
    def _parse_subtitle_content(self, content: str) -> str:
        """Parse VTT or SRV3 subtitle content to extract text"""
        lines = content.split('\n')
        transcript_lines = []
        
        for line in lines:
            line = line.strip()
            
            # Skip VTT headers, timestamps, and empty lines
            if (line.startswith('WEBVTT') or 
                line.startswith('NOTE') or
                '-->' in line or 
                not line or
                line.isdigit()):
                continue
            
            # Remove XML/HTML tags
            line = re.sub(r'<[^>]+>', '', line)
            
            # Remove timing info
            line = re.sub(r'\d+:\d+:\d+\.\d+', '', line)
            
            if line:
                transcript_lines.append(line)
        
        return " ".join(transcript_lines)
    
    async def get_transcript_comprehensive(self, video_id: str) -> TranscriptionResult:
        """
        Get transcript using comprehensive fallback strategy
        """
        methods = [
           
            ("yt_dlp", self.get_transcript_yt_dlp_fallback),           # Fast, free
            ("native", self.get_transcript_native),                    # Fast, free
            ("groq_turbo", lambda vid: self.get_transcript_groq_whisper(vid, self.groq_models["turbo"])),  # Paid, faster
            ("groq_primary", lambda vid: self.get_transcript_groq_whisper(vid, self.groq_models["primary"]))  # Paid, slower
        ]
        
        for method_name, method_func in methods:
            logger.info(f"Trying {method_name} for video {video_id}")
            
            try:
                result = await method_func(video_id)
                
                if result.transcript and len(result.transcript.strip()) > 50:
                    logger.info(f"Success with {method_name} for video {video_id}")
                    return result
                else:
                    logger.info(f"{method_name} returned insufficient content for {video_id}")
                    
            except Exception as e:
                logger.warning(f"{method_name} failed for video {video_id}: {e}")
                continue
        
        # If all methods fail, return error result
        return TranscriptionResult(
            video_id=video_id,
            source="all_failed",
            error_message="All transcription methods failed"
        )
    
    async def process_multiple_videos(self, video_urls: List[str]) -> List[TranscriptionResult]:
        """
        Process multiple videos with controlled concurrency
        """
        video_ids = []
        for url in video_urls:
            video_id = self.extract_video_id(url)
            if video_id:
                video_ids.append(video_id)
        
        if not video_ids:
            raise ValueError("No valid video IDs extracted from URLs")
        
        # Use semaphore to control concurrency
        semaphore = asyncio.Semaphore(self.max_concurrent_requests)
        
        async def process_with_semaphore(video_id: str):
            async with semaphore:
                return await self.get_transcript_comprehensive(video_id)
        
        # Process all videos
        tasks = [process_with_semaphore(video_id) for video_id in video_ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append(
                    TranscriptionResult(
                        video_id=video_ids[i],
                        source="exception",
                        error_message=str(result)
                    )
                )
            else:
                processed_results.append(result)
        
        return processed_results
    
    async def convert_to_legacy_format(self, results: List[TranscriptionResult]) -> List[List[Any]]:
        """
        Convert results to legacy VideoDocument format for compatibility
        """
        formatted_content = []
        
        for result in results:
            # Create VideoDocument
            doc = VideoDocument(
                metadata={
                    "source": result.video_id,
                    "url": f"https://youtube.com/watch?v={result.video_id}",
                    "transcription_source": result.source,
                    "has_transcript": result.transcript is not None,
                    "confidence_score": result.confidence_score,
                    "processing_time": result.processing_time,
                    "language": result.language,
                    "has_timestamps": result.has_timestamps,
                    "fetched_at": datetime.utcnow().isoformat(),
                    **result.metadata
                },
                page_content=result.transcript or "Transcript not available"
            )
            
            # Wrap in list for legacy compatibility
            formatted_content.append([doc])
        
        return formatted_content


# Integration function for existing codebase
async def enhanced_youtube_loader(url_results: Union[str, List[str]]) -> List[List[Any]]:
    """
    Enhanced YouTube loader function compatible with existing codebase
    """
    service = EnhancedYouTubeService()
    
    # Handle URL format
    if isinstance(url_results, str):
        try:
            import ast
            url_results = ast.literal_eval(url_results)
        except:
            url_results = [url_results]
    
    # Process videos
    results = await service.process_multiple_videos(url_results)
    
    # Convert to legacy format
    return await service.convert_to_legacy_format(results)


# Utility functions
async def test_enhanced_loader():
    """Test function for the enhanced loader"""
    test_urls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Example URL
    ]
    
    try:
        results = await enhanced_youtube_loader(test_urls)
        for doc_group in results:
            for doc in doc_group:
                print(f"Video ID: {doc.metadata.get('source')}")
                print(f"Transcription source: {doc.metadata.get('transcription_source')}")
                print(f"Has transcript: {doc.metadata.get('has_transcript')}")
                print(f"Confidence: {doc.metadata.get('confidence_score')}")
                print(f"Content preview: {doc.page_content[:100]}...")
                print("-" * 50)
    except Exception as e:
        print(f"Test failed: {e}")