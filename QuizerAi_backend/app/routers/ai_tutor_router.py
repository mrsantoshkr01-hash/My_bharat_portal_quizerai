# Enhanced AI Tutor Router Implementation
from fastapi import APIRouter, Form, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from typing import Optional
import logging

# Import existing data processing functions
from app.services.data_ingestion_processing import process_pdf, process_image
from app.models.generate_quizes import (
    ai_tutor_explanation, 
    explain_concept, 
    solve_problem_step_by_step, 
    create_study_guide,
    interactive_learning_session       
)

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post('/user_query_for_ai_tutor')
async def user_query_for_ai_tutor(
    query: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    tutor_type: Optional[str] = Form("explanation"),  # explanation, concept, problem, study_guide, interactive
    concept: Optional[str] = Form(None),
    problem: Optional[str] = Form(None),
    topic: Optional[str] = Form(None),
    learning_goal: Optional[str] = Form(None),
    language: Optional[str] = Form("English"),
    difficulty_level: Optional[str] = Form("intermediate"),
    file: Optional[UploadFile] = File(None)
):
    """
    Handle AI tutor queries with different types of tutoring assistance.
    
    Features:
    - Supports PDF processing (up to 2 pages)
    - Supports image processing with OCR
    - Works without content source (general knowledge questions)
    - Multiple tutor modes with specialized responses
    
    Parameters:
    - query: General question or area of focus
    - content: Reference material/text content (optional)
    - tutor_type: Type of tutoring (explanation, concept, problem, study_guide, interactive)
    - concept: Specific concept to explain (for concept type)
    - problem: Problem to solve (for problem type)
    - topic: Topic for study guide (for study_guide type)
    - learning_goal: Learning objective (for interactive type)
    - language: Response language
    - difficulty_level: beginner, intermediate, advanced
    - file: Optional file upload for content (PDF max 2 pages, images)
    """
    
    try:
        # Initialize processed content
        processed_content = content or ""
        content_source = "text_input" if content else None
        
        # Process uploaded file if provided
        if file:
            try:
                # Validate file size (50MB limit)
                max_size = 50 * 1024 * 1024  # 50MB
                file_content = await file.read()
                if len(file_content) > max_size:
                    raise HTTPException(
                        status_code=400, 
                        detail="File size exceeds 50MB limit."
                    )
                
                # Reset file pointer for processing
                await file.seek(0)
                
                # Handle different file types
                if file.content_type == "text/plain":
                    processed_content = file_content.decode('utf-8')
                    content_source = "text_file"
                    
                elif file.content_type == "application/pdf":
                    logger.info(f"Processing PDF file: {file.filename}")
                    # Process PDF with 2-page limit
                    documents = process_pdf(file)  # Assuming process_pdf supports max_pages
                    if documents:
                        # Combine all document content
                        processed_content = "\n\n".join([doc.page_content if hasattr(doc, 'page_content') else str(doc) for doc in documents])
                        content_source = "pdf_file"
                        logger.info(f"PDF processed successfully. Content length: {len(processed_content)}")
                    else:
                        raise HTTPException(
                            status_code=400,
                            detail="Could not extract text from PDF. Please ensure the PDF contains readable text."
                        )
                        
                elif file.content_type in ["image/jpeg", "image/png", "image/jpg"]:
                    logger.info(f"Processing image file: {file.filename}")
                    # Process image with OCR
                    extracted_text = process_image(file)
                    if extracted_text and extracted_text.strip():
                        processed_content = extracted_text
                        content_source = "image_file"
                        logger.info(f"Image processed successfully. Content length: {len(processed_content)}")
                    else:
                        raise HTTPException(
                            status_code=400,
                            detail="Could not extract readable text from image. Please ensure the image contains clear, readable text."
                        )
                else:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Unsupported file type: {file.content_type}. Supported types: text/plain, application/pdf, image/jpeg, image/png, image/jpg"
                    )
                    
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error processing uploaded file: {str(e)}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Error processing uploaded file: {str(e)}"
                )
        
        # Validate difficulty level
        valid_difficulty_levels = ["beginner", "intermediate", "advanced"]
        if difficulty_level not in valid_difficulty_levels:
            logger.warning(f"Invalid difficulty level '{difficulty_level}' provided, defaulting to 'intermediate'")
            difficulty_level = "intermediate"
        
        # Determine if we're working with content-based or general knowledge questions
        has_content = bool(processed_content.strip())
        
        # Get the appropriate input based on tutor type
        user_input = None
        if tutor_type == "explanation":
            user_input = query
            required_field_name = "query"
        elif tutor_type == "concept":
            user_input = concept
            required_field_name = "concept"
        elif tutor_type == "problem":
            user_input = problem
            required_field_name = "problem"
        elif tutor_type == "study_guide":
            user_input = topic
            required_field_name = "topic"
        elif tutor_type == "interactive":
            user_input = learning_goal
            required_field_name = "learning_goal"
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid tutor_type: {tutor_type}. Valid types: explanation, concept, problem, study_guide, interactive"
            )
        
        # Validate required input
        if not user_input or not user_input.strip():
            raise HTTPException(
                status_code=400, 
                detail=f"{required_field_name.replace('_', ' ').title()} is required for {tutor_type} type tutoring."
            )
        
        # For content-dependent tutor types, validate content availability
        content_dependent_types = ["study_guide", "interactive"]
        if tutor_type in content_dependent_types and not has_content:
            raise HTTPException(
                status_code=400, 
                detail=f"{tutor_type.replace('_', ' ').title()} requires reference content. Please provide text content or upload a file."
            )
        
        # Prepare content for AI processing
        # If no content is provided, use empty string to allow general knowledge responses
        final_content = processed_content if has_content else ""
        
        # Add context about content availability for better AI responses
        if not has_content:
            context_note = "Note: No reference material provided. Please provide a general knowledge-based response."
            final_content = context_note
        
        # Route to appropriate tutor function based on tutor_type
        try:
            if tutor_type == "explanation":
                result = await ai_tutor_explanation(
                    text=final_content,
                    question=user_input.strip(),
                    language=language,
                    difficulty_level=difficulty_level
                )
                
            elif tutor_type == "concept":
                result = await explain_concept(
                    concept=user_input.strip(),
                    text=final_content,
                    language=language,
                    difficulty_level=difficulty_level
                )
                
            elif tutor_type == "problem":
                result = await solve_problem_step_by_step(
                    problem=user_input.strip(),
                    text=final_content,
                    language=language,
                    difficulty_level=difficulty_level
                )
                
            elif tutor_type == "study_guide":
                result = await create_study_guide(
                    topic=user_input.strip(),
                    text=final_content,
                    language=language,
                    difficulty_level=difficulty_level
                )
                
            elif tutor_type == "interactive":
                result = await interactive_learning_session(
                    text=final_content,
                    learning_goal=user_input.strip(),
                    language=language,
                    difficulty_level=difficulty_level
                )
                
        except Exception as e:
            logger.error(f"Error in AI tutor processing for {tutor_type}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error generating {tutor_type} response: {str(e)}"
            )
        
        # Return successful response
        return JSONResponse(content={
            "status": "success",
            "tutor_type": tutor_type,
            "language": language,
            "difficulty_level": difficulty_level,
            "result": result,
            "metadata": {
                "content_length": len(processed_content),
                "content_source": content_source,
                "has_reference_content": has_content,
                "user_input_provided": bool(user_input),
                "file_uploaded": bool(file),
                "file_type": file.content_type if file else None,
                "processing_mode": "content_based" if has_content else "general_knowledge"
            }
        })
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
        
    except Exception as e:
        logger.error(f"Unexpected error in AI tutor endpoint: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )

# Enhanced helper endpoint for getting available tutor types
@router.get('/ai_tutor_types')
async def get_ai_tutor_types():
    """Get available AI tutor types and their descriptions with enhanced features."""
    return JSONResponse(content={
        "tutor_types": {
            "explanation": {
                "description": "General tutoring with Q&A based on your question",
                "required_fields": ["query"],
                "optional_fields": ["content", "file", "language", "difficulty_level"],
                "supports_general_knowledge": True,
                "content_requirement": "optional"
            },
            "concept": {
                "description": "Detailed explanation of a specific concept",
                "required_fields": ["concept"],
                "optional_fields": ["content", "file", "language", "difficulty_level"],
                "supports_general_knowledge": True,
                "content_requirement": "optional"
            },
            "problem": {
                "description": "Step-by-step problem solving assistance",
                "required_fields": ["problem"],
                "optional_fields": ["content", "file", "language", "difficulty_level"],
                "supports_general_knowledge": True,
                "content_requirement": "optional"
            },
            "study_guide": {
                "description": "Comprehensive study guide creation",
                "required_fields": ["topic", "content_or_file"],
                "optional_fields": ["language", "difficulty_level"],
                "supports_general_knowledge": False,
                "content_requirement": "required"
            },
            "interactive": {
                "description": "Interactive learning session with exercises",
                "required_fields": ["learning_goal", "content_or_file"],
                "optional_fields": ["language", "difficulty_level"],
                "supports_general_knowledge": False,
                "content_requirement": "required"
            }
        },
        "file_support": {
            "supported_types": ["text/plain", "application/pdf", "image/jpeg", "image/png", "image/jpg"],
            "max_file_size": "50MB",
            "pdf_page_limit": 2,
            "image_processing": "OCR enabled",
            "notes": [
                "PDF files are limited to first 2 pages for processing",
                "Images must contain clear, readable text for OCR",
                "Text files are processed in full"
            ]
        },
        "content_modes": {
            "content_based": "Uses uploaded files or provided text as reference material",
            "general_knowledge": "Answers questions without specific reference material (available for explanation, concept, and problem types)"
        },
        "difficulty_levels": ["beginner", "intermediate", "advanced"],
        "supported_languages": ["English", "Spanish", "French", "German", "Chinese", "Japanese", "Hindi", "Arabic"]
    })

# Enhanced quick explanation endpoint
@router.post('/quick_explanation')
async def quick_explanation(
    query: str = Form(...),
    content: Optional[str] = Form(None),
    language: Optional[str] = Form("English"),
    difficulty_level: Optional[str] = Form("intermediate")
):
    """
    Quick explanation endpoint for simple Q&A with optional content.
    Supports both content-based and general knowledge questions.
    """
    try:
        # Validate difficulty level
        if difficulty_level not in ["beginner", "intermediate", "advanced"]:
            difficulty_level = "intermediate"
        
        # Prepare content
        final_content = content or "Note: No reference material provided. Please provide a general knowledge-based response."
        
        result = await ai_tutor_explanation(
            text=final_content,
            question=query.strip(),
            language=language,
            difficulty_level=difficulty_level
        )
        
        return JSONResponse(content={
            "status": "success",
            "explanation": result,
            "metadata": {
                "language": language,
                "difficulty_level": difficulty_level,
                "content_length": len(content) if content else 0,
                "processing_mode": "content_based" if content else "general_knowledge"
            }
        })
        
    except Exception as e:
        logger.error(f"Error in quick explanation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating explanation: {str(e)}"
        )

# New endpoint for testing file processing capabilities
@router.post('/test_file_processing')
async def test_file_processing(
    file: UploadFile = File(...),
    processing_type: str = Form("extract")  # extract or analyze
):
    """
    Test endpoint for file processing capabilities.
    Useful for debugging PDF and image processing.
    """
    try:
        # Validate file size
        max_size = 50 * 1024 * 1024  # 50MB
        file_content = await file.read()
        if len(file_content) > max_size:
            raise HTTPException(status_code=400, detail="File size exceeds 50MB")
        
        await file.seek(0)  # Reset file pointer
        
        result = {
            "filename": file.filename,
            "content_type": file.content_type,
            "file_size": len(file_content),
            "processing_type": processing_type
        }
        
        if file.content_type == "application/pdf":
            documents = process_pdf(file, max_pages=2)
            if documents:
                extracted_text = "\n\n".join([doc.page_content if hasattr(doc, 'page_content') else str(doc) for doc in documents])
                result.update({
                    "extraction_success": True,
                    "extracted_length": len(extracted_text),
                    "extracted_preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
                    "document_count": len(documents)
                })
            else:
                result.update({
                    "extraction_success": False,
                    "error": "No text could be extracted from PDF"
                })
                
        elif file.content_type in ["image/jpeg", "image/png", "image/jpg"]:
            extracted_text = process_image(file)
            if extracted_text and extracted_text.strip():
                result.update({
                    "extraction_success": True,
                    "extracted_length": len(extracted_text),
                    "extracted_preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
                })
            else:
                result.update({
                    "extraction_success": False,
                    "error": "No readable text found in image"
                })
                
        elif file.content_type == "text/plain":
            text_content = file_content.decode('utf-8')
            result.update({
                "extraction_success": True,
                "extracted_length": len(text_content),
                "extracted_preview": text_content[:500] + "..." if len(text_content) > 500 else text_content
            })
        else:
            result.update({
                "extraction_success": False,
                "error": f"Unsupported file type: {file.content_type}"
            })
        
        return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"Error in test file processing: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )