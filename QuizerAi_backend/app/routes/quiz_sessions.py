# app/routers/quiz_sessions_router.py (Updated for unified model structure)
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
import uuid
from datetime import datetime, timedelta
import logging

from app.database.connection import get_db
from app.models.user_models import User
from app.database.quiz import (
    Quiz, Question, QuizSession, QuizAnswer, QuizAnalytics,
    QuizType, QuizStatus, SessionStatus, TimerType, QuizSource, QuizCreatorType
)
from app.models.shared_models import UserQuizStats
from app.middleware.auth_middleware import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic Models
class QuestionAnswerData(BaseModel):
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
    context_type: str

@router.post("/save", response_model=QuizSessionResponse)
async def save_quiz_session(
    request: Request,
    session_data: QuizSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save quiz session to database for analytics - unified for all quiz types"""
    try:
        session_id = str(uuid.uuid4())
        
        # Step 1: Create or get quiz
        quiz = await create_or_get_quiz(db, session_data, current_user.id)
        
        # Step 2: Save questions
        question_mapping = await save_quiz_questions(db, quiz.id, session_data.questions_data)
        
        # Step 3: Calculate timing
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
        
        # Step 5: Save answers
        questions_saved = await save_quiz_answers(db, session_id, session_data.questions_data, question_mapping)
        
        # Step 6: Update user stats
        await update_user_quiz_stats(db, current_user.id, session_data.score_summary, total_time_seconds, quiz.creator_type)
        
        # Step 7: Update quiz analytics
        await update_quiz_analytics(db, quiz.id, quiz_session)
        
        db.commit()
        
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
            shareable_url=f"/quiz/{session_data.quiz_external_id}/results/{session_id}",
            context_type=quiz_session.context_type
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save quiz session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save quiz session: {str(e)}"
        )

@router.get("/user/{user_id}/sessions")
async def get_user_quiz_sessions(
    user_id: int,
    quiz_type: Optional[str] = None,  # "ai", "teacher", "all"
    context_type: Optional[str] = None,  # "practice", "classroom", "self_study"
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's quiz session history from unified quiz system"""
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Build query
    query = db.query(QuizSession).join(Quiz).filter(QuizSession.user_id == user_id)
    
    # Filter by quiz creator type if specified
    if quiz_type == "ai":
        query = query.filter(Quiz.creator_type == QuizCreatorType.STUDENT)
    elif quiz_type == "teacher":
        query = query.filter(Quiz.creator_type == QuizCreatorType.TEACHER)
    
    # Filter by context type if specified
    if context_type:
        query = query.filter(QuizSession.context_type == context_type)
    
    sessions = query.order_by(QuizSession.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "session_id": session.id,
            "quiz_id": session.quiz.id,
            "quiz_title": session.quiz.title,
            "quiz_external_id": session.quiz.external_id,
            "quiz_creator_type": session.quiz.creator_type.value,
            "quiz_source": session.quiz.source.value,
            "context_type": session.context_type,
            "context_id": session.context_id,
            "percentage_score": session.percentage_score,
            "is_passed": session.is_passed,
            "completion_date": session.end_time,
            "time_taken_minutes": session.total_time_seconds // 60 if session.total_time_seconds else 0,
            "questions_answered": session.questions_answered,
            "questions_skipped": session.questions_skipped,
            "total_questions": session.quiz.total_questions,
            "attempt_number": session.attempt_number,
            "status": session.status.value
        }
        for session in sessions
    ]

