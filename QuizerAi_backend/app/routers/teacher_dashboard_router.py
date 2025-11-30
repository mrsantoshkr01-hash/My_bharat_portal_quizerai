# app/routers/teacher_dashboard_router.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json

from app.database.connection import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user_models import User, UserRole
from app.database.quiz import (
    Quiz, Question, QuizSession, QuizAnswer,
    QuizType, QuizStatus, SessionStatus, QuizCreatorType
)
from app.models.classroom_models import (
    ClassroomQuizAssignment, ClassroomQuizSubmission, Classroom,
    AssignmentStatus, MembershipStatus, ClassroomMembership
)

router = APIRouter(prefix="/api/dashboard", tags=["teacher-dashboard"])

def verify_teacher(current_user: User):
    """Verify user is a teacher"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access this endpoint"
        )

@router.get("/analytics", response_model=Dict[str, Any])
async def get_full_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics for teacher dashboard"""
    verify_teacher(current_user)
    
    # Get teacher's quizzes and classrooms
    teacher_quizzes = db.query(Quiz).filter(
        Quiz.creator_id == current_user.id,
        Quiz.creator_type == QuizCreatorType.TEACHER
    ).all()
    
    teacher_classrooms = db.query(Classroom).filter(
        Classroom.teacher_id == current_user.id
    ).all()
    
    quiz_ids = [q.id for q in teacher_quizzes]
    classroom_ids = [c.id for c in teacher_classrooms]
    
    # Get all assignments created by this teacher
    assignments = db.query(ClassroomQuizAssignment).filter(
        ClassroomQuizAssignment.classroom_id.in_(classroom_ids)
    ).all() if classroom_ids else []
    
    assignment_ids = [a.id for a in assignments]
    
    # Get all quiz sessions for teacher's quizzes
    quiz_sessions = db.query(QuizSession).filter(
        QuizSession.quiz_id.in_(quiz_ids)
    ).all() if quiz_ids else []
    
    # Get all classroom submissions for teacher's assignments
    submissions = db.query(ClassroomQuizSubmission).filter(
        ClassroomQuizSubmission.assignment_id.in_(assignment_ids)
    ).all() if assignment_ids else []
    
    # Calculate overview metrics
    total_quizzes = len(teacher_quizzes)
    total_assignments = len(assignments)
    total_students = db.query(ClassroomMembership).filter(
        ClassroomMembership.classroom_id.in_(classroom_ids),
        ClassroomMembership.status == MembershipStatus.ACTIVE
    ).count() if classroom_ids else 0
    
    total_attempts = len(quiz_sessions)
    total_submissions = len(submissions)
    
    # Calculate average scores
    completed_sessions = [s for s in quiz_sessions if s.status == SessionStatus.COMPLETED and s.percentage_score is not None]
    graded_submissions = [s for s in submissions if s.is_graded and s.score_percentage is not None]
    
    avg_quiz_score = sum(s.percentage_score for s in completed_sessions) / len(completed_sessions) if completed_sessions else 0
    avg_assignment_score = sum(s.score_percentage for s in graded_submissions) / len(graded_submissions) if graded_submissions else 0
    
    # Recent activity (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_sessions = [s for s in quiz_sessions if s.start_time >= thirty_days_ago]
    recent_submissions = [s for s in submissions if s.submitted_at >= thirty_days_ago]
    
    # Subject-wise breakdown
    subject_stats = {}
    for quiz in teacher_quizzes:
        subject = quiz.subject or "Other"
        if subject not in subject_stats:
            subject_stats[subject] = {
                "quiz_count": 0,
                "total_attempts": 0,
                "avg_score": 0,
                "scores": []
            }
        
        subject_stats[subject]["quiz_count"] += 1
        quiz_sessions_for_subject = [s for s in quiz_sessions if s.quiz_id == quiz.id]
        subject_stats[subject]["total_attempts"] += len(quiz_sessions_for_subject)
        
        completed_for_subject = [s for s in quiz_sessions_for_subject if s.status == SessionStatus.COMPLETED and s.percentage_score is not None]
        subject_stats[subject]["scores"].extend([s.percentage_score for s in completed_for_subject])
    
    # Calculate average scores for subjects
    for subject in subject_stats:
        scores = subject_stats[subject]["scores"]
        subject_stats[subject]["avg_score"] = sum(scores) / len(scores) if scores else 0
        del subject_stats[subject]["scores"]  # Remove raw scores from response
    
    # Performance trends (last 7 days)
    trends = []
    for i in range(7):
        date = datetime.utcnow() - timedelta(days=i)
        date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        date_end = date_start + timedelta(days=1)
        
        day_sessions = [s for s in quiz_sessions if date_start <= s.start_time < date_end]
        day_submissions = [s for s in submissions if date_start <= s.submitted_at < date_end]
        
        completed_day_sessions = [s for s in day_sessions if s.status == SessionStatus.COMPLETED and s.percentage_score is not None]
        graded_day_submissions = [s for s in day_submissions if s.is_graded and s.score_percentage is not None]
        
        avg_score = 0
        if completed_day_sessions or graded_day_submissions:
            all_scores = [s.percentage_score for s in completed_day_sessions] + [s.score_percentage for s in graded_day_submissions]
            avg_score = sum(all_scores) / len(all_scores) if all_scores else 0
        
        trends.append({
            "date": date.strftime("%Y-%m-%d"),
            "attempts": len(day_sessions) + len(day_submissions),
            "completed": len(completed_day_sessions) + len(graded_day_submissions),
            "avg_score": round(avg_score, 1)
        })
    
    trends.reverse()  # Show oldest to newest
    
    return {
        "data": {
            "overview": {
                "total_quizzes": total_quizzes,
                "total_assignments": total_assignments,
                "total_students": total_students,
                "total_attempts": total_attempts + total_submissions,
                "avg_score": round((avg_quiz_score + avg_assignment_score) / 2 if avg_quiz_score or avg_assignment_score else 0, 1),
                "recent_activity_count": len(recent_sessions) + len(recent_submissions)
            },
            "performance_trends": trends,
            "subject_analytics": [
                {
                    "subject": subject,
                    "quiz_count": data["quiz_count"],
                    "total_attempts": data["total_attempts"],
                    "avg_score": round(data["avg_score"], 1)
                }
                for subject, data in subject_stats.items()
            ],
            "recent_sessions": [
                {
                    "id": session.id,
                    "quiz_title": next((q.title for q in teacher_quizzes if q.id == session.quiz_id), "Unknown"),
                    "student_name": session.user.full_name if session.user else "Unknown",
                    "score": session.percentage_score,
                    "completed_at": session.end_time,
                    "status": session.status.value,
                    "type": "quiz"
                }
                for session in sorted(recent_sessions, key=lambda x: x.start_time, reverse=True)[:10]
            ] + [
                {
                    "id": submission.id,
                    "assignment_title": next((a.title for a in assignments if a.id == submission.assignment_id), "Unknown"),
                    "student_name": submission.student.full_name if submission.student else "Unknown",
                    "score": submission.score_percentage,
                    "completed_at": submission.submitted_at,
                    "status": "graded" if submission.is_graded else "submitted",
                    "type": "assignment"
                }
                for submission in sorted(recent_submissions, key=lambda x: x.submitted_at, reverse=True)[:10]
            ]
        }
    }

@router.get("/overview", response_model=Dict[str, Any])
async def get_overview_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get overview statistics for teacher dashboard"""
    verify_teacher(current_user)
    
    # Count teacher's resources
    quiz_count = db.query(Quiz).filter(
        Quiz.creator_id == current_user.id,
        Quiz.creator_type == QuizCreatorType.TEACHER
    ).count()
    
    classroom_count = db.query(Classroom).filter(
        Classroom.teacher_id == current_user.id
    ).count()
    
    # Get classrooms and count assignments
    classrooms = db.query(Classroom).filter(
        Classroom.teacher_id == current_user.id
    ).all()
    
    classroom_ids = [c.id for c in classrooms]
    
    assignment_count = db.query(ClassroomQuizAssignment).filter(
        ClassroomQuizAssignment.classroom_id.in_(classroom_ids)
    ).count() if classroom_ids else 0
    
    student_count = db.query(ClassroomMembership).filter(
        ClassroomMembership.classroom_id.in_(classroom_ids),
        ClassroomMembership.status == MembershipStatus.ACTIVE
    ).count() if classroom_ids else 0
    
    # Get recent activity count (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    recent_quiz_sessions = db.query(QuizSession).join(Quiz).filter(
        Quiz.creator_id == current_user.id,
        QuizSession.start_time >= seven_days_ago
    ).count()
    
    recent_submissions = db.query(ClassroomQuizSubmission).join(ClassroomQuizAssignment).filter(
        ClassroomQuizAssignment.classroom_id.in_(classroom_ids),
        ClassroomQuizSubmission.submitted_at >= seven_days_ago
    ).count() if classroom_ids else 0
    
    return {
        "total_quizzes": quiz_count,
        "total_classrooms": classroom_count,
        "total_assignments": assignment_count,
        "total_students": student_count,
        "recent_activity": recent_quiz_sessions + recent_submissions,
        "active_assignments": db.query(ClassroomQuizAssignment).filter(
            ClassroomQuizAssignment.classroom_id.in_(classroom_ids),
            ClassroomQuizAssignment.status == AssignmentStatus.ACTIVE
        ).count() if classroom_ids else 0
    }

@router.get("/performance-trends", response_model=List[Dict[str, Any]])
async def get_performance_trends(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get performance trends over specified number of days"""
    verify_teacher(current_user)
    
    # Get teacher's quizzes and classrooms
    teacher_quizzes = db.query(Quiz).filter(
        Quiz.creator_id == current_user.id,
        Quiz.creator_type == QuizCreatorType.TEACHER
    ).all()
    
    classrooms = db.query(Classroom).filter(
        Classroom.teacher_id == current_user.id
    ).all()
    
    quiz_ids = [q.id for q in teacher_quizzes]
    classroom_ids = [c.id for c in classrooms]
    
    # Get assignment IDs
    assignment_ids = []
    if classroom_ids:
        assignments = db.query(ClassroomQuizAssignment).filter(
            ClassroomQuizAssignment.classroom_id.in_(classroom_ids)
        ).all()
        assignment_ids = [a.id for a in assignments]
    
    trends = []
    
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=i)
        date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        date_end = date_start + timedelta(days=1)
        
        # Quiz sessions for this day
        day_sessions = db.query(QuizSession).filter(
            QuizSession.quiz_id.in_(quiz_ids),
            QuizSession.start_time >= date_start,
            QuizSession.start_time < date_end
        ).all() if quiz_ids else []
        
        # Assignment submissions for this day
        day_submissions = db.query(ClassroomQuizSubmission).filter(
            ClassroomQuizSubmission.assignment_id.in_(assignment_ids),
            ClassroomQuizSubmission.submitted_at >= date_start,
            ClassroomQuizSubmission.submitted_at < date_end
        ).all() if assignment_ids else []
        
        # Calculate metrics
        total_attempts = len(day_sessions) + len(day_submissions)
        
        completed_sessions = [s for s in day_sessions if s.status == SessionStatus.COMPLETED]
        graded_submissions = [s for s in day_submissions if s.is_graded]
        
        completed_count = len(completed_sessions) + len(graded_submissions)
        
        # Calculate average score
        scores = []
        scores.extend([s.percentage_score for s in completed_sessions if s.percentage_score is not None])
        scores.extend([s.score_percentage for s in graded_submissions if s.score_percentage is not None])
        
        avg_score = sum(scores) / len(scores) if scores else 0
        
        trends.append({
            "date": date.strftime("%Y-%m-%d"),
            "total_attempts": total_attempts,
            "completed": completed_count,
            "avg_score": round(avg_score, 1),
            "completion_rate": round((completed_count / total_attempts * 100) if total_attempts > 0 else 0, 1)
        })
    
    # Return in chronological order (oldest first)
    return list(reversed(trends))

