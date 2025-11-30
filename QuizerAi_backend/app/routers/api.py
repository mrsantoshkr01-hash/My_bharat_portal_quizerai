# from fastapi import APIRouter, UploadFile, File, HTTPException, Form 
# from fastapi.responses import JSONResponse
# from app.services.data_ingestion_processing import process_pdf, process_image, process_url_selenium ,process_pptx
# # Import the new YouTube loader
# # from app.models.youtube_transcript_loader import youtube_loader
# from app.models.generate_quizes import generate_quiz , generate_summary ,youtube_search ,youtube_loader
# # for youtube enhanced feature extracting audio using ai (whisper)
# from app.services.enhanced_youtube_service import enhanced_youtube_loader
# from app.config.youtube_config_enhanced import youtube_config
# from app.services.cache_service import CacheService
# from app.tasks.quiz_generation_tasks import generate_quiz_async, generate_summary_async
# from app.tasks.document_processing_tasks import process_document_async
# import uuid
# import tempfile
# import shutil
# import logging
# import json
# from typing import Optional
# import asyncio
# # Set up logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)
# cache_service = CacheService()

# router = APIRouter()
# @router.get("/test")
# async def test():
#     print(f"router is reaching till the test router ")
#     return JSONResponse(
#         {"message":"Hello world"}
#     )
    
    
    
# @router.post("/generate-quiz-async")
# async def generate_quiz_async_endpoint(
#     request: GenerateQuizRequest,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Async quiz generation endpoint
#     Returns task_id immediately for status checking
#     """
#     try:
#         # Generate unique task ID
#         task_id = str(uuid.uuid4())
        
#         # Check rate limit
#         if not await cache_service.check_rate_limit(current_user.id, 'quiz_generation', limit=10, window=60):
#             raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait before generating more quizzes.")
        
#         # Process documents first if file is uploaded
#         content = request.document_text
#         if request.file:
#             # Save file temporarily
#             temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f".{request.file_type}")
#             shutil.copyfileobj(request.file.file, temp_file)
#             temp_file.close()
            
#             # Process document async
#             doc_task_id = f"{task_id}_doc"
#             process_document_async.delay(
#                 task_id=doc_task_id,
#                 file_path=temp_file.name,
#                 file_type=request.file_type,
#                 user_id=current_user.id
#             )
            
#             # Wait for document processing (with timeout)
#             import asyncio
#             for _ in range(30):  # 30 second timeout
#                 doc_status = await cache_service.get_task_status(doc_task_id)
#                 if doc_status and doc_status['status'] == 'completed':
#                     content = json.dumps(doc_status['result']['content'])
#                     break
#                 await asyncio.sleep(1)
        
#         # Enqueue quiz generation task
#         generate_quiz_async.delay(
#             task_id=task_id,
#             content=content,
#             quiz_type=request.quiz_type,
#             language=request.language,
#             num_questions=str(request.num_questions),
#             difficulty_level=request.difficulty_level,
#             user_id=current_user.id,
#             source_metadata={
#                 'source': request.source,
#                 'source_url': request.source_url
#             }
#         )
        
#         # Return task ID immediately
#         return {
#             "status": "accepted",
#             "task_id": task_id,
#             "message": "Quiz generation started. Check status using the task_id.",
#             "status_url": f"/api/task-status/{task_id}"
#         }
        
#     except Exception as e:
#         logger.error(f"Error initiating quiz generation: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/task-status/{task_id}")
# async def get_task_status(
#     task_id: str,
#     current_user: User = Depends(get_current_user)
# ):
#     """
#     Get status of async task
#     """
#     status = await cache_service.get_task_status(task_id)
    
#     if not status:
#         raise HTTPException(status_code=404, detail="Task not found")
    
#     return status

# @router.post("/generate-summary-async")
# async def generate_summary_async_endpoint(
#     request: GenerateSummaryRequest,
#     current_user: User = Depends(get_current_user)
# ):
#     """
#     Async summary generation endpoint
#     """
#     try:
#         task_id = str(uuid.uuid4())
        
