# app/models/question_paper_models.py
# For uploaded question papers that are digitized

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Enum ,Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base
import enum
from datetime import datetime
from typing import List, Optional ,Dict 

class QuestionType(enum.Enum):
    MCQ = "mcq"
    SHORT = "short"
    LONG = "long"
    TRUE_FALSE = "true_false"
    ASSERTION_REASON = "assertion_reason"
    FILL_BLANK = "fill_blank"

class PaperStatus(enum.Enum):
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"

class QuestionPaper(Base):
    """Uploaded question papers for digitization"""
    __tablename__ = "question_papers"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(String(255), unique=True, index=True, nullable=False)  # user_title + timestamp
    title = Column(String(200), nullable=False)
    subject = Column(String(100), nullable=False)
    exam_type = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)
    difficulty = Column(String(20), nullable=False, default="medium")
    time_limit = Column(Integer, nullable=False, default=180)  # in minutes
    instructions = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False)
    generate_answers = Column(Boolean, default=True)
    
    # Processing fields
    status = Column(Enum(PaperStatus), nullable=False, default=PaperStatus.PROCESSING)
    total_questions = Column(Integer, nullable=True)
    total_points = Column(Integer, nullable=True)
    
    # User association
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    questions = relationship("PaperQuestion", back_populates="paper", cascade="all, delete-orphan")
    quiz_sessions = relationship("PaperQuizSession", back_populates="question_paper")
    creator = relationship("User")

class PaperQuestion(Base):
    """Questions extracted from uploaded question papers"""
    __tablename__ = "paper_questions"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("question_papers.id"), nullable=False)
    question_index = Column(Integer, nullable=False)  # Order in the paper
    question_text = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False)
    
    # Answer data stored as JSON
    options = Column(JSON, nullable=True)  # For MCQ, assertion_reason, true_false
    correct_answer = Column(String(500), nullable=False)  # Index for MCQ, text for others
    explanation = Column(Text, nullable=True)
    points = Column(Integer, nullable=False, default=10)
    
    # Relationships
    paper = relationship("QuestionPaper", back_populates="questions")
    
    # Enhanced fields for dots.ocr support
    page_number = Column(Integer, nullable=True)
    has_formula = Column(Boolean, default=False)
    has_table = Column(Boolean, default=False)
    difficulty = Column(String(20), default="medium")
    extraction_method = Column(String(50), default="dots.ocr")

class PaperQuizSession(Base):
    """Quiz sessions for question paper quizzes"""
    __tablename__ = "paper_quiz_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), unique=True, index=True, nullable=False)
    paper_id = Column(Integer, ForeignKey("question_papers.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Quiz configuration
    quiz_config = Column(JSON, nullable=False)
    
    # Session data
    answers = Column(JSON, nullable=False)  # User answers
    score_summary = Column(JSON, nullable=False)  # Score breakdown
    time_tracking = Column(JSON, nullable=False)  # Time per question
    
    # Status
    is_completed = Column(Boolean, default=False)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    question_paper = relationship("QuestionPaper", back_populates="quiz_sessions")
    user = relationship("User")

# Analytics for question papers
class PaperAnalytics(Base):
    """Analytics for question papers"""
    __tablename__ = "paper_analytics"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("question_papers.id"), nullable=False)
    
    # Performance metrics
    date = Column(DateTime(timezone=True), server_default=func.now())
    total_attempts = Column(Integer, default=0)
    total_completions = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    completion_rate = Column(Float, default=0.0)
    average_time_minutes = Column(Float, default=0.0)
    
    # Question difficulty analysis
    hardest_questions = Column(JSON, nullable=True)
    easiest_questions = Column(JSON, nullable=True)
    most_skipped_questions = Column(JSON, nullable=True)
    
    # User engagement
    unique_users = Column(Integer, default=0)
    repeat_attempts = Column(Integer, default=0)
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    paper = relationship("QuestionPaper")