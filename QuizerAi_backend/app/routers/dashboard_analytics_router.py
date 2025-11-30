# routers/dashboard_analytics_router.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from pydantic import BaseModel
from datetime import datetime, timedelta
from collections import defaultdict
import statistics

from app.database.connection import get_db
from app.models.user_models import User
from app.database.quiz import (
    Quiz, Question, QuizSession, QuizAnswer, QuizAnalytics,
    QuestionPaperTemplate, QuizType, QuizStatus, SessionStatus,
    TimerType, QuizSource, QuizCreatorType
)
from app.models.shared_models import (
    UserQuizStats, Achievement, UserAchievement, Leaderboard
)
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Analytics"])

# Response Models
class OverviewStats(BaseModel):
    total_quizzes: int
    average_score: float
    total_study_hours: float
    current_streak: int
    this_month_quizzes: int
    monthly_change_percentage: float
    is_improving: bool

class PerformanceData(BaseModel):
    period_days: int
    labels: List[str]
    performance_data: Dict[str, List]
    trend_direction: str
    total_sessions_in_period: int
    average_score_in_period: float

class SubjectAnalytics(BaseModel):
    subjects: List[Dict[str, Any]]
    total_subjects: int
    best_subject: str = None
    most_practiced_subject: str = None

@router.get("/analytics")
async def get_full_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complete dashboard analytics"""
    try:
        # Check if user has saved sessions
        session_count = db.query(QuizSession).filter(
            QuizSession.user_id == current_user.id,
            QuizSession.status == SessionStatus.COMPLETED
        ).count()
        
        if session_count == 0:
            return {
                "status": "success",
                "data": {
                    "has_data": False,
                    "message": "No saved quiz sessions found. Complete and save some quizzes to see analytics!"
                }
            }
        
        # Get analytics data
        overview = get_overview_stats_data(db, current_user.id)
        performance_trends = get_performance_trends_data(db, current_user.id, 30)
        subject_analytics = get_subject_analytics_data(db, current_user.id)
        recent_activity = get_recent_activity_data(db, current_user.id, 10)
        
        return {
            "status": "success",
            "data": {
                "has_data": True,
                "overview": overview,
                "performance_trends": performance_trends,
                "subject_analytics": subject_analytics,
                "recent_activity": recent_activity
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate dashboard analytics"
        )

@router.get("/overview", response_model=OverviewStats)
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get overview statistics for dashboard cards"""
    try:
        return get_overview_stats_data(db, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get overview statistics"
        )

