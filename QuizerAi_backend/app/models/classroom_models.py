# # app/models/classroom_models.py
# # Updated classroom models to use the unified quiz system

# from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text, JSON, Float
# from sqlalchemy.orm import relationship
# from sqlalchemy.sql import func
# from app.database.connection import Base
# import enum
# from datetime import datetime
# import secrets
# import string

# class ClassroomStatus(enum.Enum):
#     ACTIVE = "active"
#     ARCHIVED = "archived"
#     SUSPENDED = "suspended"

# class MembershipStatus(enum.Enum):
#     ACTIVE = "active"
#     PENDING = "pending"
#     REMOVED = "removed"

# class AssignmentStatus(enum.Enum):
#     DRAFT = "draft"
#     ACTIVE = "active"
#     COMPLETED = "completed"
#     EXPIRED = "expired"
#     CANCELLED = "cancelled"

# class Classroom(Base):
#     __tablename__ = "classrooms"

#     id = Column(Integer, primary_key=True, index=True , autoincrement=True)
#     name = Column(String(200), nullable=False)
#     subject = Column(String(100), nullable=True)
#     description = Column(Text, nullable=True)
#     teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
#     join_code = Column(String(8), unique=True, index=True, nullable=False)
#     status = Column(Enum(ClassroomStatus), default=ClassroomStatus.ACTIVE)
    
#     # Settings
#     allow_late_submission = Column(Boolean, default=True)
#     auto_grade = Column(Boolean, default=True)
#     show_results_to_students = Column(Boolean, default=True)
#     default_quiz_settings = Column(JSON, nullable=True)
    
#     # Notification settings
#     notify_on_submission = Column(Boolean, default=True)
#     notify_on_new_assignment = Column(Boolean, default=True)
    
#     # Metadata
#     student_count = Column(Integer, default=0)
#     total_quizzes_assigned = Column(Integer, default=0)
    
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), onupdate=func.now())

#     # Relationships
#     teacher = relationship("User", foreign_keys=[teacher_id])
#     memberships = relationship("ClassroomMembership", back_populates="classroom", cascade="all, delete-orphan")
#     assigned_quizzes = relationship("ClassroomQuizAssignment", back_populates="classroom", cascade="all, delete-orphan")

#     def generate_join_code(self):
#         """Generate unique 6-character alphanumeric join code"""
#         return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))

# class ClassroomMembership(Base):
#     __tablename__ = "classroom_memberships"

#     id = Column(Integer, primary_key=True, index=True , autoincrement=True)
#     classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
#     student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
#     status = Column(Enum(MembershipStatus), default=MembershipStatus.ACTIVE)
#     joined_at = Column(DateTime(timezone=True), server_default=func.now())
#     removed_at = Column(DateTime(timezone=True), nullable=True)
    
#     # Student performance in classroom
#     total_assignments = Column(Integer, default=0)
#     completed_assignments = Column(Integer, default=0)
#     average_score = Column(Float, default=0.0)
    
#     # Engagement metrics
#     last_activity = Column(DateTime(timezone=True), nullable=True)
#     participation_score = Column(Float, default=0.0)  # Based on activity and performance

#     # Relationships
#     classroom = relationship("Classroom", back_populates="memberships")
#     student = relationship("User", foreign_keys=[student_id])

# class ClassroomQuizAssignment(Base):
#     __tablename__ = "classroom_quiz_assignments"

#     id = Column(Integer, primary_key=True, index=True , autoincrement=True)
#     classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
#     quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)  # Now references unified quiz table
    
#     # Assignment settings
#     title = Column(String(200), nullable=False)
#     description = Column(Text, nullable=True)
#     instructions = Column(Text, nullable=True)  # Special instructions for this assignment
#     assigned_date = Column(DateTime(timezone=True), server_default=func.now())
#     due_date = Column(DateTime(timezone=True), nullable=True)
#     status = Column(Enum(AssignmentStatus), default=AssignmentStatus.ACTIVE)
    
