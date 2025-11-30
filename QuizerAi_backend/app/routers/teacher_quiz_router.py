# app/routers/teacher_quiz_router.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database.connection import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user_models import User, UserRole
from app.database.quiz import (
    Quiz, Question, QuizSession, QuizAnswer,
    QuizType, QuizStatus, QuizSource, QuizCreatorType
)
from app.schemas.quiz_schemas import (
    QuizCreate, QuizUpdate, QuizResponse, QuestionCreate, QuestionResponse
)

router = APIRouter()

def verify_teacher(current_user: User):
    """Verify user is a teacher"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access this endpoint"
        )

@router.get("/my-quizzes", response_model=List[Dict[str, Any]])
async def get_teacher_quizzes(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get teacher's manually created quizzes"""
    verify_teacher(current_user)
    
    query = db.query(Quiz).filter(
        Quiz.creator_id == current_user.id,
        Quiz.creator_type == QuizCreatorType.TEACHER
    )
    
    if status_filter:
        try:
            status_enum = QuizStatus(status_filter.upper())
            query = query.filter(Quiz.status == status_enum)
        except ValueError:
            pass
    
    quizzes = query.order_by(Quiz.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": quiz.id,
            "external_id": quiz.external_id,
            "title": quiz.title,
            "description": quiz.description,
            "subject": quiz.subject,
            "difficulty_level": quiz.difficulty_level,
            "status": quiz.status.value,
            "total_questions": quiz.total_questions,
            "total_points": quiz.total_points,
            "estimated_time_minutes": quiz.estimated_time_minutes,
            "is_public": quiz.is_public,
            "is_template": quiz.is_template,
            "created_at": quiz.created_at,
            "updated_at": quiz.updated_at,
            # Quiz settings for assignment
            "timer_type": quiz.timer_type.value,
            "total_time_minutes": quiz.total_time_minutes,
            "shuffle_questions": quiz.shuffle_questions,
            "shuffle_options": quiz.shuffle_options,
            "show_results_immediately": quiz.show_results_immediately,
            "max_attempts": quiz.max_attempts,
            "passing_score": quiz.passing_score,
            # Analytics
            "total_attempts": quiz.total_attempts,
            "average_score": quiz.average_score,
            "completion_rate": quiz.completion_rate
        }
        for quiz in quizzes
    ]

