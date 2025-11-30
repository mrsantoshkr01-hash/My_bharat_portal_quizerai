# app/routers/enhanced_question_paper_router.py
"""
Enhanced Question Paper Router with dots.ocr integration
Production-ready implementation for mathematical and complex content extraction
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging
import json
import uuid
from datetime import datetime
from pydantic import BaseModel, validator
import asyncio
import io

# Enhanced imports with dots.ocr integration
from app.services.dots_ocr_service import (
    process_question_paper_with_dots_ocr,
    batch_process_question_papers
)
from app.models.enhanced_question_extractor import extract_questions_from_structured_content
from app.models.question_paper_models import QuestionPaper, PaperQuestion, QuestionType, PaperStatus
from app.models.user_models import User
from app.database.connection import get_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter()

# Enhanced Pydantic models with mathematical content support
class QuestionPaperMetadata(BaseModel):
    title: str
    subject: str
    exam_type: Optional[str] = None
    year: Optional[int] = None
    difficulty: str = "medium"
    time_limit: int = 180
    instructions: Optional[str] = None
    is_public: bool = False
    generate_answers: bool = True
    extraction_mode: str = "full_layout"  # dots.ocr extraction mode
    
    @validator('title')
    def title_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()
    
    @validator('subject')
    def subject_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Subject cannot be empty')
        return v.strip()
    
    @validator('extraction_mode')
    def extraction_mode_must_be_valid(cls, v):
        valid_modes = ['full_layout', 'layout_only', 'ocr_only']
        if v not in valid_modes:
            raise ValueError(f'Extraction mode must be one of: {valid_modes}')
        return v

class EnhancedProcessedQuestion(BaseModel):
    question: str
    type: str = "mcq"
    options: Optional[List[str]] = None
    answer: str
    explanation: Optional[str] = None
    points: int = 10
    page_number: Optional[int] = None
    has_formula: bool = False
    has_table: bool = False
    difficulty: str = "medium"
    
    @validator('question')
    def question_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Question cannot be empty')
        return v.strip()

class EnhancedQuestionPaperUploadResponse(BaseModel):
    """Enhanced response model for dots.ocr processing"""
    result: str = "quiz"
    data: List[EnhancedProcessedQuestion]
    metadata: Dict[str, Any]
    message: str
    extracted_questions_count: int
    processing_time: float
    extraction_details: Dict[str, Any]  # dots.ocr specific details

class EnhancedQuestionPaperSaveRequest(BaseModel):
    """Enhanced save request with mathematical content support"""
    questions: List[EnhancedProcessedQuestion]
    title: str
    subject: str
    exam_type: Optional[str] = None
    year: Optional[int] = None
    difficulty: str = "medium"
    time_limit: int = 180
    instructions: Optional[str] = None
    is_public: bool = False
    extraction_mode: str = "full_layout"

# Utility functions
def get_current_user():
    """Mock function - replace with actual authentication"""
    return {"id": 1, "username": "test_user"}

def generate_enhanced_paper_id(title: str) -> str:
    """Generate unique paper ID with timestamp"""
    clean_title = "".join(c for c in title if c.isalnum() or c.isspace()).replace(" ", "_").lower()
    timestamp = int(datetime.now().timestamp())
    unique_id = str(uuid.uuid4())[:8]
    return f"dotsocr_paper_{clean_title}_{timestamp}_{unique_id}"

async def validate_file_for_dots_ocr(file: UploadFile, max_size_mb: int = 50) -> bool:
    """Enhanced file validation for dots.ocr processing"""
    try:
        # Check file extension
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        supported_extensions = {'.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp'}
        file_ext = file.filename.lower().split('.')[-1]
        
        if f'.{file_ext}' not in supported_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: .{file_ext}. Supported: {supported_extensions}"
            )
        
        # Check file size
        current_pos = file.file.tell()
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(current_pos)
        
        max_size_bytes = max_size_mb * 1024 * 1024
        if size > max_size_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} is too large. Maximum {max_size_mb}MB allowed."
            )
        
        return True
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating file: {str(e)}")
        raise HTTPException(status_code=400, detail="Error validating file")

def format_enhanced_questions_for_frontend(
    questions_data: List[Dict], 
    metadata: Dict
) -> List[EnhancedProcessedQuestion]:
    """Format enhanced questions with mathematical content support"""
    formatted_questions = []
    
    for i, q_data in enumerate(questions_data):
        try:
            # Create EnhancedProcessedQuestion with validation
            formatted_question = EnhancedProcessedQuestion(
                question=q_data.get("question", ""),
                type=q_data.get("type", "mcq").lower(),
                options=q_data.get("options"),
                answer=q_data.get("answer", ""),
                explanation=q_data.get("explanation"),
                points=q_data.get("points", 10),
                page_number=q_data.get("page_number"),
                has_formula=q_data.get("has_formula", False),
                has_table=q_data.get("has_table", False),
                difficulty=q_data.get("difficulty", "medium")
            )
            
            formatted_questions.append(formatted_question)
            
        except Exception as e:
            logger.error(f"Error formatting enhanced question {i}: {str(e)}")
            continue
    
    return formatted_questions

# Main Routes with dots.ocr Integration

@router.post("/upload", response_model=EnhancedQuestionPaperUploadResponse)
async def upload_question_paper_with_dots_ocr(
    files: List[UploadFile] = File(...),
    title: str = Form(...),
    subject: str = Form(...),
    exam_type: Optional[str] = Form(None),
    year: Optional[int] = Form(None),
    difficulty: str = Form("medium"),
    time_limit: int = Form(180),
    instructions: Optional[str] = Form(None),
    is_public: bool = Form(False),
    generate_answers: bool = Form(True),
    extraction_mode: str = Form("full_layout"),
    current_user: dict = Depends(get_current_user)
):
    """
    Enhanced question paper upload with dots.ocr processing
    Handles mathematical symbols, complex layouts, and multilingual content
    """
    start_time = asyncio.get_event_loop().time()
    
    try:
        # Validate inputs using enhanced Pydantic model
        try:
            metadata = QuestionPaperMetadata(
                title=title,
                subject=subject,
                exam_type=exam_type,
                year=year,
                difficulty=difficulty,
                time_limit=time_limit,
                instructions=instructions,
                is_public=is_public,
                generate_answers=generate_answers,
                extraction_mode=extraction_mode
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
        
        # Validate files for dots.ocr
        if not files:
            raise HTTPException(status_code=400, detail="No files uploaded")
        
        for file in files:
            if file.filename:
                await validate_file_for_dots_ocr(file)
        
        logger.info(f"Starting dots.ocr processing for {len(files)} files")
        
        # Process files with dots.ocr
        try:
            if len(files) == 1:
                # Single file processing
                structured_content = await process_question_paper_with_dots_ocr(
                    files[0], 
                    extraction_mode
                )
                processed_files = [files[0].filename]
            else:
                # Batch processing
                structured_content = await batch_process_question_papers(
                    files, 
                    extraction_mode
                )
                processed_files = [f.filename for f in files if f.filename]
            
        except Exception as e:
            logger.error(f"dots.ocr processing failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Document processing failed: {str(e)}"
            )
        
        if not structured_content or len(structured_content.strip()) < 100:
            raise HTTPException(
                status_code=400,
                detail="No meaningful structured content could be extracted from the documents"
            )
        
        logger.info(f"dots.ocr extraction completed: {len(structured_content)} characters")
        
        # Extract questions using enhanced LLM processing
        try:
            questions_data = await extract_questions_from_structured_content(
                structured_content, 
                generate_answers
            )
        except Exception as e:
            logger.error(f"Enhanced question extraction failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Question extraction failed: {str(e)}"
            )
        
        if not questions_data:
            raise HTTPException(
                status_code=400,
                detail="No questions could be extracted from the processed content"
            )
        
        # Format questions for frontend
        formatted_questions = format_enhanced_questions_for_frontend(
            questions_data, 
            metadata.dict()
        )
        
        if not formatted_questions:
            raise HTTPException(
                status_code=400,
                detail="No valid questions could be formatted"
            )
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        # Calculate extraction statistics
        formula_count = sum(1 for q in formatted_questions if q.has_formula)
        table_count = sum(1 for q in formatted_questions if q.has_table)
        page_count = len(set(q.page_number for q in formatted_questions if q.page_number))
        
        # Create enhanced response metadata
        response_metadata = metadata.dict()
        response_metadata.update({
            "processed_files": processed_files,
            "content_length": len(structured_content),
            "processing_time": processing_time,
            "extraction_method": "dots.ocr"
        })
        
        extraction_details = {
            "questions_with_formulas": formula_count,
            "questions_with_tables": table_count,
            "pages_detected": page_count,
            "extraction_mode_used": extraction_mode,
            "mathematical_content_detected": formula_count > 0,
            "table_content_detected": table_count > 0
        }
        
        return EnhancedQuestionPaperUploadResponse(
            result="quiz",
            data=formatted_questions,
            metadata=response_metadata,
            message=f"Successfully extracted {len(formatted_questions)} questions using dots.ocr (with {formula_count} mathematical and {table_count} table-based questions)",
            extracted_questions_count=len(formatted_questions),
            processing_time=processing_time,
            extraction_details=extraction_details
        )
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = asyncio.get_event_loop().time() - start_time
        logger.error(f"Unexpected error in enhanced question paper upload: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Enhanced processing failed after {processing_time:.2f}s: {str(e)}"
        )

@router.post("/save", response_model=dict)
async def save_enhanced_question_paper(
    request: EnhancedQuestionPaperSaveRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Save enhanced question paper with mathematical content support
    """
    try:
        # Validate request
        if not request.questions:
            raise HTTPException(status_code=400, detail="No questions to save")
        
        # Generate enhanced paper ID
        paper_id_str = generate_enhanced_paper_id(request.title)
        
        # Calculate enhanced totals
        total_questions = len(request.questions)
        total_points = sum(q.points for q in request.questions)
        formula_questions = sum(1 for q in request.questions if q.has_formula)
        table_questions = sum(1 for q in request.questions if q.has_table)
        
        # Create enhanced question paper record
        paper = QuestionPaper(
            paper_id=paper_id_str,
            title=request.title.strip(),
            subject=request.subject.strip(),
            exam_type=request.exam_type.strip() if request.exam_type else None,
            year=request.year,
            difficulty=request.difficulty,
            time_limit=request.time_limit,
            instructions=request.instructions.strip() if request.instructions else None,
            is_public=request.is_public,
            generate_answers=True,
            created_by=current_user["id"],
            status=PaperStatus.PROCESSED,
            total_questions=total_questions,
            total_points=total_points,
            created_at=datetime.now(),
            processed_at=datetime.now()
        )
        
        db.add(paper)
        db.commit()
        db.refresh(paper)
        
        # Save enhanced questions
        for i, question_data in enumerate(request.questions):
            try:
                question_type = QuestionType(question_data.type)
            except ValueError:
                question_type = QuestionType.mcq
            
            # Create enhanced question record
            question = PaperQuestion(
                paper_id=paper.id,
                question_index=i,
                question_text=question_data.question,
                question_type=question_type,
                options=question_data.options,
                correct_answer=question_data.answer,
                explanation=question_data.explanation or "",
                points=question_data.points
                # Note: Add additional fields to your PaperQuestion model if needed:
                # page_number=question_data.page_number,
                # has_formula=question_data.has_formula,
                # has_table=question_data.has_table,
                # difficulty=question_data.difficulty
            )
            db.add(question)
        
        db.commit()
        
        logger.info(f"Enhanced paper saved: {paper_id_str} with {total_questions} questions")
        
        return {
            "success": True,
            "message": "Enhanced question paper saved successfully",
            "paper_id": paper_id_str,
            "total_questions": total_questions,
            "total_points": total_points,
            "formula_questions": formula_questions,
            "table_questions": table_questions,
            "status": "saved",
            "extraction_method": "dots.ocr"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving enhanced question paper: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving question paper: {str(e)}")

@router.get("/{paper_id}", response_model=dict)
async def get_enhanced_question_paper(
    paper_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve enhanced question paper with mathematical content support
    """
    try:
        # Get paper with questions
        paper = db.query(QuestionPaper).filter(
            QuestionPaper.paper_id == paper_id
        ).first()
        
        if not paper:
            raise HTTPException(
                status_code=404, 
                detail="Question paper not found"
            )
        
        # Check access permissions
        if not paper.is_public and paper.created_by != current_user["id"]:
            raise HTTPException(
                status_code=403, 
                detail="Access denied"
            )
        
        # Check processing status
        if paper.status != PaperStatus.PROCESSED:
            if paper.status == PaperStatus.PROCESSING:
                raise HTTPException(
                    status_code=202,
                    detail="Quiz is still being processed"
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Quiz processing failed"
                )
        
        # Get questions with proper ordering
        questions = db.query(PaperQuestion).filter(
            PaperQuestion.paper_id == paper.id
        ).order_by(PaperQuestion.question_index).all()
        
        if not questions:
            raise HTTPException(
                status_code=404,
                detail="No questions found for this quiz"
            )
        
        # Format enhanced questions
        formatted_questions = []
        for q in questions:
            try:
                formatted_question = EnhancedProcessedQuestion(
                    question=q.question_text,
                    type=q.question_type.value,
                    options=q.options,
                    answer=q.correct_answer,
                    explanation=q.explanation,
                    points=q.points,
                    # Add these if your model supports them:
                    page_number=getattr(q, 'page_number', None),
                    has_formula=getattr(q, 'has_formula', False),
                    has_table=getattr(q, 'has_table', False),
                    difficulty=getattr(q, 'difficulty', 'medium')
                )
                formatted_questions.append(formatted_question)
            except Exception as e:
                logger.error(f"Error formatting question {q.id}: {e}")
                continue
        
        if not formatted_questions:
            raise HTTPException(
                status_code=500,
                detail="Error formatting questions"
            )
        
        # Create enhanced response
        response = {
            "paper_id": paper.paper_id,
            "title": paper.title,
            "questions": [q.dict() for q in formatted_questions],
            "metadata": {
                "title": paper.title,
                "subject": paper.subject,
                "exam_type": paper.exam_type,
                "year": paper.year,
                "difficulty": paper.difficulty,
                "time_limit": paper.time_limit,
                "instructions": paper.instructions,
                "is_public": paper.is_public,
                "extraction_method": "dots.ocr"
            },
            "total_questions": len(formatted_questions),
            "total_points": sum(q.points for q in formatted_questions),
            "formula_questions": sum(1 for q in formatted_questions if q.has_formula),
            "table_questions": sum(1 for q in formatted_questions if q.has_table),
            "status": paper.status.value,
            "created_at": paper.created_at.isoformat()
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving enhanced question paper {paper_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving question paper")

@router.get("/", response_model=List[dict])
async def list_enhanced_question_papers(
    subject: Optional[str] = None,
    difficulty: Optional[str] = None,
    status: Optional[str] = None,
    my_papers: bool = False,
    has_formulas: Optional[bool] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List enhanced question papers with mathematical content filtering
    """
    try:
        # Validate pagination
        if limit <= 0 or limit > 100:
            limit = 20
        if offset < 0:
            offset = 0
        
        query = db.query(QuestionPaper)
        
        # Apply filters
        if my_papers:
            query = query.filter(QuestionPaper.created_by == current_user["id"])
        else:
            query = query.filter(
                (QuestionPaper.is_public == True) | 
                (QuestionPaper.created_by == current_user["id"])
            )
        
        if subject:
            query = query.filter(QuestionPaper.subject.ilike(f"%{subject}%"))
        
        if difficulty and difficulty in ['easy', 'medium', 'hard']:
            query = query.filter(QuestionPaper.difficulty == difficulty)
        
        if status:
            try:
                status_enum = PaperStatus(status)
                query = query.filter(QuestionPaper.status == status_enum)
            except ValueError:
                pass
        
        # Get results with pagination
        papers = query.order_by(
            QuestionPaper.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        # Format enhanced response
        result = []
        for paper in papers:
            # Get question statistics if has_formulas filter is needed
            question_stats = {}
            if has_formulas is not None:
                questions = db.query(PaperQuestion).filter(
                    PaperQuestion.paper_id == paper.id
                ).all()
                
                # This would require additional fields in your model
                formula_count = sum(1 for q in questions if getattr(q, 'has_formula', False))
                
                if has_formulas and formula_count == 0:
                    continue
                elif not has_formulas and formula_count > 0:
                    continue
                
                question_stats = {
                    "formula_questions": formula_count,
                    "table_questions": sum(1 for q in questions if getattr(q, 'has_table', False))
                }
            
            paper_item = {
                "paper_id": paper.paper_id,
                "title": paper.title,
                "subject": paper.subject,
                "exam_type": paper.exam_type,
                "year": paper.year,
                "difficulty": paper.difficulty,
                "total_questions": paper.total_questions or 0,
                "total_points": paper.total_points or 0,
                "status": paper.status.value,
                "created_at": paper.created_at.isoformat(),
                "extraction_method": "dots.ocr",
                **question_stats
            }
            
            result.append(paper_item)
        
        logger.info(f"Listed {len(result)} enhanced question papers")
        return result
        
    except Exception as e:
        logger.error(f"Error listing enhanced question papers: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving question papers")

# Health and status endpoints
@router.get("/health/dots-ocr")
async def check_dots_ocr_health():
    """Check dots.ocr service health"""
    try:
        from app.services.dots_ocr_service import dots_ocr_service
        is_healthy = await dots_ocr_service.health_check()
        
        return {
            "service": "dots.ocr",
            "status": "healthy" if is_healthy else "unhealthy",
            "vllm_url": dots_ocr_service.vllm_url,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "service": "dots.ocr",
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.get("/health")
async def health_check():
    """Enhanced health check endpoint"""
    return {
        "status": "healthy",
        "service": "enhanced-question-paper-router",
        "features": [
            "dots.ocr integration",
            "mathematical content support", 
            "multilingual processing",
            "complex layout detection"
        ],
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0"
    }