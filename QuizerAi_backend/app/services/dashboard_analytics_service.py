# services/dashboard_analytics_service.py
"""
Dashboard Analytics Service

This service provides comprehensive analytics for user quiz performance
based on SAVED quiz sessions only. It generates insights, trends, and
statistics for dashboard visualization.

Key Features:
- Performance tracking over time
- Subject-wise analysis
- Learning pattern identification
- Progress predictions
- Comparative analytics
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case, extract, desc, asc
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict
import json
import statistics
from dataclasses import dataclass

from app.models.quiz import (
    Quiz, QuizSession, QuizAnswer, Question, SessionStatus,
    UserQuizStats, QuizAnalytics, QuizType
)
from app.models.user_models import User

@dataclass
class PerformancePoint:
    """Data structure for performance tracking points"""
    date: datetime
    score: float
    quiz_count: int
    time_spent: int
    subject: str

@dataclass
class SubjectStats:
    """Data structure for subject-wise statistics"""
    subject: str
    total_quizzes: int
    average_score: float
    best_score: float
    total_time: int
    improvement_rate: float
    difficulty_distribution: Dict[str, int]

class DashboardAnalyticsService:
    """
    Service class for generating dashboard analytics
    
    This service processes saved quiz sessions to create meaningful
    analytics for user dashboard visualization.
    """
    
    def __init__(self, db: Session):
        self.db = db

    async def get_user_dashboard_analytics(self, user_id: int) -> Dict[str, Any]:
        """
        Generate comprehensive dashboard analytics for a user
        
        Args:
            user_id: ID of the user to generate analytics for
            
        Returns:
            Dictionary containing all analytics data for dashboard
            
        Analytics includes:
        - Overview stats (total quizzes, avg score, study time, streak)
        - Performance trends over time
        - Subject-wise breakdown
        - Recent activity
        - Learning insights and recommendations
        """
        
        # Verify user has saved sessions
        session_count = self.db.query(func.count(QuizSession.id)).filter(
            QuizSession.user_id == user_id,
            QuizSession.status == SessionStatus.COMPLETED
        ).scalar()
        
        if session_count == 0:
            return self._get_empty_analytics()
        
        # Generate all analytics components
        overview_stats = await self._get_overview_stats(user_id)
        performance_trends = await self._get_performance_trends(user_id)
        subject_analytics = await self._get_subject_analytics(user_id)
        recent_activity = await self._get_recent_activity(user_id)
        learning_insights = await self._generate_learning_insights(user_id)
        time_patterns = await self._get_study_time_patterns(user_id)
        achievements = await self._get_achievements_progress(user_id)
        
        return {
            "user_id": user_id,
            "generated_at": datetime.utcnow().isoformat(),
            "has_data": True,
            "overview": overview_stats,
            "performance_trends": performance_trends,
            "subject_analytics": subject_analytics,
            "recent_activity": recent_activity,
            "learning_insights": learning_insights,
            "study_patterns": time_patterns,
            "achievements": achievements
        }

    async def _get_overview_stats(self, user_id: int) -> Dict[str, Any]:
        """
        Calculate overview statistics for dashboard cards
        
        Metrics calculated:
        - Total quizzes completed (saved sessions only)
        - Average score across all sessions
        - Total study time in hours
        - Current learning streak
        - This month's progress vs last month
        """
        
        # Base query for saved sessions
        base_query = self.db.query(QuizSession).filter(
            QuizSession.user_id == user_id,
            QuizSession.status == SessionStatus.COMPLETED
        )
        
        # Total stats
        total_sessions = base_query.count()
        
        if total_sessions == 0:
            return self._get_empty_overview()
        
        # Average score calculation
        avg_score = self.db.query(func.avg(QuizSession.percentage_score)).filter(
            QuizSession.user_id == user_id,
            QuizSession.status == SessionStatus.COMPLETED,
            QuizSession.percentage_score.isnot(None)
        ).scalar() or 0
        
        # Total study time (convert seconds to hours)
        total_time_seconds = self.db.query(func.sum(QuizSession.total_time_seconds)).filter(
            QuizSession.user_id == user_id,
            QuizSession.status == SessionStatus.COMPLETED,
            QuizSession.total_time_seconds.isnot(None)
        ).scalar() or 0
        
        total_hours = round(total_time_seconds / 3600, 1)
        
        # Current streak calculation
        current_streak = await self._calculate_study_streak(user_id)
        
        # Monthly comparison
        now = datetime.utcnow()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        
        this_month_count = base_query.filter(
            QuizSession.created_at >= this_month_start
        ).count()
        
        last_month_count = base_query.filter(
            and_(
                QuizSession.created_at >= last_month_start,
                QuizSession.created_at < this_month_start
            )
        ).count()
        
        # Calculate percentage change
        month_change = 0
        if last_month_count > 0:
            month_change = round(((this_month_count - last_month_count) / last_month_count) * 100, 1)
        elif this_month_count > 0:
            month_change = 100  # New user with activity this month
        
        return {
            "total_quizzes": total_sessions,
            "average_score": round(avg_score, 1),
            "total_study_hours": total_hours,
            "current_streak": current_streak,
            "this_month_quizzes": this_month_count,
            "monthly_change_percentage": month_change,
            "is_improving": month_change > 0
        }

    async def _get_performance_trends(self, user_id: int, days: int = 30) -> Dict[str, Any]:
        """
        Generate performance trends over specified time period
        
        Creates data points for visualization showing:
        - Daily/weekly average scores
        - Quiz volume over time
        - Study time trends
        - Subject distribution over time
        
        Args:
            user_id: User ID
            days: Number of days to analyze (default 30)
        """
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get sessions within date range
        sessions = self.db.query(QuizSession, Quiz).join(
            Quiz, QuizSession.quiz_id == Quiz.id
        ).filter(
            QuizSession.user_id == user_id,
            QuizSession.status == SessionStatus.COMPLETED,
            QuizSession.created_at >= start_date
        ).order_by(QuizSession.created_at.asc()).all()
        
        if not sessions:
            return self._get_empty_trends()
        
        # Group sessions by date for trend analysis
        daily_data = defaultdict(list)
        
        for session, quiz in sessions:
            date_key = session.created_at.date()
            daily_data[date_key].append({
                'score': session.percentage_score or 0,
                'time': session.total_time_seconds or 0,
                'subject': quiz.subject or 'General'
            })
        
        # Generate trend points
        trend_points = []
        labels = []
        scores = []
        quiz_counts = []
        study_times = []
        
        # Create daily trend points
        for i in range(days):
            current_date = start_date + timedelta(days=i)
            date_key = current_date.date()
            
            if date_key in daily_data:
                day_sessions = daily_data[date_key]
                avg_score = statistics.mean([s['score'] for s in day_sessions])
                total_time = sum([s['time'] for s in day_sessions]) / 3600  # Convert to hours
                quiz_count = len(day_sessions)
            else:
                avg_score = None
                total_time = 0
                quiz_count = 0
            
            labels.append(current_date.strftime('%m/%d'))
            scores.append(avg_score)
            quiz_counts.append(quiz_count)
            study_times.append(round(total_time, 1))
        
        # Calculate trend direction
        valid_scores = [s for s in scores if s is not None]
        trend_direction = "stable"
        if len(valid_scores) >= 2:
            first_half = valid_scores[:len(valid_scores)//2]
            second_half = valid_scores[len(valid_scores)//2:]
            
            if statistics.mean(second_half) > statistics.mean(first_half) + 2:
                trend_direction = "improving"
            elif statistics.mean(second_half) < statistics.mean(first_half) - 2:
                trend_direction = "declining"
        
        return {
            "period_days": days,
            "labels": labels,
            "performance_data": {
                "scores": scores,
                "quiz_counts": quiz_counts,
                "study_hours": study_times
            },
            "trend_direction": trend_direction,
            "total_sessions_in_period": len(sessions),
            "average_score_in_period": round(statistics.mean(valid_scores), 1) if valid_scores else 0,
            "most_active_day": max(daily_data.keys(), key=lambda k: len(daily_data[k])).strftime('%A') if daily_data else None
        }

    async def _get_subject_analytics(self, user_id: int) -> Dict[str, Any]:
        """
        Analyze performance by subject/category
        
        Provides:
        - Performance breakdown by subject
        - Difficulty progression per subject
        - Time investment per subject
        - Improvement rates
        """
        
        # Get all sessions with quiz subject data
        subject_data = self.db.query(
            Quiz.subject,
            Quiz.difficulty_level,
            QuizSession.percentage_score,
            QuizSession.total_time_seconds,
            QuizSession.created_at
        ).join(
            QuizSession, Quiz.id == QuizSession.quiz_id
        ).filter(
            QuizSession.user_id == user_id,
            QuizSession.status == SessionStatus.COMPLETED
        ).order_by(QuizSession.created_at.asc()).all()
        
        if not subject_data:
            return {"subjects": [], "total_subjects": 0}
        
        # Group by subject
        subjects = defaultdict(list)
        for row in subject_data:
            subject = row.subject or "General"
            subjects[subject].append({
                'score': row.percentage_score or 0,
                'time': row.total_time_seconds or 0,
                'difficulty': row.difficulty_level or 'medium',
                'date': row.created_at
            })
        
        # Calculate subject statistics
        subject_stats = []
        
        for subject, sessions in subjects.items():
            scores = [s['score'] for s in sessions]
            times = [s['time'] for s in sessions]
            
            # Calculate improvement rate (first 3 vs last 3 sessions)
            improvement_rate = 0
            if len(sessions) >= 6:
                early_scores = scores[:3]
                recent_scores = scores[-3:]
                improvement_rate = statistics.mean(recent_scores) - statistics.mean(early_scores)
            
            # Difficulty distribution
            difficulties = [s['difficulty'] for s in sessions]
            difficulty_dist = {
                'easy': difficulties.count('easy'),
                'medium': difficulties.count('medium'),
                'hard': difficulties.count('hard')
            }
            
            subject_stats.append({
                'subject': subject,
                'total_quizzes': len(sessions),
                'average_score': round(statistics.mean(scores), 1),
                'best_score': max(scores),
                'worst_score': min(scores),
                'total_time_hours': round(sum(times) / 3600, 1),
                'average_time_minutes': round(statistics.mean(times) / 60, 1),
                'improvement_rate': round(improvement_rate, 1),
                'difficulty_distribution': difficulty_dist,
                'trend': 'improving' if improvement_rate > 2 else 'declining' if improvement_rate < -2 else 'stable'
            })
        
        # Sort by performance
        subject_stats.sort(key=lambda x: x['average_score'], reverse=True)
        
        return {
            "subjects": subject_stats,
            "total_subjects": len(subject_stats),
            "best_subject": subject_stats[0]['subject'] if subject_stats else None,
            "most_practiced_subject": max(subject_stats, key=lambda x: x['total_quizzes'])['subject'] if subject_stats else None
        }

    async def _get_recent_activity(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent quiz activity for activity feed
        
        Returns chronological list of recent quiz sessions with:
        - Quiz title and subject
        - Score achieved
        - Time taken
        - Completion date
        - Performance indicators
        """
        
        recent_sessions = self.db.query(QuizSession, Quiz).join(
            Quiz, QuizSession.quiz_id == Quiz.id
        ).filter(
            QuizSession.user_id == user_id,
            QuizSession.status == SessionStatus.COMPLETED
        ).order_by(
            QuizSession.created_at.desc()
        ).limit(limit).all()
        
        activities = []
        
        for session, quiz in recent_sessions:
            # Determine performance level
            score = session.percentage_score or 0
            if score >= 90:
                performance = "excellent"
            elif score >= 80:
                performance = "good"
            elif score >= 70:
                performance = "average"
            else:
                performance = "needs_improvement"
            
            activities.append({
                'session_id': session.id,
                'quiz_title': quiz.title,
                'subject': quiz.subject or 'General',
                'difficulty': quiz.difficulty_level or 'medium',
                'score': score,
                'max_score': session.max_possible_score or 0,
                'time_taken_minutes': round((session.total_time_seconds or 0) / 60, 1),
                'questions_answered': session.questions_answered or 0,
                'total_questions': quiz.total_questions or 0,
                'completion_date': session.created_at.isoformat(),
                'performance_level': performance,
                'is_passed': session.is_passed or False
            })
        
        return activities

    async def _generate_learning_insights(self, user_id: int) -> Dict[str, Any]:
        """
        Generate AI-powered learning insights and recommendations
        
        Analyzes patterns to provide:
        - Strengths and weaknesses identification
        - Study recommendations
        - Progress predictions
        - Personalized tips
        """
        
        # Get comprehensive user data
        sessions = self.db.query(QuizSession, Quiz).join(
            Quiz, QuizSession.quiz_id == Quiz.id
        ).filter(
            QuizSession.user_id == user_id,
            QuizSession.status == SessionStatus.COMPLETED
        ).order_by(QuizSession.created_at.asc()).all()
        
        if len(sessions) < 3:
            return self._get_basic_insights(len(sessions))
        
        insights = {
            'strengths': [],
            'improvement_areas': [],
            'recommendations': [],
            'predictions': {},
            'study_tips': []
        }
        
        # Analyze strengths and weaknesses
        subject_performance = defaultdict(list)
        difficulty_performance = defaultdict(list)
        time_efficiency = []
        
        for session, quiz in sessions:
            subject = quiz.subject or 'General'
            difficulty = quiz.difficulty_level or 'medium'
            score = session.percentage_score or 0
            time_per_question = (session.total_time_seconds or 0) / max(quiz.total_questions or 1, 1)
            
            subject_performance[subject].append(score)
            difficulty_performance[difficulty].append(score)
            time_efficiency.append(time_per_question)
        
        # Identify strengths (subjects with avg score > 85)
        for subject, scores in subject_performance.items():
            avg_score = statistics.mean(scores)
            if avg_score >= 85:
                insights['strengths'].append(f"Strong performance in {subject} (avg: {avg_score:.1f}%)")
        
        # Identify improvement areas (subjects with avg score < 70)
        for subject, scores in subject_performance.items():
            avg_score = statistics.mean(scores)
            if avg_score < 70:
                insights['improvement_areas'].append(f"{subject} needs attention (avg: {avg_score:.1f}%)")
        
        # Generate recommendations based on patterns
        if len(sessions) >= 10:
            recent_scores = [s[0].percentage_score or 0 for s in sessions[-5:]]
            earlier_scores = [s[0].percentage_score or 0 for s in sessions[-10:-5]]
            
            if statistics.mean(recent_scores) > statistics.mean(earlier_scores) + 5:
                insights['recommendations'].append("You're on an improvement streak! Keep up the consistent practice.")
            elif statistics.mean(recent_scores) < statistics.mean(earlier_scores) - 5:
                insights['recommendations'].append("Consider reviewing fundamental concepts to regain momentum.")
        
        # Study efficiency analysis
        avg_time_per_question = statistics.mean(time_efficiency)
        if avg_time_per_question > 120:  # More than 2 minutes per question
            insights['study_tips'].append("Try setting time limits for each question to improve speed.")
        
        # Performance prediction (simple linear trend)
        if len(sessions) >= 5:
            recent_trend = self._calculate_performance_trend(sessions[-10:])
            if recent_trend > 0:
                insights['predictions']['trend'] = 'improving'
                insights['predictions']['message'] = f"Based on your recent progress, you could improve by {recent_trend:.1f}% over the next month."
            else:
                insights['predictions']['trend'] = 'stable'
                insights['predictions']['message'] = "Your performance is stable. Consider challenging yourself with harder topics."
        
        return insights

    async def _get_study_time_patterns(self, user_id: int) -> Dict[str, Any]:
        """
        Analyze when and how user studies most effectively
        
        Identifies:
        - Best performing time of day
        - Study session length preferences
        - Weekly patterns
        - Optimal study conditions
        """
        
        sessions = self.db.query(QuizSession).filter(
            QuizSession.user_id == user_id,
            QuizSession.status == SessionStatus.COMPLETED,
            QuizSession.created_at.isnot(None)
        ).all()
        
        if not sessions:
            return {"patterns": [], "recommendations": []}
        
        # Analyze by time of day
        time_performance = defaultdict(list)
        day_performance = defaultdict(list)
        
        for session in sessions:
            hour = session.created_at.hour
            day = session.created_at.strftime('%A')
            score = session.percentage_score or 0
            
            # Group by time periods
            if 6 <= hour < 12:
                time_period = "Morning"
            elif 12 <= hour < 17:
                time_period = "Afternoon"
            elif 17 <= hour < 21:
                time_period = "Evening"
            else:
                time_period = "Night"
            
            time_performance[time_period].append(score)
            day_performance[day].append(score)
        
        # Find best performing periods
        best_time = max(time_performance.items(), key=lambda x: statistics.mean(x[1]))[0] if time_performance else None
        best_day = max(day_performance.items(), key=lambda x: statistics.mean(x[1]))[0] if day_performance else None
        
        patterns = []
        if best_time:
            avg_score = statistics.mean(time_performance[best_time])
            patterns.append(f"You perform best during {best_time.lower()} sessions (avg: {avg_score:.1f}%)")
        
        if best_day:
            avg_score = statistics.mean(day_performance[best_day])
            patterns.append(f"{best_day} is your most productive day (avg: {avg_score:.1f}%)")
        
        return {
            "best_time_period": best_time,
            "best_day": best_day,
            "time_performance": {k: round(statistics.mean(v), 1) for k, v in time_performance.items()},
            "day_performance": {k: round(statistics.mean(v), 1) for k, v in day_performance.items()},
            "patterns": patterns,
            "total_sessions_analyzed": len(sessions)
        }

    async def _get_achievements_progress(self, user_id: int) -> Dict[str, Any]:
        """
        Calculate progress towards achievements and milestones
        
        Tracks:
        - Quiz completion milestones
        - Score achievements
        - Streak records
        - Subject mastery
        """
        
        total_quizzes = self.db.query(func.count(QuizSession.id)).filter(
            QuizSession.user_id == user_id,
            QuizSession.status == SessionStatus.COMPLETED
        ).scalar()
        
        avg_score = self.db.query(func.avg(QuizSession.percentage_score)).filter(
            QuizSession.user_id == user_id,
            QuizSession.status == SessionStatus.COMPLETED,
            QuizSession.percentage_score.isnot(None)
        ).scalar() or 0
        
        current_streak = await self._calculate_study_streak(user_id)
        
        # Define achievement thresholds
        achievements = []
        
        # Quiz completion milestones
        quiz_milestones = [5, 10, 25, 50, 100, 250, 500]
        for milestone in quiz_milestones:
            if total_quizzes >= milestone:
                achievements.append({
                    'id': f'quiz_milestone_{milestone}',
                    'title': f'{milestone} Quizzes Completed',
                    'description': f'You have completed {milestone} quizzes!',
                    'type': 'milestone',
                    'achieved': True,
                    'progress': 100
                })
            else:
                achievements.append({
                    'id': f'quiz_milestone_{milestone}',
                    'title': f'{milestone} Quizzes Completed',
                    'description': f'Complete {milestone} quizzes',
                    'type': 'milestone',
                    'achieved': False,
                    'progress': min(100, (total_quizzes / milestone) * 100)
                })
                break  # Only show next unachieved milestone
        
        # Score achievements
        if avg_score >= 95:
            achievements.append({
                'id': 'perfectionist',
                'title': 'Perfectionist',
                'description': 'Maintain 95%+ average score',
                'type': 'performance',
                'achieved': True,
                'progress': 100
            })
        elif avg_score >= 90:
            achievements.append({
                'id': 'high_achiever',
                'title': 'High Achiever',
                'description': 'Maintain 90%+ average score',
                'type': 'performance',
                'achieved': True,
                'progress': 100
            })
        
        # Streak achievements
        streak_milestones = [3, 7, 14, 30, 60, 100]
        for milestone in streak_milestones:
            if current_streak >= milestone:
                achievements.append({
                    'id': f'streak_{milestone}',
                    'title': f'{milestone}-Day Streak',
                    'description': f'Study for {milestone} consecutive days',
                    'type': 'consistency',
                    'achieved': True,
                    'progress': 100
                })
            else:
                achievements.append({
                    'id': f'streak_{milestone}',
                    'title': f'{milestone}-Day Streak',
                    'description': f'Study for {milestone} consecutive days',
                    'type': 'consistency',
                    'achieved': False,
                    'progress': min(100, (current_streak / milestone) * 100)
                })
                break
        
        return {
            'total_achievements': len([a for a in achievements if a['achieved']]),
            'achievements': achievements,
            'current_streak': current_streak,
            'total_quizzes': total_quizzes,
            'average_score': round(avg_score, 1)
        }

    # Helper methods
    
    async def _calculate_study_streak(self, user_id: int) -> int:
        """Calculate current consecutive study streak in days"""
        
        # Get all completion dates
        completion_dates = self.db.query(
            func.date(QuizSession.created_at).label('completion_date')
        ).filter(
            QuizSession.user_id == user_id,
            QuizSession.status == SessionStatus.COMPLETED
        ).distinct().order_by(
            func.date(QuizSession.created_at).desc()
        ).all()
        
        if not completion_dates:
            return 0
        
        # Check for consecutive days
        streak = 0
        today = datetime.utcnow().date()
        
        for i, (date,) in enumerate(completion_dates):
            expected_date = today - timedelta(days=i)
            if date == expected_date:
                streak += 1
            else:
                break
        
        return streak
    
    def _calculate_performance_trend(self, sessions: List[Tuple]) -> float:
        """Calculate performance trend using simple linear regression"""
        
        if len(sessions) < 2:
            return 0
        
        scores = [(i, session[0].percentage_score or 0) for i, (session, _) in enumerate(sessions)]
        
        # Simple linear trend calculation
        n = len(scores)
        sum_x = sum(x for x, y in scores)
        sum_y = sum(y for x, y in scores)
        sum_xy = sum(x * y for x, y in scores)
        sum_x2 = sum(x * x for x, y in scores)
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
        
        return slope * 10  # Scale to represent change over 10 sessions
    
    def _get_empty_analytics(self) -> Dict[str, Any]:
        """Return empty analytics structure for users with no saved sessions"""
        return {
            "has_data": False,
            "message": "No saved quiz sessions found. Complete and save some quizzes to see your analytics!",
            "overview": self._get_empty_overview(),
            "performance_trends": self._get_empty_trends(),
            "subject_analytics": {"subjects": [], "total_subjects": 0},
            "recent_activity": [],
            "learning_insights": {"recommendations": ["Take your first quiz to start building your learning profile!"]},
            "study_patterns": {"patterns": [], "recommendations": []},
            "achievements": {"total_achievements": 0, "achievements": []}
        }
    
    def _get_empty_overview(self) -> Dict[str, Any]:
        """Return empty overview stats"""
        return {
            "total_quizzes": 0,
            "average_score": 0,
            "total_study_hours": 0,
            "current_streak": 0,
            "this_month_quizzes": 0,
            "monthly_change_percentage": 0,
            "is_improving": False
        }
    
    def _get_empty_trends(self) -> Dict[str, Any]:
        """Return empty trend data"""
        return {
            "period_days": 30,
            "labels": [],
            "performance_data": {"scores": [], "quiz_counts": [], "study_hours": []},
            "trend_direction": "stable",
            "total_sessions_in_period": 0,
            "average_score_in_period": 0,
            "most_active_day": None
        }
    
    def _get_basic_insights(self, session_count: int) -> Dict[str, Any]:
        """Return basic insights for new users"""
        return {
            "strengths": [],
            "improvement_areas": [],
            "recommendations": [
                f"Complete {3 - session_count} more quiz{'zes' if 3 - session_count > 1 else ''} to get personalized insights!",
                "Try quizzes from different subjects to identify your strengths.",
                "Save your quiz results to track progress over time."
            ],
            "predictions": {},
            "study_tips": [
                "Set a regular study schedule for best results.",
                "Focus on understanding concepts rather than memorizing answers.",
                "Review your mistakes to improve faster."
            ]
        }