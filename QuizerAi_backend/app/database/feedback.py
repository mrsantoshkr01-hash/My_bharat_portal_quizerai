from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from app.database.connection import Base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class FeedbackType(str, Enum):
    BUG = "bug"
    FEATURE = "feature" 
    IMPROVEMENT = "improvement"
    GENERAL = "general"

class DeviceType(str, Enum):
    DESKTOP = "desktop"
    LAPTOP = "laptop"
    TABLET = "tablet"
    MOBILE = "mobile"

class UserType(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    PARENT = "parent"
    PROFESSIONAL = "professional"
    INSTITUTION = "institution"
    OTHER = "other"

class UsageFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    RARELY = "rarely"
    FIRST_TIME = "first_time"

class PrimaryUseCase(str, Enum):
    QUIZ_CREATION = "quiz_creation"
    STUDYING = "studying"
    TEACHING = "teaching"
    CONTENT_ANALYSIS = "content_analysis"
    COLLABORATION = "collaboration"
    RESEARCH = "research"

class BrowserType(str, Enum):
    CHROME = "chrome"
    FIREFOX = "firefox"
    SAFARI = "safari"
    EDGE = "edge"
    OPERA = "opera"
    OTHER = "other"

class FeedbackCreate(BaseModel):
    # Basic Information
    name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    
    # Overall Experience
    overall_rating: int = Field(..., ge=1, le=5, description="Overall rating from 1 to 5")
    user_type: Optional[UserType] = None
    usage_frequency: Optional[UsageFrequency] = None
    primary_use_case: Optional[PrimaryUseCase] = None
    device_type: Optional[DeviceType] = None
    browser_type: Optional[BrowserType] = None
    
    # Feedback Details
    feedback_type: Optional[FeedbackType] = None
    
    # Detailed Feedback (from form fields)
    website_working: Optional[str] = Field(None, max_length=2000, description="How is the website working")
    expectations: Optional[str] = Field(None, max_length=2000, description="Expectations vs reality")
    suggestions: Optional[str] = Field(None, max_length=2000, description="Suggestions for improvement") 
    improvements: Optional[str] = Field(None, max_length=2000, description="What improvements are needed")
    missing_features: Optional[str] = Field(None, max_length=2000, description="What features are missing")
    user_experience: Optional[str] = Field(None, max_length=2000, description="User experience feedback")
    performance: Optional[str] = Field(None, max_length=2000, description="Website performance feedback")
    additional_comments: Optional[str] = Field(None, max_length=3000, description="Additional comments")
    
    # Contact Permission
    allow_contact: bool = Field(default=False, description="Allow contact for follow-up")
    
    # Screenshots/Files (store as list of file paths or URLs)
    screenshots: Optional[List[str]] = Field(default=[], description="List of screenshot file paths")
    
    class Config:
        use_enum_values = True
        schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "overall_rating": 4,
                "user_type": "student",
                "usage_frequency": "weekly",
                "primary_use_case": "studying",
                "device_type": "desktop",
                "browser_type": "chrome",
                "feedback_type": "improvement",
                "website_working": "The website works well overall, but sometimes quiz generation takes a bit longer than expected.",
                "expectations": "I expected faster quiz generation, but the quality of questions is excellent.",
                "suggestions": "Adding a progress bar for quiz generation would be helpful.",
                "user_experience": "Very intuitive interface, easy to navigate.",
                "performance": "Generally fast, occasional slowdowns during peak hours.",
                "additional_comments": "Keep up the great work!",
                "allow_contact": True,
                "screenshots": []
            }
        }

class FeedbackResponse(BaseModel):
    id: int
    name: Optional[str]
    email: Optional[EmailStr]
    overall_rating: int
    user_type: Optional[str]
    usage_frequency: Optional[str]
    primary_use_case: Optional[str]
    device_type: Optional[str]
    browser_type: Optional[str]
    feedback_type: Optional[str]
    website_working: Optional[str]
    expectations: Optional[str]
    suggestions: Optional[str]
    improvements: Optional[str]
    missing_features: Optional[str]
    user_experience: Optional[str]
    performance: Optional[str]
    additional_comments: Optional[str]
    allow_contact: bool
    screenshots: List[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class FeedbackStats(BaseModel):
    total_feedback: int
    average_rating: float
    feedback_by_type: dict
    feedback_by_device: dict
    recent_feedback_count: int
    
class FeedbackListResponse(BaseModel):
    feedback_items: List[FeedbackResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int