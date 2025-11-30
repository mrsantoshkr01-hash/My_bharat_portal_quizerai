"""
Quiz Security Schemas for API requests and responses
Production-ready Pydantic models for security features
"""

from pydantic import BaseModel, validator, Field
from typing import Optional, Dict, List, Any
from datetime import datetime
from enum import Enum

class ViolationType(str, Enum):
    LOCATION_VIOLATION = "location_violation"
    TAB_CHANGE = "tab_change"
    WINDOW_BLUR = "window_blur"
    MULTIPLE_LOGIN = "multiple_login"
    COPY_PASTE = "copy_paste"
    RIGHT_CLICK = "right_click"
    KEYBOARD_SHORTCUT = "keyboard_shortcut"
    DEVICE_CHANGE = "device_change"
    NETWORK_CHANGE = "network_change"

class SecuritySessionStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    TERMINATED = "terminated"
    COMPLETED = "completed"

class LocationAccuracy(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

# Security Configuration Schemas
class QuizSecurityConfigCreate(BaseModel):
    quiz_id: int
    
    # Geofencing settings
    geofencing_enabled: bool = False
    allowed_latitude: Optional[float] = None
    allowed_longitude: Optional[float] = None
    allowed_radius: int = Field(default=100, ge=10, le=1000)
    location_check_interval: int = Field(default=30, ge=5, le=300)
    require_teacher_location: bool = False
    
    # Anti-cheating settings
    prevent_tab_switching: bool = False
    prevent_copy_paste: bool = False
    prevent_right_click: bool = False
    prevent_keyboard_shortcuts: bool = False
    block_multiple_devices: bool = False
    
    # Monitoring settings
    capture_screen_activity: bool = False
    monitor_network_changes: bool = False
    require_webcam_access: bool = False
    
    # Grace periods
    location_grace_period_seconds: int = Field(default=60, ge=0, le=300)
    violation_warnings_allowed: int = Field(default=2, ge=0, le=5)
    auto_submit_on_violation: bool = True

    @validator('allowed_latitude')
    def validate_latitude(cls, v):
        if v is not None and not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90 degrees')
        return v

    @validator('allowed_longitude')
    def validate_longitude(cls, v):
        if v is not None and not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180 degrees')
        return v

class QuizSecurityConfigUpdate(BaseModel):
    geofencing_enabled: Optional[bool] = None
    allowed_latitude: Optional[float] = None
    allowed_longitude: Optional[float] = None
    allowed_radius: Optional[int] = None
    location_check_interval: Optional[int] = None
    require_teacher_location: Optional[bool] = None
    prevent_tab_switching: Optional[bool] = None
    prevent_copy_paste: Optional[bool] = None
    prevent_right_click: Optional[bool] = None
    prevent_keyboard_shortcuts: Optional[bool] = None
    block_multiple_devices: Optional[bool] = None
    location_grace_period_seconds: Optional[int] = None
    violation_warnings_allowed: Optional[int] = None
    auto_submit_on_violation: Optional[bool] = None

class QuizSecurityConfigResponse(BaseModel):
    id: int
    quiz_id: int
    geofencing_enabled: bool
    allowed_latitude: Optional[float]
    allowed_longitude: Optional[float]
    allowed_radius: int
    location_check_interval: int
    require_teacher_location: bool
    prevent_tab_switching: bool
    prevent_copy_paste: bool
    prevent_right_click: bool
    prevent_keyboard_shortcuts: bool
    block_multiple_devices: bool
    capture_screen_activity: bool
    monitor_network_changes: bool
    require_webcam_access: bool
    location_grace_period_seconds: int
    violation_warnings_allowed: int
    auto_submit_on_violation: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Security Session Schemas
class SecuritySessionCreate(BaseModel):
    quiz_id: int
    assignment_id: Optional[int] = None  # This now refers to classroom_quiz_assignments
    device_fingerprint: str
    initial_location: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class LocationData(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: Optional[float] = Field(None, ge=0)
    altitude: Optional[float] = None
    speed: Optional[float] = Field(None, ge=0)
    heading: Optional[float] = Field(None, ge=0, le=360)
    timestamp: datetime
    source: Optional[str] = "gps"

    @validator('accuracy')
    def validate_accuracy(cls, v):
        if v is not None and v > 1000:  # More than 1km accuracy is probably useless
            raise ValueError('Location accuracy seems unrealistic')
        return v

class LocationUpdateRequest(BaseModel):
    session_id: str
    location: LocationData
    network_info: Optional[Dict[str, Any]] = None
    battery_level: Optional[int] = Field(None, ge=0, le=100)

class ViolationReportRequest(BaseModel):
    session_id: str
    violation_type: ViolationType
    description: Optional[str] = None
    violation_data: Optional[Dict[str, Any]] = None
    student_location: Optional[Dict[str, Any]] = None
    severity: str = Field(default="medium" , pattern="^(low|medium|high|critical)$")

class SecuritySessionResponse(BaseModel):
    id: str
    status: SecuritySessionStatus
    total_violations: int
    warnings_issued: int
    location_accuracy: Optional[LocationAccuracy]
    start_time: datetime
    last_activity: datetime
    teacher_location_verified: bool

    class Config:
        from_attributes = True

class ViolationResponse(BaseModel):
    id: int
    violation_type: ViolationType
    severity: str
    description: Optional[str]
    action_taken: Optional[str]
    warning_message: Optional[str]
    auto_resolved: bool
    detected_at: datetime
    resolved_at: Optional[datetime]
    distance_from_allowed: Optional[float]

    class Config:
        from_attributes = True

class LocationLogResponse(BaseModel):
    id: int
    latitude: float
    longitude: float
    accuracy: Optional[float]
    is_within_bounds: bool
    distance_from_center: Optional[float]
    recorded_at: datetime
    location_source: Optional[str]

    class Config:
        from_attributes = True

# Teacher Location Verification
class TeacherLocationVerifyRequest(BaseModel):
    assignment_id: Optional[int] = None  # This now refers to classroom_quiz_assignments
    quiz_id: Optional[int] = None
    teacher_latitude: float = Field(..., ge=-90, le=90)
    teacher_longitude: float = Field(..., ge=-180, le=180)
    verification_radius: int = Field(default=50, ge=10, le=200)
    device_info: Optional[Dict[str, Any]] = None

class TeacherLocationVerifyResponse(BaseModel):
    id: int
    is_verified: bool
    verification_expires_at: Optional[datetime]
    verified_at: datetime
    teacher_latitude: float
    teacher_longitude: float
    verification_radius: int

    class Config:
        from_attributes = True

# Dashboard and Analytics
class SecurityAnalyticsResponse(BaseModel):
    total_sessions: int
    active_sessions: int
    total_violations: int
    violations_by_type: Dict[str, int]
    top_violation_locations: List[Dict[str, Any]]
    compliance_rate: float
    average_session_duration: float

class QuizSecuritySummary(BaseModel):
    quiz_id: int
    quiz_title: str
    security_enabled: bool
    total_attempts: int
    flagged_attempts: int
    compliance_rate: float
    common_violations: List[str]
    geofencing_enabled: bool
    average_accuracy: Optional[float]

# Bulk operations
class BulkSecurityConfigUpdate(BaseModel):
    quiz_ids: List[int]
    config_updates: QuizSecurityConfigUpdate

class SecuritySessionBulkResponse(BaseModel):
    sessions: List[SecuritySessionResponse]
    total_count: int
    page: int
    page_size: int
    has_next: bool