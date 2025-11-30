# app/schemas/auth_schemas.py - Updated with OTP support
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"
    INSTITUTION = "institution"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"

class OTPType(str, Enum):
    REGISTRATION = "registration"
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"
    LOGIN_VERIFICATION = "login_verification"

# Base User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.STUDENT
    phone_number: Optional[str] = None

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if len(v) > 30:
            raise ValueError('Username must not exceed 30 characters')
        if not v.replace('_', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    profile_picture: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: UserRole
    status: UserStatus
    is_active: bool
    is_verified: bool
    is_mfa_enabled: bool
    phone_number: Optional[str]
    profile_picture: Optional[str]
    last_login: Optional[datetime]
    email_verified_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# OTP Related Schemas
class OTPRequest(BaseModel):
    email: EmailStr
    otp_type: OTPType = OTPType.REGISTRATION

class OTPVerification(BaseModel):
    email: EmailStr
    otp_code: str
    otp_type: OTPType = OTPType.REGISTRATION

class OTPResponse(BaseModel):
    message: str
    expires_in: int  # seconds
    can_resend_in: Optional[int] = None  # seconds

# Registration with OTP Schemas
class RegistrationInitiate(UserCreate):
    """Schema for initiating registration - creates user and sends OTP"""
    pass

class RegistrationComplete(BaseModel):
    """Schema for completing registration with OTP verification"""
    email: EmailStr
    otp_code: str

class RegistrationResponse(BaseModel):
    message: str
    user_id: Optional[int] = None
    requires_verification: bool = True
    expires_in: int  # OTP expiry in seconds

# Token Schemas
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    user: Optional[UserResponse] = None
    mfa_required: Optional[bool] = False

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Password Related Schemas
class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v):
            raise ValueError('Password must contain at least one special character')
        return v

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetVerify(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str

# MFA Schemas
class MFASetupResponse(BaseModel):
    secret: str
    qr_code: str
    backup_codes: List[str]

class MFAVerifyRequest(BaseModel):
    otp_code: str

# Error Response Schemas
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None

class ValidationErrorResponse(BaseModel):
    detail: str
    errors: List[dict]

# Status Check Schemas
class EmailVerificationStatus(BaseModel):
    email: EmailStr
    is_verified: bool
    verification_required: bool
    can_resend_otp: bool
    next_resend_in: Optional[int] = None  # seconds