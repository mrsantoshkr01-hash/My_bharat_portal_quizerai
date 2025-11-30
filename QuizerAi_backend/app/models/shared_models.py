# app/models/shared_models.py
# Shared models for user statistics and achievements

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base
from datetime import datetime

class UserQuizStats(Base):
    """Overall user statistics across all quiz types"""
    __tablename__ = "user_quiz_stats"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True , autoincrement=True )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Overall performance - Add server_default and nullable=False
    total_quizzes_taken = Column(Integer, default=0, server_default="0", nullable=False)
    total_quizzes_completed = Column(Integer, default=0, server_default="0", nullable=False)
    total_quizzes_passed = Column(Integer, default=0, server_default="0", nullable=False)
    average_score = Column(Float, default=0.0, server_default="0.0", nullable=False)
    highest_score = Column(Float, default=0.0, server_default="0.0", nullable=False)
    total_time_spent_minutes = Column(Integer, default=0, server_default="0", nullable=False)
    total_points_earned = Column(Float, default=0.0, server_default="0.0", nullable=False)
    
    # AI Quiz specific stats - Add server_default and nullable=False
    ai_quizzes_taken = Column(Integer, default=0, server_default="0", nullable=False)
    ai_quizzes_completed = Column(Integer, default=0, server_default="0", nullable=False)
    ai_quiz_average_score = Column(Float, default=0.0, server_default="0.0", nullable=False)
    
    # Question Paper specific stats - Add server_default and nullable=False
    papers_attempted = Column(Integer, default=0, server_default="0", nullable=False)
    papers_completed = Column(Integer, default=0, server_default="0", nullable=False)
    paper_quiz_average_score = Column(Float, default=0.0, server_default="0.0", nullable=False)
    
    # Streaks and achievements - Add server_default and nullable=False
    current_streak = Column(Integer, default=0, server_default="0", nullable=False)
    longest_streak = Column(Integer, default=0, server_default="0", nullable=False)
    last_quiz_date = Column(DateTime(timezone=True), nullable=True)
    
    # Performance by category
    subject_performance = Column(JSON, nullable=True)
    difficulty_performance = Column(JSON, nullable=True)
    
    # Learning analytics - Add server_default and nullable=False where needed
    improvement_rate = Column(Float, default=0.0, server_default="0.0", nullable=False)
    consistency_score = Column(Float, default=0.0, server_default="0.0", nullable=False)
    preferred_quiz_length = Column(Integer, nullable=True)
    
    # Behavioral patterns - Add server_default and nullable=False
    average_session_duration = Column(Float, default=0.0, server_default="0.0", nullable=False)
    quiz_taking_frequency = Column(Float, default=0.0, server_default="0.0", nullable=False)
    most_active_time = Column(String(50), nullable=True)
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")

# Rest of the models remain the same
class Achievement(Base):
    """Achievement system for gamification"""
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True , autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    criteria = Column(JSON, nullable=False)
    points = Column(Integer, default=0)
    category = Column(String(50), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserAchievement(Base):
    """User earned achievements"""
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True , autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    progress_data = Column(JSON, nullable=True)

    user = relationship("User")
    achievement = relationship("Achievement")

class Leaderboard(Base):
    """Global and subject-wise leaderboards"""
    __tablename__ = "leaderboards"

    id = Column(Integer, primary_key=True, index=True , autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    global_rank = Column(Integer, nullable=True)
    subject_ranks = Column(JSON, nullable=True)
    weekly_rank = Column(Integer, nullable=True)
    monthly_rank = Column(Integer, nullable=True)
    
    total_points = Column(Float, default=0.0)
    weekly_points = Column(Float, default=0.0)
    monthly_points = Column(Float, default=0.0)
    
    overall_accuracy = Column(Float, default=0.0)
    quiz_completion_rate = Column(Float, default=0.0)
    consistency_score = Column(Float, default=0.0)
    
    last_activity = Column(DateTime(timezone=True), nullable=True)
    ranking_period_start = Column(DateTime(timezone=True), server_default=func.now())
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")