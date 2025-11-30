# app/routers/quiz_router.py (Updated for unified model structure)
from fastapi import APIRouter, Depends, HTTPException, status, Request , Query
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, validator
import logging
import uuid
from datetime import datetime, timedelta

from app.database.connection import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user_models import User, UserRole
from app.database.quiz import (
    Quiz, Question, QuizSession, QuizAnswer, QuizAnalytics,
    QuestionPaperTemplate, QuizType, QuizStatus, SessionStatus,
    TimerType, QuizSource, QuizCreatorType
)
from app.models.shared_models import UserQuizStats
from app.schemas.quiz_schemas import QuizResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/quiz", tags=["quiz"])
security = HTTPBearer()

# Pydantic Models for Quiz Session Save
class QuestionAnswerData(BaseModel):
    """Individual question answer data"""
    question_index: int
    question_text: str
    question_type: str
    user_answer: Any = None
    correct_answer: Any
    is_correct: bool
    points_earned: float
    time_taken_seconds: int
    was_skipped: bool = False
    answer_attempts: int = 1
    confidence_level: Optional[int] = None

class QuizSessionCreate(BaseModel):
    """Complete quiz session data for saving"""
    quiz_external_id: str
    quiz_metadata: Dict[str, Any]
    questions_data: List[QuestionAnswerData]
    quiz_config: Dict[str, Any]
    score_summary: Dict[str, Any]
    time_tracking: Dict[str, Any]
    session_metadata: Dict[str, Any] = {}
    context_type: str = "practice"  # "classroom", "practice", "self_study"
    context_id: Optional[int] = None

class QuizSessionResponse(BaseModel):
    """Response after saving quiz session"""
    session_id: str
    quiz_id: int
    user_id: int
    status: str
    total_score: float
    percentage_score: float
    is_passed: bool
    questions_saved: int
    created_at: datetime
    shareable_url: str

