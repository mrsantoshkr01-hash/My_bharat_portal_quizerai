# main.py
import logging
import asyncio
import time
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import uvicorn
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from pathlib import Path


# Load environment variables
load_dotenv()

# Import configurations and services
from app.config.redis_config import redis_service
from app.database.connection import engine, Base, get_db

# Import routers
from app.routers.quiz_router import router as quiz_router
from app.routers.api import router as api_router
from app.routes.admin_routes import router as admin_api_router
from app.routes.auth_routes import router as auth_api_router
from app.routes.oauth_routes import router as oauth_api_router
from app.routes.quiz_sessions import router as quiz_data_store_router
from app.routes.feedback_routes import router as feedback_router
from app.routers.ai_tutor_router import router as ai_tutor_router 
from app.routers.dashboard_analytics_router import router as analytics_router
from app.routers.classroom_routes import router as classroom_router
from app.routers.assignment_submission_router import router as assignment_submission_router
from app.routers.teacher_quiz_router import router as teacher_quiz_router
from app.routers.teacher_dashboard_router import router as teacher_dashboard_router 
from app.routers.notification_router import router as notification_router
# Add to imports
from app.routers.quiz_security_router import router as quiz_security_router

# Add to router includes (after existing routers)


# Import middleware and models
from app.middleware.auth_middleware import require_admin, require_teacher, require_student
from app.models.user_models import User
from app.models.feedbackmodels import Feedback
from app.database.quiz import (
    Quiz, Question, QuizSession, QuizAnswer, QuizAnalytics,
    QuestionPaperTemplate
)
# Add your classroom models import here
from app.models.classroom_models import (  # or wherever ClassroomQuizAssignment is
    ClassroomQuizAssignment, Classroom, ClassroomMembership
)
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Create upload directories
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "feedback").mkdir(exist_ok=True)
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting AI StudyHub QuizzerAI application...")
    
    try:
        # Initialize database tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")
        
        # Try to initialize Redis (optional for development)
        try:
            await redis_service.initialize()
            session_client = redis_service.session_client
            cache_client = redis_service.cache_client
            
            await session_client.ping()
            await cache_client.ping()
            logger.info("Redis connections initialized and verified")
            
        except Exception as redis_error:
            logger.warning(f"Redis not available: {redis_error}")
            logger.info("Continuing without Redis - some features may be limited")
            redis_service.session_client = None
            redis_service.cache_client = None
            redis_service.pubsub_client = None
        
        logger.info("Application startup completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize application: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI StudyHub QuizzerAI application...")
    
    try:
        if redis_service.session_client:
            await redis_service.session_client.close()
        if redis_service.cache_client:
            await redis_service.cache_client.close()
        if redis_service.pubsub_client:
            await redis_service.pubsub_client.close()
        
        logger.info("Application shutdown completed")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

# Create FastAPI application with unified configuration
app = FastAPI(
    title="AI StudyHub QuizzerAI",
    description="AI-powered quiz and study platform with real-time features, PDF processing, and comprehensive learning tools",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Middleware configuration
# CORS Middleware - Fix the trailing slash
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://www.quizerai.com" , # Removed trailing slash
        "https://quizerai.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TrustedHost Middleware - Fix the format
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=[
        "localhost",
        "localhost:8000",  # Add your FastAPI port
        "127.0.0.1",
        "127.0.0.1:8000",  # Add your FastAPI port
        "www.quizerai.com",  # No protocol, no trailing slash
        "quizerai.com" , # Also allow without www
        "bulkblast.in",
        "www.bulkblast.in"
    ]
)

# Combined middleware for request logging, timing, and Redis health
@app.middleware("http")
async def comprehensive_middleware(request: Request, call_next):
    """Combined middleware for logging, timing, and health checks"""
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url}")
    
    # Check Redis health for quiz-related endpoints
    if request.url.path.startswith("/api/quiz") and redis_service.session_client:
        try:
            await redis_service.session_client.ping()
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return JSONResponse(
                status_code=503,
                content={"detail": "Quiz service temporarily unavailable"}
            )
    
    response = await call_next(request)
    
    # Calculate and add process time
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log response time
    logger.info(f"Response: {response.status_code} - {process_time:.4f}s")
    
    return response

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    logger.error(f"HTTP {exc.status_code}: {exc.detail} - {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code}
    )

