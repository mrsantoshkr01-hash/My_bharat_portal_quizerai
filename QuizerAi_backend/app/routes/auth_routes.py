# # adding routes for authentication function
# from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
# from fastapi.security import OAuth2PasswordRequestForm
# from sqlalchemy.orm import Session
# from app.database.connection import get_db
# from app.services.auth_services import AuthService
# from app.schemas.auth_schemas import *
# from app.middleware.auth_middleware import get_current_active_user, get_client_ip
# from app.models.user_models import User
# from app.core.security import ACCESS_TOKEN_EXPIRE_MINUTES
# from pydantic import BaseModel

# router = APIRouter()

# @router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
# async def register(
#     user_data: UserCreate,
#     db: Session = Depends(get_db),
#     background_tasks: BackgroundTasks = BackgroundTasks()
# ):
#     auth_service = AuthService(db)
#     user = auth_service.create_user(user_data)
    
#     # Add background task to send verification email
#     # background_tasks.add_task(send_verification_email, user.email, user.id)
    
#     return user


# class LoginRequest(BaseModel):
#     email: str
#     password: str
#     remember_me: bool = False

# @router.post("/login", response_model=TokenResponse)
# async def login(
#     request: Request,
#     login_request: LoginRequest,  # Changed from OAuth2PasswordRequestForm
#     db: Session = Depends(get_db)
# ):
#     auth_service = AuthService(db)
#     print(f"Data from the frontend is {login_request}")
    
#     login_data = UserLogin(email=login_request.email, password=login_request.password)
#     ip_address = get_client_ip(request)
#     user_agent = request.headers.get("User-Agent", "")
    
#     user = auth_service.authenticate_user(login_data, ip_address, user_agent)
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Incorrect email or password",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
    
#     # Check if MFA is enabled
#     if user.is_mfa_enabled:
#         # Return temporary token for MFA verification
#         temp_token = SecurityManager.create_access_token(
#             data={"sub": user.email, "user_id": user.id, "mfa_required": True},
#             expires_delta=timedelta(minutes=5)
#         )
#         return {
#             "access_token": temp_token,
#             "token_type": "bearer",
#             "mfa_required": True,
#             "expires_in": 300
#         }
    
#     access_token, refresh_token = auth_service.create_tokens(user)
    
#     return TokenResponse(
#         access_token=access_token,
#         refresh_token=refresh_token,
#         expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
#         user=user
#     )

# @router.post("/refresh", response_model=dict)
# async def refresh_token(
#     token_data: RefreshTokenRequest,
#     db: Session = Depends(get_db)
# ):
#     auth_service = AuthService(db)
#     access_token = auth_service.refresh_access_token(token_data.refresh_token)
    
#     if not access_token:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid refresh token"
#         )
    
#     return {
#         "access_token": access_token,
#         "token_type": "bearer",
#         "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
#     }

# @router.post("/logout")
# async def logout(
#     token_data: RefreshTokenRequest,
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     auth_service = AuthService(db)
#     auth_service.revoke_refresh_token(token_data.refresh_token)
#     return {"message": "Successfully logged out"}

# @router.get("/me", response_model=UserResponse)
# async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
#     return current_user

# @router.put("/me", response_model=UserResponse)
# async def update_current_user(
#     user_data: UserUpdate,
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     auth_service = AuthService(db)
#     return auth_service.update_user(current_user.id, user_data)

# @router.post("/change-password")
# async def change_password(
#     password_data: PasswordChangeRequest,
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     auth_service = AuthService(db)
#     success = auth_service.change_password(
#         current_user.id, 
#         password_data.current_password, 
#         password_data.new_password
#     )
    
#     if not success:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Invalid current password"
#         )
    
#     return {"message": "Password changed successfully"}

# # MFA Routes
# @router.post("/mfa/setup", response_model=MFASetupResponse)
# async def setup_mfa(
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     auth_service = AuthService(db)
#     return auth_service.setup_mfa(current_user.id)

# @router.post("/mfa/verify")
# async def verify_mfa(
#     mfa_data: MFAVerifyRequest,
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     auth_service = AuthService(db)
#     is_valid = auth_service.verify_mfa(current_user.id, mfa_data.otp_code)
    
#     if not is_valid:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Invalid OTP code"
#         )
    
#     # If this was MFA verification after login, create full tokens
#     access_token, refresh_token = auth_service.create_tokens(current_user)
    
#     return TokenResponse(
#         access_token=access_token,
#         refresh_token=refresh_token,
#         expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
#         user=current_user
#     )

# @router.post("/mfa/disable")
# async def disable_mfa(
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     auth_service = AuthService(db)
#     success = auth_service.disable_mfa(current_user.id)
    
#     if not success:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Failed to disable MFA"
#         )
    
#     return {"message": "MFA disabled successfully"}