#     # Quiz configuration override for this assignment
#     time_limit_minutes = Column(Integer, nullable=True)
#     max_attempts = Column(Integer, default=1)
#     shuffle_questions = Column(Boolean, nullable=True)
#     show_results_immediately = Column(Boolean, nullable=True)
#     allow_late_submission = Column(Boolean, nullable=True)
#     negative_marking = Column(Boolean, default=False)  # ADD THIS LINE
    
#     # Grading settings
#     auto_grade = Column(Boolean, default=True)
#     partial_credit = Column(Boolean, default=False)
#     grade_weight = Column(Float, default=1.0)  # Weight in overall grade calculation
    
#     # Tracking
#     total_students = Column(Integer, default=0)
#     submitted_count = Column(Integer, default=0)
#     completed_count = Column(Integer, default=0)
#     average_score = Column(Float, default=0.0)
#     highest_score = Column(Float, default=0.0)
#     lowest_score = Column(Float, default=0.0)
    
#     # Analytics
#     submission_timeline = Column(JSON, nullable=True)  # Track when students submit
#     performance_distribution = Column(JSON, nullable=True)  # Score distribution
    
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), onupdate=func.now())

#     # Relationships
#     classroom = relationship("Classroom", back_populates="assigned_quizzes")
#     quiz = relationship("Quiz")  # References the unified Quiz model
#     submissions = relationship("ClassroomQuizSubmission", back_populates="assignment", cascade="all, delete-orphan")

# class ClassroomQuizSubmission(Base):
#     __tablename__ = "classroom_quiz_submissions"

#     id = Column(Integer, primary_key=True, index=True, autoincrement=True)
#     assignment_id = Column(Integer, ForeignKey("classroom_quiz_assignments.id"), nullable=False)
#     student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
#     quiz_session_id = Column(String(36), ForeignKey("quiz_sessions.id"), nullable=False)
    
#     # Submission tracking
#     submitted_at = Column(DateTime(timezone=True), server_default=func.now())
#     is_late = Column(Boolean, default=False)
#     attempt_number = Column(Integer, default=1)
    
#     # Grading
#     is_graded = Column(Boolean, default=False)
#     graded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
#     graded_at = Column(DateTime(timezone=True), nullable=True)
#     grade_comments = Column(Text, nullable=True)
    
#     # Results (denormalized for quick access)
#     score_percentage = Column(Float, nullable=True)
#     time_taken_minutes = Column(Integer, nullable=True)
#     questions_attempted = Column(Integer, default=0)
#     questions_correct = Column(Integer, default=0)
    
#     # NEW: Marks-based scoring fields
#     total_marks_scored = Column(Integer, nullable=True)  # Can be negative
#     max_possible_marks = Column(Integer, nullable=True)
#     questions_incorrect = Column(Integer, nullable=True)
#     questions_total = Column(Integer, nullable=True)
    
#     # Flags
#     requires_review = Column(Boolean, default=False)
#     is_flagged = Column(Boolean, default=False)
#     flag_reason = Column(String(100), nullable=True)

#     # Relationships
#     assignment = relationship("ClassroomQuizAssignment", back_populates="submissions")
#     student = relationship("User", foreign_keys=[student_id])
#     grader = relationship("User", foreign_keys=[graded_by])
#     quiz_session = relationship("QuizSession")

# # Classroom announcements and communications
# class ClassroomAnnouncement(Base):
#     __tablename__ = "classroom_announcements"

#     id = Column(Integer, primary_key=True, index=True , autoincrement=True)
#     classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
#     teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
#     title = Column(String(200), nullable=False)
#     content = Column(Text, nullable=False)
#     is_pinned = Column(Boolean, default=False)
#     is_urgent = Column(Boolean, default=False)
    
#     # Targeting
#     target_all_students = Column(Boolean, default=True)
#     target_student_ids = Column(JSON, nullable=True)  # Specific students if not all
    
#     # Analytics
#     read_by_students = Column(JSON, nullable=True)  # Track who has read it
    
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), onupdate=func.now())

#     classroom = relationship("Classroom")
#     teacher = relationship("User")

# # Classroom grades and performance tracking
# class ClassroomGrade(Base):
#     __tablename__ = "classroom_grades"

#     id = Column(Integer, primary_key=True, index=True , autoincrement=True)
#     classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
#     student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
#     # Overall performance
#     total_assignments = Column(Integer, default=0)
#     completed_assignments = Column(Integer, default=0)
#     average_score = Column(Float, default=0.0)
#     letter_grade = Column(String(5), nullable=True)  # A+, A, B+, etc.
    
#     # Detailed breakdown
#     quiz_scores = Column(JSON, nullable=True)  # Individual quiz scores
#     assignment_grades = Column(JSON, nullable=True)  # Grade breakdown by assignment
    
#     # Progress tracking
#     improvement_trend = Column(Float, default=0.0)  # Positive = improving, negative = declining
#     consistency_score = Column(Float, default=0.0)  # How consistent are the scores
    
#     # Participation
#     participation_grade = Column(Float, nullable=True)
#     attendance_score = Column(Float, nullable=True)
    
#     last_updated = Column(DateTime(timezone=True), onupdate=func.now())

#     classroom = relationship("Classroom")
#     student = relationship("User")


# app/models/classroom_models.py
# Updated classroom models to use the unified quiz system

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base
import enum
from datetime import datetime
import secrets
import string

class ClassroomStatus(enum.Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    SUSPENDED = "suspended"

class MembershipStatus(enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    REMOVED = "removed"

class AssignmentStatus(enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True , autoincrement=True)
    name = Column(String(200), nullable=False)
    subject = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    join_code = Column(String(8), unique=True, index=True, nullable=False)
    status = Column(Enum(ClassroomStatus), default=ClassroomStatus.ACTIVE)
    
    # Settings
    allow_late_submission = Column(Boolean, default=True)
    auto_grade = Column(Boolean, default=True)
    show_results_to_students = Column(Boolean, default=True)
    default_quiz_settings = Column(JSON, nullable=True)
    
    # Notification settings
    notify_on_submission = Column(Boolean, default=True)
    notify_on_new_assignment = Column(Boolean, default=True)
    
    # Metadata
    student_count = Column(Integer, default=0)
    total_quizzes_assigned = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id])
    memberships = relationship("ClassroomMembership", back_populates="classroom", cascade="all, delete-orphan")
    assigned_quizzes = relationship("ClassroomQuizAssignment", back_populates="classroom", cascade="all, delete-orphan")

    def generate_join_code(self):
        """Generate unique 6-character alphanumeric join code"""
        return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))

class ClassroomMembership(Base):
    __tablename__ = "classroom_memberships"

    id = Column(Integer, primary_key=True, index=True , autoincrement=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(MembershipStatus), default=MembershipStatus.ACTIVE)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    removed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Student performance in classroom
    total_assignments = Column(Integer, default=0)
    completed_assignments = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    
    # Engagement metrics
    last_activity = Column(DateTime(timezone=True), nullable=True)
    participation_score = Column(Float, default=0.0)  # Based on activity and performance

    # Relationships
    classroom = relationship("Classroom", back_populates="memberships")
    student = relationship("User", foreign_keys=[student_id])

class ClassroomQuizAssignment(Base):
    __tablename__ = "classroom_quiz_assignments"

    id = Column(Integer, primary_key=True, index=True , autoincrement=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)  # Now references unified quiz table
    
     # Add these geofencing fields
    geofencing_enabled = Column(Boolean, default=False)
    allowed_latitude = Column(Float, nullable=True)
    allowed_longitude = Column(Float, nullable=True)
    allowed_radius = Column(Integer, default=100)
    require_teacher_location = Column(Boolean, default=False)
    
    # Assignment settings
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)  # Special instructions for this assignment
    assigned_date = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.ACTIVE)
    
    # Quiz configuration override for this assignment
    time_limit_minutes = Column(Integer, nullable=True)
    max_attempts = Column(Integer, default=1)
    shuffle_questions = Column(Boolean, nullable=True)
    show_results_immediately = Column(Boolean, nullable=True)
    allow_late_submission = Column(Boolean, nullable=True)
    negative_marking = Column(Boolean, default=False)  # ADD THIS LINE
    
    # Grading settings
    auto_grade = Column(Boolean, default=True)
    partial_credit = Column(Boolean, default=False)
    grade_weight = Column(Float, default=1.0)  # Weight in overall grade calculation
    
    # Tracking
    total_students = Column(Integer, default=0)
    submitted_count = Column(Integer, default=0)
    completed_count = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    highest_score = Column(Float, default=0.0)
    lowest_score = Column(Float, default=0.0)
    
    # Analytics
    submission_timeline = Column(JSON, nullable=True)  # Track when students submit
    performance_distribution = Column(JSON, nullable=True)  # Score distribution
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    classroom = relationship("Classroom", back_populates="assigned_quizzes")
    quiz = relationship("Quiz")  # References the unified Quiz model
    submissions = relationship("ClassroomQuizSubmission", back_populates="assignment", cascade="all, delete-orphan")

class ClassroomQuizSubmission(Base):
    __tablename__ = "classroom_quiz_submissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    assignment_id = Column(Integer, ForeignKey("classroom_quiz_assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_session_id = Column(String(36), ForeignKey("quiz_sessions.id"), nullable=False)
    
    # Submission tracking
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    is_late = Column(Boolean, default=False)
    attempt_number = Column(Integer, default=1)
    
    # Grading
    is_graded = Column(Boolean, default=False)
    graded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    graded_at = Column(DateTime(timezone=True), nullable=True)
    grade_comments = Column(Text, nullable=True)
    
    # Results (denormalized for quick access)
    score_percentage = Column(Float, nullable=True)
    time_taken_minutes = Column(Integer, nullable=True)
    questions_attempted = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    
    # NEW: Marks-based scoring fields
    total_marks_scored = Column(Integer, nullable=True)  # Can be negative
    max_possible_marks = Column(Integer, nullable=True)
    questions_incorrect = Column(Integer, nullable=True)
    questions_total = Column(Integer, nullable=True)
    
    # Flags
    requires_review = Column(Boolean, default=False)
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(String(100), nullable=True)

    # Relationships
    assignment = relationship("ClassroomQuizAssignment", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id])
    grader = relationship("User", foreign_keys=[graded_by])
    quiz_session = relationship("QuizSession")

# Classroom announcements and communications
class ClassroomAnnouncement(Base):
    __tablename__ = "classroom_announcements"

    id = Column(Integer, primary_key=True, index=True , autoincrement=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=False)
    is_urgent = Column(Boolean, default=False)
    
    # Targeting
    target_all_students = Column(Boolean, default=True)
    target_student_ids = Column(JSON, nullable=True)  # Specific students if not all
    
    # Analytics
    read_by_students = Column(JSON, nullable=True)  # Track who has read it
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    classroom = relationship("Classroom")
    teacher = relationship("User")

# Classroom grades and performance tracking
class ClassroomGrade(Base):
    __tablename__ = "classroom_grades"

    id = Column(Integer, primary_key=True, index=True , autoincrement=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Overall performance
    total_assignments = Column(Integer, default=0)
    completed_assignments = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    letter_grade = Column(String(5), nullable=True)  # A+, A, B+, etc.
    
    # Detailed breakdown
    quiz_scores = Column(JSON, nullable=True)  # Individual quiz scores
    assignment_grades = Column(JSON, nullable=True)  # Grade breakdown by assignment
    
    # Progress tracking
    improvement_trend = Column(Float, default=0.0)  # Positive = improving, negative = declining
    consistency_score = Column(Float, default=0.0)  # How consistent are the scores
    
    # Participation
    participation_grade = Column(Float, nullable=True)
    attendance_score = Column(Float, nullable=True)
    
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())

    classroom = relationship("Classroom")
    student = relationship("User")