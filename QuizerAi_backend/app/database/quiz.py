# app/models/quiz_models.py
# Unified quiz system for both AI-generated and manually created quizzes

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base
import enum
from datetime import datetime

class QuizType(enum.Enum):
    MCQ = "mcq"
    SHORT_ANSWER = "short_answer"
    LONG_ANSWER = "long_answer"
    FILL_BLANK = "fill_blank"
    TRUE_FALSE = "true_false"

class QuizStatus(enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"

class SessionStatus(enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"
    ABANDONED = "abandoned"

class TimerType(enum.Enum):
    PER_QUESTION = "per_question"
    TOTAL_QUIZ = "total_quiz"
    NO_LIMIT = "no_limit"

class QuizSource(enum.Enum):
    FILE_UPLOAD = "file"
    URL = "url"
    YOUTUBE_URL = "youtube_url"
    YOUTUBE_SEARCH = "youtube_search"
    MANUAL = "manual"
    QUESTION_PAPER = "question_paper"  # Added for teacher-created question papers

class QuizCreatorType(enum.Enum):
    STUDENT = "student"  # AI-generated quizzes by students
    TEACHER = "teacher"  # Manually created by teachers
    SYSTEM = "system"    # System generated

class Quiz(Base):
    """Unified quiz model for both AI-generated and manually created quizzes"""
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(100), unique=True, index=True)  # For frontend quiz IDs
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator_type = Column(Enum(QuizCreatorType), nullable=False)
    subject = Column(String(100), nullable=True)
    difficulty_level = Column(String(20), nullable=True)  # easy, medium, hard
    source = Column(Enum(QuizSource), default=QuizSource.MANUAL)
    source_content = Column(Text, nullable=True)  # Original content/URL for AI quizzes
    
    # Quiz access control
    is_public = Column(Boolean, default=False)  # Can be accessed by anyone
    is_template = Column(Boolean, default=False)  # Can be used as template by others
    
    # Timer settings
    timer_type = Column(Enum(TimerType), default=TimerType.NO_LIMIT)
    total_time_minutes = Column(Integer, nullable=True)
    per_question_time_seconds = Column(Integer, nullable=True)
    
    # Quiz settings
    shuffle_questions = Column(Boolean, default=False)
    shuffle_options = Column(Boolean, default=False)
    show_results_immediately = Column(Boolean, default=True)
    allow_review = Column(Boolean, default=True)
    max_attempts = Column(Integer, default=1)
    allow_skip = Column(Boolean, default=True)
    show_correct_answers = Column(Boolean, default=True)  # Show correct answers after completion
    
    # Metadata
    status = Column(Enum(QuizStatus), default=QuizStatus.ACTIVE)
    total_questions = Column(Integer, default=0)
    total_points = Column(Float, default=0.0)
    passing_score = Column(Float, default=70.0)
    estimated_time_minutes = Column(Integer, nullable=True)
    language = Column(String(50), default="English")
    
    # Teacher-specific features
    instructions = Column(Text, nullable=True)  # Special instructions for students
    prerequisites = Column(Text, nullable=True)  # Prerequisites for taking the quiz
    tags = Column(JSON, nullable=True)  # Tags for categorization
    
    # Analytics
    total_attempts = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    completion_rate = Column(Float, default=0.0)
    
    # AI-specific metadata (for AI-generated quizzes)
    ai_generation_metadata = Column(JSON, nullable=True)  # Store AI generation details
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    creator = relationship("User")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    sessions = relationship("QuizSession", back_populates="quiz")
    classroom_assignments = relationship("ClassroomQuizAssignment", back_populates="quiz")
    security_config = relationship("QuizSecurityConfig", back_populates="quiz", uselist=False)

class Question(Base):
    """Unified question model for all quiz types"""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(Enum(QuizType), nullable=False)
    order_index = Column(Integer, nullable=False)
    points = Column(Float, default=1.0)
    
    # Question options (for MCQ, True/False)
    options = Column(JSON, nullable=True)  # ["Option 1", "Option 2", "Option 3", "Option 4"]
    correct_answer = Column(Text, nullable=False)  # Store correct answer
    explanation = Column(Text, nullable=True)
    
    # Additional content
    image_url = Column(String(500), nullable=True)  # Question image
    video_url = Column(String(500), nullable=True)  # Question video
    
    # Settings
    is_required = Column(Boolean, default=True)  # Must be answered
    partial_credit = Column(Boolean, default=False)  # Allow partial scoring
    
    # Time estimates
    estimated_time_seconds = Column(Integer, default=90)
    
    # Metadata
    difficulty = Column(String(20), nullable=True)
    tags = Column(JSON, nullable=True)  # ["calculus", "derivatives"]
    
    # Analytics
    times_answered = Column(Integer, default=0)
    correct_answer_count = Column(Integer, default=0)
    average_time_taken = Column(Float, default=0.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    answers = relationship("QuizAnswer", back_populates="question")

class QuizSession(Base):
    """Unified quiz session model"""
    __tablename__ = "quiz_sessions"

    id = Column(String(36), primary_key=True, index=True)  # UUID
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Session context
    context_type = Column(String(50), nullable=True)  # 'classroom', 'practice', 'self_study'
    context_id = Column(Integer, nullable=True)  # classroom_id or assignment_id if applicable
    
    # Session tracking
    status = Column(Enum(SessionStatus), default=SessionStatus.NOT_STARTED)
    attempt_number = Column(Integer, nullable=False)
    
    # Configuration used for this session
    session_config = Column(JSON, nullable=True)  # Store the quiz config used
    
    # Timing
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    total_time_seconds = Column(Integer, nullable=True)
    paused_time_seconds = Column(Integer, default=0)
    
    # Progress tracking
    current_question_index = Column(Integer, default=0)
    questions_answered = Column(Integer, default=0)
    questions_skipped = Column(Integer, default=0)
    questions_reviewed = Column(Integer, default=0)
    
    # Scoring
    total_score = Column(Float, default=0.0)
    max_possible_score = Column(Float, nullable=True)
    percentage_score = Column(Float, nullable=True)
    is_passed = Column(Boolean, default=False)
    
    # Analytics
    question_order = Column(JSON, nullable=True)  # Track question order if shuffled
    time_per_question = Column(JSON, nullable=True)  # Track time spent per question
    answer_changes = Column(JSON, nullable=True)  # Track answer modifications
    
    # Technical metadata
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    device_info = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    quiz = relationship("Quiz", back_populates="sessions")
    user = relationship("User")
    answers = relationship("QuizAnswer", back_populates="session")

class QuizAnswer(Base):
    """Unified answer model for all quiz types"""
    __tablename__ = "quiz_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), ForeignKey("quiz_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    
    # Answer data
    user_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    points_earned = Column(Float, default=0.0)
    confidence_level = Column(Integer, nullable=True)  # 1-5 scale
    
    # Timing and behavior
    time_taken_seconds = Column(Integer, nullable=True)
    answer_attempts = Column(Integer, default=1)  # Number of times answer was changed
    was_skipped = Column(Boolean, default=False)
    was_reviewed = Column(Boolean, default=False)
    
    # Answer metadata
    answer_sequence = Column(JSON, nullable=True)  # Track answer changes
    answered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Auto-grading metadata (for AI assistance)
    auto_grade_confidence = Column(Float, nullable=True)  # AI confidence in grading
    requires_manual_review = Column(Boolean, default=False)  # For subjective answers
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("QuizSession", back_populates="answers")
    question = relationship("Question", back_populates="answers")

# Enhanced analytics tables
class QuizAnalytics(Base):
    """Analytics for all quiz types"""
    __tablename__ = "quiz_analytics"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    
    # Daily aggregated metrics
    date = Column(DateTime(timezone=True), server_default=func.now())
    total_attempts = Column(Integer, default=0)
    total_completions = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    completion_rate = Column(Float, default=0.0)
    average_time_minutes = Column(Float, default=0.0)
    
    # Question-level analytics
    question_performance = Column(JSON, nullable=True)  # Performance per question
    common_wrong_answers = Column(JSON, nullable=True)  # Most common incorrect answers
    
    # Difficulty analysis
    hardest_questions = Column(JSON, nullable=True)  # Questions with lowest success rate
    easiest_questions = Column(JSON, nullable=True)  # Questions with highest success rate
    
    # Student analytics (for teacher-created quizzes)
    student_performance_summary = Column(JSON, nullable=True)  # Summary by student groups
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    quiz = relationship("Quiz")

# Question Paper Templates (for teachers to create reusable templates)
class QuestionPaperTemplate(Base):
    """Templates for commonly used question papers"""
    __tablename__ = "question_paper_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(100), nullable=True)
    grade_level = Column(String(50), nullable=True)
    
    # Template configuration
    default_settings = Column(JSON, nullable=True)  # Default quiz settings
    question_distribution = Column(JSON, nullable=True)  # Number of questions by type/difficulty
    
    # Usage tracking
    times_used = Column(Integer, default=0)
    is_public = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User")