@router.get("/performance-trends", response_model=PerformanceData)
async def get_performance_trends(
    days: int = Query(30, description="Number of days to analyze", ge=7, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get performance trends over time"""
    try:
        return get_performance_trends_data(db, current_user.id, days)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get performance trends"
        )

@router.get("/subjects", response_model=SubjectAnalytics)
async def get_subject_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get subject-wise performance analytics"""
    try:
        return get_subject_analytics_data(db, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get subject analytics"
        )

@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = Query(10, description="Number of recent activities", ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent quiz activity"""
    try:
        activity_data = get_recent_activity_data(db, current_user.id, limit)
        return {
            "status": "success",
            "activities": activity_data,
            "total_shown": len(activity_data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recent activity"
        )

# Helper Functions
def get_overview_stats_data(db: Session, user_id: int) -> Dict[str, Any]:
    """Calculate overview statistics"""
    total_sessions = db.query(QuizSession).filter(
        QuizSession.user_id == user_id,
        QuizSession.status == SessionStatus.COMPLETED
    ).count()
    
    if total_sessions == 0:
        return {
            "total_quizzes": 0,
            "average_score": 0,
            "total_study_hours": 0,
            "current_streak": 0,
            "this_month_quizzes": 0,
            "monthly_change_percentage": 0,
            "is_improving": False
        }
    
    # Get user stats
    stats = db.query(UserQuizStats).filter(UserQuizStats.user_id == user_id).first()
    
    # Monthly comparison
    now = datetime.utcnow()
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    this_month_count = db.query(QuizSession).filter(
        QuizSession.user_id == user_id,
        QuizSession.status == SessionStatus.COMPLETED,
        QuizSession.created_at >= this_month_start
    ).count()
    
    return {
        "total_quizzes": stats.total_quizzes_completed if stats else total_sessions,
        "average_score": round(stats.average_score, 1) if stats else 0,
        "total_study_hours": round(stats.total_time_spent_minutes / 60, 1) if stats else 0,
        "current_streak": stats.current_streak if stats else 0,
        "this_month_quizzes": this_month_count,
        "monthly_change_percentage": 0,  # Simplified
        "is_improving": True if stats and stats.current_streak > 0 else False
    }

def get_performance_trends_data(db: Session, user_id: int, days: int) -> Dict[str, Any]:
    """Get performance trends over time"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    sessions = db.query(QuizSession, Quiz).join(
        Quiz, QuizSession.quiz_id == Quiz.id
    ).filter(
        QuizSession.user_id == user_id,
        QuizSession.status == SessionStatus.COMPLETED,
        QuizSession.created_at >= start_date
    ).order_by(QuizSession.created_at.asc()).all()
    
    if not sessions:
        return {
            "period_days": days,
            "labels": [],
            "performance_data": {"scores": [], "quiz_counts": [], "study_hours": []},
            "trend_direction": "stable",
            "total_sessions_in_period": 0,
            "average_score_in_period": 0
        }
    
    # Group by week for better visualization
    weekly_data = defaultdict(list)
    
    for session, quiz in sessions:
        week_start = session.created_at - timedelta(days=session.created_at.weekday())
        week_key = week_start.strftime('%m/%d')
        weekly_data[week_key].append({
            'score': session.percentage_score or 0,
            'time': session.total_time_seconds or 0
        })
    
    labels = []
    scores = []
    quiz_counts = []
    study_hours = []
    
    for week_key in sorted(weekly_data.keys()):
        week_sessions = weekly_data[week_key]
        avg_score = statistics.mean([s['score'] for s in week_sessions])
        total_time = sum([s['time'] for s in week_sessions]) / 3600
        
        labels.append(week_key)
        scores.append(round(avg_score, 1))
        quiz_counts.append(len(week_sessions))
        study_hours.append(round(total_time, 1))
    
    # Determine trend
    trend_direction = "stable"
    if len(scores) >= 2:
        if scores[-1] > scores[0] + 5:
            trend_direction = "improving"
        elif scores[-1] < scores[0] - 5:
            trend_direction = "declining"
    
    return {
        "period_days": days,
        "labels": labels,
        "performance_data": {
            "scores": scores,
            "quiz_counts": quiz_counts,
            "study_hours": study_hours
        },
        "trend_direction": trend_direction,
        "total_sessions_in_period": len(sessions),
        "average_score_in_period": round(statistics.mean([s[0].percentage_score or 0 for s in sessions]), 1)
    }

def get_subject_analytics_data(db: Session, user_id: int) -> Dict[str, Any]:
    """Get subject-wise analytics"""
    subject_data = db.query(
        Quiz.subject,
        QuizSession.percentage_score,
        QuizSession.total_time_seconds
    ).join(
        QuizSession, Quiz.id == QuizSession.quiz_id
    ).filter(
        QuizSession.user_id == user_id,
        QuizSession.status == SessionStatus.COMPLETED
    ).all()
    
    if not subject_data:
        return {"subjects": [], "total_subjects": 0}
    
    # Group by subject
    subjects = defaultdict(list)
    for subject, score, time in subject_data:
        subject_name = subject or "General"
        subjects[subject_name].append({
            'score': score or 0,
            'time': time or 0
        })
    
    subject_stats = []
    for subject, sessions in subjects.items():
        scores = [s['score'] for s in sessions]
        times = [s['time'] for s in sessions]
        
        subject_stats.append({
            'subject': subject,
            'total_quizzes': len(sessions),
            'average_score': round(statistics.mean(scores), 1),
            'best_score': max(scores),
            'total_time_hours': round(sum(times) / 3600, 1),
            'trend': 'stable'  # Simplified
        })
    
    # Sort by performance
    subject_stats.sort(key=lambda x: x['average_score'], reverse=True)
    
    return {
        "subjects": subject_stats,
        "total_subjects": len(subject_stats),
        "best_subject": subject_stats[0]['subject'] if subject_stats else None,
        "most_practiced_subject": max(subject_stats, key=lambda x: x['total_quizzes'])['subject'] if subject_stats else None
    }

def get_recent_activity_data(db: Session, user_id: int, limit: int) -> List[Dict[str, Any]]:
    """Get recent quiz activity"""
    recent_sessions = db.query(QuizSession, Quiz).join(
        Quiz, QuizSession.quiz_id == Quiz.id
    ).filter(
        QuizSession.user_id == user_id,
        QuizSession.status == SessionStatus.COMPLETED
    ).order_by(
        QuizSession.created_at.desc()
    ).limit(limit).all()
    
    activities = []
    for session, quiz in recent_sessions:
        score = session.percentage_score or 0
        performance_level = "excellent" if score >= 90 else "good" if score >= 80 else "average" if score >= 70 else "needs_improvement"
        
        activities.append({
            'session_id': session.id,
            'quiz_title': quiz.title,
            'subject': quiz.subject or 'General',
            'score': score,
            'time_taken_minutes': round((session.total_time_seconds or 0) / 60, 1),
            'questions_answered': session.questions_answered or 0,
            'total_questions': quiz.total_questions or 0,
            'completion_date': session.created_at.isoformat(),
            'performance_level': performance_level,
            'is_passed': session.is_passed or False
        })
    
    return activities