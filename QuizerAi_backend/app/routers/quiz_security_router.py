"""
Quiz Security API Router
Production-ready endpoints for geofencing and anti-cheating features
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.connection import get_db
from app.middleware.auth_middleware import get_current_user, require_teacher
from app.models.user_models import User
from app.services.geofencing_service import geofencing_service
from app.schemas.quiz_security_schemas import (
    QuizSecurityConfigCreate, QuizSecurityConfigUpdate, QuizSecurityConfigResponse,
    SecuritySessionCreate, SecuritySessionResponse, LocationUpdateRequest,
    ViolationReportRequest, ViolationResponse, TeacherLocationVerifyRequest,
    TeacherLocationVerifyResponse, SecurityAnalyticsResponse
)

router = APIRouter(
    prefix="/api/quiz-security",
    tags=["Quiz Security"],
    responses={404: {"description": "Not found"}}
)

# Initialize the service
@router.on_event("startup")
async def startup_event():
    await geofencing_service.initialize_redis()

# Security Configuration Endpoints (Teacher Only)
@router.post(
    "/config",
    response_model=QuizSecurityConfigResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Security Configuration",
    description="Create security configuration for a quiz (teachers only)"
)
async def create_security_config(
    config_data: QuizSecurityConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Create security configuration for a quiz"""
    # Verify teacher owns the quiz (implement based on your quiz ownership model)
    # This is a placeholder - implement according to your quiz model relationships
    
    try:
        security_config = await geofencing_service.create_security_config(db, config_data)
        return security_config
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create security configuration"
        )

@router.get(
    "/config/{quiz_id}",
    response_model=QuizSecurityConfigResponse,
    summary="Get Security Configuration",
    description="Get security configuration for a quiz"
)
async def get_security_config(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get security configuration for a quiz"""
    security_config = await geofencing_service.get_security_config(db, quiz_id)
    if not security_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Security configuration not found"
        )
    return security_config

@router.put(
    "/config/{quiz_id}",
    response_model=QuizSecurityConfigResponse,
    summary="Update Security Configuration",
    description="Update security configuration for a quiz (teachers only)"
)
async def update_security_config(
    quiz_id: int,
    update_data: QuizSecurityConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Update security configuration for a quiz"""
    security_config = await geofencing_service.get_security_config(db, quiz_id)
    if not security_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Security configuration not found"
        )
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(security_config, field, value)
    
    db.commit()
    db.refresh(security_config)
    
    return security_config

# Security Session Endpoints (Students)
@router.post(
    "/session/start",
    response_model=SecuritySessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start Security Session",
    description="Start a new security session for quiz attempt"
)
async def start_security_session(
    session_data: SecuritySessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new security session"""
    try:
        security_session = await geofencing_service.start_security_session(
            db, current_user.id, session_data
        )
        return security_session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start security session"
        )

@router.post(
    "/session/location",
    summary="Update Location",
    description="Update student location during quiz"
)
async def update_session_location(
    location_update: LocationUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update location for active security session"""
    try:
        success = await geofencing_service.update_session_location(db, location_update)
        return {"success": success, "message": "Location updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update location"
        )

@router.post(
    "/session/violation",
    response_model=ViolationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Report Violation",
    description="Report a security violation"
)
async def report_security_violation(
    violation_request: ViolationReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Report a security violation"""
    try:
        violation = await geofencing_service.report_violation(db, violation_request.session_id, violation_request)
        return violation
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to report violation"
        )

@router.post(
    "/session/{session_id}/terminate",
    summary="Terminate Session",
    description="Terminate a security session"
)
async def terminate_security_session(
    session_id: str,
    reason: str = Query(..., description="Reason for termination"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Terminate a security session"""
    try:
        success = await geofencing_service.terminate_session(db, session_id, reason)
        return {"success": success, "message": "Session terminated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to terminate session"
        )

@router.get(
    "/session/{session_id}",
    response_model=SecuritySessionResponse,
    summary="Get Security Session",
    description="Get security session details"
)
async def get_security_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get security session details"""
    from app.models.quiz_security import SecuritySession
    
    session = db.query(SecuritySession).filter(
        SecuritySession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Security session not found"
        )
    
    # Check if user has access to this session
    if session.user_id != current_user.id and current_user.role not in ['teacher', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return session

# Teacher Location Verification
@router.post(
    "/teacher/verify-location",
    response_model=TeacherLocationVerifyResponse,
    summary="Verify Teacher Location",
    description="Verify teacher location for assignments requiring teacher presence"
)
async def verify_teacher_location(
    location_data: TeacherLocationVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Verify teacher location"""
    try:
        verification = await geofencing_service.verify_teacher_location(
            db,
            current_user.id,
            location_data.teacher_latitude,
            location_data.teacher_longitude,
            location_data.assignment_id,
            location_data.quiz_id,
            location_data.verification_radius
        )
        return verification
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify teacher location"
        )

# Analytics and Reporting (Teachers/Admins)
@router.get(
    "/analytics",
    response_model=SecurityAnalyticsResponse,
    summary="Get Security Analytics",
    description="Get security analytics for dashboard"
)
async def get_security_analytics(
    quiz_id: Optional[int] = Query(None, description="Filter by quiz ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Get security analytics"""
    try:
        analytics = await geofencing_service.get_security_analytics(
            db, quiz_id, start_date, end_date
        )
        return analytics
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get security analytics"
        )

@router.get(
    "/violations/{session_id}",
    response_model=List[ViolationResponse],
    summary="Get Session Violations",
    description="Get all violations for a security session"
)
async def get_session_violations(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all violations for a security session"""
    from app.models.quiz_security import SecuritySession, SecurityViolation
    
    # Check if session exists and user has access
    session = db.query(SecuritySession).filter(
        SecuritySession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Security session not found"
        )
    
    if session.user_id != current_user.id and current_user.role not in ['teacher', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    violations = db.query(SecurityViolation).filter(
        SecurityViolation.security_session_id == session_id
    ).order_by(SecurityViolation.detected_at.desc()).all()
    
    return violations

# Health Check
@router.get(
    "/health",
    summary="Security Service Health Check",
    description="Check if security service is operational"
)
async def security_health_check():
    """Check security service health"""
    try:
        # Check Redis connection
        redis_status = "connected" if geofencing_service.redis_client else "disconnected"
        
        return {
            "status": "healthy",
            "redis_status": redis_status,
            "timestamp": datetime.utcnow(),
            "message": "Quiz security service is operational"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Security service health check failed: {str(e)}"
        )