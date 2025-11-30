"""
Geofencing and Security Service
Production-ready service for handling all quiz security operations
"""

import asyncio
import json
import logging
import math
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from fastapi import HTTPException, status
import redis.asyncio as redis
from geopy.distance import geodesic

from app.models.quiz_security import (
    QuizSecurityConfig, SecuritySession, SecurityViolation,
    LocationLog, TeacherLocationVerification, ViolationType,
    SecuritySessionStatus, LocationAccuracy
)
from app.schemas.quiz_security_schemas import (
    QuizSecurityConfigCreate, LocationData, ViolationReportRequest,
    SecuritySessionCreate, LocationUpdateRequest
)
from app.config.redis_config import redis_service

logger = logging.getLogger(__name__)

class GeofencingService:
    """Service for handling all geofencing and security operations"""
    
    def __init__(self):
        self.redis_client = None
        self.violation_thresholds = {
            ViolationType.LOCATION_VIOLATION: {
                'low': 5,      # 5+ meters outside
                'medium': 25,  # 25+ meters outside  
                'high': 50,    # 50+ meters outside
                'critical': 100 # 100+ meters outside
            }
        }
    
    async def initialize_redis(self):
        """Initialize Redis connection for real-time tracking"""
        try:
            self.redis_client = redis_service.cache_client
            if not self.redis_client:
                logger.warning("Redis not available - some features will be limited")
        except Exception as e:
            logger.error(f"Failed to initialize Redis: {e}")

    # Security Configuration Management
    async def create_security_config(
        self, 
        db: Session, 
        config_data: QuizSecurityConfigCreate
    ) -> QuizSecurityConfig:
        """Create security configuration for a quiz"""
        try:
            # Validate geofencing requirements
            if config_data.geofencing_enabled:
                if config_data.allowed_latitude is None or config_data.allowed_longitude is None:
                    raise HTTPException(
                        status_code=400,
                        detail="Latitude and longitude required when geofencing is enabled"
                    )
            
            # Check if config already exists
            existing_config = db.query(QuizSecurityConfig).filter(
                QuizSecurityConfig.quiz_id == config_data.quiz_id
            ).first()
            
            if existing_config:
                raise HTTPException(
                    status_code=400,
                    detail="Security configuration already exists for this quiz"
                )
            
            # Create new configuration
            security_config = QuizSecurityConfig(**config_data.dict())
            db.add(security_config)
            db.commit()
            db.refresh(security_config)
            
            logger.info(f"Created security config for quiz {config_data.quiz_id}")
            return security_config
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create security config: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to create security configuration"
            )

    async def get_security_config(
        self, 
        db: Session, 
        quiz_id: int
    ) -> Optional[QuizSecurityConfig]:
        """Get security configuration for a quiz"""
        return db.query(QuizSecurityConfig).filter(
            QuizSecurityConfig.quiz_id == quiz_id
        ).first()

    # Security Session Management
    async def start_security_session(
        self,
        db: Session,
        user_id: int,
        session_data: SecuritySessionCreate
    ) -> SecuritySession:
        """Start a new security session for quiz attempt"""
        try:
            # Get security configuration
            security_config = await self.get_security_config(db, session_data.quiz_id)
            if not security_config:
                raise HTTPException(
                    status_code=404,
                    detail="Security configuration not found for this quiz"
                )
            
            # Check for existing active sessions (prevent multiple device access)
            if security_config.block_multiple_devices:
                existing_session = db.query(SecuritySession).filter(
                    and_(
                        SecuritySession.user_id == user_id,
                        SecuritySession.security_config_id == security_config.id,
                        SecuritySession.status == SecuritySessionStatus.ACTIVE
                    )
                ).first()
                
                if existing_session:
                    # Terminate old session
                    await self.terminate_session(
                        db, existing_session.id, "multiple_device_detected"
                    )
            
            # Validate initial location if geofencing is enabled
            location_verified = True
            if security_config.geofencing_enabled and session_data.initial_location:
                location_verified = self.verify_location(
                    session_data.initial_location.get('latitude'),
                    session_data.initial_location.get('longitude'),
                    security_config.allowed_latitude,
                    security_config.allowed_longitude,
                    security_config.allowed_radius
                )
            
            # Create security session
            session_id = str(uuid.uuid4())
            security_session = SecuritySession(
                id=str(uuid.uuid4()),
                user_id=user_id,
                quiz_id=session_data.quiz_id,
                assignment_id=session_data.assignment_id,
                security_config_id=security_config.id,  # THIS WAS MISSING!
                device_fingerprint=session_data.device_fingerprint,
                ip_address=session_data.ip_address,
                user_agent=session_data.user_agent,
                initial_location=session_data.initial_location,
                status=SecuritySessionStatus.ACTIVE,
                total_violations=0,
                warnings_issued=0,
                teacher_location_verified=False
            )
            
            db.add(security_session)
            db.commit()
            db.refresh(security_session)
            
            # Cache session data in Redis for real-time access
            if self.redis_client:
                await self.cache_session_data(session_id, {
                    'user_id': user_id,
                    'security_config_id': security_config.id,
                    'status': SecuritySessionStatus.ACTIVE.value,
                    'start_time': datetime.utcnow().isoformat()
                })
            
            # Log initial location if provided
            if session_data.initial_location:
                await self.log_location_update(
                    db, session_id, LocationData(**session_data.initial_location)
                )
            
            # Warn if location not verified initially
            if security_config.geofencing_enabled and not location_verified:
                await self.report_violation(
                    db,
                    session_id,
                    ViolationReportRequest(
                        session_id=session_id,
                        violation_type=ViolationType.LOCATION_VIOLATION,
                        description="Initial location outside allowed area",
                        severity="high"
                    )
                )
            
            logger.info(f"Started security session {session_id} for user {user_id}")
            return security_session
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to start security session: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to start security session"
            )

    async def update_session_location(
        self,
        db: Session,
        update_request: LocationUpdateRequest
    ) -> bool:
        """Update location for an active security session"""
        try:
            # Get session
            session = db.query(SecuritySession).filter(
                SecuritySession.id == update_request.session_id
            ).first()
            
            if not session:
                raise HTTPException(
                    status_code=404,
                    detail="Security session not found"
                )
            
            if session.status != SecuritySessionStatus.ACTIVE:
                raise HTTPException(
                    status_code=400,
                    detail="Session is not active"
                )
            
            # Update session activity
            session.last_activity = datetime.utcnow()
            session.current_location = update_request.location.dict()
            
            # Log location update
            await self.log_location_update(db, session.id, update_request.location)
            
            # Check location compliance if geofencing is enabled
            if session.security_config.geofencing_enabled:
                compliance = await self.check_location_compliance(
                    db, session, update_request.location
                )
                
                if not compliance['compliant']:
                    # Report location violation
                    await self.report_violation(
                        db,
                        session.id,
                        ViolationReportRequest(
                            session_id=session.id,
                            violation_type=ViolationType.LOCATION_VIOLATION,
                            description=f"Student is {compliance['distance']:.1f}m outside allowed area",
                            violation_data={
                                'distance_from_center': compliance['distance'],
                                'allowed_radius': session.security_config.allowed_radius,
                                'current_location': update_request.location.dict(),
                                'allowed_location': {
                                    'latitude': session.security_config.allowed_latitude,
                                    'longitude': session.security_config.allowed_longitude
                                }
                            },
                            student_location=update_request.location.dict(),
                            severity=self.determine_violation_severity(
                                ViolationType.LOCATION_VIOLATION, 
                                compliance['distance']
                            )
                        )
                    )
                    
                    # Auto-terminate if critical violation
                    if compliance['distance'] > session.security_config.allowed_radius * 2:
                        await self.terminate_session(
                            db, session.id, "critical_location_violation"
                        )
                        return False
            
            # Update Redis cache
            if self.redis_client:
                await self.update_cached_session(session.id, {
                    'last_activity': datetime.utcnow().isoformat(),
                    'current_location': update_request.location.dict()
                })
            
            db.commit()
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update session location: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to update session location"
            )

    async def report_violation(
        self,
        db: Session,
        session_id: str,
        violation_request: ViolationReportRequest
    ) -> SecurityViolation:
        """Report a security violation"""
        try:
            # Get session
            session = db.query(SecuritySession).filter(
                SecuritySession.id == session_id
            ).first()
            
            if not session:
                raise HTTPException(
                    status_code=404,
                    detail="Security session not found"
                )
            
            # Create violation record
            violation = SecurityViolation(
                security_session_id=session_id,
                violation_type=violation_request.violation_type,
                severity=violation_request.severity,
                description=violation_request.description,
                violation_data=violation_request.violation_data,
                student_location=violation_request.student_location
            )
            
            # Add allowed location context for location violations
            if violation_request.violation_type == ViolationType.LOCATION_VIOLATION:
                violation.allowed_location = {
                    'latitude': session.security_config.allowed_latitude,
                    'longitude': session.security_config.allowed_longitude,
                    'radius': session.security_config.allowed_radius
                }
                
                # Calculate distance if student location provided
                if violation_request.student_location:
                    distance = self.calculate_distance(
                        violation_request.student_location.get('latitude'),
                        violation_request.student_location.get('longitude'),
                        session.security_config.allowed_latitude,
                        session.security_config.allowed_longitude
                    )
                    violation.distance_from_allowed = distance
            
            # Determine action based on violation count and severity
            action_taken = await self.determine_violation_action(db, session, violation)
            violation.action_taken = action_taken
            
            # Update session violation counts
            session.total_violations += 1
            if violation.action_taken == "warning":
                session.warnings_issued += 1
            
            # Update violations by type
            violations_by_type = session.violations_by_type or {}
            violation_type_str = violation.violation_type.value
            violations_by_type[violation_type_str] = violations_by_type.get(violation_type_str, 0) + 1
            session.violations_by_type = violations_by_type
            
            db.add(violation)
            db.commit()
            db.refresh(violation)
            
            # Send real-time notification
            if self.redis_client:
                await self.send_violation_notification(session_id, violation)
            
            logger.warning(
                f"Violation reported: {violation.violation_type.value} "
                f"for session {session_id}, action: {action_taken}"
            )
            
            return violation
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to report violation: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to report violation"
            )

    async def terminate_session(
        self,
        db: Session,
        session_id: str,
        reason: str
    ) -> bool:
        """Terminate a security session"""
        try:
            session = db.query(SecuritySession).filter(
                SecuritySession.id == session_id
            ).first()
            
            if not session:
                raise HTTPException(
                    status_code=404,
                    detail="Security session not found"
                )
            
            # Update session status
            session.status = SecuritySessionStatus.TERMINATED
            session.end_time = datetime.utcnow()
            
            # Create termination violation record
            termination_violation = SecurityViolation(
                security_session_id=session_id,
                violation_type=ViolationType.MULTIPLE_LOGIN if "multiple" in reason else ViolationType.LOCATION_VIOLATION,
                severity="critical",
                description=f"Session terminated: {reason}",
                action_taken="termination"
            )
            
            db.add(termination_violation)
            db.commit()
            
            # Clear Redis cache
            if self.redis_client:
                await self.clear_cached_session(session_id)
            
            logger.info(f"Terminated security session {session_id}: {reason}")
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to terminate session: {e}")
            return False

    # Location and Distance Calculations
    def verify_location(
        self,
        student_lat: float,
        student_lng: float,
        allowed_lat: float,
        allowed_lng: float,
        allowed_radius: int
    ) -> bool:
        """Verify if student location is within allowed area"""
        if not all([student_lat, student_lng, allowed_lat, allowed_lng]):
            return False
        
        distance = self.calculate_distance(
            student_lat, student_lng, allowed_lat, allowed_lng
        )
        
        return distance <= allowed_radius

    def calculate_distance(
        self,
        lat1: float, lng1: float,
        lat2: float, lng2: float
    ) -> float:
        """Calculate distance between two points in meters"""
        try:
            point1 = (lat1, lng1)
            point2 = (lat2, lng2)
            return geodesic(point1, point2).meters
        except Exception as e:
            logger.error(f"Distance calculation error: {e}")
            return float('inf')

    def determine_location_accuracy(self, location_data: Optional[Dict]) -> LocationAccuracy:
        """Determine location accuracy level"""
        if not location_data or 'accuracy' not in location_data:
            return LocationAccuracy.LOW
        
        accuracy = location_data['accuracy']
        if accuracy <= 10:
            return LocationAccuracy.HIGH
        elif accuracy <= 50:
            return LocationAccuracy.MEDIUM
        else:
            return LocationAccuracy.LOW

    async def check_location_compliance(
        self,
        db: Session,
        session: SecuritySession,
        location: LocationData
    ) -> Dict[str, Any]:
        """Check if current location complies with geofencing rules"""
        if not session.security_config.geofencing_enabled:
            return {'compliant': True, 'distance': 0}
        
        distance = self.calculate_distance(
            location.latitude,
            location.longitude,
            session.security_config.allowed_latitude,
            session.security_config.allowed_longitude
        )
        
        is_compliant = distance <= session.security_config.allowed_radius
        
        return {
            'compliant': is_compliant,
            'distance': distance,
            'allowed_radius': session.security_config.allowed_radius,
            'grace_period_active': False  # Could implement grace period logic here
        }

    def determine_violation_severity(
        self,
        violation_type: ViolationType,
        distance: Optional[float] = None
    ) -> str:
        """Determine severity of a violation"""
        if violation_type == ViolationType.LOCATION_VIOLATION and distance:
            thresholds = self.violation_thresholds[violation_type]
            if distance >= thresholds['critical']:
                return 'critical'
            elif distance >= thresholds['high']:
                return 'high'
            elif distance >= thresholds['medium']:
                return 'medium'
            else:
                return 'low'
        
        # Default severities for other violation types
        severity_map = {
            ViolationType.TAB_CHANGE: 'medium',
            ViolationType.WINDOW_BLUR: 'low',
            ViolationType.MULTIPLE_LOGIN: 'critical',
            ViolationType.COPY_PASTE: 'medium',
            ViolationType.RIGHT_CLICK: 'low',
            ViolationType.KEYBOARD_SHORTCUT: 'medium',
            ViolationType.DEVICE_CHANGE: 'high',
            ViolationType.NETWORK_CHANGE: 'medium'
        }
        
        return severity_map.get(violation_type, 'medium')

    async def determine_violation_action(
        self,
        db: Session,
        session: SecuritySession,
        violation: SecurityViolation
    ) -> str:
        """Determine what action to take for a violation"""
        # Critical violations always result in termination
        if violation.severity == 'critical':
            await self.terminate_session(db, session.id, f"critical_violation_{violation.violation_type.value}")
            return 'termination'
        
        # Check if warnings are exceeded
        if session.warnings_issued >= session.security_config.violation_warnings_allowed:
            if session.security_config.auto_submit_on_violation:
                await self.terminate_session(db, session.id, "warnings_exceeded")
                return 'termination'
            else:
                session.status = SecuritySessionStatus.SUSPENDED
                return 'suspension'
        
        # Issue warning for first few violations
        return 'warning'

    # Location Logging
    async def log_location_update(
        self,
        db: Session,
        session_id: str,
        location_data: LocationData
    ) -> LocationLog:
        """Log a location update"""
        try:
            # Get session to check compliance
            session = db.query(SecuritySession).filter(
                SecuritySession.id == session_id
            ).first()
            
            if not session:
                return None
            
            # Calculate compliance
            is_within_bounds = True
            distance_from_center = 0.0
            
            if session.security_config.geofencing_enabled:
                distance_from_center = self.calculate_distance(
                    location_data.latitude,
                    location_data.longitude,
                    session.security_config.allowed_latitude,
                    session.security_config.allowed_longitude
                )
                is_within_bounds = distance_from_center <= session.security_config.allowed_radius
            
            # Create location log
            location_log = LocationLog(
                security_session_id=session_id,
                latitude=location_data.latitude,
                longitude=location_data.longitude,
                accuracy=location_data.accuracy,
                altitude=location_data.altitude,
                speed=location_data.speed,
                heading=location_data.heading,
                is_within_bounds=is_within_bounds,
                distance_from_center=distance_from_center,
                location_source=location_data.source,
                client_timestamp=location_data.timestamp
            )
            
            db.add(location_log)
            db.commit()
            
            return location_log
            
        except Exception as e:
            logger.error(f"Failed to log location update: {e}")
            return None

    # Redis Caching Functions
    async def cache_session_data(self, session_id: str, data: Dict):
        """Cache session data in Redis"""
        if not self.redis_client:
            return
        
        try:
            await self.redis_client.setex(
                f"security_session:{session_id}",
                3600,  # 1 hour TTL
                json.dumps(data)
            )
        except Exception as e:
            logger.error(f"Failed to cache session data: {e}")

    async def update_cached_session(self, session_id: str, updates: Dict):
        """Update cached session data"""
        if not self.redis_client:
            return
        
        try:
            # Get existing data
            cached_data = await self.redis_client.get(f"security_session:{session_id}")
            if cached_data:
                data = json.loads(cached_data)
                data.update(updates)
                await self.cache_session_data(session_id, data)
        except Exception as e:
            logger.error(f"Failed to update cached session: {e}")

    async def clear_cached_session(self, session_id: str):
        """Clear cached session data"""
        if not self.redis_client:
            return
        
        try:
            await self.redis_client.delete(f"security_session:{session_id}")
        except Exception as e:
            logger.error(f"Failed to clear cached session: {e}")

    async def send_violation_notification(self, session_id: str, violation: SecurityViolation):
        """Send real-time violation notification"""
        if not self.redis_client:
            return
        
        try:
            notification_data = {
                'type': 'security_violation',
                'session_id': session_id,
                'violation_type': violation.violation_type.value,
                'severity': violation.severity,
                'description': violation.description,
                'action_taken': violation.action_taken,
                'timestamp': violation.detected_at.isoformat()
            }
            
            # Publish to session-specific channel
            await self.redis_client.publish(
                f"session_violations:{session_id}",
                json.dumps(notification_data)
            )
            
            # Publish to teacher dashboard channel
            await self.redis_client.publish(
                f"teacher_violations",
                json.dumps(notification_data)
            )
            
        except Exception as e:
            logger.error(f"Failed to send violation notification: {e}")

    # Teacher Location Verification
    # Update the verify_teacher_location method
    async def verify_teacher_location(
        self,
        db: Session,
        teacher_id: int,
        teacher_lat: float,
        teacher_lng: float,
        assignment_id: Optional[int] = None,  # Now refers to classroom_quiz_assignments
        quiz_id: Optional[int] = None,
        verification_radius: int = 50
    ) -> TeacherLocationVerification:
        """Verify teacher location for assignments requiring teacher presence"""
        try:
            verification = TeacherLocationVerification(
                teacher_id=teacher_id,
                assignment_id=assignment_id,  # classroom_quiz_assignments.id
                quiz_id=quiz_id,
                teacher_latitude=teacher_lat,
                teacher_longitude=teacher_lng,
                verification_radius=verification_radius,
                is_verified=True,
                verification_expires_at=datetime.utcnow() + timedelta(hours=2)
            )
            
            db.add(verification)
            db.commit()
            db.refresh(verification)
            
            # Cache teacher location for quick access
            if self.redis_client:
                cache_key = f"teacher_location:{teacher_id}"
                if assignment_id:
                    cache_key += f":classroom_assignment_{assignment_id}"  # Updated cache key
                elif quiz_id:
                    cache_key += f":quiz_{quiz_id}"
                
                await self.redis_client.setex(
                    cache_key,
                    7200,  # 2 hours
                    json.dumps({
                        'latitude': teacher_lat,
                        'longitude': teacher_lng,
                        'radius': verification_radius,
                        'verified_at': datetime.utcnow().isoformat()
                    })
                )
            
            logger.info(f"Teacher {teacher_id} location verified for classroom assignment/quiz")
            return verification
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to verify teacher location: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to verify teacher location"
            )

    # Analytics and Reporting
    async def get_security_analytics(
        self,
        db: Session,
        quiz_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get security analytics for dashboard"""
        try:
            base_query = db.query(SecuritySession)
            
            if quiz_id:
                base_query = base_query.join(QuizSecurityConfig).filter(
                    QuizSecurityConfig.quiz_id == quiz_id
                )
            
            if start_date:
                base_query = base_query.filter(SecuritySession.start_time >= start_date)
            if end_date:
                base_query = base_query.filter(SecuritySession.start_time <= end_date)
            
            # Total sessions
            total_sessions = base_query.count()
            
            # Active sessions
            active_sessions = base_query.filter(
                SecuritySession.status == SecuritySessionStatus.ACTIVE
            ).count()
            
            # Violations analysis
            violations_query = db.query(SecurityViolation).join(SecuritySession)
            if quiz_id:
                violations_query = violations_query.join(QuizSecurityConfig).filter(
                    QuizSecurityConfig.quiz_id == quiz_id
                )
            
            total_violations = violations_query.count()
            
            # Violations by type
            violations_by_type = {}
            for violation_type in ViolationType:
                count = violations_query.filter(
                    SecurityViolation.violation_type == violation_type
                ).count()
                violations_by_type[violation_type.value] = count
            
            # Compliance rate
            compliant_sessions = base_query.filter(
                SecuritySession.total_violations == 0
            ).count()
            compliance_rate = (compliant_sessions / total_sessions * 100) if total_sessions > 0 else 100
            
            # Average session duration
            completed_sessions = base_query.filter(
                SecuritySession.end_time.isnot(None)
            ).all()
            
            avg_duration = 0
            if completed_sessions:
                durations = [
                    (s.end_time - s.start_time).total_seconds() / 60
                    for s in completed_sessions
                ]
                avg_duration = sum(durations) / len(durations)
            
            return {
                'total_sessions': total_sessions,
                'active_sessions': active_sessions,
                'total_violations': total_violations,
                'violations_by_type': violations_by_type,
                'compliance_rate': round(compliance_rate, 2),
                'average_session_duration': round(avg_duration, 2)
            }
            
        except Exception as e:
            logger.error(f"Failed to get security analytics: {e}")
            return {
                'total_sessions': 0,
                'active_sessions': 0,
                'total_violations': 0,
                'violations_by_type': {},
                'compliance_rate': 0,
                'average_session_duration': 0
            }

# Create global service instance
geofencing_service = GeofencingService()