# @app.exception_handler(RequestValidationError)
# async def validation_exception_handler(request: Request, exc: RequestValidationError):
#     """Handle validation errors"""
#     logger.error(f"Validation error: {exc.errors()} - {request.url}")
#     return JSONResponse(
#         status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#         content={"detail": "Validation error", "errors": exc.errors()}
#     )


# In your app/main.py file, update your validation_exception_handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with proper serialization"""
    
    # Convert validation errors to a serializable format
    errors = []
    for error in exc.errors():
        # Create a clean error dict without any potential bytes objects
        clean_error = {
            "type": error.get("type", ""),
            "loc": [str(item) for item in error.get("loc", [])],  # Convert all to strings
            "msg": str(error.get("msg", "")),   # Ensure it's a string
            "input": str(error.get("input", "")) if error.get("input") is not None else None
        }
        errors.append(clean_error)
    
    # Create user-friendly error messages
    error_messages = []
    
    for error in errors:
        field_path = " -> ".join(error["loc"])
        error_type = error.get("type", "")
        error_msg = error.get("msg", "")
        
        if "username" in field_path or "email" in field_path:
            if error_type == "missing":
                error_messages.append("Email is required")
            elif error_type == "value_error.email":
                error_messages.append("Please enter a valid email address")
            elif "email" in error_msg.lower():
                error_messages.append("Please enter a valid email address")
                
        elif "password" in field_path:
            if error_type == "missing":
                error_messages.append("Password is required")
            elif "length" in error_msg.lower():
                error_messages.append("Password must be at least 6 characters long")
            elif "uppercase" in error_msg.lower():
                error_messages.append("Password must contain at least one uppercase letter")
            elif "number" in error_msg.lower():
                error_messages.append("Password must contain at least one number")
            elif "special" in error_msg.lower():
                error_messages.append("Password must contain at least one special character")
            else:
                error_messages.append("Password must contain at least one uppercase letter, one number, one special character, and be at least 6 characters long")
        else:
            error_messages.append(f"{field_path}: {error_msg}")
    
    
    
    error_response = {
        "success": False,
        "message": "Validation failed",
        "errors": error_messages,
        "detail": "Please check your input data and try again"
    }
    
    # Log the validation error for debugging
    logger.error(f"Validation error: {error_messages} - {request.url}")
    
    return JSONResponse(
        status_code=422,
        content=error_response
    )