@router.get("/subjects", response_model=List[Dict[str, Any]])
async def get_subject_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics broken down by subject"""
    verify_teacher(current_user)
    
    # Get teacher's quizzes
    teacher_quizzes = db.query(Quiz).filter(
        Quiz.creator_id == current_user.id,
        Quiz.creator_type == QuizCreatorType.TEACHER
    ).all()
    
    quiz_ids = [q.id for q in teacher_quizzes]
    
    # Get all sessions for these quizzes
    if quiz_ids:
        sessions = db.query(QuizSession).filter(
            QuizSession.quiz_id.in_(quiz_ids)
        ).all()
    else:
        sessions = []
    
    # Group by subject
    subject_data = {}
    
    for quiz in teacher_quizzes:
        subject = quiz.subject or "Other"
        if subject not in subject_data:
            subject_data[subject] = {
                "subject": subject,
                "quiz_count": 0,
                "total_attempts": 0,
                "completed_attempts": 0,
                "total_questions": 0,
                "avg_score": 0,
                "scores": [],
                "difficulty_breakdown": {"Easy": 0, "Medium": 0, "Hard": 0}
            }
        
        subject_data[subject]["quiz_count"] += 1
        subject_data[subject]["total_questions"] += quiz.total_questions or 0
        
        # Count difficulty
        if quiz.difficulty_level:
            if quiz.difficulty_level in subject_data[subject]["difficulty_breakdown"]:
                subject_data[subject]["difficulty_breakdown"][quiz.difficulty_level] += 1
        
        # Get sessions for this quiz
        quiz_sessions = [s for s in sessions if s.quiz_id == quiz.id]
        subject_data[subject]["total_attempts"] += len(quiz_sessions)
        
        completed_sessions = [s for s in quiz_sessions if s.status == SessionStatus.COMPLETED]
        subject_data[subject]["completed_attempts"] += len(completed_sessions)
        
        # Collect scores
        scores = [s.percentage_score for s in completed_sessions if s.percentage_score is not None]
        subject_data[subject]["scores"].extend(scores)
    
    # Calculate final metrics and clean up
    result = []
    for subject_name, data in subject_data.items():
        scores = data["scores"]
        avg_score = sum(scores) / len(scores) if scores else 0
        completion_rate = (data["completed_attempts"] / data["total_attempts"] * 100) if data["total_attempts"] > 0 else 0
        
        result.append({
            "subject": subject_name,
            "quiz_count": data["quiz_count"],
            "total_attempts": data["total_attempts"],
            "completed_attempts": data["completed_attempts"],
            "completion_rate": round(completion_rate, 1),
            "total_questions": data["total_questions"],
            "avg_score": round(avg_score, 1),
            "difficulty_breakdown": data["difficulty_breakdown"]
        })
    
    return sorted(result, key=lambda x: x["total_attempts"], reverse=True)

@router.get("/recent-activity", response_model=Dict[str, Any])
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activity across all teacher's resources"""
    verify_teacher(current_user)
    
    # Get teacher's quizzes and classrooms
    teacher_quizzes = db.query(Quiz).filter(
        Quiz.creator_id == current_user.id,
        Quiz.creator_type == QuizCreatorType.TEACHER
    ).all()
    
    classrooms = db.query(Classroom).filter(
        Classroom.teacher_id == current_user.id
    ).all()
    
    quiz_ids = [q.id for q in teacher_quizzes]
    classroom_ids = [c.id for c in classrooms]
    quiz_dict = {q.id: q for q in teacher_quizzes}
    
    activities = []
    
    # Get recent quiz sessions
    if quiz_ids:
        recent_sessions = db.query(QuizSession).filter(
            QuizSession.quiz_id.in_(quiz_ids)
        ).order_by(QuizSession.start_time.desc()).limit(limit * 2).all()
        
        for session in recent_sessions:
            quiz = quiz_dict.get(session.quiz_id)
            activities.append({
                "id": f"session_{session.id}",
                "type": "quiz_attempt",
                "title": f"{session.user.full_name if session.user else 'Student'} attempted {quiz.title if quiz else 'Quiz'}",
                "description": f"Score: {session.percentage_score}%" if session.percentage_score else "In progress",
                "timestamp": session.start_time,
                "status": session.status.value,
                "score": session.percentage_score,
                "user_name": session.user.full_name if session.user else "Unknown"
            })
    
    # Get recent assignment submissions
    if classroom_ids:
        assignments = db.query(ClassroomQuizAssignment).filter(
            ClassroomQuizAssignment.classroom_id.in_(classroom_ids)
        ).all()
        
        assignment_dict = {a.id: a for a in assignments}
        assignment_ids = [a.id for a in assignments]
        
        if assignment_ids:
            recent_submissions = db.query(ClassroomQuizSubmission).filter(
                ClassroomQuizSubmission.assignment_id.in_(assignment_ids)
            ).order_by(ClassroomQuizSubmission.submitted_at.desc()).limit(limit * 2).all()
            
            for submission in recent_submissions:
                assignment = assignment_dict.get(submission.assignment_id)
                activities.append({
                    "id": f"submission_{submission.id}",
                    "type": "assignment_submission",
                    "title": f"{submission.student.full_name if submission.student else 'Student'} submitted {assignment.title if assignment else 'Assignment'}",
                    "description": f"Score: {submission.score_percentage}%" if submission.score_percentage else "Not graded",
                    "timestamp": submission.submitted_at,
                    "status": "graded" if submission.is_graded else "submitted",
                    "score": submission.score_percentage,
                    "user_name": submission.student.full_name if submission.student else "Unknown",
                    "is_late": submission.is_late
                })
    
    # Sort all activities by timestamp and limit
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    activities = activities[:limit]
    
    return {
        "activities": activities,
        "total_count": len(activities)
    }