#         # Rate limiting
#         if not await cache_service.check_rate_limit(current_user.id, 'summary_generation', limit=10, window=60):
#             raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
#         # Enqueue task
#         generate_summary_async.delay(
#             task_id=task_id,
#             content=request.document_text,
#             language=request.language,
#             word_count=str(request.word_count),
#             user_id=current_user.id
#         )
        
#         return {
#             "status": "accepted",
#             "task_id": task_id,
#             "message": "Summary generation started",
#             "status_url": f"/api/task-status/{task_id}"
#         }
        
#     except Exception as e:
#         logger.error(f"Error initiating summary: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# @router.delete("/task/{task_id}")
# async def cancel_task(
#     task_id: str,
#     current_user: User = Depends(get_current_user)
# ):
#     """
#     Cancel a running task
#     """
#     from app.celery_app import celery_app
    
#     try:
#         celery_app.control.revoke(task_id, terminate=True)
        
#         await cache_service.set_task_status(task_id, {
#             'status': 'cancelled',
#             'message': 'Task cancelled by user'
#         })
        
#         return {"status": "cancelled", "task_id": task_id}
        
#     except Exception as e:
#         logger.error(f"Error cancelling task: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


# @router.post("/upload")
# async def upload_resource(
#     file: UploadFile = File(None),
#     url: str = Form(None),
#     action: str = Form(...),  # Required: "quiz" or "summary"
#     quiz_type: str = Form("mcq"),  # Optional: defaults to "mcq"
#     difficulty_level: str = Form("medium"),  # Optional: defaults to "medium"
#     num_questions: str = Form("10"),  # Optional: defaults to "10"
#     language: str = Form("English"),# Optional: defaults to "English"
#     no_of_words= Form("400")
# ):
#     """
#    Handle resource uploads (PDF, PowerPoint, image, URL) and process them for quiz or summary generation.
#     - File size limit: 50MB
#     - Supported file types: PDF, PPTX, PPT, PNG, JPG, JPEG
#     - Action: Generate quiz or summary
#     - Quiz parameters: quiz_type (mcq, short, long), difficulty_level (easy, medium, hard), num_questions (1-50), language
#     """
#     # Validate inputs
#     if not file and not url:
#         raise HTTPException(status_code=400, detail="Either file or URL must be provided")
    
#     if action not in ["quiz", "summary"]:
#         raise HTTPException(status_code=400, detail="Action must be 'quiz' or 'summary'")
    
#     if action == "quiz":
#         valid_quiz_types = ["mcq", "short", "long"]
#         valid_difficulties = ["easy", "medium", "hard"]
#         try:
#             num_questions_int = int(num_questions)
#             if not 1 <= num_questions_int <= 50:
#                 raise ValueError("Number of questions must be between 1 and 50")
#         except ValueError:
#             raise HTTPException(status_code=400, detail="Invalid num_questions: must be a number between 1 and 50")
        
#         if quiz_type not in valid_quiz_types:
#             raise HTTPException(status_code=400, detail=f"Invalid quiz_type: must be one of {valid_quiz_types}")
#         if difficulty_level not in valid_difficulties:
#             raise HTTPException(status_code=400, detail=f"Invalid difficulty_level: must be one of {valid_difficulties}")
#         if len(language) > 50:  # Basic validation for language
#             raise HTTPException(status_code=400, detail="Language name too long")

#     try:
#         if file:
#             # Validate file size and type
#             max_size = 50 * 1024 * 1024  # 50MB
#             file_size = await file.read()
#             if len(file_size) > max_size:
#                 raise HTTPException(status_code=400, detail="File size exceeds 50MB")
#             await file.seek(0)  # Reset file pointer

#             # Determine file type and process
#             filename_lower = file.filename.lower()
            
#             if filename_lower.endswith(".pdf"):
#                 logger.info(f"🔄 Processing PDF: {file.filename}")
#                 documents = process_pdf(file)
#                 logger.info(f"✅ PDF processing complete: {len(documents)} chunks")
                
