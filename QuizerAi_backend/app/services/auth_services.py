# app/services/auth_services.py - Complete version with OTP support and smart username handling
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user_models import User, RefreshToken, PasswordReset, LoginAttempt, UserRole, UserStatus, OTPCode, OTPType
from app.schemas.auth_schemas import UserCreate, UserLogin, UserUpdate, OTPRequest, OTPVerification, RegistrationComplete
from app.core.security import SecurityManager
from app.services.email_service import EmailService
from datetime import datetime, timedelta
from typing import Optional, Tuple
import secrets
import random
import logging

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.security = SecurityManager()
        self.email_service = EmailService()

    def _generate_otp(self) -> str:
        """Generate a 6-digit OTP code"""
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])

    def _create_otp_record(self, email: str, user_id: Optional[int], otp_type: OTPType, ip_address: Optional[str] = None) -> Tuple[str, datetime]:
        """Create OTP record in database"""
        # Invalidate any existing OTP codes for this email and type
        existing_otps = self.db.query(OTPCode).filter(
            OTPCode.email == email,
            OTPCode.otp_type == otp_type,
            OTPCode.is_used == False,
            OTPCode.expires_at > datetime.utcnow()
        ).all()
        
        for otp in existing_otps:
            otp.is_used = True
        
        # Generate new OTP
        otp_code = self._generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=10)  # 10 minutes expiry
        
        otp_record = OTPCode(
            user_id=user_id,
            email=email,
            code=otp_code,
            otp_type=otp_type,
            expires_at=expires_at,
            ip_address=ip_address
        )
        
        self.db.add(otp_record)
        self.db.commit()
        
        return otp_code, expires_at

    def _verify_otp_code(self, email: str, otp_code: str, otp_type: OTPType) -> bool:
        """Verify OTP code"""
        otp_record = self.db.query(OTPCode).filter(
            OTPCode.email == email,
            OTPCode.code == otp_code,
            OTPCode.otp_type == otp_type,
            OTPCode.is_used == False,
            OTPCode.expires_at > datetime.utcnow()
        ).first()
        
        if not otp_record:
            return False
        
        # Check attempts
        otp_record.attempts_count += 1
        
        if otp_record.attempts_count > otp_record.max_attempts:
            otp_record.is_used = True
            self.db.commit()
            return False
        
        # Mark as used
        otp_record.is_used = True
        otp_record.used_at = datetime.utcnow()
        self.db.commit()
        
        return True

    def _cleanup_unverified_user(self, email: str, username: str):
        """Remove unverified users that might block new registrations"""
        # Find unverified users with same email or username
        unverified_users = self.db.query(User).filter(
            User.is_verified == False,
            (User.email == email) | (User.username == username)
        ).all()
        
        for user in unverified_users:
            # Delete related OTP codes first (to avoid foreign key constraints)
            self.db.query(OTPCode).filter(OTPCode.user_id == user.id).delete()
            # Delete related refresh tokens
            self.db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()
            # Delete related login attempts
            self.db.query(LoginAttempt).filter(LoginAttempt.user_id == user.id).delete()
            # Delete the unverified user
            self.db.delete(user)
        
        self.db.commit()
        logger.info(f"Cleaned up unverified users for email: {email}, username: {username}")

    def initiate_registration(self, user_data: UserCreate, ip_address: Optional[str] = None) -> dict:
        """Initiate user registration by creating user and sending OTP"""
        
        # CRITICAL FIX: Check only VERIFIED users for conflicts
        existing_verified_email = self.db.query(User).filter(
            User.email == user_data.email,
            User.is_verified == True
        ).first()
        
        if existing_verified_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered and verified"
            )
        
        existing_verified_username = self.db.query(User).filter(
            User.username == user_data.username,
            User.is_verified == True
        ).first()
        
        if existing_verified_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken by verified user"
            )

        # Clean up any unverified users that might conflict
        self._cleanup_unverified_user(user_data.email, user_data.username)

        # Create new user (always create fresh for simplicity)
        hashed_password = self.security.get_password_hash(user_data.password)
        user = User(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            role=user_data.role,
            status=UserStatus.PENDING_VERIFICATION,
            is_active=False,
            is_verified=False,
            phone_number=user_data.phone_number
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        # Generate and send OTP
        otp_code, expires_at = self._create_otp_record(
            email=user.email,
            user_id=user.id,
            otp_type=OTPType.REGISTRATION,
            ip_address=ip_address
        )
        
        # Send OTP email
        email_sent = self.email_service.send_otp_email(
            to_email=user.email,
            otp_code=otp_code,
            user_name=user.full_name,
            otp_type="registration"
        )
        
        if not email_sent:
            logger.warning(f"Failed to send OTP email to {user.email}")
            # Don't fail registration if email fails, but log it
        
        expires_in = int((expires_at - datetime.utcnow()).total_seconds())
        
        return {
            "message": "Registration initiated. Please check your email for verification code.",
            "user_id": user.id,
            "requires_verification": True,
            "expires_in": expires_in
        }

    def complete_registration(self, registration_data: RegistrationComplete) -> User:
        """Complete registration by verifying OTP"""
        # Verify OTP
        if not self._verify_otp_code(registration_data.email, registration_data.otp_code, OTPType.REGISTRATION):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP code"
            )
        
        # Get user
        user = self.get_user_by_email(registration_data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Activate user
        user.is_active = True
        user.is_verified = True
        user.status = UserStatus.ACTIVE
        user.email_verified_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(user)
        
        # Send welcome email
        try:
            self.email_service.send_welcome_email(user.email, user.full_name)
        except Exception as e:
            logger.warning(f"Failed to send welcome email to {user.email}: {str(e)}")
        
        return user

    def resend_otp(self, email: str, otp_type: OTPType = OTPType.REGISTRATION, ip_address: Optional[str] = None) -> dict:
        """Resend OTP code"""
        user = self.get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.is_verified and otp_type == OTPType.REGISTRATION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already verified"
            )
        
        # Check if too many recent requests
        recent_otps = self.db.query(OTPCode).filter(
            OTPCode.email == email,
            OTPCode.otp_type == otp_type,
            OTPCode.created_at > datetime.utcnow() - timedelta(minutes=2)
        ).count()
        
        if recent_otps >= 3:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many OTP requests. Please wait before requesting again."
            )
        
        # Generate and send new OTP
        otp_code, expires_at = self._create_otp_record(
            email=email,
            user_id=user.id,
            otp_type=otp_type,
            ip_address=ip_address
        )
        
        # Send OTP email
        email_sent = self.email_service.send_otp_email(
            to_email=email,
            otp_code=otp_code,
            user_name=user.full_name,
            otp_type=otp_type.value
        )
        
        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP email"
            )
        
        expires_in = int((expires_at - datetime.utcnow()).total_seconds())
        
        return {
            "message": "OTP resent successfully",
            "expires_in": expires_in,
            "can_resend_in": 120  # 2 minutes
        }

    def create_user(self, user_data: UserCreate) -> User:
        """Legacy method - now redirects to initiate_registration"""
        result = self.initiate_registration(user_data)
        # Return the user for backward compatibility
        return self.get_user_by_email(user_data.email)

    def authenticate_user(self, login_data: UserLogin, ip_address: str, user_agent: str) -> Optional[User]:
        """Authenticate user login"""
        user = self.get_user_by_email(login_data.email)
        
        # Log login attempt
        login_attempt = LoginAttempt(
            user_id=user.id if user else None,
            email=login_data.email,
            ip_address=ip_address,
            user_agent=user_agent,
            is_successful=False
        )

        if not user:
            login_attempt.failure_reason = "User not found"
            self.db.add(login_attempt)
            self.db.commit()
            return None

        if not self.security.verify_password(login_data.password, user.hashed_password):
            login_attempt.failure_reason = "Invalid password"
            self.db.add(login_attempt)
            self.db.commit()
            return None

        if not user.is_verified:
            login_attempt.failure_reason = "Email not verified"
            self.db.add(login_attempt)
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email before logging in"
            )

        if not user.is_active or user.status != UserStatus.ACTIVE:
            login_attempt.failure_reason = "Account inactive"
            self.db.add(login_attempt)
            self.db.commit()
            return None

        # Successful login
        login_attempt.is_successful = True
        login_attempt.user_id = user.id
        user.last_login = datetime.utcnow()
        
        self.db.add(login_attempt)
        self.db.commit()
        return user

    def create_tokens(self, user: User) -> Tuple[str, str]:
        """Create access and refresh tokens"""
        # Create access token
        access_token = self.security.create_access_token(
            data={"sub": user.email, "user_id": user.id, "role": user.role.value}
        )
        
        # Create refresh token
        refresh_token_data = {"sub": user.email, "user_id": user.id}
        refresh_token = self.security.create_refresh_token(refresh_token_data)
        REFRESH_TOKEN_EXPIRE_DAYS = 7  # Updated to 7 days
        
        # Store refresh token in database
        db_refresh_token = RefreshToken(
            token=refresh_token,
            user_id=user.id,
            expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        )
        self.db.add(db_refresh_token)
        self.db.commit()
        
        return access_token, refresh_token

    def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        """Refresh access token using refresh token"""
        # Verify refresh token
        payload = self.security.verify_token(refresh_token, "refresh")
        if not payload:
            return None

        # Check if refresh token exists and is not revoked
        db_token = self.db.query(RefreshToken).filter(
            RefreshToken.token == refresh_token,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > datetime.utcnow()
        ).first()

        if not db_token:
            return None

        # Get user
        user = self.get_user_by_id(db_token.user_id)
        if not user or not user.is_active:
            return None

        # Create new access token
        access_token = self.security.create_access_token(
            data={"sub": user.email, "user_id": user.id, "role": user.role.value}
        )
        
        return access_token

    def revoke_refresh_token(self, refresh_token: str) -> bool:
        """Revoke refresh token"""
        db_token = self.db.query(RefreshToken).filter(
            RefreshToken.token == refresh_token
        ).first()
        
        if db_token:
            db_token.is_revoked = True
            self.db.commit()
            return True
        return False

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        return self.db.query(User).filter(User.username == username).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def update_user(self, user_id: int, user_data: UserUpdate) -> User:
        """Update user information"""
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        for field, value in user_data.dict(exclude_unset=True).items():
            setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def change_password(self, user_id: int, current_password: str, new_password: str) -> bool:
        """Change user password"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False

        if not self.security.verify_password(current_password, user.hashed_password):
            return False

        user.hashed_password = self.security.get_password_hash(new_password)
        self.db.commit()
        return True

    def setup_mfa(self, user_id: int) -> dict:
        """Setup Multi-Factor Authentication"""
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        secret = self.security.generate_totp_secret()
        qr_code = self.security.generate_qr_code(secret, user.email)
        backup_codes = self.security.generate_backup_codes()

        user.totp_secret = secret
        self.db.commit()

        return {
            "secret": secret,
            "qr_code": qr_code,
            "backup_codes": backup_codes
        }

    def verify_mfa(self, user_id: int, otp_code: str) -> bool:
        """Verify MFA code"""
        user = self.get_user_by_id(user_id)
        if not user or not user.totp_secret:
            return False

        is_valid = self.security.verify_totp(user.totp_secret, otp_code)
        if is_valid and not user.is_mfa_enabled:
            user.is_mfa_enabled = True
            self.db.commit()

        return is_valid

    def disable_mfa(self, user_id: int) -> bool:
        """Disable Multi-Factor Authentication"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False

        user.is_mfa_enabled = False
        user.totp_secret = None
        self.db.commit()
        return True

    def get_verification_status(self, email: str) -> dict:
        """Get email verification status"""
        user = self.get_user_by_email(email)
        if not user:
            return {
                "is_verified": False,
                "verification_required": True,
                "can_resend_otp": False
            }
        
        # Check if can resend OTP (no recent requests)
        recent_otp = self.db.query(OTPCode).filter(
            OTPCode.email == email,
            OTPCode.otp_type == OTPType.REGISTRATION,
            OTPCode.created_at > datetime.utcnow() - timedelta(minutes=2)
        ).first()
        
        can_resend = recent_otp is None
        next_resend_in = None
        
        if recent_otp:
            next_resend_time = recent_otp.created_at + timedelta(minutes=2)
            if next_resend_time > datetime.utcnow():
                next_resend_in = int((next_resend_time - datetime.utcnow()).total_seconds())
        
        return {
            "is_verified": user.is_verified,
            "verification_required": not user.is_verified,
            "can_resend_otp": can_resend,
            "next_resend_in": next_resend_in
        }

    def cleanup_expired_otps(self):
        """Cleanup expired OTP codes (can be called by a background task)"""
        try:
            expired_otps = self.db.query(OTPCode).filter(
                OTPCode.expires_at < datetime.utcnow(),
                OTPCode.is_used == False
            ).all()
            
            for otp in expired_otps:
                otp.is_used = True
            
            self.db.commit()
            logger.info(f"Cleaned up {len(expired_otps)} expired OTP codes")
        except Exception as e:
            logger.error(f"Failed to cleanup expired OTPs: {str(e)}")
            self.db.rollback()

    def cleanup_old_unverified_users(self, days_old: int = 7):
        """Cleanup old unverified users (can be called by a background task)"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            old_unverified_users = self.db.query(User).filter(
                User.is_verified == False,
                User.created_at < cutoff_date
            ).all()
            
            for user in old_unverified_users:
                # Delete related records first to avoid foreign key constraints
                self.db.query(OTPCode).filter(OTPCode.user_id == user.id).delete()
                self.db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()
                self.db.query(LoginAttempt).filter(LoginAttempt.user_id == user.id).delete()
                # Delete the user
                self.db.delete(user)
            
            self.db.commit()
            logger.info(f"Cleaned up {len(old_unverified_users)} old unverified users")
        except Exception as e:
            logger.error(f"Failed to cleanup old unverified users: {str(e)}")
            self.db.rollback()

    def get_user_login_history(self, user_id: int, limit: int = 10) -> list:
        """Get user login history"""
        login_attempts = self.db.query(LoginAttempt).filter(
            LoginAttempt.user_id == user_id
        ).order_by(LoginAttempt.created_at.desc()).limit(limit).all()
        
        return [
            {
                "ip_address": attempt.ip_address,
                "user_agent": attempt.user_agent,
                "is_successful": attempt.is_successful,
                "failure_reason": attempt.failure_reason,
                "created_at": attempt.created_at
            }
            for attempt in login_attempts
        ]

    def revoke_all_user_tokens(self, user_id: int) -> bool:
        """Revoke all refresh tokens for a user (useful for security incidents)"""
        try:
            active_tokens = self.db.query(RefreshToken).filter(
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked == False
            ).all()
            
            for token in active_tokens:
                token.is_revoked = True
            
            self.db.commit()
            logger.info(f"Revoked {len(active_tokens)} tokens for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to revoke tokens for user {user_id}: {str(e)}")
            self.db.rollback()
            return False

    def get_user_stats(self) -> dict:
        """Get user statistics for admin dashboard"""
        try:
            from sqlalchemy import func
            
            # Get basic user statistics
            total_users = self.db.query(func.count(User.id)).scalar()
            verified_users = self.db.query(func.count(User.id)).filter(User.is_verified == True).scalar()
            active_users = self.db.query(func.count(User.id)).filter(User.is_active == True).scalar()
            pending_users = self.db.query(func.count(User.id)).filter(User.status == UserStatus.PENDING_VERIFICATION).scalar()
            
            # Get recent registrations (last 7 days)
            week_ago = datetime.utcnow() - timedelta(days=7)
            recent_registrations = self.db.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar()
            
            # Get OTP statistics
            total_otps = self.db.query(func.count(OTPCode.id)).scalar()
            used_otps = self.db.query(func.count(OTPCode.id)).filter(OTPCode.is_used == True).scalar()
            
            # Get login statistics
            total_logins = self.db.query(func.count(LoginAttempt.id)).scalar()
            successful_logins = self.db.query(func.count(LoginAttempt.id)).filter(LoginAttempt.is_successful == True).scalar()
            
            return {
                "users": {
                    "total": total_users,
                    "verified": verified_users,
                    "active": active_users,
                    "pending": pending_users,
                    "recent_registrations": recent_registrations,
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
            logger.error(f"Failed to get user stats: {str(e)}")
            return {
                "error": "Failed to retrieve statistics",
                "users": {"total": 0, "verified": 0, "active": 0},
                "otp": {"total_generated": 0, "total_used": 0},
                "login_attempts": {"total": 0, "successful": 0}
            }