@router.get("/export", response_model=Dict[str, Any])
async def export_analytics(
    format: str = Query("json", regex="^(json|csv)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export analytics data"""
    verify_teacher(current_user)
    
    # Get full analytics data
    analytics_data = await get_full_analytics(current_user, db)
    
    if format == "json":
        return {
            "format": "json",
            "data": analytics_data["data"],
            "exported_at": datetime.utcnow().isoformat(),
            "teacher_id": current_user.id,
            "teacher_name": current_user.full_name
        }
    
    elif format == "csv":
        # For CSV, we'll provide a simplified flat structure
        csv_data = []
        
        # Add overview data
        overview = analytics_data["data"]["overview"]
        csv_data.append({
            "metric": "Total Quizzes",
            "value": overview["total_quizzes"],
            "category": "overview"
        })
        csv_data.append({
            "metric": "Total Assignments", 
            "value": overview["total_assignments"],
            "category": "overview"
        })
        csv_data.append({
            "metric": "Total Students",
            "value": overview["total_students"],
            "category": "overview"
        })
        csv_data.append({
            "metric": "Average Score",
            "value": overview["avg_score"],
            "category": "overview"
        })
        
        # Add subject analytics
        for subject in analytics_data["data"]["subject_analytics"]:
            csv_data.append({
                "metric": f"{subject['subject']} - Quiz Count",
                "value": subject["quiz_count"],
                "category": "subject"
            })
            csv_data.append({
                "metric": f"{subject['subject']} - Avg Score",
                "value": subject["avg_score"],
                "category": "subject"
            })
        
        return {
            "format": "csv",
            "data": csv_data,
            "exported_at": datetime.utcnow().isoformat(),
            "teacher_id": current_user.id,
            "teacher_name": current_user.full_name
        }