#             elif filename_lower.endswith((".pptx", ".ppt")):
#                 logger.info(f"🔄 Processing PowerPoint: {file.filename}")
#                 documents = process_pptx(file)  # New PowerPoint processing
#                 logger.info(f"✅ PowerPoint processing complete: {len(documents)} chunks")
                
#             elif filename_lower.endswith((".png", ".jpg", ".jpeg")):
#                 logger.info(f"🔄 Processing image: {file.filename}")
#                 text = process_image(file)
#                 documents = [text]  # Wrap text as a single document
#                 logger.info(f"✅ Image processing complete")
                
#             else:
#                 raise HTTPException(
#                     status_code=400, 
#                     detail="Unsupported file type. Supported formats: PDF, PPTX, PPT, PNG, JPG, JPEG"
#                 )
#         else:
#             logger.info(f"🔄 Processing URL: {url}")
#             text = process_url_selenium(url)
#             documents = [text]  # Wrap text as a single document
#             logger.info(f"✅ URL processing complete")


#         # Generate quiz or summary based on action
#         if action == "quiz":
#             logger.info(f"🎯 Generating {quiz_type} quiz with {num_questions} questions")
#             result = await generate_quiz(documents, quiz_type, language, num_questions, difficulty_level)
#             return JSONResponse(content={
#                 "result": "quiz", 
#                 "data": result,
#                 "metadata": {
#                     "file_type": file.filename.split('.')[-1] if file else "url",
#                     "quiz_type": quiz_type,
#                     "num_questions": len(result) if isinstance(result, list) else num_questions,
#                     "difficulty": difficulty_level,
#                     "language": language
#                 }
#             })
#         elif action == "summary":
#             logger.info(f"📝 Generating summary with {no_of_words} words")
#             result = await generate_summary(documents, language, no_of_words)
#             return JSONResponse(content={
#                 "result": "summary", 
#                 "data": result,
#                 "metadata": {
#                     "file_type": file.filename.split('.')[-1] if file else "url",
#                     "word_count": no_of_words,
#                     "language": language
#                 }
#             })

#     except Exception as e:
#         logger.error(f"Error in upload_resource: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    
    
    
# # ... inside the form make it required None can be if nothing then also

# # Add these imports at the top if not already present


# async def smart_youtube_loader(url_results):
#     """Smart loader with fallback to original method"""
#     try:
#         # Try enhanced for 30 seconds max
#         enhanced_result = await asyncio.wait_for(
#             enhanced_youtube_loader(url_results),
#             timeout=30
#         )
        
#         # Check if we got actual content
#         has_content = any(
#             doc.page_content and 
#             doc.page_content != "Transcript not available" and
#             len(doc.page_content.strip()) > 50
#             for group in enhanced_result for doc in group
#         )
        
#         if has_content:
#             logger.info("Enhanced strategy succeeded")
#             return enhanced_result
#         else:
#             logger.warning("Enhanced strategy returned no content, using fallback")
#             return await youtube_loader(url_results)  # Your original
            
#     except Exception as e:
#         logger.error(f"Enhanced strategy failed: {e}, using fallback")
#         return await youtube_loader(url_results)  # Your original

# # @router.post('/you_tube_searcher')
# # async def give_prompt_searcher(query: Optional[str]=Form(None) , youtube_url: Optional[str]=Form(None), top_ranker: str=Form("5") ,action: str=Form("content") ,quiz_type: str = "mcq" ,language: str = "English",num_questions: str = "10" ,difficulty_level: str = "medium" ,no_of_words: str = "400") :
    
    
# #     try:
# #         # Additional validation
      
# #         if query:
# #             combined_query = f"{query},{top_ranker}"
# #              # Fix the function call - pass top_ranker properly
# #             url_results = await youtube_search(combined_query)
# #             url_content = await smart_youtube_loader(url_results)  # CHANGED
            
