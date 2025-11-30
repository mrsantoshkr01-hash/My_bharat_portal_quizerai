# assigning the logic of quiz tasks
# tasks/quiz_tasks.py
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from celery import Celery

from app.database.connection import get_db
from app.config.redis_config import redis_service, RedisKeys
from app.services.quiz_service import QuizService
from app.database.quiz import QuizSession, SessionStatus

logger = logging.getLogger(__name__)

# Celery configuration
celery_app = Celery(
    "ai_studyhub",
    broker="redis://localhost:6379/3",  # Different Redis DB for Celery
    backend="redis://localhost:6379/3"
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_routes={
        'tasks.quiz_tasks.check_expired_sessions': {'queue': 'quiz_timers'},
        'tasks.quiz_tasks.cleanup_redis_sessions': {'queue': 'cleanup'},
        'tasks.quiz_tasks.update_quiz_analytics': {'queue': 'analytics'},
    },
    beat_schedule={
        'check-expired-sessions': {
            'task': 'tasks.quiz_tasks.check_expired_sessions',
            'schedule': 30.0,  # Every 30 seconds
        },
        'cleanup-redis-sessions': {
            'task': 'tasks.quiz_tasks.cleanup_redis_sessions',
            'schedule': 300.0,  # Every 5 minutes
        },
        'update-quiz-analytics': {
            'task': 'tasks.quiz_tasks.update_quiz_analytics',
            'schedule': 3600.0,  # Every hour
        },
    }
)

class QuizTimerManager:
    """Manages quiz timers and session expiry"""
    
    def __init__(self):
        self.redis_client = None
    
    async def initialize(self):
        """Initialize Redis connection"""
        if not self.redis_client:
            await redis_service.initialize()
            self.redis_client = redis_service.session_client
    
    async def check_and_expire_sessions(self) -> List[str]:
        """Check for expired quiz sessions and handle them"""
        expired_sessions = []
        
        try:
            await self.initialize()
            
            # Scan for all active quiz sessions
            pattern = RedisKeys.QUIZ_SESSION.format(session_id="*")
            
            async for key in self.redis_client.scan_iter(match=pattern):
                try:
                    session_data_str = await self.redis_client.get(key)
                    if not session_data_str:
                        continue
                    
                    import json
                    session_data = json.loads(session_data_str)
                    
                    # Skip if not in progress
                    if session_data.get("status") != "in_progress":
                        continue
                    
                    session_id = session_data.get("session_id")
                    if not session_id:
                        continue
                    
                    # Check if session has expired
                    if await self._is_session_expired(session_id, session_data):
                        await self._expire_session(session_id)
                        expired_sessions.append(session_id)
                        logger.info(f"Expired quiz session: {session_id}")
                
                except Exception as e:
                    logger.error(f"Error processing session {key}: {e}")
                    continue
            
            return expired_sessions
            
        except Exception as e:
            logger.error(f"Error checking expired sessions: {e}")
            return expired_sessions
    
    async def _is_session_expired(self, session_id: str, session_data: dict) -> bool:
        """Check if a session has expired based on timer settings"""
        try:
            timer_type = session_data.get("timer_type", "no_limit")
            
            if timer_type == "no_limit":
                # Check for abandonment (no activity for 2+ hours)
                start_time_str = session_data.get("start_time")
                if start_time_str:
                    start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                    time_elapsed = datetime.utcnow() - start_time.replace(tzinfo=None)
                    return time_elapsed > timedelta(hours=2)  # 2 hour abandonment limit
                
            elif timer_type == "total_quiz":
                # Check Redis timer
                remaining_time = await redis_service.get_remaining_time(session_id)
                return remaining_time is not None and remaining_time <= 0
            
            elif timer_type == "per_question":
                # For per-question timers, we'd need to track question start times
                # This is more complex and would require additional Redis keys
                per_question_time = session_data.get("settings", {}).get("per_question_time_seconds", 60)
                
                # Check if current question has been active too long
                current_question_start = session_data.get("current_question_start_time")
                if current_question_start:
                    start_time = datetime.fromisoformat(current_question_start)
                    time_on_question = datetime.utcnow() - start_time
                    return time_on_question > timedelta(seconds=per_question_time + 30)  # 30s buffer
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking session expiry for {session_id}: {e}")
            return False
    
    async def _expire_session(self, session_id: str):
        """Expire a quiz session"""
        try:
            # Use QuizService to handle expiry
            db = next(get_db())
            quiz_service = QuizService(db)
            await quiz_service.handle_timer_expiry(session_id)
            
        except Exception as e:
            logger.error(f"Error expiring session {session_id}: {e}")

# Celery Tasks
@celery_app.task(name="tasks.quiz_tasks.check_expired_sessions")
def check_expired_sessions():
    """Celery task to check for expired quiz sessions"""
    async def _check():
        timer_manager = QuizTimerManager()
        expired_sessions = await timer_manager.check_and_expire_sessions()
        return len(expired_sessions)
    
    # Run the async function
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        expired_count = loop.run_until_complete(_check())
        logger.info(f"Timer check completed. Expired {expired_count} sessions.")
        return expired_count
    finally:
        loop.close()