@router.post("/", response_model=Dict[str, Any])
async def create_teacher_quiz(
    quiz_data: QuizCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new quiz as a teacher"""
    verify_teacher(current_user)
    
    # Generate external ID for the quiz
    import uuid
    external_id = str(uuid.uuid4())
    
    # Create quiz with teacher-specific settings
    quiz = Quiz(
        external_id=external_id,
        title=quiz_data.title,
        description=quiz_data.description,
        creator_id=current_user.id,
        creator_type=QuizCreatorType.TEACHER,
        subject=quiz_data.subject,
        difficulty_level=quiz_data.difficulty_level,
        source=QuizSource.MANUAL,  # Teacher manually creates
        is_public=quiz_data.is_public,
        is_template=quiz_data.is_template,
        # Timer settings
        timer_type=quiz_data.timer_type,
        total_time_minutes=quiz_data.total_time_minutes,
        per_question_time_seconds=quiz_data.per_question_time_seconds,
        # Quiz settings
        shuffle_questions=quiz_data.shuffle_questions,
        shuffle_options=quiz_data.shuffle_options,
        show_results_immediately=quiz_data.show_results_immediately,
        allow_review=quiz_data.allow_review,
        max_attempts=quiz_data.max_attempts,
        allow_skip=quiz_data.allow_skip,
        show_correct_answers=quiz_data.show_correct_answers,
        passing_score=quiz_data.passing_score,
        # Teacher-specific
        instructions=quiz_data.instructions,
        prerequisites=quiz_data.prerequisites,
        tags=quiz_data.tags,
        language="English"
    )
    
    db.add(quiz)
    db.flush()
    
    # Add questions if provided
    if quiz_data.questions:
        total_points = 0
        estimated_time = 0
        
        for i, q_data in enumerate(quiz_data.questions):
            question = Question(
                quiz_id=quiz.id,
                question_text=q_data.question_text,
                question_type=q_data.question_type,
                order_index=i,
                points=q_data.points,
                options=q_data.options,
                correct_answer=q_data.correct_answer,
                explanation=q_data.explanation,
                image_url=q_data.image_url,
                video_url=q_data.video_url,
                is_required=q_data.is_required,
                partial_credit=q_data.partial_credit,
                estimated_time_seconds=q_data.estimated_time_seconds,
                difficulty=q_data.difficulty,
                tags=q_data.tags
            )
            db.add(question)
            total_points += q_data.points
            estimated_time += q_data.estimated_time_seconds
        
        # Update quiz totals
        quiz.total_questions = len(quiz_data.questions)
        quiz.total_points = total_points
        quiz.estimated_time_minutes = estimated_time // 60
    
    db.commit()
    db.refresh(quiz)
    
    return {
        "id": quiz.id,
        "external_id": quiz.external_id,
        "title": quiz.title,
        "message": "Quiz created successfully"
    }

@router.get("/{quiz_id}", response_model=Dict[str, Any])
async def get_teacher_quiz(
    quiz_id: int,
    include_questions: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get teacher's quiz by ID"""
    verify_teacher(current_user)
    
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.creator_id == current_user.id,
        Quiz.creator_type == QuizCreatorType.TEACHER
    ).first()
    
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    quiz_data = {
        "id": quiz.id,
        "external_id": quiz.external_id,
        "title": quiz.title,
        "description": quiz.description,
        "subject": quiz.subject,
        "difficulty_level": quiz.difficulty_level,
        "status": quiz.status.value,
        "total_questions": quiz.total_questions,
        "total_points": quiz.total_points,
        "estimated_time_minutes": quiz.estimated_time_minutes,
        "timer_type": quiz.timer_type.value,
        "total_time_minutes": quiz.total_time_minutes,
        "per_question_time_seconds": quiz.per_question_time_seconds,
        "shuffle_questions": quiz.shuffle_questions,
        "shuffle_options": quiz.shuffle_options,
        "show_results_immediately": quiz.show_results_immediately,
        "allow_review": quiz.allow_review,
        "max_attempts": quiz.max_attempts,
        "allow_skip": quiz.allow_skip,
        "show_correct_answers": quiz.show_correct_answers,
        "passing_score": quiz.passing_score,
        "instructions": quiz.instructions,
        "prerequisites": quiz.prerequisites,
        "tags": quiz.tags,
        "is_public": quiz.is_public,
        "is_template": quiz.is_template,
        "created_at": quiz.created_at,
        "updated_at": quiz.updated_at
    }
    
    if include_questions:
        questions = db.query(Question).filter(
            Question.quiz_id == quiz.id
        ).order_by(Question.order_index).all()
        
        quiz_data["questions"] = [
            {
                "id": q.id,
                "question_text": q.question_text,
                "question_type": q.question_type.value,
                "order_index": q.order_index,
                "points": q.points,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
                "image_url": q.image_url,
                "video_url": q.video_url,
                "is_required": q.is_required,
                "partial_credit": q.partial_credit,
                "estimated_time_seconds": q.estimated_time_seconds,
                "difficulty": q.difficulty,
                "tags": q.tags,
                # Analytics for teacher
                "times_answered": q.times_answered,
                "correct_answer_count": q.correct_answer_count,
                "success_rate": (q.correct_answer_count / q.times_answered * 100) if q.times_answered > 0 else 0
            }
            for q in questions
        ]
    
    return quiz_data

@router.put("/{quiz_id}", response_model=Dict[str, Any])
async def update_teacher_quiz(
    quiz_id: int,
    quiz_data: QuizUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update teacher's quiz"""
    verify_teacher(current_user)
    
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.creator_id == current_user.id,
        Quiz.creator_type == QuizCreatorType.TEACHER
    ).first()
    
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Update fields
    for field, value in quiz_data.dict(exclude_unset=True).items():
        setattr(quiz, field, value)
    
    quiz.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(quiz)
    
    return {
        "id": quiz.id,
        "title": quiz.title,
        "message": "Quiz updated successfully"
    }

