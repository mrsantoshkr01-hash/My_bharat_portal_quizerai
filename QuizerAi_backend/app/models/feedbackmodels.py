# app/models/feedback.py
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database.connection import Base

class Feedback(Base):
    __tablename__ = "feedback"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Basic Information
    name = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    
    # Overall Experience
    overall_rating = Column(Integer, nullable=False)  # 1-5 rating
    user_type = Column(String(50), nullable=True)  # student, teacher, parent, etc.
    usage_frequency = Column(String(50), nullable=True)  # daily, weekly, monthly, etc.
    primary_use_case = Column(String(50), nullable=True)  # quiz_creation, studying, etc.
    device_type = Column(String(50), nullable=True)  # desktop, laptop, tablet, mobile
    browser_type = Column(String(50), nullable=True)  # chrome, firefox, safari, etc.
    
    # Feedback Details
    feedback_type = Column(String(50), nullable=True)  # bug, feature, improvement, general
    
    # Detailed Feedback Text Fields
    website_working = Column(Text, nullable=True)  # How is the website working
    expectations = Column(Text, nullable=True)  # Expectations vs reality
    suggestions = Column(Text, nullable=True)  # Suggestions for improvement
    improvements = Column(Text, nullable=True)  # What improvements are needed
    missing_features = Column(Text, nullable=True)  # What features are missing
    user_experience = Column(Text, nullable=True)  # User experience feedback
    performance = Column(Text, nullable=True)  # Website performance feedback
    additional_comments = Column(Text, nullable=True)  # Additional comments
    
    # Contact & File Information
    allow_contact = Column(Boolean, default=False, nullable=False)
    screenshots = Column(JSON, nullable=True)  # List of screenshot file paths
    
    # Status & Tracking
    is_resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    admin_notes = Column(Text, nullable=True)  # Internal notes for admins
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Feedback(id={self.id}, type={self.feedback_type}, rating={self.overall_rating})>"
    
    @property
    def short_description(self):
        """Generate a short description for admin dashboard"""
        if self.suggestions:
            return self.suggestions[:100] + "..." if len(self.suggestions) > 100 else self.suggestions
        elif self.website_working:
            return self.website_working[:100] + "..." if len(self.website_working) > 100 else self.website_working
        elif self.additional_comments:
            return self.additional_comments[:100] + "..." if len(self.additional_comments) > 100 else self.additional_comments
        else:
            return f"{self.feedback_type or 'General'} feedback - {self.overall_rating} stars"