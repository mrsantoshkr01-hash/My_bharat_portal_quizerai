"""
Quiz Security Models for Geofencing and Anti-Cheating
Production-ready models for handling location-based quiz security
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, JSON, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base
from app.models.classroom_models import ClassroomQuizAssignment
import enum
from datetime import datetime
from typing import Optional, Dict, Any

class ViolationType(enum.Enum):
    """Types of security violations"""
    LOCATION_VIOLATION = "location_violation"
    TAB_CHANGE = "tab_change"
    WINDOW_BLUR = "window_blur"
    MULTIPLE_LOGIN = "multiple_login"
    COPY_PASTE = "copy_paste"
    RIGHT_CLICK = "right_click"
    KEYBOARD_SHORTCUT = "keyboard_shortcut"
    DEVICE_CHANGE = "device_change"
    NETWORK_CHANGE = "network_change"

class SecuritySessionStatus(enum.Enum):
    """Security session statuses"""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    TERMINATED = "terminated"
    COMPLETED = "completed"

class LocationAccuracy(enum.Enum):
    """Location accuracy levels"""
    HIGH = "high"        # GPS + WiFi (5-10m)
    MEDIUM = "medium"    # GPS only (20-50m)
    LOW = "low"          # Cell tower (100m+)

class QuizSecurityConfig(Base):
    """Security configuration for quizzes"""
    __tablename__ = "quiz_security_configs"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    
    # Geofencing settings
    geofencing_enabled = Column(Boolean, default=False)
    allowed_latitude = Column(Float, nullable=True)
    allowed_longitude = Column(Float, nullable=True)
    allowed_radius = Column(Integer, default=100)  # meters
    location_check_interval = Column(Integer, default=30)  # seconds
    require_teacher_location = Column(Boolean, default=False)  # Teacher must also be present
    
    # Anti-cheating settings
    prevent_tab_switching = Column(Boolean, default=False)
    prevent_copy_paste = Column(Boolean, default=False)
    prevent_right_click = Column(Boolean, default=False)
    prevent_keyboard_shortcuts = Column(Boolean, default=False)
    block_multiple_devices = Column(Boolean, default=False)
    
    # Monitoring settings
    capture_screen_activity = Column(Boolean, default=False)
    monitor_network_changes = Column(Boolean, default=False)
    require_webcam_access = Column(Boolean, default=False)
    
    # Grace periods and warnings
    location_grace_period_seconds = Column(Integer, default=60)
    violation_warnings_allowed = Column(Integer, default=2)
    auto_submit_on_violation = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    quiz = relationship("Quiz")
    security_sessions = relationship("SecuritySession", back_populates="security_config")

class SecuritySession(Base):
    """Individual security session for quiz attempt"""
    __tablename__ = "security_sessions"

    id = Column(String(36), primary_key=True, index=True)  # UUID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Quiz/Assignment references
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=True)
    assignment_id = Column(Integer, ForeignKey("classroom_quiz_assignments.id"), nullable=True)
    security_config_id = Column(Integer, ForeignKey("quiz_security_configs.id"), nullable=False)
    
    # Session status - ADD THIS MISSING FIELD
    status = Column(SQLEnum(SecuritySessionStatus), default=SecuritySessionStatus.ACTIVE, nullable=False)
    
    # Device and session info
    device_fingerprint = Column(String(255), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Location tracking
    initial_location = Column(JSON, nullable=True)
    current_location = Column(JSON, nullable=True)
    
    # Session metrics - ADD THESE MISSING FIELDS
    total_violations = Column(Integer, default=0)
    warnings_issued = Column(Integer, default=0)
    location_accuracy = Column(SQLEnum(LocationAccuracy), nullable=True)
    
    # Teacher verification
    teacher_location_verified = Column(Boolean, default=False)
    teacher_verification_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    last_activity = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    security_config = relationship("QuizSecurityConfig", back_populates="security_sessions")
    user = relationship("User")
    quiz = relationship("Quiz")
    assignment = relationship("ClassroomQuizAssignment")
    violations = relationship("SecurityViolation", back_populates="security_session")
    location_logs = relationship("LocationLog", back_populates="security_session")

    def __repr__(self):
        return f"<SecuritySession(id={self.id}, user_id={self.user_id}, status={self.status})>"
    
class SecurityViolation(Base):
    """Individual security violations"""
    __tablename__ = "security_violations"

    id = Column(Integer, primary_key=True, index=True)
    security_session_id = Column(String(36), ForeignKey("security_sessions.id"), nullable=False)
    
    # Violation details
    violation_type = Column(SQLEnum(ViolationType), nullable=False)
    severity = Column(String(10), default="medium")  # low, medium, high, critical
    description = Column(Text, nullable=True)
    
    # Context data
    violation_data = Column(JSON, nullable=True)  # Additional violation context
    student_location = Column(JSON, nullable=True)  # Location at time of violation
    allowed_location = Column(JSON, nullable=True)  # Expected location
    distance_from_allowed = Column(Float, nullable=True)  # meters
    
    # Response
    action_taken = Column(String(50), nullable=True)  # warning, suspension, termination
    warning_message = Column(Text, nullable=True)
    auto_resolved = Column(Boolean, default=False)
    
    # Timing
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    security_session = relationship("SecuritySession", back_populates="violations")

class LocationLog(Base):
    """Detailed location tracking log"""
    __tablename__ = "location_logs"

    id = Column(Integer, primary_key=True, index=True)
    security_session_id = Column(String(36), ForeignKey("security_sessions.id"), nullable=False)
    
    # Location data
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)  # meters
    altitude = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)
    
    # Compliance check
    is_within_bounds = Column(Boolean, nullable=False)
    distance_from_center = Column(Float, nullable=True)  # meters from allowed center
    
    # Additional context
    location_source = Column(String(20), nullable=True)  # gps, network, passive
    network_info = Column(JSON, nullable=True)  # WiFi networks detected
    battery_level = Column(Integer, nullable=True)
    
    # Timing
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    client_timestamp = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    security_session = relationship("SecuritySession", back_populates="location_logs")

class TeacherLocationVerification(Base):
    """Teacher location verification for assignments"""
    __tablename__ = "teacher_location_verifications"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Change this line - use your existing table name
    assignment_id = Column(Integer, ForeignKey("classroom_quiz_assignments.id"), nullable=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=True)
    
    # Location data
    teacher_latitude = Column(Float, nullable=False)
    teacher_longitude = Column(Float, nullable=False)
    verification_radius = Column(Integer, default=50)  # meters
    
    # Verification status
    is_verified = Column(Boolean, default=False)
    verification_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    device_info = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    verified_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    teacher = relationship("User")
    assignment = relationship("ClassroomQuizAssignment")  # Use your existing model

# Update existing Quiz model to include security config
# Add this to your existing quiz.py file:
"""
Add this relationship to your existing Quiz model:
    security_config = relationship("QuizSecurityConfig", back_populates="quiz", uselist=False)
"""