# #             try:
# #                url_content = await asyncio.wait_for(
# #                     enhanced_youtube_loader(url_results), 
# #                     timeout=30
# #                 )
# #             except Exception as e:
# #                 # Fallback to original loader if enhanced fails
# #                 logger.warning(f"Enhanced loader failed, falling back to original: {e}")
# #                 url_content = await smart_youtube_loader(youtube_url)  # CHANGED
            
# #         elif youtube_url:
# #             print(f" url provided by the user is {youtube_url}")
# #             url_content = await smart_youtube_loader(youtube_url)  # CHANGED
# #         else:
# #            raise HTTPException(status_code=400, detail={"message": "Validation Error",
# #                 "errors": [
# #                     {
# #                         "fields": ["query", "youtube_url"],
# #                         "message": "At least one of 'query' or 'youtube_url' must be provided and cannot be empty"
# #                     }
# #                 ]})
        
        
       
       
            
       
       
        
# #         content_list = []
# #         # print(f"url contents from youtube loader is {url_content}")
        
# #         if action == "quiz":
# #             quiz_result = await generate_quiz(url_content , language="English",quiz_type="mcq" ,difficulty_level="medium" ,num_questions = "10")
# #             return JSONResponse(content={"result": "quiz", "data": quiz_result})
# #         elif action == "summary":
# #             summary_result = await generate_summary(url_content, no_of_words="400", language="English")
# #             return JSONResponse(content={"result": "summary", "data": summary_result})
# #         else:
# #             for group in url_content:        # because url_content is [[Doc], [Doc], ...]
# #                 for doc in group:
# #                     content_list.append({
# #                         "channel": doc.metadata.get("source", ""),  # or just doc.metadata
                        
# #                         "content": doc.page_content
# #                     })
                    
                    

# #             # Serialize to JSON string (if you need to send/store it)
# #             json_str = json.dumps(content_list, ensure_ascii=False, indent=2)
# #             print(json_str)
            
# #             return JSONResponse(content={"result": "you_tube_content", "data": json_str})
    
# #     except Exception as e:
# #         logger.error(f"Error in extracting the url and summarizing: {str(e)}")
# #         raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# @router.post('/you_tube_searcher')
# async def give_prompt_searcher(
#     query: Optional[str] = Form(None), 
#     youtube_url: Optional[str] = Form(None), 
#     top_ranker: str = Form("5"),
#     action: str = Form("content"),
#     quiz_type: str = "mcq",
#     language: str = "English",
#     num_questions: str = "10",
#     difficulty_level: str = "medium",
#     no_of_words: str = "400"
# ):
#     try:
#         # Additional validation
#         if query:
#             combined_query = f"{query},{top_ranker}"
#             url_results = await youtube_search(combined_query)
#             url_content = await smart_youtube_loader(url_results)  # UPDATED
            
#         elif youtube_url:
#             print(f" url provided by the user is {youtube_url}")
#             url_content = await smart_youtube_loader(youtube_url)  # UPDATED
#         else:
#             raise HTTPException(status_code=400, detail={
#                 "message": "Validation Error",
#                 "errors": [{
#                     "fields": ["query", "youtube_url"],
#                     "message": "At least one of 'query' or 'youtube_url' must be provided and cannot be empty"
#                 }]
#             })
        
#         content_list = []
        
#         if action == "quiz":
#             quiz_result = await generate_quiz(
#                 url_content, 
#                 language="English",
#                 quiz_type="mcq",
#                 difficulty_level="medium",
#                 num_questions="10"
#             )
#             return JSONResponse(content={"result": "quiz", "data": quiz_result})
            
#         elif action == "summary":
#             summary_result = await generate_summary(
#                 url_content, 
#                 no_of_words="400", 
#                 language="English"
#             )
#             return JSONResponse(content={"result": "summary", "data": summary_result})
            
#         else:
#             for group in url_content:
#                 for doc in group:
#                     content_list.append({
#                         "channel": doc.metadata.get("source", ""),
#                         "content": doc.page_content
#                     })
            
#             json_str = json.dumps(content_list, ensure_ascii=False, indent=2)
#             print(json_str)
            