@router.get("/{session_id}/detailed")
async def get_session_details(
    session_id: str,
    include_answers: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed session data with Q&A - unified for all quiz types"""
    
    session = db.query(QuizSession).filter(QuizSession.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check access permissions
    if session.user_id != current_user.id and session.quiz.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    session_data = {
        "session": {
            "id": session.id,
            "quiz_id": session.quiz.id,
            "quiz_title": session.quiz.title,
            "quiz_external_id": session.quiz.external_id,
            "quiz_creator_type": session.quiz.creator_type.value,
            "quiz_source": session.quiz.source.value,
            "context_type": session.context_type,
            "context_id": session.context_id,
            "status": session.status.value,
            "percentage_score": session.percentage_score,
            "total_score": session.total_score,
            "max_possible_score": session.max_possible_score,
            "is_passed": session.is_passed,
            "start_time": session.start_time,
            "end_time": session.end_time,
            "total_time_seconds": session.total_time_seconds,
            "questions_answered": session.questions_answered,
            "questions_skipped": session.questions_skipped,
            "attempt_number": session.attempt_number,
            "created_at": session.created_at
        }
    }
    
    if include_answers:
        answers = db.query(QuizAnswer).join(Question).filter(
            QuizAnswer.session_id == session_id
        ).order_by(Question.order_index).all()
        
        session_data["questions_and_answers"] = [
            {
                "question_id": answer.question.id,
                "question_text": answer.question.question_text,
                "question_type": answer.question.question_type.value,
                "user_answer": answer.user_answer,
                "correct_answer": answer.question.correct_answer,
                "is_correct": answer.is_correct,
                "points_earned": answer.points_earned,
                "confidence_level": answer.confidence_level,
                "time_taken_seconds": answer.time_taken_seconds,
                "answer_attempts": answer.answer_attempts,
                "was_skipped": answer.was_skipped,
                "was_reviewed": answer.was_reviewed,
                "explanation": answer.question.explanation,
                "requires_manual_review": answer.requires_manual_review
            }
            for answer in answers
        ]
    
    return session_data

@router.get("/analytics/user/{user_id}")
async def get_user_analytics(
    user_id: int,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive user analytics across all quiz types"""
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Date filter
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get sessions in date range
    sessions = db.query(QuizSession).join(Quiz).filter(
        QuizSession.user_id == user_id,
        QuizSession.created_at >= start_date
    ).all()
    
    # Calculate analytics
    total_sessions = len(sessions)
    completed_sessions = [s for s in sessions if s.status == SessionStatus.COMPLETED]
    ai_sessions = [s for s in sessions if s.quiz.creator_type == QuizCreatorType.STUDENT]
    teacher_sessions = [s for s in sessions if s.quiz.creator_type == QuizCreatorType.TEACHER]
    
    analytics = {
        "period_days": days,
        "total_sessions": total_sessions,
        "completed_sessions": len(completed_sessions),
        "completion_rate": len(completed_sessions) / total_sessions * 100 if total_sessions > 0 else 0,
        
        # Performance metrics
        "average_score": sum(s.percentage_score or 0 for s in completed_sessions) / len(completed_sessions) if completed_sessions else 0,
        "highest_score": max((s.percentage_score or 0 for s in completed_sessions), default=0),
        "total_time_minutes": sum(s.total_time_seconds or 0 for s in sessions) // 60,
        "average_time_per_session": (sum(s.total_time_seconds or 0 for s in sessions) // 60) / total_sessions if total_sessions > 0 else 0,
        
        # Quiz type breakdown
        "ai_quiz_sessions": len(ai_sessions),
        "teacher_quiz_sessions": len(teacher_sessions),
        "ai_average_score": sum(s.percentage_score or 0 for s in ai_sessions if s.status == SessionStatus.COMPLETED) / len([s for s in ai_sessions if s.status == SessionStatus.COMPLETED]) if ai_sessions else 0,
        "teacher_average_score": sum(s.percentage_score or 0 for s in teacher_sessions if s.status == SessionStatus.COMPLETED) / len([s for s in teacher_sessions if s.status == SessionStatus.COMPLETED]) if teacher_sessions else 0,
        
        # Context breakdown
        "practice_sessions": len([s for s in sessions if s.context_type == "practice"]),
        "classroom_sessions": len([s for s in sessions if s.context_type == "classroom"]),
        "self_study_sessions": len([s for s in sessions if s.context_type == "self_study"]),
        
        # Daily activity
        "daily_activity": get_daily_activity(sessions, days),
        
        # Subject performance
        "subject_performance": get_subject_performance(sessions)
    }
    
    return analytics

@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a quiz session (soft delete for analytics)"""
    session = db.query(QuizSession).filter(QuizSession.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Soft delete by changing status
    session.status = SessionStatus.ABANDONED
    db.commit()
    
    return {"message": "Session deleted successfully"}

# Helper Functions
async def create_or_get_quiz(db: Session, session_data: QuizSessionCreate, creator_id: int) -> Quiz:
    """Create or get quiz - unified for all types"""
    existing_quiz = db.query(Quiz).filter(Quiz.external_id == session_data.quiz_external_id).first()
    
    if existing_quiz:
        return existing_quiz
    
    # Determine quiz type based on metadata
    source_type = session_data.quiz_metadata.get('source', 'manual')
    creator_type = QuizCreatorType.STUDENT if source_type != 'manual' else QuizCreatorType.TEACHER
    
    try:
        source_enum = QuizSource(source_type)
    except ValueError:
        source_enum = QuizSource.MANUAL
    
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
        estimated_time_minutes=sum(q.time_taken_seconds for q in session_data.questions_data) // 60,
        ai_generation_metadata=session_data.quiz_metadata if creator_type == QuizCreatorType.STUDENT else None
    )
    
    db.add(quiz)
    db.flush()
    return quiz

async def save_quiz_questions(db: Session, quiz_id: int, questions_data: List[QuestionAnswerData]) -> Dict[int, int]:
    """Save quiz questions - unified for all types"""
    question_mapping = {}
    
    for q_data in questions_data:
        existing_question = db.query(Question).filter(
            Question.quiz_id == quiz_id,
            Question.order_index == q_data.question_index
        ).first()
        
        if existing_question:
            question_mapping[q_data.question_index] = existing_question.id
            # Update question analytics
            existing_question.times_answered += 1
            if q_data.is_correct:
                existing_question.correct_answer_count += 1
            continue
        
        try:
            question_type = QuizType(q_data.question_type.lower())
        except ValueError:
            question_type = QuizType.MCQ
        
        question = Question(
            quiz_id=quiz_id,
            question_text=q_data.question_text,
            question_type=question_type,
            order_index=q_data.question_index,
            points=q_data.points_earned if q_data.is_correct else 1.0,
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
    """Save quiz answers - unified for all types"""
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
            answered_at=datetime.utcnow()
        )
        
        db.add(quiz_answer)
        saved_count += 1
    
    return saved_count

async def get_next_attempt_number(db: Session, quiz_id: int, user_id: int) -> int:
    """Get next attempt number"""
    last_attempt = db.query(QuizSession).filter(
        QuizSession.quiz_id == quiz_id,
        QuizSession.user_id == user_id
    ).order_by(QuizSession.attempt_number.desc()).first()
    
    return (last_attempt.attempt_number + 1) if last_attempt else 1
async def update_user_quiz_stats(db: Session, user_id: int, score_data: Dict[str, Any], time_seconds: int, creator_type: QuizCreatorType):
    """Update user statistics - unified for all quiz types"""
    stats = db.query(UserQuizStats).filter(UserQuizStats.user_id == user_id).first()
    
    if not stats:
        stats = UserQuizStats(
            user_id=user_id,
            # Initialize all numeric fields to prevent None errors
            total_quizzes_taken=0,
            total_quizzes_completed=0,
            total_quizzes_passed=0,
            average_score=0.0,
            highest_score=0.0,
            total_time_spent_minutes=0,
            total_points_earned=0,
            ai_quizzes_taken=0,
            ai_quizzes_completed=0,
            ai_quiz_average_score=0.0,
            papers_attempted=0,
            papers_completed=0,
            paper_quiz_average_score=0.0,
            current_streak=0,
            longest_streak=0,
            improvement_rate=0.0,
            consistency_score=0.0,
            preferred_quiz_length=0,
            average_session_duration=0,
            quiz_taking_frequency=0.0
        )
        db.add(stats)
        db.flush()  # Ensure the record exists before updating
    
    # Helper function to safely increment None values
    def safe_increment(current_value: Optional[int], increment: int = 1) -> int:
        return (current_value or 0) + increment
    
    def safe_add_time(current_value: Optional[int], additional_time: int) -> int:
        return (current_value or 0) + additional_time
    
    def safe_max(current_value: Optional[float], new_value: float) -> float:
        return max(current_value or 0, new_value)
    
    # Update overall stats with safe operations
    stats.total_quizzes_taken = safe_increment(stats.total_quizzes_taken)
    stats.total_quizzes_completed = safe_increment(stats.total_quizzes_completed)
    stats.total_time_spent_minutes = safe_add_time(stats.total_time_spent_minutes, time_seconds // 60)
    
    percentage = score_data.get('percentage', 0)
    stats.highest_score = safe_max(stats.highest_score, percentage)
    
    # Update overall average with safe operations
    current_completed = stats.total_quizzes_completed or 1
    if current_completed > 1:
        current_avg = stats.average_score or 0
        stats.average_score = ((current_avg * (current_completed - 1)) + percentage) / current_completed
    else:
        stats.average_score = percentage
    
    # Update type-specific stats with safe operations
    if creator_type == QuizCreatorType.STUDENT:
        stats.ai_quizzes_taken = safe_increment(stats.ai_quizzes_taken)
        stats.ai_quizzes_completed = safe_increment(stats.ai_quizzes_completed)
        
        ai_completed = stats.ai_quizzes_completed or 1
        if ai_completed > 1:
            current_ai_avg = stats.ai_quiz_average_score or 0
            stats.ai_quiz_average_score = ((current_ai_avg * (ai_completed - 1)) + percentage) / ai_completed
        else:
            stats.ai_quiz_average_score = percentage
    
    elif creator_type == QuizCreatorType.TEACHER:
        stats.papers_attempted = safe_increment(stats.papers_attempted)
        stats.papers_completed = safe_increment(stats.papers_completed)
        
        papers_completed = stats.papers_completed or 1
        if papers_completed > 1:
            current_paper_avg = stats.paper_quiz_average_score or 0
            stats.paper_quiz_average_score = ((current_paper_avg * (papers_completed - 1)) + percentage) / papers_completed
        else:
            stats.paper_quiz_average_score = percentage
    
    # Update streak with safe operations
    current_streak = stats.current_streak or 0
    longest_streak = stats.longest_streak or 0
    
    if score_data.get('isPassed', False):
        stats.current_streak = current_streak + 1
        stats.longest_streak = max(longest_streak, stats.current_streak)
        # Increment passed count
        stats.total_quizzes_passed = safe_increment(stats.total_quizzes_passed)
    else:
        stats.current_streak = 0
    
    # Update points earned
    points_earned = score_data.get('points', 0)
    stats.total_points_earned = safe_add_time(stats.total_points_earned, points_earned)
    
    stats.last_quiz_date = datetime.utcnow()
    
    # Optional: Update session duration tracking
    session_duration_minutes = time_seconds // 60
    current_avg_duration = stats.average_session_duration or 0
    total_sessions = stats.total_quizzes_completed or 1
    
    if total_sessions > 1:
        stats.average_session_duration = ((current_avg_duration * (total_sessions - 1)) + session_duration_minutes) / total_sessions
    else:
        stats.average_session_duration = session_duration_minutes

async def update_quiz_analytics(db: Session, quiz_id: int, session: QuizSession):
    """Update quiz-level analytics"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        return
    
    quiz.total_attempts += 1
    
    if session.status == SessionStatus.COMPLETED:
        completed_sessions = db.query(QuizSession).filter(
            QuizSession.quiz_id == quiz_id,
            QuizSession.status == SessionStatus.COMPLETED
        ).count()
        
        quiz.completion_rate = (completed_sessions / quiz.total_attempts) * 100
        
        if session.percentage_score is not None:
            if completed_sessions > 1:
                quiz.average_score = ((quiz.average_score * (completed_sessions - 1)) + session.percentage_score) / completed_sessions
            else:
                quiz.average_score = session.percentage_score

def get_daily_activity(sessions: List[QuizSession], days: int) -> List[Dict[str, Any]]:
    """Get daily activity breakdown"""
    from collections import defaultdict
    
    daily_counts = defaultdict(int)
    for session in sessions:
        date_key = session.created_at.date().isoformat()
        daily_counts[date_key] += 1
    
    # Fill in missing days
    activity = []
    for i in range(days):
        date = (datetime.utcnow() - timedelta(days=i)).date()
        activity.append({
            "date": date.isoformat(),
            "sessions": daily_counts.get(date.isoformat(), 0)
        })
    
    return list(reversed(activity))

def get_subject_performance(sessions: List[QuizSession]) -> Dict[str, Any]:
    """Get performance breakdown by subject"""
    from collections import defaultdict
    
    subjects = defaultdict(list)
    for session in sessions:
        if session.quiz.subject and session.percentage_score is not None:
            subjects[session.quiz.subject].append(session.percentage_score)
    
    return {
        subject: {
            "average_score": sum(scores) / len(scores),
            "sessions_count": len(scores),
            "highest_score": max(scores),
            "lowest_score": min(scores)
        }
        for subject, scores in subjects.items()
    }
    
    
    
# function for delete the quiz get saved to the database 
@router.delete("/{session_id}", response_model=Dict[str, str])
async def delete_quiz_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a quiz session and all related data"""
    
    # Get the session and verify ownership
    session = db.query(QuizSession).filter(
        QuizSession.id == session_id,
        QuizSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz session not found"
        )
    
    try:
        # Delete related quiz answers first (foreign key constraint)
        db.query(QuizAnswer).filter(
            QuizAnswer.session_id == session_id
        ).delete()
        
        # Delete the session
        db.delete(session)
        db.commit()
        
        return {"message": "Quiz session deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete quiz session"
        )