# app/routers/auth_routes.py - Complete and corrected version with OTP support
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth_services import AuthService
from app.schemas.auth_schemas import *
from app.middleware.auth_middleware import get_current_active_user, get_client_ip
from app.models.user_models import User, OTPType
from app.core.security import ACCESS_TOKEN_EXPIRE_MINUTES, SecurityManager
from pydantic import BaseModel
from typing import Optional
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Registration endpoints with OTP
@router.post("/register/initiate", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def initiate_registration(
    user_data: RegistrationInitiate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Initiate registration process - creates user and sends OTP"""
    auth_service = AuthService(db)
    ip_address = get_client_ip(request)
    
    try:
        result = auth_service.initiate_registration(user_data, ip_address)
        return RegistrationResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration initiation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )

@router.post("/register/complete", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def complete_registration(
    registration_data: RegistrationComplete,
    db: Session = Depends(get_db)
):
    """Complete registration by verifying OTP"""
    auth_service = AuthService(db)
    
    try:
        user = auth_service.complete_registration(registration_data)
        return UserResponse.from_orm(user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration completion failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration completion failed. Please try again."
        )

# Legacy registration endpoint (backwards compatibility)
@router.post("/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Legacy registration endpoint - redirects to initiate registration"""
    return await initiate_registration(RegistrationInitiate(**user_data.dict()), request, db)

# OTP management endpoints
@router.post("/otp/resend", response_model=OTPResponse)
async def resend_otp(
    otp_request: OTPRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Resend OTP code"""
    auth_service = AuthService(db)
    ip_address = get_client_ip(request)
    
    try:
        result = auth_service.resend_otp(
            email=otp_request.email,
            otp_type=otp_request.otp_type,
            ip_address=ip_address
        )
        return OTPResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP resend failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resend OTP. Please try again."
        )

@router.post("/otp/verify", response_model=dict)
async def verify_otp(
    verification_data: OTPVerification,
    db: Session = Depends(get_db)
):
    """Verify OTP code without completing registration"""
    auth_service = AuthService(db)
    
    try:
        is_valid = auth_service._verify_otp_code(
            email=verification_data.email,
            otp_code=verification_data.otp_code,
            otp_type=verification_data.otp_type
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP code"
            )
        
        return {"message": "OTP verified successfully", "valid": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OTP verification failed. Please try again."
        )

@router.get("/verification-status/{email}", response_model=EmailVerificationStatus)
async def get_verification_status(
    email: str,
    db: Session = Depends(get_db)
):
    """Get email verification status"""
    auth_service = AuthService(db)
    
    try:
        status_data = auth_service.get_verification_status(email)
        return EmailVerificationStatus(email=email, **status_data)
    except Exception as e:
        logger.error(f"Failed to get verification status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get verification status"
        )

# Login endpoints
class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False

@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    login_request: LoginRequest,
    db: Session = Depends(get_db)
):
    """User login endpoint"""
    auth_service = AuthService(db)
    logger.info(f"Login attempt for email: {login_request.email}")
    
    try:
        login_data = UserLogin(email=login_request.email, password=login_request.password)
        ip_address = get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "")
        
        user =  auth_service.authenticate_user(login_data, ip_address, user_agent)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if MFA is enabled
        if user.is_mfa_enabled:
            # Return temporary token for MFA verification
            security_manager = SecurityManager()
            temp_token = security_manager.create_access_token(
                data={"sub": user.email, "user_id": user.id, "mfa_required": True},
                expires_delta=timedelta(minutes=5)
            )
            return TokenResponse(
                access_token=temp_token,
                token_type="bearer",
                mfa_required=True,
                expires_in=300
            )
        
        access_token, refresh_token = auth_service.create_tokens(user)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.from_orm(user)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again."
        )

@router.post("/refresh", response_model=dict)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    auth_service = AuthService(db)
    
    try:
        access_token = auth_service.refresh_access_token(token_data.refresh_token)
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed. Please try again."
        )

@router.post("/logout")
async def logout(
    token_data: RefreshTokenRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """User logout endpoint"""
    auth_service = AuthService(db)
    
    try:
        auth_service.revoke_refresh_token(token_data.refresh_token)
        return {"message": "Successfully logged out"}
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed. Please try again."
        )

# User management endpoints
@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse.from_orm(current_user)

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user information"""
    auth_service = AuthService(db)
    
    try:
        updated_user = auth_service.update_user(current_user.id, user_data)
        return UserResponse.from_orm(updated_user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User update failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user information."
        )

@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    auth_service = AuthService(db)
    
    try:
        success = auth_service.change_password(
            current_user.id, 
            password_data.current_password, 
            password_data.new_password
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid current password"
            )
        
        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password change failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed. Please try again."
        )

# Password reset with OTP
@router.post("/password-reset/request")
async def request_password_reset(
    reset_request: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Request password reset OTP"""
    auth_service = AuthService(db)
    ip_address = get_client_ip(request)
    
    try:
        user = auth_service.get_user_by_email(reset_request.email)
        if not user:
            # Don't reveal if email exists for security
            return {"message": "If the email exists, a reset code has been sent"}
        
        result = auth_service.resend_otp(
            email=reset_request.email,
            otp_type=OTPType.PASSWORD_RESET,
            ip_address=ip_address
        )
        
        return {
            "message": "Password reset code sent to your email", 
            "expires_in": result["expires_in"]
        }
    except Exception as e:
        logger.error(f"Password reset request failed: {str(e)}")
        return {"message": "If the email exists, a reset code has been sent"}

@router.post("/password-reset/verify")
async def verify_password_reset(
    reset_data: PasswordResetVerify,
    db: Session = Depends(get_db)
):
    """Verify OTP and reset password"""
    auth_service = AuthService(db)
    
    try:
        # Verify OTP
        is_valid = auth_service._verify_otp_code(
            email=reset_data.email,
            otp_code=reset_data.otp_code,
            otp_type=OTPType.PASSWORD_RESET
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset code"
            )
        
        # Get user and update password
        user = auth_service.get_user_by_email(reset_data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update password
        user.hashed_password = auth_service.security.get_password_hash(reset_data.new_password)
        auth_service.db.commit()
        
        return {"message": "Password reset successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed. Please try again."
        )

# Email verification endpoints
@router.post("/email/verify-request")
async def request_email_verification(
    email_request: OTPRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Request email verification OTP for already registered users"""
    auth_service = AuthService(db)
    ip_address = get_client_ip(request)
    
    try:
        if current_user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified"
            )
        
        result = auth_service.resend_otp(
            email=current_user.email,
            otp_type=OTPType.EMAIL_VERIFICATION,
            ip_address=ip_address
        )
        
        return OTPResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification request failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again."
        )

@router.post("/email/verify")
async def verify_email(
    verification_data: OTPVerification,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Verify email with OTP for already registered users"""
    auth_service = AuthService(db)
    
    try:
        if current_user.is_verified:
            return {"message": "Email is already verified"}
        
        is_valid = auth_service._verify_otp_code(
            email=current_user.email,
            otp_code=verification_data.otp_code,
            otp_type=OTPType.EMAIL_VERIFICATION
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code"
            )
        
        # Update user verification status
        current_user.is_verified = True
        current_user.email_verified_at = datetime.utcnow()
        auth_service.db.commit()
        
        return {"message": "Email verified successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed. Please try again."
        )

# MFA Routes
@router.post("/mfa/setup", response_model=MFASetupResponse)
async def setup_mfa(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Setup Multi-Factor Authentication"""
    auth_service = AuthService(db)
    
    try:
        return auth_service.setup_mfa(current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MFA setup failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="MFA setup failed. Please try again."
        )

@router.post("/mfa/verify")
async def verify_mfa(
    mfa_data: MFAVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Verify MFA code and complete login"""
    auth_service = AuthService(db)
    
    try:
        is_valid = auth_service.verify_mfa(current_user.id, mfa_data.otp_code)
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP code"
            )
        
        # If this was MFA verification after login, create full tokens
        access_token, refresh_token = auth_service.create_tokens(current_user)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.from_orm(current_user)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MFA verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="MFA verification failed. Please try again."
        )

@router.post("/mfa/disable")
async def disable_mfa(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Disable Multi-Factor Authentication"""
    auth_service = AuthService(db)
    
    try:
        success = auth_service.disable_mfa(current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to disable MFA"
            )
        
        return {"message": "MFA disabled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MFA disable failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disable MFA. Please try again."
        )

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check endpoint for authentication service"""
    return {
        "status": "healthy",
        "service": "auth_service",
        "version": "1.0.0"
    }

# User statistics endpoint (for admin)
@router.get("/stats")
async def get_auth_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get authentication statistics (admin only)"""
    # Check if user is admin
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    try:
        from sqlalchemy import func
        from app.models.user_models import User, OTPCode, LoginAttempt
        
        # Get basic user statistics
        total_users = db.query(func.count(User.id)).scalar()
        verified_users = db.query(func.count(User.id)).filter(User.is_verified == True).scalar()
        active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
        
        # Get OTP statistics
        total_otps = db.query(func.count(OTPCode.id)).scalar()
        used_otps = db.query(func.count(OTPCode.id)).filter(OTPCode.is_used == True).scalar()
        
        # Get login attempt statistics
        total_logins = db.query(func.count(LoginAttempt.id)).scalar()
        successful_logins = db.query(func.count(LoginAttempt.id)).filter(LoginAttempt.is_successful == True).scalar()
        
        return {
            "users": {
                "total": total_users,
                "verified": verified_users,
                "active": active_users,
                "verification_rate": round((verified_users / total_users * 100) if total_users > 0 else 0, 2)
            },
            "otp": {
                "total_generated": total_otps,
                "total_used": used_otps,
                "usage_rate": round((used_otps / total_otps * 100) if total_otps > 0 else 0, 2)
            },
            "login_attempts": {
                "total": total_logins,
                "successful": successful_logins,
                "success_rate": round((successful_logins / total_logins * 100) if total_logins > 0 else 0, 2)
            }
        }
    except Exception as e:
        logger.error(f"Failed to get auth stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )