# app/schemas/quiz_schemas.py
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum

# Enums for better type safety
class QuizTypeEnum(str, Enum):
    MCQ = "mcq"
    SHORT_ANSWER = "short_answer"
    LONG_ANSWER = "long_answer"
    FILL_BLANK = "fill_blank"
    TRUE_FALSE = "true_false"

class QuizStatusEnum(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"

class SessionStatusEnum(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"
    ABANDONED = "abandoned"

class TimerTypeEnum(str, Enum):
    PER_QUESTION = "per_question"
    TOTAL_QUIZ = "total_quiz"
    NO_LIMIT = "no_limit"

class QuizSourceEnum(str, Enum):
    FILE_UPLOAD = "file"
    URL = "url"
    YOUTUBE_URL = "youtube_url"
    YOUTUBE_SEARCH = "youtube_search"
    MANUAL = "manual"
    QUESTION_PAPER = "question_paper"

class QuizCreatorTypeEnum(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    SYSTEM = "system"

# Question Schemas
class QuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=1)
    question_type: QuizTypeEnum
    order_index: int = Field(..., ge=0)
    points: float = Field(1.0, gt=0)
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    is_required: bool = True
    partial_credit: bool = False
    estimated_time_seconds: int = Field(90, gt=0)
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    tags: Optional[List[str]] = None

    @validator('options')
    def validate_options(cls, v, values):
        question_type = values.get('question_type')
        if question_type in ['mcq', 'true_false'] and not v:
            raise ValueError(f'Options are required for {question_type} questions')
        if question_type == 'true_false' and v and len(v) != 2:
            raise ValueError('True/False questions must have exactly 2 options')
        return v

class QuestionUpdate(BaseModel):
    question_text: Optional[str] = Field(None, min_length=1)
    question_type: Optional[QuizTypeEnum] = None
    order_index: Optional[int] = Field(None, ge=0)
    points: Optional[float] = Field(None, gt=0)
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    is_required: Optional[bool] = None
    partial_credit: Optional[bool] = None
    estimated_time_seconds: Optional[int] = Field(None, gt=0)
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    tags: Optional[List[str]] = None

class QuestionResponse(BaseModel):
    id: int
    question_text: str
    question_type: QuizTypeEnum
    order_index: int
    points: float
    options: Optional[List[str]]
    correct_answer: str  # Only shown to quiz creators
    explanation: Optional[str]
    image_url: Optional[str]
    video_url: Optional[str]
    is_required: bool
    partial_credit: bool
    estimated_time_seconds: int
    difficulty: Optional[str]
    tags: Optional[List[str]]
    times_answered: int
    correct_answer_count: int
    success_rate: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True
        use_enum_values = True

# Quiz Schemas
class QuizCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    subject: Optional[str] = Field(None, max_length=100)
    difficulty_level: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    source: QuizSourceEnum = QuizSourceEnum.MANUAL
    source_content: Optional[str] = None
    is_public: bool = False
    is_template: bool = False
    
    # Timer settings
    timer_type: TimerTypeEnum = TimerTypeEnum.NO_LIMIT
    total_time_minutes: Optional[int] = Field(None, gt=0)
    per_question_time_seconds: Optional[int] = Field(None, gt=0)
    
    # Quiz settings
    shuffle_questions: bool = False
    shuffle_options: bool = False
    show_results_immediately: bool = True
    allow_review: bool = True
    max_attempts: int = Field(1, ge=1, le=10)
    allow_skip: bool = True
    show_correct_answers: bool = True
    passing_score: float = Field(70.0, ge=0, le=100)
    negative_marking: bool = False  # Add this line
    
    # Teacher-specific fields
    instructions: Optional[str] = None
    prerequisites: Optional[str] = None
    tags: Optional[List[str]] = None
    
    # Questions can be added separately or included here
    questions: Optional[List[QuestionCreate]] = None

class QuizUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    subject: Optional[str] = Field(None, max_length=100)
    difficulty_level: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    is_public: Optional[bool] = None
    is_template: Optional[bool] = None
    status: Optional[QuizStatusEnum] = None
    
    # Timer settings
    timer_type: Optional[TimerTypeEnum] = None
    total_time_minutes: Optional[int] = Field(None, gt=0)
    per_question_time_seconds: Optional[int] = Field(None, gt=0)
    
    # Quiz settings
    shuffle_questions: Optional[bool] = None
    shuffle_options: Optional[bool] = None
    show_results_immediately: Optional[bool] = None
    allow_review: Optional[bool] = None
    max_attempts: Optional[int] = Field(None, ge=1, le=10)
    allow_skip: Optional[bool] = None
    show_correct_answers: Optional[bool] = None
    passing_score: Optional[float] = Field(None, ge=0, le=100)
    negative_marking: Optional[bool] = None
    
    # Teacher-specific fields
    instructions: Optional[str] = None
    prerequisites: Optional[str] = None
    tags: Optional[List[str]] = None

class QuizResponse(BaseModel):
    id: int
    external_id: Optional[str]
    title: str
    description: Optional[str]
    creator_id: int
    creator_type: QuizCreatorTypeEnum
    creator_name: Optional[str] = None
    subject: Optional[str]
    difficulty_level: Optional[str]
    source: QuizSourceEnum
    source_content: Optional[str]
    is_public: bool
    is_template: bool
    
    # Timer settings
    timer_type: TimerTypeEnum
    total_time_minutes: Optional[int]
    per_question_time_seconds: Optional[int]
    
    # Quiz settings
    shuffle_questions: bool
    shuffle_options: bool
    show_results_immediately: bool
    allow_review: bool
    max_attempts: int
    allow_skip: bool
    show_correct_answers: bool
    negative_marking: bool
    
    # Metadata
    status: QuizStatusEnum
    total_questions: int
    total_points: float
    passing_score: float
    estimated_time_minutes: Optional[int]
    language: str
    
    # Teacher-specific fields
    instructions: Optional[str]
    prerequisites: Optional[str]
    tags: Optional[List[str]]
    
    # Analytics
    total_attempts: int
    average_score: float
    completion_rate: float
    
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Related data
    questions: Optional[List[QuestionResponse]] = None

    class Config:
        from_attributes = True
        use_enum_values = True

# AI Quiz Generation Schemas
class AIQuizGenerationRequest(BaseModel):
    source: QuizSourceEnum
    source_content: Optional[str] = None  # URL, YouTube URL, or file content
    title: Optional[str] = None
    subject: Optional[str] = None
    difficulty_level: str = Field("medium", pattern="^(easy|medium|hard)$")
    num_questions: int = Field(10, ge=1, le=50)
    question_types: Optional[List[QuizTypeEnum]] = None
    language: str = "English"
    
    # Generation settings
    focus_topics: Optional[List[str]] = None
    avoid_topics: Optional[List[str]] = None
    include_explanations: bool = True

class AIQuizGenerationResponse(BaseModel):
    quiz_id: int
    generation_status: str  # "processing", "completed", "failed"
    estimated_time_seconds: Optional[int]
    generated_questions: Optional[int]
    error_message: Optional[str] = None

# Quiz Session Schemas
class QuizSessionCreate(BaseModel):
    quiz_id: int
    context_type: Optional[str] = "practice"  # "classroom", "practice", "self_study"
    context_id: Optional[int] = None

class QuizSessionResponse(BaseModel):
    id: str
    quiz_id: int
    quiz_title: str
    user_id: int
    context_type: Optional[str]
    context_id: Optional[int]
    status: SessionStatusEnum
    attempt_number: int
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    total_time_seconds: Optional[int]
    current_question_index: int
    questions_answered: int
    questions_skipped: int
    total_score: float
    max_possible_score: Optional[float]
    percentage_score: Optional[float]
    is_passed: bool
    created_at: datetime

    class Config:
        from_attributes = True
        use_enum_values = True

# Answer Schemas
class AnswerSubmit(BaseModel):
    question_id: int
    user_answer: Optional[str] = None
    confidence_level: Optional[int] = Field(None, ge=1, le=5)

class AnswerResponse(BaseModel):
    id: int
    question_id: int
    user_answer: Optional[str]
    is_correct: Optional[bool]
    points_earned: float
    confidence_level: Optional[int]
    time_taken_seconds: Optional[int]
    was_skipped: bool
    was_reviewed: bool
    answered_at: Optional[datetime]
    correct_answer: Optional[str] = None  # Only shown after quiz completion
    explanation: Optional[str] = None

    class Config:
        from_attributes = True

# Analytics Schemas
class QuizAnalyticsResponse(BaseModel):
    quiz_id: int
    total_attempts: int
    total_completions: int
    completion_rate: float
    average_score: float
    average_time_minutes: float
    question_performance: List[Dict[str, Any]]
    score_distribution: Dict[str, int]
    time_distribution: Dict[str, int]
    common_mistakes: List[Dict[str, Any]]

class StudentQuizProgress(BaseModel):
    quiz_id: int
    quiz_title: str
    attempts: int
    best_score: float
    latest_score: Optional[float]
    completion_status: str
    time_spent_minutes: int
    last_attempt: Optional[datetime]

# Bulk operations
class BulkQuestionCreate(BaseModel):
    questions: List[QuestionCreate] = Field(..., min_items=1, max_items=50)

class BulkQuestionUpdate(BaseModel):
    question_updates: List[Dict[str, Any]] = Field(..., min_items=1)

# Search and filtering
class QuizSearchRequest(BaseModel):
    query: Optional[str] = None
    subject: Optional[str] = None
    difficulty_level: Optional[str] = None
    creator_type: Optional[QuizCreatorTypeEnum] = None
    source: Optional[QuizSourceEnum] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None
    min_questions: Optional[int] = None
    max_questions: Optional[int] = None
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)

class QuizSearchResponse(BaseModel):
    quizzes: List[QuizResponse]
    total: int
    page: int
    per_page: int
    total_pages: int