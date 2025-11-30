# In this we are coding to what admin can access and how   the access is to filtering all the user , delete , ban the account  ,seeing stats
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database.connection import get_db
from app.middleware.auth_middleware import require_admin
from app.models.user_models import User, UserRole, UserStatus, LoginAttempt
from app.schemas.auth_schemas import UserResponse, UserCreate
from app.services.auth_services import AuthService
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter()    #prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)]

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all users with filtering and pagination"""
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)
    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%"))
        )
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get specific user by ID"""
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create new user (admin only)"""
    auth_service = AuthService(db)
    return auth_service.create_user(user_data)

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    status: UserStatus,
    db: Session = Depends(get_db)
):
    """Update user status"""
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.status = status
    user.is_active = status == UserStatus.ACTIVE
    db.commit()
    
    return {"message": f"User status updated to {status.value}"}

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: UserRole,
    db: Session = Depends(get_db)
):
    """Update user role"""
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = role
    db.commit()
    
    return {"message": f"User role updated to {role.value}"}

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete user (soft delete by deactivating)"""
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    user.status = UserStatus.INACTIVE
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.get("/stats")
async def get_user_stats(db: Session = Depends(get_db)):
    """Get user statistics"""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    role_stats = db.query(
        User.role, func.count(User.id)
    ).group_by(User.role).all()
    
    status_stats = db.query(
        User.status, func.count(User.id)
    ).group_by(User.status).all()
    
    # Recent login attempts
    recent_logins = db.query(LoginAttempt).filter(
        LoginAttempt.created_at >= datetime.utcnow() - timedelta(days=7)
    ).count()
    
    failed_logins = db.query(LoginAttempt).filter(
        LoginAttempt.created_at >= datetime.utcnow() - timedelta(days=7),
        LoginAttempt.is_successful == False
    ).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "role_distribution": {role.value: count for role, count in role_stats},
        "status_distribution": {status.value: count for status, count in status_stats},
        "recent_logins_7d": recent_logins,
        "failed_logins_7d": failed_logins
    }

@router.get("/login-attempts")
async def get_login_attempts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[int] = None,
    successful_only: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get login attempts with filtering"""
    query = db.query(LoginAttempt).order_by(desc(LoginAttempt.created_at))
    
    if user_id:
        query = query.filter(LoginAttempt.user_id == user_id)
    if successful_only is not None:
        query = query.filter(LoginAttempt.is_successful == successful_only)
    
    attempts = query.offset(skip).limit(limit).all()
    return attempts