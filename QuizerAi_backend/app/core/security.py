# app/core/security.py - Production-ready version
import bcrypt
import hashlib
import logging
from typing import Optional
from jose import JWTError, jwt
from datetime import datetime, timedelta
import secrets
import pyotp
import qrcode
from io import BytesIO
import base64
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))  # 12 is good balance

class SecurityManager:
    """Production-grade security manager using direct bcrypt"""
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """
        Hash password with bcrypt.
        Handles 72-byte limit automatically.
        """
        try:
            # Input validation
            if not password or not isinstance(password, str):
                raise ValueError("Password must be a non-empty string")
            
            password = password.strip()
            if len(password) < 6:
                raise ValueError("Password too short")
            
            password_bytes = password.encode('utf-8')
            
            # Handle bcrypt's 72-byte limit with SHA-256 pre-hash
            if len(password_bytes) > 72:
                logger.info(f"Long password detected ({len(password_bytes)} bytes), applying pre-hash")
                password_bytes = hashlib.sha256(password_bytes).hexdigest().encode('utf-8')
            
            # Generate salt and hash
            salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
            hashed = bcrypt.hashpw(password_bytes, salt)
            
            return hashed.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Password hashing failed: {str(e)}", exc_info=True)
            raise ValueError("Failed to hash password")
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify password against bcrypt hash.
        Applies same transformations as get_password_hash.
        """
        try:
            if not plain_password or not hashed_password:
                return False
            
            plain_password = plain_password.strip()
            password_bytes = plain_password.encode('utf-8')
            
            # Apply same pre-hashing for long passwords
            if len(password_bytes) > 72:
                password_bytes = hashlib.sha256(password_bytes).hexdigest().encode('utf-8')
            
            # Verify with bcrypt
            return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
            
        except Exception as e:
            logger.error(f"Password verification failed: {str(e)}")
            return False
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + (
            expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        to_encode.update({"exp": expire, "type": "access"})
        return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    
    @staticmethod
    def create_refresh_token(data: dict) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
            if payload.get("type") != token_type:
                return None
            return payload
        except JWTError as e:
            logger.warning(f"Token verification failed: {str(e)}")
            return None
    
    @staticmethod
    def generate_totp_secret() -> str:
        """Generate TOTP secret for MFA"""
        return pyotp.random_base32()
    
    @staticmethod
    def verify_totp(secret: str, token: str) -> bool:
        """Verify TOTP token"""
        try:
            totp = pyotp.TOTP(secret)
            return totp.verify(token, valid_window=1)
        except Exception as e:
            logger.error(f"TOTP verification failed: {str(e)}")
            return False
    
    @staticmethod
    def generate_qr_code(secret: str, email: str, issuer: str = "AI StudyHub") -> str:
        """Generate QR code for TOTP setup"""
        try:
            totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
                email, issuer_name=issuer
            )
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(totp_uri)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buffered = BytesIO()
            img.save(buffered, format='PNG')
            img_str = base64.b64encode(buffered.getvalue()).decode()
            return f"data:image/png;base64,{img_str}"
        except Exception as e:
            logger.error(f"QR code generation failed: {str(e)}")
            raise
    
    @staticmethod
    def generate_backup_codes(count: int = 10) -> list:
        """Generate backup codes for MFA"""
        return [secrets.token_hex(4).upper() for _ in range(count)]
    
    @staticmethod
    def generate_reset_token() -> str:
        """Generate password reset token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def generate_verification_token() -> str:
        """Generate email verification token"""
        return secrets.token_urlsafe(32)