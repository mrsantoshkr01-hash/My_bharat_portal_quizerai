from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
from pathlib import Path
import uuid
from datetime import datetime, timedelta

from app.database.feedback import FeedbackCreate, FeedbackResponse, FeedbackStats, FeedbackListResponse
from app.database.connection import get_db
from app.models.feedbackmodels import Feedback

router = APIRouter()

# Configure upload directory
UPLOAD_DIR = Path("uploads/feedback")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    feedback_data: FeedbackCreate,
    db: Session = Depends(get_db)
):
    """
    Create new feedback entry
    """
    try:
        # Create feedback entry in database
        db_feedback = Feedback(
            name=feedback_data.name,
            email=feedback_data.email,
            overall_rating=feedback_data.overall_rating,
            user_type=feedback_data.user_type,
            usage_frequency=feedback_data.usage_frequency,
            primary_use_case=feedback_data.primary_use_case,
            device_type=feedback_data.device_type,
            browser_type=feedback_data.browser_type,
            feedback_type=feedback_data.feedback_type,
            website_working=feedback_data.website_working,
            expectations=feedback_data.expectations,
            suggestions=feedback_data.suggestions,
            improvements=feedback_data.improvements,
            missing_features=feedback_data.missing_features,
            user_experience=feedback_data.user_experience,
            performance=feedback_data.performance,
            additional_comments=feedback_data.additional_comments,
            allow_contact=feedback_data.allow_contact,
            screenshots=feedback_data.screenshots,
            created_at=datetime.utcnow()
        )
        
        db.add(db_feedback)
        db.commit()
        db.refresh(db_feedback)
        
        return db_feedback
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create feedback: {str(e)}"
        )

@router.post("/upload-screenshots")
async def upload_screenshots(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload screenshots for feedback
    """
    try:
        uploaded_files = []
        
        for file in files:
            # Validate file type
            if not file.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File {file.filename} is not an image"
                )
            
            # Generate unique filename
            file_extension = Path(file.filename).suffix
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = UPLOAD_DIR / unique_filename
            
            # Save file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            uploaded_files.append(str(file_path))
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": f"Successfully uploaded {len(uploaded_files)} files",
                "file_paths": uploaded_files
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload files: {str(e)}"
        )

@router.get("/", response_model=FeedbackListResponse)
async def get_feedback_list(
    page: int = 1,
    page_size: int = 10,
    feedback_type: Optional[str] = None,
    rating_filter: Optional[int] = None,
    device_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get paginated list of feedback entries (Public - for admin dashboard)
    """
    try:
        # Build query with filters
        query = db.query(Feedback)
        
        if feedback_type:
            query = query.filter(Feedback.feedback_type == feedback_type)
        
        if rating_filter:
            query = query.filter(Feedback.overall_rating == rating_filter)
            
        if device_type:
            query = query.filter(Feedback.device_type == device_type)
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        feedback_items = query.order_by(Feedback.created_at.desc()).offset(offset).limit(page_size).all()
        
        total_pages = (total_count + page_size - 1) // page_size
        
        return FeedbackListResponse(
            feedback_items=feedback_items,
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve feedback: {str(e)}"
        )

@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback_by_id(
    feedback_id: int,
    db: Session = Depends(get_db)
):
    """
    Get specific feedback by ID (Public - for admin dashboard)
    """
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    return feedback

@router.get("/stats/overview", response_model=FeedbackStats)
async def get_feedback_stats(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get feedback statistics and analytics (Public - for admin dashboard)
    """
    try:
        # Date range for recent feedback
        date_threshold = datetime.utcnow() - timedelta(days=days)
        
        # Total feedback count
        total_feedback = db.query(Feedback).count()
        
        # Average rating
        avg_rating_result = db.query(Feedback.overall_rating).all()
        average_rating = sum(rating[0] for rating in avg_rating_result) / len(avg_rating_result) if avg_rating_result else 0
        
        # Feedback by type
        feedback_by_type = {}
        type_results = db.query(Feedback.feedback_type).all()
        for feedback_type in type_results:
            if feedback_type[0]:
                feedback_by_type[feedback_type[0]] = feedback_by_type.get(feedback_type[0], 0) + 1
        
        # Feedback by device
        feedback_by_device = {}
        device_results = db.query(Feedback.device_type).all()
        for device_type in device_results:
            if device_type[0]:
                feedback_by_device[device_type[0]] = feedback_by_device.get(device_type[0], 0) + 1
        
        # Recent feedback count
        recent_feedback_count = db.query(Feedback).filter(
            Feedback.created_at >= date_threshold
        ).count()
        
        return FeedbackStats(
            total_feedback=total_feedback,
            average_rating=round(average_rating, 2),
            feedback_by_type=feedback_by_type,
            feedback_by_device=feedback_by_device,
            recent_feedback_count=recent_feedback_count
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get feedback stats: {str(e)}"
        )

@router.delete("/{feedback_id}")
async def delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete feedback entry (Public - for admin dashboard)
    """
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    # Delete associated screenshot files
    if feedback.screenshots:
        for screenshot_path in feedback.screenshots:
            try:
                if os.path.exists(screenshot_path):
                    os.remove(screenshot_path)
            except Exception as e:
                print(f"Failed to delete screenshot {screenshot_path}: {e}")
    
    db.delete(feedback)
    db.commit()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "Feedback deleted successfully"}
    )

@router.put("/{feedback_id}/mark-resolved")
async def mark_feedback_resolved(
    feedback_id: int,
    db: Session = Depends(get_db)
):
    """
    Mark feedback as resolved (Public - for admin dashboard)
    """
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    feedback.is_resolved = True
    feedback.resolved_at = datetime.utcnow()
    feedback.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(feedback)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "Feedback marked as resolved"}
    )