@celery_app.task(name="tasks.quiz_tasks.cleanup_redis_sessions")
def cleanup_redis_sessions():
    """Clean up stale Redis sessions"""
    async def _cleanup():
        try:
            await redis_service.initialize()
            await redis_service.cleanup_expired_sessions()
            
            # Additional cleanup for orphaned keys
            client = redis_service.session_client
            
            # Clean up expired timers
            timer_pattern = RedisKeys.QUIZ_TIMER.format(session_id="*")
            deleted_count = 0
            
            async for key in client.scan_iter(match=timer_pattern):
                ttl = await client.ttl(key)
                if ttl < 0:  # Key exists but no TTL
                    await client.delete(key)
                    deleted_count += 1
            
            logger.info(f"Cleaned up {deleted_count} orphaned timer keys")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error during Redis cleanup: {e}")
            return 0
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        cleaned_count = loop.run_until_complete(_cleanup())
        return cleaned_count
    finally:
        loop.close()

@celery_app.task(name="tasks.quiz_tasks.update_quiz_analytics")
def update_quiz_analytics():
    """Update quiz analytics and cache performance data"""
    async def _update_analytics():
        try:
            db = next(get_db())
            
            # Update cached analytics for active quizzes
            from models.quiz import Quiz, QuizSession
            from sqlalchemy import func, and_
            
            # Get quizzes that had activity in the last 24 hours
            yesterday = datetime.utcnow() - timedelta(days=1)
            
            active_quiz_ids = db.query(QuizSession.quiz_id).filter(
                QuizSession.created_at >= yesterday
            ).distinct().all()
            
            updated_count = 0
            
            for (quiz_id,) in active_quiz_ids:
                # Calculate analytics
                analytics = db.query(
                    func.count(QuizSession.id).label('total_attempts'),
                    func.avg(QuizSession.percentage_score).label('average_score'),
                    func.count(QuizSession.id).filter(
                        QuizSession.status == SessionStatus.COMPLETED
                    ).label('completed_sessions')
                ).filter(
                    QuizSession.quiz_id == quiz_id
                ).first()
                
                # Cache analytics data
                analytics_data = {
                    "quiz_id": quiz_id,
                    "total_attempts": analytics.total_attempts or 0,
                    "average_score": float(analytics.average_score or 0),
                    "completion_rate": float(analytics.completed_sessions or 0) / max(analytics.total_attempts or 1, 1) * 100,
                    "last_updated": datetime.utcnow().isoformat()
                }
                
                # Store in Redis
                analytics_key = RedisKeys.QUIZ_ANALYTICS.format(quiz_id=quiz_id)
                await redis_service.cache_client.setex(
                    analytics_key,
                    3600,  # 1 hour TTL
                    json.dumps(analytics_data, default=str)
                )
                
                updated_count += 1
            
            logger.info(f"Updated analytics for {updated_count} quizzes")
            return updated_count
            
        except Exception as e:
            logger.error(f"Error updating quiz analytics: {e}")
            return 0
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        updated_count = loop.run_until_complete(_update_analytics())
        return updated_count
    finally:
        loop.close()

@celery_app.task(name="tasks.quiz_tasks.send_quiz_reminders")
def send_quiz_reminders():
    """Send reminders for incomplete quiz sessions"""
    async def _send_reminders():
        try:
            await redis_service.initialize()
            
            # Find sessions that have been inactive for 30+ minutes
            pattern = RedisKeys.QUIZ_SESSION.format(session_id="*")
            reminder_count = 0
            
            async for key in redis_service.session_client.scan_iter(match=pattern):
                try:
                    session_data_str = await redis_service.session_client.get(key)
                    if not session_data_str:
                        continue
                    
                    import json
                    session_data = json.loads(session_data_str)
                    
                    if session_data.get("status") != "in_progress":
                        continue
                    
                    start_time_str = session_data.get("start_time")
                    if not start_time_str:
                        continue
                    
                    start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                    inactive_time = datetime.utcnow() - start_time.replace(tzinfo=None)
                    
                    # Send reminder if inactive for 30+ minutes but less than 1 hour
                    if timedelta(minutes=30) <= inactive_time <= timedelta(hours=1):
                        user_id = session_data.get("user_id")
                        session_id = session_data.get("session_id")
                        
                        if user_id and session_id:
                            # Publish reminder notification
                            reminder_message = {
                                "type": "quiz_reminder",
                                "user_id": user_id,
                                "session_id": session_id,
                                "message": "You have an incomplete quiz session. Would you like to continue?",
                                "timestamp": datetime.utcnow().isoformat()
                            }
                            
                            await redis_service.publish_quiz_update(
                                session_data.get("quiz_id", 0),
                                reminder_message
                            )
                            
                            reminder_count += 1
                
                except Exception as e:
                    logger.error(f"Error processing reminder for session {key}: {e}")
                    continue
            
            logger.info(f"Sent {reminder_count} quiz reminders")
            return reminder_count
            
        except Exception as e:
            logger.error(f"Error sending quiz reminders: {e}")
            return 0
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        reminder_count = loop.run_until_complete(_send_reminders())
        return reminder_count
    finally:
        loop.close()

# Manual task triggers (for testing or manual execution)
@celery_app.task(name="tasks.quiz_tasks.force_expire_session")
def force_expire_session(session_id: str):
    """Manually expire a specific session"""
    async def _force_expire():
        timer_manager = QuizTimerManager()
        await timer_manager._expire_session(session_id)
        return f"Session {session_id} expired"
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(_force_expire())
        return result
    finally:
        loop.close()

# Health check task
@celery_app.task(name="tasks.quiz_tasks.health_check")
def health_check():
    """Health check for the quiz task system"""
    try:
        # Check Redis connectivity
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def _check():
            await redis_service.initialize()
            await redis_service.session_client.ping()
            return True
        
        redis_ok = loop.run_until_complete(_check())
        loop.close()
        
        return {
            "status": "healthy",
            "redis_connection": redis_ok,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }