# Updated Google OAuth routes
from fastapi import APIRouter, Request, HTTPException, Depends, status
from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse
from fastapi_sso.sso.google import GoogleSSO
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth_services import AuthService
from app.models.user_models import User, OAuthProvider, UserRole, UserStatus
from app.core.security import SecurityManager
from datetime import datetime
import os
from dotenv import load_dotenv
import json
import jwt
from datetime import datetime, timedelta
import traceback

import logging

load_dotenv()
logger = logging.getLogger(__name__)

router = APIRouter()

# OAuth Configuration
GLE_CLIENT_ID = os.getenv("GLE_CLIENT_ID")
GLE_CLIENT_TKN = os.getenv("GLE_CLIENT_TKN")
ACCESS_TKN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TKN_EXPIRE_MINUTES", "30"))
GOOGLE_CALLBACK_URL = os.getenv("GOOGLE_CALLBACK_URL", "http://localhost:8000/oauth/google/callback")

if not GLE_CLIENT_ID or not GLE_CLIENT_TKN:
    logger.error("Google OAuth credentials not found in environment variables")

google_sso = GoogleSSO(
    GLE_CLIENT_ID,
    GLE_CLIENT_TKN,
    GOOGLE_CALLBACK_URL
)

@router.get("/google/login")
async def google_login(popup: bool = False):
    """Initiate Google OAuth login
    
    Args:
        popup: If True, returns auth URL for popup flow. If False, redirects directly.
    """
    try:
        # Get the authorization URL
        authorization_url = await google_sso.get_login_redirect()
        
        if popup:
            # For popup flow, return the URL as JSON
            return JSONResponse({
                "auth_url": str(authorization_url.headers.get('location')),
                "status": "success"
            })
        else:
            # For direct flow, redirect to Google
            return authorization_url
            
    except Exception as e:
        logger.error(f"Error initiating Google OAuth: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initiate Google OAuth"
        )

def _generate_unique_username(auth_service: AuthService, base_username: str, email: str) -> str:
    """Generate a unique username from email or base name"""
    # Start with email prefix
    base = base_username or email.split('@')[0]

    # Clean the base username
    base = ''.join(c for c in base if c.isalnum() or c == '_')[:20]
    if not base:
        base = 'user'

    # Check if base username is available
    if not auth_service.get_user_by_username(base):
        return base

    # Try with numbers
    for i in range(1, 1000):
        candidate = f"{base}{i}"
        if not auth_service.get_user_by_username(candidate):
            return candidate

    # Fallback to random suffix
    import random
    import string
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"{base}_{suffix}"

# @router.get("/google/callback")
# async def google_callback(request: Request, db: Session = Depends(get_db)):
#     """Handle Google OAuth callback"""
#     try:
#         user_info = await google_sso.verify_and_process(request)
#         if not user_info or not user_info.email:
#             return _create_popup_response("error", "Unable to get email from Google account")

#         auth_service = AuthService(db)

#         # Check if verified user exists with this email
#         existing_user = db.query(User).filter(
#             User.email == user_info.email,
#             User.is_verified == True
#         ).first()

#         if existing_user:
#             # EXISTING USER - Complete login immediately
#             oauth_provider = db.query(OAuthProvider).filter(
#                 OAuthProvider.user_id == existing_user.id,
#                 OAuthProvider.provider == "google"
#             ).first()

#             if not oauth_provider:
#                 oauth_provider = OAuthProvider(
#                     user_id=existing_user.id,
#                     provider="google",
#                     provider_user_id=str(user_info.id)
#                 )
#                 db.add(oauth_provider)
#                 db.commit()

#             # Create tokens for existing user
#             access_token, refresh_token = auth_service.create_tokens(existing_user)