#             return JSONResponse(content={"result": "you_tube_content", "data": json_str})
    
#     except Exception as e:
#         logger.error(f"Error in extracting the url and summarizing: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# app/routers/api.py

from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import tempfile
import shutil
import logging
import json
import asyncio

# Import services and models
from app.services.data_ingestion_processing import process_pdf, process_image, process_url_selenium, process_pptx
from app.models.generate_quizes import generate_quiz, generate_summary, youtube_search, youtube_loader
from app.services.enhanced_youtube_service import enhanced_youtube_loader
from app.config.youtube_config_enhanced import youtube_config
from app.services.cache_service import CacheService
from app.tasks.quiz_generation_tasks import generate_quiz_async, generate_summary_async
from app.tasks.document_processing_tasks import process_document_async

# Import authentication dependencies (adjust path as needed)
# from app.dependencies import get_current_user, get_db
# from app.models.user import User

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
cache_service = CacheService()

router = APIRouter()

# Pydantic models for request validation
from pydantic import BaseModel

class GenerateQuizRequest(BaseModel):
    document_text: str
    quiz_type: str = "mcq"
    language: str = "English"
    num_questions: int = 10
    difficulty_level: str = "medium"
    source: Optional[str] = None
    source_url: Optional[str] = None
    file_type: Optional[str] = None

class GenerateSummaryRequest(BaseModel):
    document_text: str
    language: str = "English"
    word_count: int = 400


@router.get("/test")
async def test():
    logger.info("Router reached test endpoint")
    return JSONResponse({"message": "Hello world"})


@router.post("/generate-quiz-async")
async def generate_quiz_async_endpoint(
    request: GenerateQuizRequest,
    # Uncomment these when you have authentication set up
    # current_user: User = Depends(get_current_user),
    # db: Session = Depends(get_db)
):
    """
    Async quiz generation endpoint
    Returns task_id immediately for status checking
    """
    try:
        # Generate unique task ID
        task_id = str(uuid.uuid4())
        
        # Uncomment when authentication is set up
        # Check rate limit
        # if not await cache_service.check_rate_limit(current_user.id, 'quiz_generation', limit=10, window=60):
        #     raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait before generating more quizzes.")
        
        # Process documents first if file is uploaded
        content = request.document_text
        
        # Enqueue quiz generation task
        generate_quiz_async.delay(
            task_id=task_id,
            content=content,
            quiz_type=request.quiz_type,
            language=request.language,
            num_questions=str(request.num_questions),
            difficulty_level=request.difficulty_level,
            user_id=None,  # Replace with current_user.id when auth is enabled
            source_metadata={
                'source': request.source,
                'source_url': request.source_url
            }
        )
        
        # Return task ID immediately
        return {
            "status": "accepted",
            "task_id": task_id,
            "message": "Quiz generation started. Check status using the task_id.",
            "status_url": f"/api/task-status/{task_id}"
        }
        
    except Exception as e:
        logger.error(f"Error initiating quiz generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/task-status/{task_id}")
async def get_task_status(
    task_id: str,
    # current_user: User = Depends(get_current_user)
):
    """
    Get status of async task
    """
    status = cache_service.get_task_status(task_id)
    
    if not status:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return status


@router.post("/generate-summary-async")
async def generate_summary_async_endpoint(
    request: GenerateSummaryRequest,
    # current_user: User = Depends(get_current_user)
):
    """
    Async summary generation endpoint
    """
    try:
        task_id = str(uuid.uuid4())
        
        # Rate limiting (uncomment when auth is enabled)
        # if not await cache_service.check_rate_limit(current_user.id, 'summary_generation', limit=10, window=60):
        #     raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Enqueue task
        generate_summary_async.delay(
            task_id=task_id,
            content=request.document_text,
            language=request.language,
            word_count=str(request.word_count),
            user_id=None  # Replace with current_user.id when auth is enabled
        )
        
        return {
            "status": "accepted",
            "task_id": task_id,
            "message": "Summary generation started",
            "status_url": f"/api/task-status/{task_id}"
        }
        
    except Exception as e:
        logger.error(f"Error initiating summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/task/{task_id}")