@router.delete("/{quiz_id}")
async def delete_teacher_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete teacher's quiz (soft delete)"""
    verify_teacher(current_user)
    
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.creator_id == current_user.id,
        Quiz.creator_type == QuizCreatorType.TEACHER
    ).first()
    
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Check if quiz is used in any active assignments
    from app.models.classroom_models import ClassroomQuizAssignment, AssignmentStatus
    active_assignments = db.query(ClassroomQuizAssignment).filter(
        ClassroomQuizAssignment.quiz_id == quiz.id,
        ClassroomQuizAssignment.status == AssignmentStatus.ACTIVE
    ).count()
    
    if active_assignments > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete quiz that is used in active assignments"
        )
    
    # Soft delete - change status to archived
    quiz.status = QuizStatus.ARCHIVED
    quiz.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Quiz deleted successfully"}

# Question management endpoints
@router.post("/{quiz_id}/questions", response_model=Dict[str, Any])
async def add_question_to_quiz(
    quiz_id: int,
    question_data: QuestionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add question to teacher's quiz"""
    verify_teacher(current_user)
    
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.creator_id == current_user.id,
        Quiz.creator_type == QuizCreatorType.TEACHER
    ).first()
    
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Get next order index
    last_question = db.query(Question).filter(
        Question.quiz_id == quiz_id
    ).order_by(Question.order_index.desc()).first()
    
    next_order = (last_question.order_index + 1) if last_question else 0
    
    question = Question(
        quiz_id=quiz.id,
        question_text=question_data.question_text,
        question_type=question_data.question_type,
        order_index=next_order,
        points=question_data.points,
        options=question_data.options,
        correct_answer=question_data.correct_answer,
        explanation=question_data.explanation,
        image_url=question_data.image_url,
        video_url=question_data.video_url,
        is_required=question_data.is_required,
        partial_credit=question_data.partial_credit,
        estimated_time_seconds=question_data.estimated_time_seconds,
        difficulty=question_data.difficulty,
        tags=question_data.tags
    )
    
    db.add(question)
    
    # Update quiz totals
    quiz.total_questions += 1
    quiz.total_points += question_data.points
    quiz.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(question)
    
    return {
        "id": question.id,
        "quiz_id": quiz.id,
        "message": "Question added successfully"
    }

@router.get("/{quiz_id}/analytics", response_model=Dict[str, Any])
async def get_quiz_analytics(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics for teacher's quiz"""
    verify_teacher(current_user)
    
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.creator_id == current_user.id,
        Quiz.creator_type == QuizCreatorType.TEACHER
    ).first()
    
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Get session data
    sessions = db.query(QuizSession).filter(QuizSession.quiz_id == quiz.id).all()
    completed_sessions = [s for s in sessions if s.status.value == "completed"]
    
    # Calculate analytics
    analytics = {
        "quiz_id": quiz.id,
        "quiz_title": quiz.title,
        "total_attempts": len(sessions),
        "completed_attempts": len(completed_sessions),
        "completion_rate": (len(completed_sessions) / len(sessions) * 100) if sessions else 0,
        "average_score": sum(s.percentage_score for s in completed_sessions if s.percentage_score) / len(completed_sessions) if completed_sessions else 0,
        "highest_score": max((s.percentage_score for s in completed_sessions if s.percentage_score), default=0),
        "lowest_score": min((s.percentage_score for s in completed_sessions if s.percentage_score), default=0),
        "average_time_minutes": sum(s.total_time_seconds for s in completed_sessions if s.total_time_seconds) // 60 / len(completed_sessions) if completed_sessions else 0,
        "pass_rate": sum(1 for s in completed_sessions if s.is_passed) / len(completed_sessions) * 100 if completed_sessions else 0
    }
    
    return analytics