#             response_data = {
#                 "access_token": access_token,
#                 "refresh_token": refresh_token,
#                 "token_type": "bearer",
#                 "expires_in": ACCESS_TKN_EXPIRE_MINUTES * 60,
#                 "user": {
#                     "id": existing_user.id,
#                     "email": existing_user.email,
#                     "username": existing_user.username,
#                     "full_name": existing_user.full_name,
#                     "role": existing_user.role.value if hasattr(existing_user.role, 'value') else str(existing_user.role),
#                     "is_verified": existing_user.is_verified
#                 },
#                 "is_new_user": False
#             }

#             return _create_popup_response("success", response_data)

#         # NEW USER - Require role selection
#         # Clean up any unverified users with this email
#         auth_service._cleanup_unverified_user(user_info.email, "")

#         # Store temporary OAuth data for role selection
#         temp_oauth_data = {
#             "provider": "google",
#             "provider_user_id": str(user_info.id),
#             "email": user_info.email,
#             "full_name": user_info.display_name or user_info.email.split('@')[0],
#             "profile_picture": getattr(user_info, 'picture', None)
#         }

#         # Generate a temporary token for role selection
#         import jwt
#         from datetime import timedelta
        
#         temp_token = jwt.encode({
#             "oauth_data": temp_oauth_data,
#             "exp": datetime.utcnow() + timedelta(minutes=10)  # 10 minute expiry
#         }, os.getenv("JWT_SECRET", "your-secret-key"), algorithm="HS256")

#         response_data = {
#             "needs_role_selection": True,
#             "temp_token": temp_token,
#             "user_info": {
#                 "email": user_info.email,
#                 "full_name": user_info.display_name or user_info.email.split('@')[0],
#                 "profile_picture": getattr(user_info, 'picture', None)
#             },
#             "is_new_user": True
#         }

#         return _create_popup_response("success", response_data)

#     except HTTPException as he:
#         logger.error(f"HTTPException in OAuth callback: {he.detail}")
#         return _create_popup_response("error", he.detail)
#     except Exception as e:
#         logger.error(f"Google OAuth callback failed: {str(e)}")
#         return _create_popup_response("error", "Authentication failed. Please try again.")

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        logger.info("=== Starting OAuth callback ===")
        
        user_info = await google_sso.verify_and_process(request)
        logger.info(f"User info received: {user_info}")
        logger.info(f"User info type: {type(user_info)}")
        
        if not user_info:
            logger.error("user_info is None")
            return _create_popup_response("error", "No user info received from Google")
            
        if not user_info.email:
            logger.error("user_info.email is None")
            return _create_popup_response("error", "No email received from Google")

        logger.info(f"User email: {user_info.email}")
        logger.info(f"User ID: {getattr(user_info, 'id', 'NO_ID')}")
        logger.info(f"User display_name: {getattr(user_info, 'display_name', 'NO_DISPLAY_NAME')}")
        logger.info(f"User picture: {getattr(user_info, 'picture', 'NO_PICTURE')}")

        auth_service = AuthService(db)

        # Check if verified user exists with this email
        existing_user = db.query(User).filter(
            User.email == user_info.email,
            User.is_verified == True
        ).first()

        if existing_user:
            logger.info(f"Found existing user: {existing_user.email}")
            # EXISTING USER - Complete login immediately
            oauth_provider = db.query(OAuthProvider).filter(
                OAuthProvider.user_id == existing_user.id,
                OAuthProvider.provider == "google"
            ).first()

            if not oauth_provider:
                provider_user_id = str(user_info.id) if user_info.id else str(user_info.email)
                logger.info(f"Creating OAuth provider with provider_user_id: {provider_user_id}")
                
                oauth_provider = OAuthProvider(
                    user_id=existing_user.id,
                    provider="google",
                    provider_user_id=provider_user_id
                )
                db.add(oauth_provider)
                db.commit()

            # Create tokens for existing user
            access_token, refresh_token = auth_service.create_tokens(existing_user)

            response_data = {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": ACCESS_TKN_EXPIRE_MINUTES * 60,
                "user": {
                    "id": existing_user.id,
                    "email": existing_user.email,
                    "username": existing_user.username,
                    "full_name": existing_user.full_name,
                    "role": existing_user.role.value if hasattr(existing_user.role, 'value') else str(existing_user.role),
                    "is_verified": existing_user.is_verified
                },
                "is_new_user": False
            }

            logger.info("Returning success response for existing user")
            return _create_popup_response("success", response_data)

        # NEW USER - Require role selection
        logger.info("New user detected, preparing role selection")
        
        # Clean up any unverified users with this email
        auth_service._cleanup_unverified_user(user_info.email, "")

        # Store temporary OAuth data for role selection - ensure all values are strings
        user_id_value = user_info.id if user_info.id else user_info.email
        display_name_value = user_info.display_name if user_info.display_name else user_info.email.split('@')[0]
        picture_value = getattr(user_info, 'picture', '') or ''
        
        logger.info(f"Raw values - ID: {user_id_value}, Display: {display_name_value}, Picture: {picture_value}")
        
        temp_oauth_data = {
            "provider": "google",
            "provider_user_id": str(user_id_value),
            "email": str(user_info.email),
            "full_name": str(display_name_value),
            "profile_picture": str(picture_value)
        }
        
        logger.info(f"Temp OAuth data: {temp_oauth_data}")

        # Check JWT_SECRET
        secret_key = os.getenv("JWT_SECRET")
        logger.info(f"JWT_SECRET exists: {bool(secret_key)}")
        logger.info(f"JWT_SECRET length: {len(secret_key) if secret_key else 0}")
        
        if not secret_key:
            logger.error("JWT_SECRET not found in environment variables")
            return _create_popup_response("error", "Server configuration error - missing JWT secret")
        
        try:
            logger.info("Creating JWT token...")
            temp_token = jwt.encode({
                "oauth_data": temp_oauth_data,
                "exp": datetime.utcnow() + timedelta(minutes=10)
            }, secret_key, algorithm="HS256")
            logger.info(f"JWT token created successfully, length: {len(temp_token)}")
            
        except Exception as jwt_error:
            logger.error(f"JWT encoding error: {str(jwt_error)}")
            logger.error(f"JWT error type: {type(jwt_error)}")
            import traceback
            logger.error(f"JWT traceback: {traceback.format_exc()}")
            return _create_popup_response("error", f"Authentication token creation failed: {str(jwt_error)}")

        response_data = {
            "needs_role_selection": True,
            "temp_token": temp_token,
            "user_info": {
                "email": user_info.email,
                "full_name": display_name_value,
                "profile_picture": picture_value
            },
            "is_new_user": True
        }

        logger.info("Returning role selection response for new user")
        return _create_popup_response("success", response_data)

    except HTTPException as he:
        logger.error(f"HTTPException in OAuth callback: {he.detail}")
        return _create_popup_response("error", str(he.detail))
    except Exception as e:
        logger.error(f"=== OAuth callback failed with unexpected error ===")
        logger.error(f"Error: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error args: {e.args}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return _create_popup_response("error", f"Authentication failed: {str(e)}")

@router.post("/complete-registration")
async def complete_oauth_registration(
    request: dict,
    db: Session = Depends(get_db)
):
    """Complete OAuth registration with role selection"""
    try:
        temp_token = request.get("temp_token")
        selected_role = request.get("role")
        
        if not temp_token or not selected_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing temp_token or role"
            )

        # Verify and decode temporary token
        import jwt
        try:
            payload = jwt.decode(
                temp_token, 
                os.getenv("JWT_SECRET", "your-secret-key"), 
                algorithms=["HS256"]
            )
            oauth_data = payload["oauth_data"]
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration session expired. Please try again."
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid registration token"
            )

        # Validate role
        if selected_role not in ["student", "teacher", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role selected"
            )

        auth_service = AuthService(db)

        # Generate unique username
        display_name = oauth_data["full_name"]
        suggested_username = display_name.replace(" ", "_").lower() if display_name else ""
        unique_username = _generate_unique_username(auth_service, suggested_username, oauth_data["email"])

        # Create new user with selected role
        role_mapping = {
            "student": UserRole.STUDENT,
            "teacher": UserRole.TEACHER,
            "admin": UserRole.ADMIN
        }

        user = User(
            username=unique_username,
            email=oauth_data["email"],
            full_name=oauth_data["full_name"],
            hashed_password="",  # OAuth users don't need passwords
            role=role_mapping[selected_role],
            status=UserStatus.ACTIVE,
            is_active=True,
            is_verified=True,
            email_verified_at=datetime.utcnow()
        )
        db.add(user)
        db.flush()

        # Create OAuth provider record
        oauth_provider = OAuthProvider(
            user_id=user.id,
            provider=oauth_data["provider"],
            provider_user_id=oauth_data["provider_user_id"]
        )
        db.add(oauth_provider)
        db.commit()

        logger.info(f"Created new OAuth user: {user.email} with role: {selected_role}")

        # Create tokens
        access_token, refresh_token = auth_service.create_tokens(user)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TKN_EXPIRE_MINUTES * 60,
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
                "is_verified": user.is_verified
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth registration completion failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )

def _create_popup_response(status: str, data):
    """Create HTML response that posts message to parent window for popup flow"""
    
    # Get the frontend URL from environment or use default
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    if status == "success":
        # Properly serialize the data to JSON
        json_data = json.dumps(data, default=str)
        
        script_content = f"""
        <script>
            console.log('OAuth success, posting message to parent...');
            console.log('Frontend URL:', '{FRONTEND_URL}');
            console.log('Window opener:', window.opener);
            
            try {{
                const data = {json_data};
                console.log('Data to send:', data);
                
                if (window.opener) {{
                    // Send message to the correct frontend origin
                    window.opener.postMessage({{
                        type: 'OAUTH_SUCCESS',
                        payload: data
                    }}, '{FRONTEND_URL}');
                    console.log('Message posted successfully to {FRONTEND_URL}');
                }} else {{
                    console.error('No opener window found');
                    alert('Please close this window and try again.');
                }}
                
                // Close window after a short delay
                setTimeout(function() {{
                    window.close();
                }}, 1000);
                
            }} catch (error) {{
                console.error('Error posting message:', error);
                alert('Authentication completed but failed to communicate with parent window. Please close this window and try again.');
            }}
        </script>
        """
    else:
        error_message = str(data).replace("'", "\\'").replace('"', '\\"')
        script_content = f"""
        <script>
            console.log('OAuth error, posting message to parent...');
            console.log('Frontend URL:', '{FRONTEND_URL}');
            
            try {{
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'OAUTH_ERROR',
                        error: '{error_message}'
                    }}, '{FRONTEND_URL}');
                    console.log('Error message posted successfully to {FRONTEND_URL}');
                }} else {{
                    console.error('No opener window found');
                    alert('Error: {error_message}');
                }}
                
                // Close window after a short delay
                setTimeout(function() {{
                    window.close();
                }}, 2000);
                
            }} catch (error) {{
                console.error('Error posting error message:', error);
                alert('Authentication failed: {error_message}');
            }}
        </script>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>OAuth Callback</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 50px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                margin: 0;
                height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }}
            .container {{
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
            }}
            .spinner {{
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top: 4px solid white;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            }}
            @keyframes spin {{
                0% {{ transform: rotate(0deg); }}
                100% {{ transform: rotate(360deg); }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>{'Authentication Successful!' if status == 'success' else 'Authentication Error'}</h2>
            {f'<div class="spinner"></div><p>Completing sign-in...</p>' if status == 'success' else f'<p>{data}</p><p>This window will close automatically.</p>'}
        </div>
        {script_content}
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)
