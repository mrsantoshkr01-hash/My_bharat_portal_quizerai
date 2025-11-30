from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from fastapi import HTTPException, status
from datetime import datetime
import secrets
import string

from app.models.classroom_models import (
    Classroom, ClassroomMembership, ClassroomQuizAssignment, 
    ClassroomQuizSubmission, ClassroomStatus, MembershipStatus,
    AssignmentStatus 
)
from app.models.user_models import User, UserRole
from app.database.quiz import Quiz  # Fixed import
from app.schemas.classroom_schemas import ClassroomCreate, ClassroomAssignmentCreate, ClassroomUpdate , ClassroomResponse


class ClassroomService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_classroom(self, teacher_id: int, classroom_data: ClassroomCreate) -> Classroom:
        """Create a new classroom"""
        # Generate unique join code
        join_code = self._generate_unique_join_code()
        
        classroom = Classroom(
            name=classroom_data.name,
            subject=classroom_data.subject,
            description=classroom_data.description,
            teacher_id=teacher_id,
            join_code=join_code,
            allow_late_submission=classroom_data.allow_late_submission,
            auto_grade=classroom_data.auto_grade,
            show_results_to_students=classroom_data.show_results_to_students
        )
        
        self.db.add(classroom)
        self.db.commit()
        self.db.refresh(classroom)
        
        return classroom
    
    def get_teacher_classrooms(self, teacher_id: int, status_filter: Optional[str] = None, 
                             skip: int = 0, limit: int = 100) -> List[Classroom]:
        """Get classrooms created by teacher"""
        query = self.db.query(Classroom).filter(Classroom.teacher_id == teacher_id)
        
        if status_filter:
            query = query.filter(Classroom.status == status_filter)
        
        return query.order_by(desc(Classroom.created_at)).offset(skip).limit(limit).all()
    
    def get_classroom_by_id(self, classroom_id: int, user_id: int) -> Classroom:
        """Get classroom by ID with access control"""
        classroom = self.db.query(Classroom).filter(Classroom.id == classroom_id).first()
        
        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found"
            )
        
        # Check if user has access (teacher or enrolled student)
        if classroom.teacher_id == user_id:
            return classroom
        
        # Check if student is enrolled
        membership = self.db.query(ClassroomMembership).filter(
            and_(
                ClassroomMembership.classroom_id == classroom_id,
                ClassroomMembership.student_id == user_id,
                ClassroomMembership.status == MembershipStatus.ACTIVE
            )
        ).first()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return classroom
    
    def join_classroom(self, student_id: int, join_code: str) -> ClassroomMembership:
        """Student joins classroom using join code"""
        # Find classroom by join code
        classroom = self.db.query(Classroom).filter(
            and_(
                Classroom.join_code == join_code.upper(),
                Classroom.status == ClassroomStatus.ACTIVE
            )
        ).first()
        
        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid join code or classroom not active"
            )
        
        # Check if student is already a member
        existing_membership = self.db.query(ClassroomMembership).filter(
            and_(
                ClassroomMembership.classroom_id == classroom.id,
                ClassroomMembership.student_id == student_id,
                ClassroomMembership.status == MembershipStatus.ACTIVE
            )
        ).first()
        
        if existing_membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already a member of this classroom"
            )
        
        # Create membership
        membership = ClassroomMembership(
            classroom_id=classroom.id,
            student_id=student_id,
            status=MembershipStatus.ACTIVE
        )
        
        self.db.add(membership)
        
        # Update classroom student count
        classroom.student_count = self.db.query(ClassroomMembership).filter(
            and_(
                ClassroomMembership.classroom_id == classroom.id,
                ClassroomMembership.status == MembershipStatus.ACTIVE
            )
        ).count() + 1
        
        self.db.commit()
        self.db.refresh(membership)
        
        return membership
    def get_student_classrooms(self, student_id: int) -> List[Dict]:
        """Get classrooms student is enrolled in"""
        memberships = self.db.query(ClassroomMembership).filter(
            and_(
                ClassroomMembership.student_id == student_id,
                ClassroomMembership.status == MembershipStatus.ACTIVE
            )
        ).all()
    
        result = []
        for membership in memberships:
            classroom = membership.classroom
        
            # Count total assignments
            total_assignments = self.db.query(ClassroomQuizAssignment).filter(
                and_(
                    ClassroomQuizAssignment.classroom_id == classroom.id,
                    ClassroomQuizAssignment.status == AssignmentStatus.ACTIVE
                )
            ).count()
        
            # Get submitted assignments count
            submitted_assignments = self.db.query(ClassroomQuizSubmission).filter(
                ClassroomQuizSubmission.student_id == student_id
            ).join(ClassroomQuizAssignment).filter(
                ClassroomQuizAssignment.classroom_id == classroom.id
            ).count()
        
            result.append({
                "classroom": ClassroomResponse.model_validate(classroom, from_attributes=True),
                "joined_at": membership.joined_at,  # Extract from membership
                "membership_status": membership.status.value,  # Extract from membership
                "teacher_name": classroom.teacher.full_name,
                "total_assignments": total_assignments,
                "completed_assignments": submitted_assignments,
                "pending_assignments": max(0, total_assignments - submitted_assignments),
                "average_score": membership.average_score or 0.0,
                "last_activity": membership.last_activity
            })
    
        return result
    
    def get_classroom_analytics(self, teacher_id: int, classroom_id: int) -> Dict:
        """Get detailed analytics for a classroom"""
        # Verify teacher owns classroom
        classroom = self.db.query(Classroom).filter(
            and_(
                Classroom.id == classroom_id,
                Classroom.teacher_id == teacher_id
            )
        ).first()
        
        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found"
            )
        
        # Get basic stats
        total_students = self.db.query(ClassroomMembership).filter(
            and_(
                ClassroomMembership.classroom_id == classroom_id,
                ClassroomMembership.status == MembershipStatus.ACTIVE
            )
        ).count()
        
        total_assignments = self.db.query(ClassroomQuizAssignment).filter(
            ClassroomQuizAssignment.classroom_id == classroom_id
        ).count()
        
        total_submissions = self.db.query(ClassroomQuizSubmission).join(
            ClassroomQuizAssignment
        ).filter(
            ClassroomQuizAssignment.classroom_id == classroom_id
        ).count()
        
        # Get average score
        avg_score_result = self.db.query(
            func.avg(ClassroomQuizSubmission.score_percentage)
        ).join(ClassroomQuizAssignment).filter(
            ClassroomQuizAssignment.classroom_id == classroom_id
        ).scalar()
        
        average_class_score = round(avg_score_result or 0, 1)
        
        # Get recent assignments
        assignments = self.db.query(ClassroomQuizAssignment).filter(
            ClassroomQuizAssignment.classroom_id == classroom_id
        ).order_by(desc(ClassroomQuizAssignment.created_at)).limit(5).all()
        
        assignments_data = []
        for assignment in assignments:
            assignments_data.append({
                "id": assignment.id,
                "title": assignment.title,
                "due_date": assignment.due_date,
                "total_students": total_students,
                "completed_count": assignment.completed_count or 0,
                "average_score": round(assignment.average_score or 0, 1)
            })
        
        return {
            "classroom": classroom,
            "total_students": total_students,
            "total_assignments": total_assignments,
            "total_submissions": total_submissions,
            "average_class_score": average_class_score,
            "assignments": assignments_data
        }
    
    def get_classroom_students(self, teacher_id: int, classroom_id: int) -> List[Dict]:
        """Get students in classroom with their performance"""
        # Verify teacher owns classroom
        classroom = self.db.query(Classroom).filter(
            and_(
                Classroom.id == classroom_id,
                Classroom.teacher_id == teacher_id
            )
        ).first()
    
        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found"
            )
    
        # Get all students with their memberships in one query
        students_query = self.db.query(
            ClassroomMembership,
            User
        ).join(
            User, ClassroomMembership.student_id == User.id
        ).filter(
            and_(
                ClassroomMembership.classroom_id == classroom_id,
                ClassroomMembership.status == MembershipStatus.ACTIVE
            )
        ).all()
    
        result = []
        for membership, student in students_query:
            # Get student's submissions count and average
            submissions = self.db.query(ClassroomQuizSubmission).join(
                ClassroomQuizAssignment
            ).filter(
                and_(
                    ClassroomQuizAssignment.classroom_id == classroom_id,
                    ClassroomQuizSubmission.student_id == student.id
                )
            ).all()
        
            total_submissions = len(submissions)
            
            # Calculate average score safely
            scores = [s.score_percentage for s in submissions if s.score_percentage is not None]
            avg_score = sum(scores) / len(scores) if scores else 0.0
        
            result.append({
                "student": {
                    "id": student.id,
                    "full_name": student.full_name,
                    "email": student.email
                },
                "joined_at": membership.joined_at,
                "total_assignments": membership.total_assignments,
                "completed_assignments": total_submissions,
                "average_score": round(avg_score, 1),
                "last_activity": membership.last_activity
            })
    
        return result
    
    def get_classroom_assignments(self, classroom_id: int, user_id: int) -> List[ClassroomQuizAssignment]:
        """Get assignments for classroom"""
        # Verify access
        self.get_classroom_by_id(classroom_id, user_id)
        
        return self.db.query(ClassroomQuizAssignment).filter(
            ClassroomQuizAssignment.classroom_id == classroom_id
        ).order_by(desc(ClassroomQuizAssignment.created_at)).all()
    
    def assign_quiz_to_classroom(self, teacher_id: int, assignment_data: ClassroomAssignmentCreate) -> ClassroomQuizAssignment:
        """Assign a quiz to classroom"""
        # Verify teacher owns classroom
        classroom = self.db.query(Classroom).filter(
            and_(
                Classroom.id == assignment_data.classroom_id,
                Classroom.teacher_id == teacher_id
            )
        ).first()
        
        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found"
            )
        
        # Verify quiz exists
        quiz = self.db.query(Quiz).filter(
            and_(
                Quiz.id == assignment_data.quiz_id,
                Quiz.creator_id == teacher_id
            )
        ).first()
        
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found"
            )
        
        # Get student count
        student_count = self.db.query(ClassroomMembership).filter(
            and_(
                ClassroomMembership.classroom_id == assignment_data.classroom_id,
                ClassroomMembership.status == MembershipStatus.ACTIVE
            )
        ).count()
        
        assignment = ClassroomQuizAssignment(
            classroom_id=assignment_data.classroom_id,
            quiz_id=assignment_data.quiz_id,
            title=assignment_data.title,
            description=assignment_data.description,
            instructions=assignment_data.instructions,
            due_date=assignment_data.due_date,
            time_limit_minutes=assignment_data.time_limit_minutes,
            max_attempts=assignment_data.max_attempts or 1,
            shuffle_questions=assignment_data.shuffle_questions,
            show_results_immediately=assignment_data.show_results_immediately,
            allow_late_submission=assignment_data.allow_late_submission,
            negative_marking=assignment_data.negative_marking,  # ADD THIS LINE
            total_students=student_count,
            geofencing_enabled=assignment_data.geofencing_enabled,
            allowed_latitude=assignment_data.allowed_latitude,
            allowed_longitude=assignment_data.allowed_longitude,
            allowed_radius=assignment_data.allowed_radius,
            require_teacher_location=assignment_data.require_teacher_location
            
            
            
            # # adding for geofencing 
            # geofencing_enabled=getattr(assignment_data, 'geofencing_enabled', False),
            # allowed_latitude=getattr(assignment_data, 'allowed_latitude', None),
            # allowed_longitude=getattr(assignment_data, 'allowed_longitude', None),
            # allowed_radius=getattr(assignment_data, 'allowed_radius', 100),
            # require_teacher_location=getattr(assignment_data, 'require_teacher_location', False)
        )
        
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        
        return assignment
    
    def update_classroom(self, teacher_id: int, classroom_id: int, update_data: ClassroomUpdate) -> Classroom:
        """Update classroom settings"""
        classroom = self.db.query(Classroom).filter(
            and_(
                Classroom.id == classroom_id,
                Classroom.teacher_id == teacher_id
            )
        ).first()
        
        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found"
            )
        
        # Update fields
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(classroom, field, value)
        
        self.db.commit()
        self.db.refresh(classroom)
        
        return classroom
    
    def remove_student(self, teacher_id: int, classroom_id: int, student_id: int):
        """Remove student from classroom"""
        # Verify teacher owns classroom
        classroom = self.db.query(Classroom).filter(
            and_(
                Classroom.id == classroom_id,
                Classroom.teacher_id == teacher_id
            )
        ).first()
        
        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found"
            )
        
        # Find membership
        membership = self.db.query(ClassroomMembership).filter(
            and_(
                ClassroomMembership.classroom_id == classroom_id,
                ClassroomMembership.student_id == student_id,
                ClassroomMembership.status == MembershipStatus.ACTIVE
            )
        ).first()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found in classroom"
            )
        
        # Mark as removed
        membership.status = MembershipStatus.REMOVED
        membership.removed_at = datetime.utcnow()
        
        # Update student count
        classroom.student_count = max(0, classroom.student_count - 1)
        
        self.db.commit()
    
    def leave_classroom(self, student_id: int, classroom_id: int):
        """Student leaves classroom"""
        membership = self.db.query(ClassroomMembership).filter(
            and_(
                ClassroomMembership.classroom_id == classroom_id,
                ClassroomMembership.student_id == student_id,
                ClassroomMembership.status == MembershipStatus.ACTIVE
            )
        ).first()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="You are not a member of this classroom"
            )
        
        # Mark as removed
        membership.status = MembershipStatus.REMOVED
        membership.removed_at = datetime.utcnow()
        
        # Update classroom student count
        classroom = membership.classroom
        classroom.student_count = max(0, classroom.student_count - 1)
        
        self.db.commit()
    
    def _generate_unique_join_code(self) -> str:
        """Generate unique 6-character join code"""
        for _ in range(10):  # Try up to 10 times
            join_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
            
            existing = self.db.query(Classroom).filter(Classroom.join_code == join_code).first()
            if not existing:
                return join_code
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate unique join code"
        )
        
                    
    # this function is for the student to see their assignment assigned by the teacher

    def get_assignment_for_student(self, assignment_id: int, student_id: int) -> Dict:
        """Get assignment details for student to take quiz"""
        # Get the assignment
        assignment = self.db.query(ClassroomQuizAssignment).filter(
            ClassroomQuizAssignment.id == assignment_id
        ).first()
        
        print(f" this is the actual value {assignment}")
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Check if student has access to this classroom
        membership = self.db.query(ClassroomMembership).filter(
            and_(
                ClassroomMembership.classroom_id == assignment.classroom_id,
                ClassroomMembership.student_id == student_id,
                ClassroomMembership.status == MembershipStatus.ACTIVE
            )
        ).first()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this assignment"
            )
        
        # Get existing submissions
        submissions = self.db.query(ClassroomQuizSubmission).filter(
            and_(
                ClassroomQuizSubmission.assignment_id == assignment_id,
                ClassroomQuizSubmission.student_id == student_id
            )
        ).all()
        
        # Check if can attempt
        can_attempt = len(submissions) < assignment.max_attempts
        is_overdue = assignment.due_date and datetime.utcnow() > assignment.due_date
        
        return {
            "assignment": {
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "instructions": assignment.instructions,
                "due_date": assignment.due_date,
                "time_limit_minutes": assignment.time_limit_minutes,
                "max_attempts": assignment.max_attempts,
                "shuffle_questions": assignment.shuffle_questions,
                "show_results_immediately": assignment.show_results_immediately,
                "allow_late_submission": assignment.allow_late_submission,
                "negative_marking": assignment.negative_marking,
                "status": assignment.status,
                "geofencing_enabled": assignment.geofencing_enabled,
                "allowed_latitude": assignment.allowed_latitude,
                "allowed_longitude": assignment.allowed_longitude,
                "allowed_radius": assignment.allowed_radius,
                "require_teacher_location": assignment.require_teacher_location,
            },
            "quiz": {
                "id": assignment.quiz.id,
                "title": assignment.quiz.title,
                "description": assignment.quiz.description,
                "total_questions": assignment.quiz.total_questions,
                "total_points": assignment.quiz.total_points,
                "passing_score": assignment.quiz.passing_score
            },
            "classroom": {
                "id": assignment.classroom.id,
                "name": assignment.classroom.name,
                "teacher_name": assignment.classroom.teacher.full_name
            },
            "attempts_made": len(submissions),
            "can_attempt": can_attempt and (not is_overdue or assignment.allow_late_submission),
            "is_overdue": is_overdue
        }

    def get_student_assignments(self, student_id: int) -> List[Dict]:
        """Get all assignments for a student across all classrooms"""
        # Get student's classrooms
        memberships = self.db.query(ClassroomMembership).filter(
            and_(
                ClassroomMembership.student_id == student_id,
                ClassroomMembership.status == MembershipStatus.ACTIVE
            )
        ).all()
        
        classroom_ids = [m.classroom_id for m in memberships]
        
        if not classroom_ids:
            return []
        
        # Get assignments from all classrooms
        assignments = self.db.query(ClassroomQuizAssignment).filter(
            and_(
                ClassroomQuizAssignment.classroom_id.in_(classroom_ids),
                ClassroomQuizAssignment.status == AssignmentStatus.ACTIVE
            )
        ).order_by(
            ClassroomQuizAssignment.due_date.asc(),
            ClassroomQuizAssignment.created_at.desc()
        ).all()
        
        result = []
        for assignment in assignments:
            # Check submission status
            submission = self.db.query(ClassroomQuizSubmission).filter(
                and_(
                    ClassroomQuizSubmission.assignment_id == assignment.id,
                    ClassroomQuizSubmission.student_id == student_id
                )
            ).first()
            
            # Determine status
            now = datetime.utcnow()
            is_overdue = assignment.due_date and now > assignment.due_date
            has_submitted = submission is not None
            
            status = "completed" if has_submitted else ("overdue" if is_overdue else "pending")
            
            result.append({
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "due_date": assignment.due_date,
                "status": status,
                "classroom": {
                    "id": assignment.classroom.id,
                    "name": assignment.classroom.name,
                    "teacher_name": assignment.classroom.teacher.full_name
                },
                "quiz": {
                    "id": assignment.quiz.id,
                    "title": assignment.quiz.title,
                    "total_questions": assignment.quiz.total_questions
                },
                "submission": {
                    "submitted_at": submission.submitted_at if submission else None,
                    "score_percentage": submission.score_percentage if submission else None,
                    "is_graded": submission.is_graded if submission else False
                } if submission else None
            })
        
        return result


    # this is for the fetching the details of the assignment givent to the student by the te

    def get_classroom_assignments_for_student(self, classroom_id: int, student_id: int):
        """Get classroom assignments with student's submission status"""
        
        # Verify student access to classroom
        membership = self.db.query(ClassroomMembership).filter(
            ClassroomMembership.classroom_id == classroom_id,
            ClassroomMembership.student_id == student_id,
            ClassroomMembership.status == MembershipStatus.ACTIVE
        ).first()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this classroom"
            )
        
        # Get all assignments for this classroom
        assignments = self.db.query(ClassroomQuizAssignment).filter(
            ClassroomQuizAssignment.classroom_id == classroom_id,
            ClassroomQuizAssignment.status == AssignmentStatus.ACTIVE
        ).order_by(
            ClassroomQuizAssignment.due_date.asc(),
            ClassroomQuizAssignment.created_at.desc()
        ).all()
        
        assignments_with_submissions = []
        
        for assignment in assignments:
            # Get student's submission for this assignment
            submission = self.db.query(ClassroomQuizSubmission).filter(
                ClassroomQuizSubmission.assignment_id == assignment.id,
                ClassroomQuizSubmission.student_id == student_id
            ).order_by(ClassroomQuizSubmission.attempt_number.desc()).first()
            
            # Build assignment data with submission info
            assignment_data = {
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "instructions": assignment.instructions,
                "due_date": assignment.due_date,
                "created_at": assignment.created_at,
                "time_limit_minutes": assignment.time_limit_minutes,
                "max_attempts": assignment.max_attempts,
                "shuffle_questions": assignment.shuffle_questions,
                "show_results_immediately": assignment.show_results_immediately,
                "allow_late_submission": assignment.allow_late_submission,
                "negative_marking": assignment.negative_marking,
                "status": assignment.status.value,
                
                "geofencing_enabled": assignment.geofencing_enabled,
                "allowed_latitude": assignment.allowed_latitude,
                "allowed_longitude": assignment.allowed_longitude,
                "allowed_radius": assignment.allowed_radius,
                "require_teacher_location": assignment.require_teacher_location,
                
                # Quiz information
                "quiz": {
                    "id": assignment.quiz.id,
                    "title": assignment.quiz.title,
                    "description": assignment.quiz.description,
                    "total_questions": assignment.quiz.total_questions,
                    "total_points": assignment.quiz.total_points,
                    "estimated_time_minutes": assignment.quiz.estimated_time_minutes,
                    "passing_score": assignment.quiz.passing_score
                },
                
                # Student submission data
                "student_submission": {
                    "id": submission.id,
                    "submitted_at": submission.submitted_at,
                    "is_late": submission.is_late,
                    "attempt_number": submission.attempt_number,
                    "score_percentage": submission.score_percentage,
                    "is_graded": submission.is_graded,
                    "time_taken_minutes": submission.time_taken_minutes,
                    "questions_attempted": submission.questions_attempted,
                    "questions_correct": submission.questions_correct,
                    "grade_comments": submission.grade_comments
                } if submission else None,
                
                # Assignment status for student
                "attempts_made": self.db.query(ClassroomQuizSubmission).filter(
                    ClassroomQuizSubmission.assignment_id == assignment.id,
                    ClassroomQuizSubmission.student_id == student_id
                ).count(),
                
                "can_attempt": self.db.query(ClassroomQuizSubmission).filter(
                    ClassroomQuizSubmission.assignment_id == assignment.id,
                    ClassroomQuizSubmission.student_id == student_id
                ).count() < assignment.max_attempts
            }
            
            assignments_with_submissions.append(assignment_data)
        
        return assignments_with_submissions
            
            

            
        
        