# Quiz Session Save Endpoint
@router.post("/sessions/save", response_model=QuizSessionResponse)
async def save_quiz_session(
    request: Request,
    session_data: QuizSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save a complete quiz session with all questions, answers, and user performance data."""
    try:
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        # Step 1: Create or find Quiz record
        quiz = await create_or_get_quiz(db, session_data, current_user.id)
        
        # Step 2: Save all questions
        question_mapping = await save_quiz_questions(db, quiz.id, session_data.questions_data)
        
        # Step 3: Calculate session timing
        total_time_seconds = sum(q.time_taken_seconds for q in session_data.questions_data)
        start_time = datetime.utcnow() - timedelta(seconds=total_time_seconds)
        
        # Step 4: Create quiz session
        quiz_session = QuizSession(
            id=session_id,
            quiz_id=quiz.id,
            user_id=current_user.id,
            context_type=session_data.context_type,
            context_id=session_data.context_id,
            status=SessionStatus.COMPLETED,
            attempt_number=await get_next_attempt_number(db, quiz.id, current_user.id),
            session_config=session_data.quiz_config,
            start_time=start_time,
            end_time=datetime.utcnow(),
            total_time_seconds=total_time_seconds,
            current_question_index=len(session_data.questions_data),
            questions_answered=len([q for q in session_data.questions_data if not q.was_skipped]),
            questions_skipped=len([q for q in session_data.questions_data if q.was_skipped]),
            total_score=session_data.score_summary.get('points', 0),
            max_possible_score=session_data.score_summary.get('maxPoints', 0),
            percentage_score=session_data.score_summary.get('percentage', 0),
            is_passed=session_data.score_summary.get('isPassed', False),
            time_per_question=session_data.time_tracking,
            ip_address=str(request.client.host),
            user_agent=request.headers.get("user-agent", ""),
            device_info={"platform": request.headers.get("sec-ch-ua-platform", "unknown")}
        )
        
        db.add(quiz_session)
        db.flush()
        
        # Step 5: Save all individual answers
        questions_saved = await save_quiz_answers(db, session_id, session_data.questions_data, question_mapping)
        
        # Step 6: Update user statistics
        await update_user_quiz_stats(db, current_user.id, quiz_session, quiz)
        
        # Step 7: Update quiz analytics
        await update_quiz_analytics(db, quiz.id, quiz_session)
        
        db.commit()
        
        # Generate shareable URL
        shareable_url = f"/quiz/{session_data.quiz_external_id}/results/{session_id}"
        
        return QuizSessionResponse(
            session_id=session_id,
            quiz_id=quiz.id,
            user_id=current_user.id,
            status=quiz_session.status.value,
            total_score=quiz_session.total_score,
            percentage_score=quiz_session.percentage_score,
            is_passed=quiz_session.is_passed,
            questions_saved=questions_saved,
            created_at=quiz_session.created_at,
            shareable_url=shareable_url
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving quiz session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save quiz session: {str(e)}"
        )

# Helper Functions
async def create_or_get_quiz(db: Session, session_data: QuizSessionCreate, creator_id: int) -> Quiz:
    """Create or retrieve quiz record"""
    # Check if quiz already exists
    existing_quiz = db.query(Quiz).filter(Quiz.external_id == session_data.quiz_external_id).first()
    
    if existing_quiz:
        return existing_quiz
    
    # Determine if this is AI-generated or manual based on source
    source_type = session_data.quiz_metadata.get('source', 'manual')
    creator_type = QuizCreatorType.STUDENT if source_type != 'manual' else QuizCreatorType.TEACHER
    
    # Convert source string to enum
    try:
        source_enum = QuizSource(source_type)
    except ValueError:
        source_enum = QuizSource.MANUAL
    
    # Create new quiz record
    quiz = Quiz(
        external_id=session_data.quiz_external_id,
        title=session_data.quiz_metadata.get('title', 'Generated Quiz'),
        description=session_data.quiz_metadata.get('description', ''),
        creator_id=creator_id,
        creator_type=creator_type,
        subject=session_data.quiz_metadata.get('subject', 'General'),
        difficulty_level=session_data.quiz_metadata.get('difficulty', 'medium'),
        source=source_enum,
        source_content=session_data.quiz_metadata.get('source_content'),
        total_questions=len(session_data.questions_data),
        total_points=sum(q.points_earned for q in session_data.questions_data if q.is_correct),
        language=session_data.quiz_metadata.get('language', 'English'),
        estimated_time_minutes=sum(q.time_taken_seconds for q in session_data.questions_data) // 60,
        # Set AI-specific metadata for AI-generated quizzes
        ai_generation_metadata=session_data.quiz_metadata if creator_type == QuizCreatorType.STUDENT else None
    )
    
    db.add(quiz)
    db.flush()
    return quiz

async def save_quiz_questions(db: Session, quiz_id: int, questions_data: List[QuestionAnswerData]) -> Dict[int, int]:
    """Save all quiz questions and return mapping of question_index -> question_id"""
    question_mapping = {}
    
    for q_data in questions_data:
        # Check if question already exists
        existing_question = db.query(Question).filter(
            Question.quiz_id == quiz_id,
            Question.order_index == q_data.question_index
        ).first()
        
        if existing_question:
            question_mapping[q_data.question_index] = existing_question.id
            continue
        
        # Determine question type
        try:
            question_type = QuizType(q_data.question_type.lower())
        except ValueError:
            question_type = QuizType.MCQ  # Default fallback
        
        # Create new question
        question = Question(
            quiz_id=quiz_id,
            question_text=q_data.question_text,
            question_type=question_type,
            order_index=q_data.question_index,
            points=q_data.points_earned if q_data.is_correct else 1.0,  # Use actual points or default
            correct_answer=str(q_data.correct_answer),
            estimated_time_seconds=q_data.time_taken_seconds,
            times_answered=1,
            correct_answer_count=1 if q_data.is_correct else 0,
            average_time_taken=float(q_data.time_taken_seconds)
        )
        
        db.add(question)
        db.flush()
        question_mapping[q_data.question_index] = question.id
    
    return question_mapping

async def save_quiz_answers(db: Session, session_id: str, questions_data: List[QuestionAnswerData], question_mapping: Dict[int, int]) -> int:
    """Save all quiz user answers and return count of saved answers"""
    saved_count = 0
    
    for q_data in questions_data:
        question_id = question_mapping.get(q_data.question_index)
        if not question_id:
            continue
        
        quiz_answer = QuizAnswer(
            session_id=session_id,
            question_id=question_id,
            user_answer=str(q_data.user_answer) if q_data.user_answer is not None else None,
            is_correct=q_data.is_correct,
            points_earned=q_data.points_earned,
            confidence_level=q_data.confidence_level,
            time_taken_seconds=q_data.time_taken_seconds,
            answer_attempts=q_data.answer_attempts,
            was_skipped=q_data.was_skipped,
            answered_at=datetime.utcnow(),
            requires_manual_review=False  # Set to True for subjective questions if needed
        )
        
        db.add(quiz_answer)
        saved_count += 1
    
    return saved_count

async def get_next_attempt_number(db: Session, quiz_id: int, user_id: int) -> int:
    """Get the next attempt number for this user on this quiz"""
    last_attempt = db.query(QuizSession).filter(
        QuizSession.quiz_id == quiz_id,
        QuizSession.user_id == user_id
    ).order_by(QuizSession.attempt_number.desc()).first()
    
    return (last_attempt.attempt_number + 1) if last_attempt else 1

async def update_user_quiz_stats(db: Session, user_id: int, session: QuizSession, quiz: Quiz):
    """Update user's overall quiz statistics"""
    stats = db.query(UserQuizStats).filter(UserQuizStats.user_id == user_id).first()
    
    if not stats:
        stats = UserQuizStats(user_id=user_id)
        db.add(stats)
    
    # Update overall stats
    stats.total_quizzes_taken += 1
    if session.status == SessionStatus.COMPLETED:
        stats.total_quizzes_completed += 1
        if session.is_passed:
            stats.total_quizzes_passed += 1
    
    # Update scores
    if session.percentage_score is not None:
        if stats.total_quizzes_completed > 1:
            stats.average_score = ((stats.average_score * (stats.total_quizzes_completed - 1)) + session.percentage_score) / stats.total_quizzes_completed
        else:
            stats.average_score = session.percentage_score
        
        if session.percentage_score > stats.highest_score:
            stats.highest_score = session.percentage_score
    
    # Update time spent
    if session.total_time_seconds:
        stats.total_time_spent_minutes += session.total_time_seconds // 60
    
    # Update AI vs regular quiz stats based on creator type
    if quiz.creator_type == QuizCreatorType.STUDENT:
        stats.ai_quizzes_taken += 1
        if session.status == SessionStatus.COMPLETED:
            stats.ai_quizzes_completed += 1
            if session.percentage_score is not None:
                if stats.ai_quizzes_completed > 1:
                    stats.ai_quiz_average_score = ((stats.ai_quiz_average_score * (stats.ai_quizzes_completed - 1)) + session.percentage_score) / stats.ai_quizzes_completed
                else:
                    stats.ai_quiz_average_score = session.percentage_score
    
    stats.last_quiz_date = datetime.utcnow()

async def update_quiz_analytics(db: Session, quiz_id: int, session: QuizSession):
    """Update quiz analytics"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        return
    
    # Update quiz-level analytics
    quiz.total_attempts += 1
    if session.status == SessionStatus.COMPLETED:
        # Update completion rate
        completed_sessions = db.query(QuizSession).filter(
            QuizSession.quiz_id == quiz_id,
            QuizSession.status == SessionStatus.COMPLETED
        ).count()
        
        quiz.completion_rate = (completed_sessions / quiz.total_attempts) * 100
        
        # Update average score
        if session.percentage_score is not None:
            if completed_sessions > 1:
                quiz.average_score = ((quiz.average_score * (completed_sessions - 1)) + session.percentage_score) / completed_sessions
            else:
                quiz.average_score = session.percentage_score

# Quiz retrieval endpoints
@router.get("/{quiz_id}", response_model=dict)
async def get_quiz(
    quiz_id: str,
    include_questions: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a specific quiz by external ID"""
    try:
        quiz = db.query(Quiz).filter(Quiz.external_id == quiz_id).first()
        
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Check access permissions
        if not quiz.is_public and quiz.creator_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        quiz_data = {
            "id": quiz.external_id,
            "title": quiz.title,
            "description": quiz.description,
            "subject": quiz.subject,
            "difficulty": quiz.difficulty_level,
            "creator_type": quiz.creator_type.value,
            "source": quiz.source.value,
            "total_questions": quiz.total_questions,
            "total_points": quiz.total_points,
            "estimated_time_minutes": quiz.estimated_time_minutes,
            "passing_score": quiz.passing_score,
            "max_attempts": quiz.max_attempts,
            "is_public": quiz.is_public,
            "created_at": quiz.created_at
        }
        
        if include_questions:
            questions = db.query(Question).filter(
                Question.quiz_id == quiz.id
            ).order_by(Question.order_index).all()
            
            quiz_data["questions"] = [
                {
                    "id": q.id,
                    "text": q.question_text,
                    "type": q.question_type.value,
                    "options": q.options,
                    "points": q.points,
                    "explanation": q.explanation,
                    "image_url": q.image_url,
                    "video_url": q.video_url,
                    "estimated_time_seconds": q.estimated_time_seconds
                }
                for q in questions
            ]
        
        return quiz_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving quiz {quiz_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving quiz")

@router.get("/{quiz_id}/sessions", response_model=List[dict])
async def get_quiz_sessions(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all sessions for a specific quiz by the current user"""
    try:
        quiz = db.query(Quiz).filter(Quiz.external_id == quiz_id).first()
        
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        sessions = db.query(QuizSession).filter(
            QuizSession.quiz_id == quiz.id,
            QuizSession.user_id == current_user.id
        ).order_by(QuizSession.created_at.desc()).all()
        
        return [
            {
                "session_id": session.id,
                "status": session.status.value,
                "context_type": session.context_type,
                "total_score": session.total_score,
                "percentage_score": session.percentage_score,
                "is_passed": session.is_passed,
                "attempt_number": session.attempt_number,
                "created_at": session.created_at,
                "total_time_seconds": session.total_time_seconds,
                "questions_answered": session.questions_answered,
                "questions_skipped": session.questions_skipped
            }
            for session in sessions
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving quiz sessions for {quiz_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving quiz sessions")

@router.get("/sessions/{session_id}/results", response_model=dict)
async def get_session_results(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed results for a specific session"""
    try:
        session = db.query(QuizSession).filter(QuizSession.id == session_id).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Check if user owns this session or is the quiz creator
        quiz = db.query(Quiz).filter(Quiz.id == session.quiz_id).first()
        if session.user_id != current_user.id and quiz.creator_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get all answers for this session
        answers = db.query(QuizAnswer).join(Question).filter(
            QuizAnswer.session_id == session_id
        ).order_by(Question.order_index).all()
        
        return {
            "session_id": session.id,
            "quiz_title": quiz.title,
            "status": session.status.value,
            "total_score": session.total_score,
            "percentage_score": session.percentage_score,
            "is_passed": session.is_passed,
            "total_time_seconds": session.total_time_seconds,
            "questions_answered": session.questions_answered,
            "questions_skipped": session.questions_skipped,
            "created_at": session.created_at,
            "answers": [
                {
                    "question_text": answer.question.question_text,
                    "user_answer": answer.user_answer,
                    "correct_answer": answer.question.correct_answer,
                    "is_correct": answer.is_correct,
                    "points_earned": answer.points_earned,
                    "time_taken_seconds": answer.time_taken_seconds,
                    "was_skipped": answer.was_skipped,
                    "explanation": answer.question.explanation
                }
                for answer in answers
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving session results {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving session results")

@router.get("/user/stats", response_model=dict)
async def get_user_quiz_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive quiz statistics for the current user"""
    try:
        stats = db.query(UserQuizStats).filter(UserQuizStats.user_id == current_user.id).first()
        
        if not stats:
            return {
                "total_quizzes_taken": 0,
                "total_quizzes_completed": 0,
                "average_score": 0.0,
                "ai_quizzes_taken": 0,
                "papers_attempted": 0
            }
        
        return {
            "total_quizzes_taken": stats.total_quizzes_taken,
            "total_quizzes_completed": stats.total_quizzes_completed,
            "total_quizzes_passed": stats.total_quizzes_passed,
            "average_score": stats.average_score,
            "highest_score": stats.highest_score,
            "ai_quizzes_taken": stats.ai_quizzes_taken,
            "ai_quiz_average_score": stats.ai_quiz_average_score,
            "papers_attempted": stats.papers_attempted,
            "total_time_spent_minutes": stats.total_time_spent_minutes,
            "current_streak": stats.current_streak,
            "longest_streak": stats.longest_streak,
            "last_quiz_date": stats.last_quiz_date
        }
        
    except Exception as e:
        logger.error(f"Error retrieving user quiz stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving quiz statistics")
    
    
    
    
# for teacher 
@router.get("/my-quizzes", response_model=List[QuizResponse])
async def get_my_quizzes(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's quizzes"""
    query = db.query(Quiz).filter(Quiz.user_id == current_user.id)
    
    if status_filter:
        query = query.filter(Quiz.status == status_filter)
    
    quizzes = query.order_by(Quiz.created_at.desc()).offset(skip).limit(limit).all()
    return [QuizResponse.model_validate(quiz, from_attributes=True) for quiz in quizzes]