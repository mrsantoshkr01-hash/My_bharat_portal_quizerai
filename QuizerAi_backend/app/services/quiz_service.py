# services/quiz_service.py
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import logging
import json

from app.database.quiz import Quiz, Question, QuizSession, QuizAnswer, SessionStatus, TimerType
from app.models.user_models import User, UserRole
from app.config.redis_config import redis_service
from app.database.connection import get_db

logger = logging.getLogger(__name__)

class QuizService:
    """Service layer for quiz operations with Redis integration"""
    
    def __init__(self, db: Session):
        self.db = db
        
    # Quiz Creation and Management
    async def create_quiz(self, quiz_data: Dict[str, Any], creator_id: int) -> Quiz:
        """Create a new quiz and cache it"""
        try:
            # Create quiz in database
            quiz = Quiz(
                title=quiz_data["title"],
                description=quiz_data.get("description"),
                creator_id=creator_id,
                subject=quiz_data.get("subject"),
                difficulty_level=quiz_data.get("difficulty_level"),
                timer_type=TimerType(quiz_data.get("timer_type", "no_limit")),
                total_time_minutes=quiz_data.get("total_time_minutes"),
                per_question_time_seconds=quiz_data.get("per_question_time_seconds"),
                shuffle_questions=quiz_data.get("shuffle_questions", False),
                shuffle_options=quiz_data.get("shuffle_options", False),
                show_results_immediately=quiz_data.get("show_results_immediately", True),
                allow_review=quiz_data.get("allow_review", True),
                max_attempts=quiz_data.get("max_attempts", 1)
            )
            
            self.db.add(quiz)
            self.db.commit()
            self.db.refresh(quiz)
            
            # Cache quiz data in Redis
            await self._cache_quiz_data(quiz)
            
            logger.info(f"Quiz {quiz.id} created by user {creator_id}")
            return quiz
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating quiz: {e}")
            raise
    
    async def add_questions_to_quiz(self, quiz_id: int, questions_data: List[Dict[str, Any]], creator_id: int):
        """Add questions to quiz (from AI generation or manual input)"""
        try:
            # Verify quiz ownership
            quiz = self.db.query(Quiz).filter(
                and_(Quiz.id == quiz_id, Quiz.creator_id == creator_id)
            ).first()
            
            if not quiz:
                raise ValueError("Quiz not found or access denied")
            
            # Add questions
            questions = []
            for idx, q_data in enumerate(questions_data):
                question = Question(
                    quiz_id=quiz_id,
                    question_text=q_data["question_text"],
                    question_type=q_data["question_type"],
                    order_index=idx + 1,
                    points=q_data.get("points", 1.0),
                    options=q_data.get("options"),
                    correct_answer=q_data["correct_answer"],
                    explanation=q_data.get("explanation"),
                    difficulty=q_data.get("difficulty"),
                    tags=q_data.get("tags", [])
                )
                questions.append(question)
                self.db.add(question)
            
            # Update quiz total questions
            quiz.total_questions = len(questions_data)
            self.db.commit()
            
            # Update cache
            await self._cache_quiz_data(quiz)
            
            logger.info(f"Added {len(questions_data)} questions to quiz {quiz_id}")
            return questions
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error adding questions to quiz {quiz_id}: {e}")
            raise
    
    # Quiz Session Management
    async def start_quiz_session(self, quiz_id: int, user_id: int, ip_address: str = None, user_agent: str = None) -> Dict[str, Any]:
        """Start a new quiz session with Redis integration"""
        try:
            # Check if quiz exists and is active
            quiz = await self._get_quiz_with_cache(quiz_id)
            if not quiz:
                raise ValueError("Quiz not found")
            
            # Check user permissions and attempt limits
            await self._validate_quiz_access(quiz_id, user_id)
            
            # Create session ID
            session_id = str(uuid.uuid4())
            
            # Get quiz questions
            questions = self.db.query(Question).filter(Question.quiz_id == quiz_id).order_by(Question.order_index).all()
            
            if not questions:
                raise ValueError("Quiz has no questions")
            
            # Shuffle questions if enabled
            if quiz.get("shuffle_questions"):
                import random
                questions = random.sample(questions, len(questions))
            
            # Create database session record
            attempt_number = await self._get_next_attempt_number(quiz_id, user_id)
            
            db_session = QuizSession(
                id=session_id,
                quiz_id=quiz_id,
                user_id=user_id,
                status=SessionStatus.IN_PROGRESS,
                attempt_number=attempt_number,
                start_time=datetime.utcnow(),
                current_question_index=0,
                max_possible_score=sum(q.points for q in questions),
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            self.db.add(db_session)
            self.db.commit()
            
            # Prepare session data for Redis
            session_data = {
                "session_id": session_id,
                "quiz_id": quiz_id,
                "user_id": user_id,
                "status": "in_progress",
                "start_time": datetime.utcnow().isoformat(),
                "current_question_index": 0,
                "questions_answered": 0,
                "total_questions": len(questions),
                "answers": {},  # {question_id: user_answer}
                "question_order": [q.id for q in questions],
                "timer_type": quiz.get("timer_type", "no_limit"),
                "settings": {
                    "total_time_minutes": quiz.get("total_time_minutes"),
                    "per_question_time_seconds": quiz.get("per_question_time_seconds"),
                    "shuffle_options": quiz.get("shuffle_options", False),
                    "allow_review": quiz.get("allow_review", True)
                }
            }
            
            # Save session to Redis with appropriate TTL
            ttl = 7200  # Default 2 hours
            if quiz.get("timer_type") == "total_quiz" and quiz.get("total_time_minutes"):
                ttl = quiz["total_time_minutes"] * 60 + 300  # Quiz time + 5 min buffer
            
            await redis_service.save_quiz_session(session_id, session_data, ttl)
            
            # Set up timer if required
            if quiz.get("timer_type") == "total_quiz" and quiz.get("total_time_minutes"):
                total_seconds = quiz["total_time_minutes"] * 60
                await redis_service.set_quiz_timer(session_id, total_seconds)
            
            # Track active user sessions
            await self._track_user_session(user_id, session_id)
            
            logger.info(f"Quiz session {session_id} started for user {user_id}")
            
            return {
                "session_id": session_id,
                "quiz_title": quiz.get("title", ""),
                "total_questions": len(questions),
                "timer_type": quiz.get("timer_type"),
                "total_time_minutes": quiz.get("total_time_minutes"),
                "per_question_time_seconds": quiz.get("per_question_time_seconds"),
                "first_question": await self._get_next_question(session_id)
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error starting quiz session: {e}")
            raise
    
    async def get_current_question(self, session_id: str) -> Dict[str, Any]:
        """Get current question for active session"""
        try:
            session_data = await redis_service.get_quiz_session(session_id)
            if not session_data:
                raise ValueError("Session not found or expired")
            
            if session_data["status"] != "in_progress":
                raise ValueError("Session is not active")
            
            current_index = session_data["current_question_index"]
            question_order = session_data["question_order"]
            
            if current_index >= len(question_order):
                # All questions completed
                return await self._complete_quiz_session(session_id)
            
            question_id = question_order[current_index]
            question = self.db.query(Question).filter(Question.id == question_id).first()
            
            if not question:
                raise ValueError("Question not found")
            
            # Prepare question data (hide correct answer)
            question_data = {
                "question_id": question.id,
                "question_text": question.question_text,
                "question_type": question.question_type.value,
                "options": question.options,
                "points": question.points,
                "order_index": current_index + 1,
                "total_questions": session_data["total_questions"],
                "explanation": None  # Hide explanation until submission
            }
            
            # Shuffle options if enabled
            if session_data["settings"].get("shuffle_options") and question.options:
                import random
                options = list(question.options.items())
                random.shuffle(options)
                question_data["options"] = dict(options)
            
            # Add timer information
            timer_info = await self._get_timer_info(session_id, question_id)
            
            return {
                "question": question_data,
                "session_info": {
                    "current_question": current_index + 1,
                    "total_questions": session_data["total_questions"],
                    "questions_answered": session_data["questions_answered"],
                    "timer": timer_info
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting current question for session {session_id}: {e}")
            raise
    
    async def submit_answer(self, session_id: str, question_id: int, user_answer: str) -> Dict[str, Any]:
        """Submit answer for current question"""
        try:
            session_data = await redis_service.get_quiz_session(session_id)
            if not session_data:
                raise ValueError("Session not found or expired")
            
            if session_data["status"] != "in_progress":
                raise ValueError("Session is not active")
            
            # Check if question is current
            current_index = session_data["current_question_index"]
            question_order = session_data["question_order"]
            
            if current_index >= len(question_order):
                raise ValueError("All questions already answered")
            
            expected_question_id = question_order[current_index]
            if question_id != expected_question_id:
                raise ValueError("Question order mismatch")
            
            # Get question details
            question = self.db.query(Question).filter(Question.id == question_id).first()
            if not question:
                raise ValueError("Question not found")
            
            # Calculate time taken
            time_taken = await self._calculate_time_taken(session_id, question_id)
            
            # Check answer correctness
            is_correct, points_earned = await self._evaluate_answer(question, user_answer)
            
            # Store answer in Redis session
            session_data["answers"][str(question_id)] = {
                "user_answer": user_answer,
                "is_correct": is_correct,
                "points_earned": points_earned,
                "time_taken": time_taken,
                "answered_at": datetime.utcnow().isoformat()
            }
            
            # Update progress
            session_data["questions_answered"] += 1
            session_data["current_question_index"] += 1
            session_data["total_score"] = session_data.get("total_score", 0) + points_earned
            
            # Update Redis session
            await redis_service.update_quiz_session(session_id, session_data)
            
            # Check if quiz is completed
            if session_data["current_question_index"] >= len(question_order):
                return await self._complete_quiz_session(session_id)
            
            # Get next question
            next_question = await self._get_next_question(session_id)
            
            return {
                "status": "answer_submitted",
                "is_correct": is_correct,
                "points_earned": points_earned,
                "next_question": next_question,
                "progress": {
                    "current_question": session_data["current_question_index"] + 1,
                    "total_questions": session_data["total_questions"],
                    "questions_answered": session_data["questions_answered"],
                    "current_score": session_data["total_score"]
                }
            }
            
        except Exception as e:
            logger.error(f"Error submitting answer for session {session_id}: {e}")
            raise
    
    async def complete_quiz_session(self, session_id: str) -> Dict[str, Any]:
        """Complete quiz session and save results to database"""
        try:
            session_data = await redis_service.get_quiz_session(session_id)
            if not session_data:
                raise ValueError("Session not found")
            
            # Get database session
            db_session = self.db.query(QuizSession).filter(QuizSession.id == session_id).first()
            if not db_session:
                raise ValueError("Database session not found")
            
            # Calculate final scores
            total_score = session_data.get("total_score", 0)
            max_possible_score = db_session.max_possible_score or 0
            percentage_score = (total_score / max_possible_score * 100) if max_possible_score > 0 else 0
            
            # Update database session
            db_session.status = SessionStatus.COMPLETED
            db_session.end_time = datetime.utcnow()
            db_session.total_time_seconds = int((db_session.end_time - db_session.start_time).total_seconds())
            db_session.questions_answered = session_data.get("questions_answered", 0)
            db_session.total_score = total_score
            db_session.percentage_score = percentage_score
            
            # Save individual answers to database
            answers_data = session_data.get("answers", {})
            for question_id_str, answer_data in answers_data.items():
                quiz_answer = QuizAnswer(
                    session_id=session_id,
                    question_id=int(question_id_str),
                    user_answer=answer_data["user_answer"],
                    is_correct=answer_data["is_correct"],
                    points_earned=answer_data["points_earned"],
                    time_taken_seconds=answer_data.get("time_taken", 0),
                    answered_at=datetime.fromisoformat(answer_data["answered_at"]) if answer_data.get("answered_at") else None
                )
                self.db.add(quiz_answer)
            
            self.db.commit()
            
            # Update user statistics
            await self._update_user_stats(db_session.user_id, db_session)
            
            # Generate detailed results
            results = await self._generate_quiz_results(session_id, db_session)
            
            # Clean up Redis session (optional - can keep for review)
            session_data["status"] = "completed"
            session_data["completed_at"] = datetime.utcnow().isoformat()
            await redis_service.update_quiz_session(session_id, session_data)
            
            # Publish completion event for real-time updates
            await redis_service.publish_quiz_update(db_session.quiz_id, {
                "type": "quiz_completed",
                "user_id": db_session.user_id,
                "session_id": session_id,
                "score": percentage_score
            })
            
            logger.info(f"Quiz session {session_id} completed with score {percentage_score:.1f}%")
            return results
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error completing quiz session {session_id}: {e}")
            raise
    
    # Timer Management Methods
    async def get_session_timer_status(self, session_id: str) -> Dict[str, Any]:
        """Get current timer status for session"""
        try:
            session_data = await redis_service.get_quiz_session(session_id)
            if not session_data:
                raise ValueError("Session not found")
            
            timer_type = session_data.get("timer_type", "no_limit")
            
            if timer_type == "no_limit":
                return {"timer_type": "no_limit", "unlimited": True}
            
            elif timer_type == "total_quiz":
                remaining_time = await redis_service.get_remaining_time(session_id)
                if remaining_time is None:
                    await redis_service.expire_quiz_timer(session_id)
                    return {"timer_type": "total_quiz", "expired": True, "remaining_seconds": 0}
                
                if remaining_time <= 0:
                    await self._handle_timer_expiry(session_id)
                    return {"timer_type": "total_quiz", "expired": True, "remaining_seconds": 0}
                
                return {
                    "timer_type": "total_quiz",
                    "remaining_seconds": remaining_time,
                    "remaining_minutes": remaining_time // 60,
                    "expired": False
                }
            
            elif timer_type == "per_question":
                per_question_time = session_data["settings"].get("per_question_time_seconds", 60)
                return {
                    "timer_type": "per_question",
                    "per_question_seconds": per_question_time,
                    "expired": False
                }
            
        except Exception as e:
            logger.error(f"Error getting timer status for session {session_id}: {e}")
            raise
    
    async def handle_timer_expiry(self, session_id: str):
        """Handle quiz timer expiry"""
        try:
            session_data = await redis_service.get_quiz_session(session_id)
            if not session_data or session_data["status"] != "in_progress":
                return
            
            # Mark session as expired
            session_data["status"] = "expired"
            session_data["expired_at"] = datetime.utcnow().isoformat()
            await redis_service.update_quiz_session(session_id, session_data)
            
            # Update database
            db_session = self.db.query(QuizSession).filter(QuizSession.id == session_id).first()
            if db_session:
                db_session.status = SessionStatus.EXPIRED
                db_session.end_time = datetime.utcnow()
                db_session.total_time_seconds = int((db_session.end_time - db_session.start_time).total_seconds())
                
                # Save partial results
                answers_data = session_data.get("answers", {})
                for question_id_str, answer_data in answers_data.items():
                    quiz_answer = QuizAnswer(
                        session_id=session_id,
                        question_id=int(question_id_str),
                        user_answer=answer_data["user_answer"],
                        is_correct=answer_data["is_correct"],
                        points_earned=answer_data["points_earned"],
                        time_taken_seconds=answer_data.get("time_taken", 0)
                    )
                    self.db.add(quiz_answer)
                
                self.db.commit()
            
            logger.info(f"Quiz session {session_id} expired due to timeout")
            
        except Exception as e:
            logger.error(f"Error handling timer expiry for session {session_id}: {e}")
    
    # User Role-Based Methods
    async def get_user_quiz_dashboard(self, user_id: int, role: UserRole) -> Dict[str, Any]:
        """Get dashboard data based on user role"""
        try:
            if role == UserRole.STUDENT:
                return await self._get_student_dashboard(user_id)
            elif role == UserRole.TEACHER:
                return await self._get_teacher_dashboard(user_id)
            elif role == UserRole.ADMIN:
                return await self._get_admin_dashboard(user_id)
            else:
                raise ValueError("Invalid user role")
                
        except Exception as e:
            logger.error(f"Error getting dashboard for user {user_id}: {e}")
            raise
    
    # Private Helper Methods
    async def _get_quiz_with_cache(self, quiz_id: int) -> Optional[Dict[str, Any]]:
        """Get quiz data with Redis caching"""
        # Try cache first
        cached_quiz = await redis_service.get_cached_quiz(quiz_id)
        if cached_quiz:
            return cached_quiz
        
        # Fallback to database
        quiz = self.db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if quiz:
            quiz_data = {
                "id": quiz.id,
                "title": quiz.title,
                "description": quiz.description,
                "timer_type": quiz.timer_type.value,
                "total_time_minutes": quiz.total_time_minutes,
                "per_question_time_seconds": quiz.per_question_time_seconds,
                "shuffle_questions": quiz.shuffle_questions,
                "shuffle_options": quiz.shuffle_options,
                "show_results_immediately": quiz.show_results_immediately,
                "allow_review": quiz.allow_review,
                "max_attempts": quiz.max_attempts,
                "total_questions": quiz.total_questions
            }
            # Cache for future use
            await redis_service.cache_quiz_data(quiz_id, quiz_data)
            return quiz_data
        
        return None
    
    async def _cache_quiz_data(self, quiz: Quiz):
        """Cache quiz data in Redis"""
        quiz_data = {
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "timer_type": quiz.timer_type.value,
            "total_time_minutes": quiz.total_time_minutes,
            "per_question_time_seconds": quiz.per_question_time_seconds,
            "shuffle_questions": quiz.shuffle_questions,
            "shuffle_options": quiz.shuffle_options,
            "show_results_immediately": quiz.show_results_immediately,
            "allow_review": quiz.allow_review,
            "max_attempts": quiz.max_attempts,
            "total_questions": quiz.total_questions
        }
        await redis_service.cache_quiz_data(quiz.id, quiz_data)
    
    async def _validate_quiz_access(self, quiz_id: int, user_id: int):
        """Validate user access to quiz"""
        # Check if user has exceeded attempt limits
        attempt_count = self.db.query(QuizSession).filter(
            and_(
                QuizSession.quiz_id == quiz_id,
                QuizSession.user_id == user_id,
                QuizSession.status.in_([SessionStatus.COMPLETED, SessionStatus.EXPIRED])
            )
        ).count()
        
        quiz = await self._get_quiz_with_cache(quiz_id)
        max_attempts = quiz.get("max_attempts", 1)
        
        if attempt_count >= max_attempts:
            raise ValueError(f"Maximum attempts ({max_attempts}) exceeded")
    
    async def _get_next_attempt_number(self, quiz_id: int, user_id: int) -> int:
        """Get next attempt number for user"""
        max_attempt = self.db.query(QuizSession.attempt_number).filter(
            and_(QuizSession.quiz_id == quiz_id, QuizSession.user_id == user_id)
        ).order_by(QuizSession.attempt_number.desc()).first()
        
        return (max_attempt[0] if max_attempt else 0) + 1
    
    async def _get_next_question(self, session_id: str) -> Dict[str, Any]:
        """Get next question in sequence"""
        return await self.get_current_question(session_id)
    
    async def _evaluate_answer(self, question: Question, user_answer: str) -> Tuple[bool, float]:
        """Evaluate user answer against correct answer"""
        correct_answer = question.correct_answer.strip().lower()
        user_answer = user_answer.strip().lower()
        
        if question.question_type.value in ["mcq", "true_false"]:
            is_correct = user_answer == correct_answer
        else:
            # For text answers, implement fuzzy matching or exact match
            is_correct = user_answer == correct_answer
        
        points_earned = question.points if is_correct else 0
        return is_correct, points_earned
    
    async def _calculate_time_taken(self, session_id: str, question_id: int) -> int:
        """Calculate time taken for current question"""
        # This would track when question was displayed vs answered
        # For now, return 30 seconds as placeholder
        return 30
    
    async def _get_timer_info(self, session_id: str, question_id: int) -> Dict[str, Any]:
        """Get timer information for current question"""
        session_data = await redis_service.get_quiz_session(session_id)
        timer_type = session_data.get("timer_type", "no_limit")
        
        if timer_type == "total_quiz":
            remaining_time = await redis_service.get_remaining_time(session_id)
            return {
                "type": "total_quiz",
                "remaining_seconds": remaining_time or 0
            }
        elif timer_type == "per_question":
            per_question_time = session_data["settings"].get("per_question_time_seconds", 60)
            return {
                "type": "per_question",
                "seconds_per_question": per_question_time
            }
        else:
            return {"type": "no_limit"}
    
    async def _complete_quiz_session(self, session_id: str) -> Dict[str, Any]:
        """Internal method to complete quiz session"""
        return await self.complete_quiz_session(session_id)
    
    async def _handle_timer_expiry(self, session_id: str):
        """Internal timer expiry handler"""
        await self.handle_timer_expiry(session_id)
    
    async def _track_user_session(self, user_id: int, session_id: str):
        """Track active user sessions"""
        # This can be used to prevent multiple concurrent sessions
        key = f"user_sessions:{user_id}"
        await redis_service.session_client.sadd(key, session_id)
        await redis_service.session_client.expire(key, 7200)
    
    async def _update_user_stats(self, user_id: int, session: QuizSession):
        """Update user statistics after quiz completion"""
        # This would update UserQuizStats table
        # Implementation depends on specific analytics requirements
        pass
    
    async def _generate_quiz_results(self, session_id: str, session: QuizSession) -> Dict[str, Any]:
        """Generate comprehensive quiz results"""
        # Get all answers for this session
        answers = self.db.query(QuizAnswer).filter(QuizAnswer.session_id == session_id).all()
        
        results = {
            "session_id": session_id,
            "quiz_id": session.quiz_id,
            "total_score": session.total_score,
            "percentage_score": session.percentage_score,
            "questions_answered": session.questions_answered,
            "total_time_seconds": session.total_time_seconds,
            "answers": []
        }
        
        for answer in answers:
            question = self.db.query(Question).filter(Question.id == answer.question_id).first()
            results["answers"].append({
                "question_id": answer.question_id,
                "question_text": question.question_text if question else "",
                "user_answer": answer.user_answer,
                "correct_answer": question.correct_answer if question else "",
                "is_correct": answer.is_correct,
                "points_earned": answer.points_earned,
                "explanation": question.explanation if question else ""
            })
        
        return results
    
    async def _get_student_dashboard(self, user_id: int) -> Dict[str, Any]:
        """Get student-specific dashboard data"""
        # Recent sessions
        recent_sessions = self.db.query(QuizSession).filter(
            QuizSession.user_id == user_id
        ).order_by(QuizSession.created_at.desc()).limit(10).all()
        
        # Calculate stats
        total_quizzes = len(recent_sessions)
        avg_score = sum(s.percentage_score or 0 for s in recent_sessions) / total_quizzes if total_quizzes > 0 else 0
        
        return {
            "user_type": "student",
            "total_quizzes_taken": total_quizzes,
            "average_score": round(avg_score, 1),
            "recent_sessions": [
                {
                    "session_id": s.id,
                    "quiz_id": s.quiz_id,
                    "score": s.percentage_score,
                    "completed_at": s.end_time.isoformat() if s.end_time else None
                } for s in recent_sessions[:5]
            ]
        }
    
    async def _get_teacher_dashboard(self, user_id: int) -> Dict[str, Any]:
        """Get teacher-specific dashboard data"""
        # Quizzes created by teacher
        created_quizzes = self.db.query(Quiz).filter(Quiz.creator_id == user_id).all()
        
        return {
            "user_type": "teacher",
            "total_quizzes_created": len(created_quizzes),
            "created_quizzes": [
                {
                    "quiz_id": q.id,
                    "title": q.title,
                    "total_questions": q.total_questions,
                    "created_at": q.created_at.isoformat()
                } for q in created_quizzes[:10]
            ]
        }
    
    async def _get_admin_dashboard(self, user_id: int) -> Dict[str, Any]:
        """Get admin-specific dashboard data"""
        # System-wide statistics
        total_users = self.db.query(User).count()
        total_quizzes = self.db.query(Quiz).count()
        total_sessions = self.db.query(QuizSession).count()
        
        return {
            "user_type": "admin",
            "total_users": total_users,
            "total_quizzes": total_quizzes,
            "total_sessions": total_sessions
        }