@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors"""
    logger.error(f"Database error: {exc} - {request.url}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Database error occurred"}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc} - {request.url}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "status_code": 500}
    )
    
    
    
# Mount static files for uploaded content
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Include all routers with appropriate prefixes

app.include_router(quiz_router ,prefix="/quiz_router")  # Quiz functionality
app.include_router(api_router, prefix="/api")  # General API routes
app.include_router(admin_api_router, prefix="/admin_auth")  # Admin routes
app.include_router(auth_api_router, prefix="/auth_auth")  #  auth routes
app.include_router(oauth_api_router, prefix="/oauth")  # OAuth routes
app.include_router(quiz_data_store_router , prefix="/api/quiz-sessions")  # for quiz-sessions
app.include_router(feedback_router ,prefix ="/api/feedback")
app.include_router(ai_tutor_router , prefix="/ai_tutor")   #this is for the ai_tutor feature the prefix should be same as frontend
app.include_router(analytics_router)
app.include_router(classroom_router ,prefix="/api/classrooms")
app.include_router(assignment_submission_router , prefix="/api/assignments")
app.include_router(teacher_quiz_router , prefix="/api/teacher/quizzes")
app.include_router(teacher_dashboard_router , prefix="/api/dashboard")
app.include_router(notification_router , prefix="/api/notifications")
app.include_router(quiz_security_router)


@app.post("/api/processemails")
async def processemails():
    """Process emails sorted"""
    return {
        "message": "Process emails sorted",
    }


# Role-based access endpoints
@app.get("/admin-only")
async def admin_endpoint(user: User = Depends(require_admin)):
    """Admin only endpoint"""
    return {"message": "Admin access granted", "user": user.username}

@app.get("/teacher-access")
async def teacher_endpoint(user: User = Depends(require_teacher)):
    """Teacher or Admin access endpoint"""
    return {"message": "Teacher or Admin access", "user": user.username}

@app.get("/student-access")  
async def student_endpoint(user: User = Depends(require_student)):
    """Student access endpoint"""
    return {"message": "Student access granted", "user": user.username}

# Health check endpoints
@app.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy", 
        "service": "AI StudyHub QuizzerAI",
        "timestamp": time.time()
    }

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check including Redis and database"""
    health_status = {
        "status": "healthy",
        "service": "AI StudyHub QuizzerAI",
        "timestamp": time.time(),
        "components": {}
    }
    
    # Check Redis connections
    try:
        await redis_service.session_client.ping()
        health_status["components"]["redis_session"] = "healthy"
    except Exception as e:
        health_status["components"]["redis_session"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    try:
        await redis_service.cache_client.ping()
        health_status["components"]["redis_cache"] = "healthy"
    except Exception as e:
        health_status["components"]["redis_cache"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check database
    try:
        db = next(get_db())
        db.execute("SELECT 1")
        health_status["components"]["database"] = "healthy"
        db.close()
    except Exception as e:
        health_status["components"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status




@app.get("/health/celery")
async def celery_health():
    """Check Celery workers health"""
    from app.celery_app import celery_app
    
    try:
        # Check active workers
        inspect = celery_app.control.inspect()
        active_workers = inspect.active()
        
        return {
            "status": "healthy" if active_workers else "no_workers",
            "active_workers": list(active_workers.keys()) if active_workers else [],
            "timestamp": time.time()
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": time.time()
        }


# WebSocket endpoint for real-time features
@app.websocket("/ws/quiz/{session_id}")
async def websocket_quiz_endpoint(websocket, session_id: str):
    """WebSocket endpoint for real-time quiz updates"""
    try:
        await websocket.accept()
        logger.info(f"WebSocket connected for session: {session_id}")
        
        # Subscribe to quiz updates
        pubsub_client = redis_service.get_pubsub_client()
        pubsub = pubsub_client.pubsub()
        
        # Subscribe to session-specific updates
        await pubsub.subscribe(f"session_updates:{session_id}")
        
        async def listen_for_messages():
            """Listen for Redis pub/sub messages"""
            try:
                while True:
                    message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                    if message:
                        await websocket.send_json({
                            "type": "quiz_update",
                            "data": message["data"]
                        })
            except Exception as e:
                logger.error(f"Error in WebSocket message listener: {e}")
        
        async def handle_websocket_messages():
            """Handle incoming WebSocket messages"""
            try:
                while True:
                    data = await websocket.receive_json()
                    
                    # Handle different message types
                    if data.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                    elif data.get("type") == "timer_sync":
                        # Send current timer status
                        remaining_time = await redis_service.get_remaining_time(session_id)
                        await websocket.send_json({
                            "type": "timer_update",
                            "remaining_seconds": remaining_time or 0
                        })
                    
            except Exception as e:
                logger.error(f"Error handling WebSocket messages: {e}")
        
        # Run both listeners concurrently
        await asyncio.gather(
            listen_for_messages(),
            handle_websocket_messages()
        )
        
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")
    finally:
        try:
            await pubsub.unsubscribe(f"session_updates:{session_id}")
            await pubsub.close()
        except:
            pass
        logger.info(f"WebSocket disconnected for session: {session_id}")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with combined features"""
    return {
        "message": "Welcome to AI StudyHub QuizzerAI API",
        "description": "Best Luck for today Achievement",
        "version": "1.0.0",
        "features": [
            "AI-powered quiz generation",
            "Real-time quiz sessions",
            "Timer management", 
            "Role-based access control",
            "Analytics and reporting",
            "PDF processing and learning tools",
            "OAuth authentication",
            "Admin dashboard"
        ],
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "health": "/health",
            "detailed_health": "/health/detailed"
        }
    }
    

# Development server configuration
# if __name__ == "__main__":
#     uvicorn.run(
#         "main:app",
#         host="0.0.0.0",
#         port=8000,
#         reload=True,
#         log_level="info"
#     )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        workers=4,
        loop="uvloop",
        access_log=False,
        reload=False
    )