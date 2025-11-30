# app/schemas/classroom_schemas.py
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum
from app.schemas.auth_schemas import UserResponse

# Enums for better type safety
class ClassroomStatusEnum(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    SUSPENDED = "suspended"

class MembershipStatusEnum(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    REMOVED = "removed"

class AssignmentStatusEnum(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    INACTIVE ="inactive"

# Classroom Schemas
class ClassroomCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    subject: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    allow_late_submission: bool = True
    auto_grade: bool = True
    show_results_to_students: bool = True
    notify_on_submission: bool = True
    notify_on_new_assignment: bool = True
    default_quiz_settings: Optional[Dict[str, Any]] = None

class ClassroomUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    subject: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    allow_late_submission: Optional[bool] = None
    auto_grade: Optional[bool] = None
    show_results_to_students: Optional[bool] = None
    notify_on_submission: Optional[bool] = None
    notify_on_new_assignment: Optional[bool] = None
    default_quiz_settings: Optional[Dict[str, Any]] = None
    status: Optional[ClassroomStatusEnum] = None

class ClassroomResponse(BaseModel):
    id: int
    name: str
    subject: Optional[str]
    description: Optional[str]
    join_code: str
    status: ClassroomStatusEnum
    student_count: int
    total_quizzes_assigned: int
    allow_late_submission: bool
    auto_grade: bool
    show_results_to_students: bool
    notify_on_submission: bool
    notify_on_new_assignment: bool
    created_at: datetime
    updated_at: Optional[datetime]
    teacher_name: Optional[str] = None
    teacher_email: Optional[str] = None

    class Config:
        from_attriibutes = True
        use_enum_values = True

class ClassroomJoinRequest(BaseModel):
    join_code: str = Field(..., min_length=6, max_length=8)
    
    @validator('join_code')
    def validate_join_code(cls, v):
        return v.upper().strip()

# Enhanced Assignment Schemas
class ClassroomAssignmentCreate(BaseModel):
    classroom_id: Optional[int] = None  # Set by route
    quiz_id: int
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    instructions: Optional[str] = None
    due_date: Optional[datetime] = None
    time_limit_minutes: Optional[int] = Field(None, gt=0)
    max_attempts: int = Field(1, ge=1, le=10)
    shuffle_questions: Optional[bool] = None  # Override quiz setting
    show_results_immediately: Optional[bool] = None  # Override quiz setting
    allow_late_submission: Optional[bool] = None  # Override classroom setting
    negative_marking: Optional[bool] = False
    auto_grade: bool = True
    partial_credit: bool = False
    grade_weight: float = Field(1.0, ge=0.1, le=10.0)
    
    geofencing_enabled: Optional[bool] = False
    allowed_latitude: Optional[float] = None
    allowed_longitude: Optional[float] = None
    allowed_radius: Optional[int] = 100
    require_teacher_location: Optional[bool] = False

class ClassroomAssignmentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    instructions: Optional[str] = None
    due_date: Optional[datetime] = None
    time_limit_minutes: Optional[int] = Field(None, gt=0)
    max_attempts: Optional[int] = Field(None, ge=1, le=10)
    shuffle_questions: Optional[bool] = None
    show_results_immediately: Optional[bool] = None
    allow_late_submission: Optional[bool] = None
    negative_marking: Optional[bool] = None  # Add this line
    auto_grade: Optional[bool] = None
    partial_credit: Optional[bool] = None
    grade_weight: Optional[float] = Field(None, ge=0.1, le=10.0)
    status: Optional[AssignmentStatusEnum] = None

class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    instructions: Optional[str]
    assigned_date: datetime
    due_date: Optional[datetime]
    status: AssignmentStatusEnum
    time_limit_minutes: Optional[int]
    max_attempts: int
    shuffle_questions: Optional[bool]
    show_results_immediately: Optional[bool]
    allow_late_submission: Optional[bool]
    negative_marking: Optional[bool] = False # Add this line
    geofencing_enabled: bool = False
    allowed_latitude: Optional[float] = None
    allowed_longitude: Optional[float] = None
    allowed_radius: Optional[int] = 100
    require_teacher_location: bool = False
    
    auto_grade: bool
    partial_credit: bool
    grade_weight: float
    total_students: int
    submitted_count: int
    completed_count: int
    average_score: float
    highest_score: float
    lowest_score: float
    created_at: datetime
    quiz_title: Optional[str] = None
    quiz_total_questions: Optional[int] = None

    class Config:
        from_attriibutes = True
        use_enum_values = True

# Student-specific schemas
class StudentClassroomResponse(BaseModel):
    classroom: ClassroomResponse
    membership_status: MembershipStatusEnum
    joined_at: datetime
    pending_assignments: int
    completed_assignments: int
    total_assignments: int
    average_score: float
    last_activity: Optional[datetime]
    teacher_name: str

    class Config:
        use_enum_values = True

class ClassroomMembershipResponse(BaseModel):
    id: int
    student: UserResponse
    status: MembershipStatusEnum
    joined_at: datetime
    removed_at: Optional[datetime]
    total_assignments: int
    completed_assignments: int
    average_score: float
    last_activity: Optional[datetime]
    participation_score: float

    class Config:
        from_attriibutes = True
        use_enum_values = True

# Submission schemas
class SubmissionResponse(BaseModel):
    id: str
    student_id: int
    student_name: str
    student_email: str
    submitted_at: datetime
    is_late: bool
    attempt_number: int
    is_graded: bool
    graded_at: Optional[datetime]
    grade_comments: Optional[str]
    score_percentage: Optional[float]
    time_taken_minutes: Optional[int]
    questions_attempted: int
    questions_correct: int
    requires_review: bool
    is_flagged: bool
    flag_reason: Optional[str]

    class Config:
        from_attriibutes = True

class SubmissionGradeUpdate(BaseModel):
    grade_comments: Optional[str] = None
    requires_review: bool = False
    is_flagged: bool = False
    flag_reason: Optional[str] = None

# Analytics and reporting schemas
class ClassroomAnalytics(BaseModel):
    total_students: int
    active_students: int
    total_assignments: int
    active_assignments: int
    overall_completion_rate: float
    overall_average_score: float
    student_performance_distribution: Dict[str, int]  # {"A": 5, "B": 10, ...}
    assignment_performance: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]

class AssignmentAnalytics(BaseModel):
    assignment_id: int
    title: str
    total_students: int
    submitted_count: int
    completion_rate: float
    average_score: float
    score_distribution: Dict[str, int]
    time_distribution: Dict[str, int]
    question_performance: List[Dict[str, Any]]
    submission_timeline: List[Dict[str, Any]]

# Announcement schemas
class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    is_pinned: bool = False
    is_urgent: bool = False
    target_all_students: bool = True
    target_student_ids: Optional[List[int]] = None

    @validator('target_student_ids')
    def validate_targets(cls, v, values):
        if not values.get('target_all_students', True) and not v:
            raise ValueError('target_student_ids is required when target_all_students is False')
        return v

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    is_pinned: Optional[bool] = None
    is_urgent: Optional[bool] = None

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    is_pinned: bool
    is_urgent: bool
    target_all_students: bool
    target_student_ids: Optional[List[int]]
    read_by_students: Optional[List[int]]
    teacher_name: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attriibutes = True

# Grade schemas
class GradeResponse(BaseModel):
    student_id: int
    student_name: str
    total_assignments: int
    completed_assignments: int
    average_score: float
    letter_grade: Optional[str]
    improvement_trend: float
    consistency_score: float
    participation_grade: Optional[float]
    assignment_grades: Dict[str, Any]

    class Config:
        orm_mode = True

# Bulk operations
class BulkStudentInvite(BaseModel):
    emails: List[str] = Field(..., min_items=1, max_items=50)
    send_notification: bool = True

    @validator('emails')
    def validate_emails(cls, v):
        from email_validator import validate_email, EmailNotValidError
        validated_emails = []
        for email in v:
            try:
                validated = validate_email(email)
                validated_emails.append(validated.email)
            except EmailNotValidError:
                raise ValueError(f'Invalid email: {email}')
        return validated_emails

class BulkAssignmentCreate(BaseModel):
    quiz_ids: List[int] = Field(..., min_items=1, max_items=20)
    title_prefix: Optional[str] = "Assignment"
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    assignment_settings: Optional[Dict[str, Any]] = None

# Dashboard schemas
class TeacherDashboard(BaseModel):
    total_classrooms: int
    total_students: int
    active_assignments: int
    pending_submissions: int
    recent_classrooms: List[ClassroomResponse]
    recent_assignments: List[AssignmentResponse]
    performance_summary: Dict[str, Any]

class StudentDashboard(BaseModel):
    enrolled_classrooms: int
    pending_assignments: int
    completed_assignments: int
    average_score: float
    recent_submissions: List[Dict[str, Any]]
    upcoming_deadlines: List[Dict[str, Any]]
    performance_trend: List[Dict[str, Any]]