async def cancel_task(
    task_id: str,
    # current_user: User = Depends(get_current_user)
):
    """
    Cancel a running task
    """
    from app.celery_app import celery_app
    
    try:
        celery_app.control.revoke(task_id, terminate=True)
        
        cache_service.set_task_status(task_id, {
            'status': 'cancelled',
            'message': 'Task cancelled by user'
        })
        
        return {"status": "cancelled", "task_id": task_id}
        
    except Exception as e:
        logger.error(f"Error cancelling task: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_resource(
    file: UploadFile = File(None),
    url: str = Form(None),
    action: str = Form(...),  # Required: "quiz" or "summary"
    quiz_type: str = Form("mcq"),  # Optional: defaults to "mcq"
    difficulty_level: str = Form("medium"),  # Optional: defaults to "medium"
    num_questions: str = Form("10"),  # Optional: defaults to "10"
    language: str = Form("English"),  # Optional: defaults to "English"
    no_of_words: str = Form("400")
):
    """
    Handle resource uploads (PDF, PowerPoint, image, URL) and process them for quiz or summary generation.
    - File size limit: 50MB
    - Supported file types: PDF, PPTX, PPT, PNG, JPG, JPEG
    - Action: Generate quiz or summary
    - Quiz parameters: quiz_type (mcq, short, long), difficulty_level (easy, medium, hard), num_questions (1-50), language
    """
    # Validate inputs
    if not file and not url:
        raise HTTPException(status_code=400, detail="Either file or URL must be provided")
    
    if action not in ["quiz", "summary"]:
        raise HTTPException(status_code=400, detail="Action must be 'quiz' or 'summary'")
    
    if action == "quiz":
        valid_quiz_types = ["mcq", "short", "long"]
        valid_difficulties = ["easy", "medium", "hard"]
        try:
            num_questions_int = int(num_questions)
            if not 1 <= num_questions_int <= 50:
                raise ValueError("Number of questions must be between 1 and 50")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid num_questions: must be a number between 1 and 50")
        
        if quiz_type not in valid_quiz_types:
            raise HTTPException(status_code=400, detail=f"Invalid quiz_type: must be one of {valid_quiz_types}")
        if difficulty_level not in valid_difficulties:
            raise HTTPException(status_code=400, detail=f"Invalid difficulty_level: must be one of {valid_difficulties}")
        if len(language) > 50:  # Basic validation for language
            raise HTTPException(status_code=400, detail="Language name too long")

    try:
        if file:
            # Validate file size and type
            max_size = 50 * 1024 * 1024  # 50MB
            file_size = await file.read()
            if len(file_size) > max_size:
                raise HTTPException(status_code=400, detail="File size exceeds 50MB")
            await file.seek(0)  # Reset file pointer

            # Determine file type and process
            filename_lower = file.filename.lower()
            
            if filename_lower.endswith(".pdf"):
                logger.info(f"🔄 Processing PDF: {file.filename}")
                documents = process_pdf(file)
                logger.info(f"✅ PDF processing complete: {len(documents)} chunks")
                
            elif filename_lower.endswith((".pptx", ".ppt")):
                logger.info(f"🔄 Processing PowerPoint: {file.filename}")
                documents = process_pptx(file)  # New PowerPoint processing
                logger.info(f"✅ PowerPoint processing complete: {len(documents)} chunks")
                
            elif filename_lower.endswith((".png", ".jpg", ".jpeg")):
                logger.info(f"🔄 Processing image: {file.filename}")
                text = process_image(file)
                documents = [text]  # Wrap text as a single document
                logger.info(f"✅ Image processing complete")
                
            else:
                raise HTTPException(
                    status_code=400, 
                    detail="Unsupported file type. Supported formats: PDF, PPTX, PPT, PNG, JPG, JPEG"
                )
        else:
            logger.info(f"🔄 Processing URL: {url}")
            text = process_url_selenium(url)
            documents = [text]  # Wrap text as a single document
            logger.info(f"✅ URL processing complete")

        # Generate quiz or summary based on action
        if action == "quiz":
            logger.info(f"🎯 Generating {quiz_type} quiz with {num_questions} questions")
            result = await generate_quiz(documents, quiz_type, language, num_questions, difficulty_level)
            return JSONResponse(content={
                "result": "quiz", 
                "data": result,
                "metadata": {
                    "file_type": file.filename.split('.')[-1] if file else "url",
                    "quiz_type": quiz_type,
                    "num_questions": len(result) if isinstance(result, list) else num_questions,
                    "difficulty": difficulty_level,
                    "language": language
                }
            })
        elif action == "summary":
            logger.info(f"📝 Generating summary with {no_of_words} words")
            result = await generate_summary(documents, language, no_of_words)
            return JSONResponse(content={
                "result": "summary", 
                "data": result,
                "metadata": {
                    "file_type": file.filename.split('.')[-1] if file else "url",
                    "word_count": no_of_words,
                    "language": language
                }
            })

    except Exception as e:
        logger.error(f"Error in upload_resource: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


async def smart_youtube_loader(url_results):
    """Smart loader with fallback to original method"""
    try:
        # Try enhanced for 30 seconds max
        enhanced_result = await asyncio.wait_for(
            enhanced_youtube_loader(url_results),
            timeout=30
        )
        
        # Check if we got actual content
        has_content = any(
            doc.page_content and 
            doc.page_content != "Transcript not available" and
            len(doc.page_content.strip()) > 50
            for group in enhanced_result for doc in group
        )
        
        if has_content:
            logger.info("Enhanced strategy succeeded")
            return enhanced_result
        else:
            logger.warning("Enhanced strategy returned no content, using fallback")
            return await youtube_loader(url_results)  # Your original
            
    except Exception as e:
        logger.error(f"Enhanced strategy failed: {e}, using fallback")
        return await youtube_loader(url_results)  # Your original


@router.post('/you_tube_searcher')
async def give_prompt_searcher(
    query: Optional[str] = Form(None), 
    youtube_url: Optional[str] = Form(None), 
    top_ranker: str = Form("5"),
    action: str = Form("content"),
    quiz_type: str = Form("mcq"),
    language: str = Form("English"),
    num_questions: str = Form("10"),
    difficulty_level: str = Form("medium"),
    no_of_words: str = Form("400")
):
    try:
        # Validation
        if query:
            combined_query = f"{query},{top_ranker}"
            url_results = await youtube_search(combined_query)
            url_content = await smart_youtube_loader(url_results)
            
        elif youtube_url:
            logger.info(f"URL provided by user: {youtube_url}")
            url_content = await smart_youtube_loader(youtube_url)
        else:
            raise HTTPException(status_code=400, detail={
                "message": "Validation Error",
                "errors": [{
                    "fields": ["query", "youtube_url"],
                    "message": "At least one of 'query' or 'youtube_url' must be provided and cannot be empty"
                }]
            })
        
        content_list = []
        
        if action == "quiz":
            quiz_result = await generate_quiz(
                url_content, 
                language=language,
                quiz_type=quiz_type,
                difficulty_level=difficulty_level,
                num_questions=num_questions
            )
            return JSONResponse(content={"result": "quiz", "data": quiz_result})
            
        elif action == "summary":
            summary_result = await generate_summary(
                url_content, 
                no_of_words=no_of_words, 
                language=language
            )
            return JSONResponse(content={"result": "summary", "data": summary_result})
            
        else:
            for group in url_content:
                for doc in group:
                    content_list.append({
                        "channel": doc.metadata.get("source", ""),
                        "content": doc.page_content
                    })
            
            json_str = json.dumps(content_list, ensure_ascii=False, indent=2)
            logger.info("YouTube content extracted successfully")
            
            return JSONResponse(content={"result": "youtube_content", "data": json_str})
    
    except Exception as e:
        logger.error(f"Error in YouTube searcher: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")