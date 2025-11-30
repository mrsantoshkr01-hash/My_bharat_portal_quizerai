# # app/routers/assignment_submission_router.py
# from fastapi import APIRouter, Depends, HTTPException, status, Request
# from sqlalchemy.orm import Session
# from typing import List, Dict, Any, Optional
# from datetime import datetime, timedelta
# import uuid
# from pydantic import BaseModel

# from app.database.connection import get_db
# from app.middleware.auth_middleware import get_current_user
# from app.models.user_models import User, UserRole ,Notification
# from app.database.quiz import (
#     Quiz, Question, QuizSession, QuizAnswer,
#     QuizType, QuizStatus, SessionStatus, QuizCreatorType
# )
# from app.models.classroom_models import (
#     ClassroomQuizAssignment, ClassroomQuizSubmission, ClassroomMembership,
#     AssignmentStatus, MembershipStatus
# )
# from app.services.email_service import EmailService
# from app.schemas.classroom_schemas import AssignmentResponse
# router = APIRouter()

# # Pydantic models for assignment submissions
# class AssignmentStartRequest(BaseModel):
#     assignment_id: int

# class AssignmentAnswerSubmit(BaseModel):
#     question_id: int
#     user_answer: str
#     confidence_level: Optional[int] = None

# class AssignmentSubmissionData(BaseModel):
#     assignment_id: int
#     session_id: str
#     answers: List[AssignmentAnswerSubmit]
#     total_time_seconds: int
#     completed_at: str

# def verify_student(current_user: User):
#     """Verify user is a student"""
#     if current_user.role != UserRole.STUDENT:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only students can access this endpoint"
#         )

# def verify_assignment_access(db: Session, assignment_id: int, student_id: int):
#     """Verify student has access to this assignment"""
#     # Check if student is in the classroom
#     assignment = db.query(ClassroomQuizAssignment).filter(
#         ClassroomQuizAssignment.id == assignment_id
#     ).first()
    
#     if not assignment:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Assignment not found"
#         )
    
#     membership = db.query(ClassroomMembership).filter(
#         ClassroomMembership.classroom_id == assignment.classroom_id,
#         ClassroomMembership.student_id == student_id,
#         ClassroomMembership.status == MembershipStatus.ACTIVE
#     ).first()
    
#     if not membership:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="You don't have access to this assignment"
#         )
    
#     return assignment

# @router.get("/student", response_model=List[Dict[str, Any]])
# async def get_student_assignments(
#     status_filter: Optional[str] = None,  # "pending", "submitted", "overdue"
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get all assignments for a student across all classrooms"""
#     verify_student(current_user)
    
#     # Get student's classrooms
#     memberships = db.query(ClassroomMembership).filter(
#         ClassroomMembership.student_id == current_user.id,
#         ClassroomMembership.status == MembershipStatus.ACTIVE
#     ).all()
    
#     classroom_ids = [m.classroom_id for m in memberships]
    
#     if not classroom_ids:
#         return []
    
#     # Get assignments from all classrooms
#     assignments_query = db.query(ClassroomQuizAssignment).filter(
#         ClassroomQuizAssignment.classroom_id.in_(classroom_ids),
#         ClassroomQuizAssignment.status == AssignmentStatus.ACTIVE
#     )
    
#     assignments = assignments_query.order_by(
#         ClassroomQuizAssignment.due_date.asc().nullslast(),
#         ClassroomQuizAssignment.created_at.desc()
#     ).all()
    
#     result = []
#     for assignment in assignments:
#         # Check if student has submitted
#         submission = db.query(ClassroomQuizSubmission).filter(
#             ClassroomQuizSubmission.assignment_id == assignment.id,
#             ClassroomQuizSubmission.student_id == current_user.id
#         ).first()
        
#         # Determine status
#         now = datetime.utcnow()
#         is_overdue = assignment.due_date and now > assignment.due_date
#         has_submitted = submission is not None
        
#         assignment_status = "completed" if has_submitted else ("overdue" if is_overdue else "pending")
        
#         # Apply status filter
#         if status_filter and assignment_status != status_filter:
#             continue
        
#         # Get quiz info
#         quiz = assignment.quiz
        
#         result.append({
#             "id": assignment.id,
#             "title": assignment.title,
#             "description": assignment.description,
#             "instructions": assignment.instructions,
#             "due_date": assignment.due_date,
#             "status": assignment_status,
#             "created_at": assignment.created_at,
#             "classroom": {
#                 "id": assignment.classroom.id,
#                 "name": assignment.classroom.name,
#                 "teacher_name": assignment.classroom.teacher.full_name
#             },
#             "quiz": {
#                 "id": quiz.id,
#                 "title": quiz.title,
#                 "total_questions": quiz.total_questions,
#                 "total_points": quiz.total_points,
#                 "estimated_time_minutes": quiz.estimated_time_minutes,
#                 "passing_score": quiz.passing_score
#             },
#             "assignment_settings": {
#                 "time_limit_minutes": assignment.time_limit_minutes,
#                 "max_attempts": assignment.max_attempts,
#                 "shuffle_questions": assignment.shuffle_questions,
#                 "show_results_immediately": assignment.show_results_immediately,
#                 "allow_late_submission": assignment.allow_late_submission
#             },
#             "submission": {
#                 "submitted_at": submission.submitted_at if submission else None,
#                 "score_percentage": submission.score_percentage if submission else None,
#                 "is_graded": submission.is_graded if submission else False,
#                 "attempt_number": submission.attempt_number if submission else 0
#             } if submission else None
#         })
    
#     return result
# @router.get("/{assignment_id}/student-view", response_model=Dict[str, Any])
# async def get_assignment_for_student(
#     assignment_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get assignment details for student to take the quiz"""
#     verify_student(current_user)
#     assignment = verify_assignment_access(db, assignment_id, current_user.id)
    
#     # Check if assignment is still active and accessible
#     now = datetime.utcnow()
#     is_overdue = assignment.due_date and now > assignment.due_date
    
#     if assignment.status != AssignmentStatus.ACTIVE:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Assignment is not active"
#         )
    
#     # Check for existing submissions
#     submissions = db.query(ClassroomQuizSubmission).filter(
#         ClassroomQuizSubmission.assignment_id == assignment_id,
#         ClassroomQuizSubmission.student_id == current_user.id
#     ).order_by(ClassroomQuizSubmission.attempt_number.desc()).all()
    
#     can_attempt = len(submissions) < assignment.max_attempts
    
#     if not can_attempt and not (is_overdue and assignment.allow_late_submission):
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="No more attempts allowed or assignment is overdue"
#         )
    
#     quiz = assignment.quiz
    
#     # Get questions (without answers for security)
#     questions = db.query(Question).filter(
#         Question.quiz_id == quiz.id
#     ).order_by(Question.order_index).all()
    
#     return {
#         "assignment": {
#             "id": assignment.id,
#             "title": assignment.title,
#             "description": assignment.description,
#             "instructions": assignment.instructions,
#             "due_date": assignment.due_date,
#             "time_limit_minutes": assignment.time_limit_minutes,
#             "max_attempts": assignment.max_attempts,
#             "shuffle_questions": assignment.shuffle_questions,
#             "show_results_immediately": assignment.show_results_immediately,
#             "allow_late_submission": assignment.allow_late_submission,
#             "negative_marking": assignment.negative_marking,  # ADD THIS LINE
#             "status": assignment.status.value
#         },
#         "quiz": {
#             "id": quiz.id,
#             "external_id": quiz.external_id,
#             "title": quiz.title,
#             "description": quiz.description,
#             "total_questions": quiz.total_questions,
#             "total_points": quiz.total_points,
#             "passing_score": quiz.passing_score,
#             "estimated_time_minutes": quiz.estimated_time_minutes,
#             "shuffle_options": quiz.shuffle_options,
#             "allow_skip": quiz.allow_skip
#         },
#         "questions": [
#             {
#                 "id": q.id,
#                 "question_text": q.question_text,
#                 "question_type": q.question_type.value,
#                 "order_index": q.order_index,
#                 "points": q.points,
#                 "options": q.options,
#                 "image_url": q.image_url,
#                 "video_url": q.video_url,
#                 "is_required": q.is_required,
#                 "estimated_time_seconds": q.estimated_time_seconds
#                 # Note: correct_answer and explanation excluded for security
#             }
#             for q in questions
#         ],
#         "classroom": {
#             "id": assignment.classroom.id,
#             "name": assignment.classroom.name,
#             "teacher_name": assignment.classroom.teacher.full_name
#         },
#         "attempts_made": len(submissions),
#         "can_attempt": can_attempt,
#         "is_overdue": is_overdue,
#         "last_submission": {
#             "submitted_at": submissions[0].submitted_at,
#             "score_percentage": submissions[0].score_percentage,
#             "is_graded": submissions[0].is_graded
#         } if submissions else None
#     }

# @router.post("/{assignment_id}/start", response_model=Dict[str, Any])
# async def start_assignment_session(
#     assignment_id: int,
#     request: Request,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Start a new assignment session for the student"""
#     verify_student(current_user)
#     assignment = verify_assignment_access(db, assignment_id, current_user.id)
    
#     # Verify student can start new attempt
#     submissions_count = db.query(ClassroomQuizSubmission).filter(
#         ClassroomQuizSubmission.assignment_id == assignment_id,
#         ClassroomQuizSubmission.student_id == current_user.id
#     ).count()
    
#     if submissions_count >= assignment.max_attempts:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Maximum attempts reached"
#         )
    
#     # Check if assignment is still accessible
#     now = datetime.utcnow()
#     is_overdue = assignment.due_date and now > assignment.due_date
    
#     if is_overdue and not assignment.allow_late_submission:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Assignment is overdue and late submission is not allowed"
#         )
    
#     # Create quiz session
#     session_id = str(uuid.uuid4())
#     quiz_session = QuizSession(
#         id=session_id,
#         quiz_id=assignment.quiz_id,
#         user_id=current_user.id,
#         context_type="classroom",
#         context_id=assignment_id,
#         status=SessionStatus.IN_PROGRESS,
#         attempt_number=submissions_count + 1,
#         start_time=now,
#         ip_address=str(request.client.host),
#         user_agent=request.headers.get("user-agent", ""),
#         session_config={
#             "assignment_id": assignment_id,
#             "time_limit_minutes": assignment.time_limit_minutes,
#             "shuffle_questions": assignment.shuffle_questions,
#             "max_attempts": assignment.max_attempts
#         }
#     )
    
#     db.add(quiz_session)
#     db.commit()
#     db.refresh(quiz_session)
    
#     return {
#         "session_id": session_id,
#         "assignment_id": assignment_id,
#         "quiz_id": assignment.quiz_id,
#         "attempt_number": submissions_count + 1,
#         "time_limit_minutes": assignment.time_limit_minutes,
#         "started_at": now,
#         "message": "Assignment session started successfully"
#     }

# @router.post("/{assignment_id}/submit", response_model=Dict[str, Any])
# async def submit_assignment(
#     assignment_id: int,
#     submission_data: AssignmentSubmissionData,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Submit assignment answers and create classroom submission record"""
#     verify_student(current_user)
#     assignment = verify_assignment_access(db, assignment_id, current_user.id)
    
#     # Get the quiz session
#     quiz_session = db.query(QuizSession).filter(
#         QuizSession.id == submission_data.session_id,
#         QuizSession.user_id == current_user.id,
#         QuizSession.context_type == "classroom",
#         QuizSession.context_id == assignment_id
#     ).first()
    
#     if not quiz_session:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Quiz session not found"
#         )
    
#     if quiz_session.status != SessionStatus.IN_PROGRESS:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Session is not in progress"
#         )
    
#     # Check if submission is late
#     now = datetime.utcnow()
#     is_late = assignment.due_date and now > assignment.due_date
    
#     if is_late and not assignment.allow_late_submission:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Late submission not allowed"
#         )
    
#     # Grade the assignment
#     quiz = assignment.quiz
#     questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
#     question_dict = {q.id: q for q in questions}
    
#     total_score = 0.0
#     max_possible_score = sum(q.points for q in questions)
#     correct_answers = 0
    
#     total_marks = 0
#     max_marks = 0
#     incorrect_answers = 0

    
#     # Process each answer
#     for answer_data in submission_data.answers:
#         question = question_dict.get(answer_data.question_id)
#         if not question:
#             continue
        
        
#         def normalize_answer(answer_text):
#             """Normalize answer text for comparison"""
#             if not answer_text:
#                 return ""
            
#             # Remove common prefixes like "A) ", "B) ", etc.
#             import re
#             normalized = re.sub(r'^[A-Za-z]\)\s*', '', answer_text.strip())
#             return normalized.lower().strip()

#         # In your grading loop, replace the comparison with:
#         max_marks += question.points  # Add this
#         user_answer_normalized = normalize_answer(answer_data.user_answer)
#         correct_answer_normalized = normalize_answer(question.correct_answer)
#         is_correct = user_answer_normalized == correct_answer_normalized
        
     
#         points_earned = question.points if is_correct else 0.0
#         total_score += points_earned
        
#         if is_correct:
#             total_marks += question.points
#             correct_answers += 1
#         else:
#             incorrect_answers += 1
#             # Apply negative marking if enabled
#             if assignment.negative_marking:
#                 total_marks -= question.points
        
#         # Save individual answer
#         quiz_answer = QuizAnswer(
#             session_id=submission_data.session_id,
#             question_id=answer_data.question_id,
#             user_answer=answer_data.user_answer,
#             is_correct=is_correct,
#             points_earned=points_earned,
#             confidence_level=answer_data.confidence_level,
#             time_taken_seconds=submission_data.total_time_seconds // len(submission_data.answers),  # Approximate
#             answered_at=now
#         )
#         db.add(quiz_answer)
        
#         # Update question analytics
#         question.times_answered += 1
#         if is_correct:
#             question.correct_answer_count += 1
    
#     # Calculate percentage
#     percentage_score = (total_score / max_possible_score * 100) if max_possible_score > 0 else 0
#     is_passed = percentage_score >= quiz.passing_score
    
#     # Update quiz session
#     quiz_session.status = SessionStatus.COMPLETED
#     quiz_session.end_time = now
#     quiz_session.total_time_seconds = submission_data.total_time_seconds
#     quiz_session.questions_answered = len(submission_data.answers)
#     quiz_session.total_score = total_score
#     quiz_session.max_possible_score = max_possible_score
#     quiz_session.percentage_score = percentage_score
#     quiz_session.is_passed = is_passed
    
#     # Create classroom submission record
#     classroom_submission = ClassroomQuizSubmission(
#         assignment_id=assignment_id,
#         student_id=current_user.id,
#         quiz_session_id=submission_data.session_id,
#         submitted_at=now,
#         is_late=is_late,
#         attempt_number=quiz_session.attempt_number,
#         score_percentage=max(0, (total_marks / max_marks * 100)) if max_marks > 0 else 0,  # Cap negative percentages
#         total_marks_scored=total_marks,  # ✅ Add this
#         max_possible_marks=max_marks,    # ✅ Add this
#         questions_incorrect=incorrect_answers,  # ✅ Add this
#         questions_total=len(questions),  # ✅ Add this
#         is_graded=True,
#         time_taken_minutes=submission_data.total_time_seconds // 60,
#         questions_attempted=len(submission_data.answers),
#         questions_correct=correct_answers
#     )
    
#     db.add(classroom_submission)
    
#     # Update assignment analytics
#     assignment.completed_count = (assignment.completed_count or 0) + 1
    
#     # Recalculate assignment average score
#     all_submissions = db.query(ClassroomQuizSubmission).filter(
#         ClassroomQuizSubmission.assignment_id == assignment_id,
#         ClassroomQuizSubmission.is_graded == True
#     ).all()
    
#     if all_submissions:
#         assignment.average_score = sum(s.score_percentage for s in all_submissions if s.score_percentage) / len(all_submissions)
    
#     # Update quiz analytics
#     quiz.total_attempts += 1
#     completed_sessions = db.query(QuizSession).filter(
#         QuizSession.quiz_id == quiz.id,
#         QuizSession.status == SessionStatus.COMPLETED
#     ).count()
    
#     quiz.completion_rate = (completed_sessions / quiz.total_attempts) * 100
    
#     if completed_sessions > 1:
#         quiz.average_score = ((quiz.average_score * (completed_sessions - 1)) + percentage_score) / completed_sessions
#     else:
#         quiz.average_score = percentage_score
    
#     db.commit()
    
#     # Prepare response
#     response_data = {
#         "submission_id": classroom_submission.id,
#         "session_id": submission_data.session_id,
#         "assignment_id": assignment_id,
#         "submitted_at": now,
#         "is_late": is_late,
#         "attempt_number": quiz_session.attempt_number,
#         "total_score": total_score,
#         "max_possible_score": max_possible_score,
#         "percentage_score": percentage_score,
#         "is_passed": is_passed,
#         "questions_correct": correct_answers,
#         "questions_total": len(questions),
#         "time_taken_minutes": submission_data.total_time_seconds // 60,
#         "message": "Assignment submitted successfully"
#     }
    
#     # Add detailed results if assignment allows showing results immediately
#     if assignment.show_results_immediately:
#         # Get the graded quiz answers that were just created
#         quiz_answers = db.query(QuizAnswer).filter(
#             QuizAnswer.session_id == submission_data.session_id
#         ).all()

#         answer_dict = {ans.question_id: ans for ans in quiz_answers}

#         response_data["detailed_results"] = [
#             {
#                 "question_id": ans.question_id,
#                 "question_text": question_dict[ans.question_id].question_text,
#                 "user_answer": ans.user_answer,
#                 "correct_answer": question_dict[ans.question_id].correct_answer,
#                 "is_correct": ans.is_correct,  # Now uses graded QuizAnswer
#                 "points_earned": ans.points_earned,  # Now uses graded QuizAnswer
#                 "explanation": question_dict[ans.question_id].explanation
#             }
#             for ans in quiz_answers  # Use graded answers instead of raw input
#             if ans.question_id in question_dict
#         ]
    
#     return response_data

# @router.get("/{assignment_id}/results", response_model=Dict[str, Any])
# async def get_assignment_results(
#     assignment_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get student's results for an assignment"""
#     verify_student(current_user)
#     assignment = verify_assignment_access(db, assignment_id, current_user.id)
    
#     # Get all submissions for this assignment by the student
#     submissions = db.query(ClassroomQuizSubmission).filter(
#         ClassroomQuizSubmission.assignment_id == assignment_id,
#         ClassroomQuizSubmission.student_id == current_user.id
#     ).order_by(ClassroomQuizSubmission.attempt_number.desc()).all()
    
#     if not submissions:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="No submissions found for this assignment"
#         )
    
#     # Get the latest submission
#     latest_submission = submissions[0]
    
#     # Check if results should be shown
#     if not assignment.show_results_immediately and not latest_submission.is_graded:
#         return {
#             "assignment_id": assignment_id,
#             "submission_id": latest_submission.id,
#             "submitted_at": latest_submission.submitted_at,
#             "results_available": False,
#             "message": "Results will be available after grading"
#         }
    
#     # Get detailed answers if results should be shown
#     quiz_session = db.query(QuizSession).filter(
#         QuizSession.id == latest_submission.quiz_session_id
#     ).first()
    
#     answers = []
#     if quiz_session and assignment.show_results_immediately:
#         quiz_answers = db.query(QuizAnswer).join(Question).filter(
#             QuizAnswer.session_id == quiz_session.id
#         ).order_by(Question.order_index).all()
        
#         answers = [
#             {
#                 "question_id": ans.question.id,
#                 "question_text": ans.question.question_text,
#                 "question_type": ans.question.question_type.value,
#                 "user_answer": ans.user_answer,
#                 "correct_answer": ans.question.correct_answer if assignment.quiz.show_correct_answers else None,
#                 "is_correct": ans.is_correct,
#                 "points_earned": ans.points_earned,
#                 "max_points": ans.question.points,
#                 "explanation": ans.question.explanation if ans.question.explanation else None
#             }
#             for ans in quiz_answers
#         ]
    
#     return {
#         "assignment": {
#             "id": assignment.id,
#             "title": assignment.title,
#             "due_date": assignment.due_date,
#             "max_attempts": assignment.max_attempts
#         },
#         "quiz": {
#             "id": assignment.quiz.id,
#             "title": assignment.quiz.title,
#             "passing_score": assignment.quiz.passing_score
#         },
#         "latest_submission": {
#             "id": latest_submission.id,
#             "submitted_at": latest_submission.submitted_at,
#             "is_late": latest_submission.is_late,
#             "attempt_number": latest_submission.attempt_number,
#             "score_percentage": latest_submission.score_percentage,
#             "is_passed": latest_submission.score_percentage >= assignment.quiz.passing_score if latest_submission.score_percentage else False,
#             "questions_correct": latest_submission.questions_correct,
#             "questions_total": assignment.quiz.total_questions,
#             "time_taken_minutes": latest_submission.time_taken_minutes,
#             "is_graded": latest_submission.is_graded,
#             "grade_comments": latest_submission.grade_comments
#         },
#         "all_attempts": [
#             {
#                 "attempt_number": sub.attempt_number,
#                 "submitted_at": sub.submitted_at,
#                 "score_percentage": sub.score_percentage,
#                 "is_late": sub.is_late
#             }
#             for sub in reversed(submissions)
#         ],
#         "answers": answers,
#         "results_available": True
#     }

# @router.get("/{assignment_id}/status", response_model=Dict[str, Any])
# async def get_assignment_status(
#     assignment_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get current status of assignment for student"""
#     verify_student(current_user)
#     assignment = verify_assignment_access(db, assignment_id, current_user.id)
    
#     # Get submission count
#     submissions = db.query(ClassroomQuizSubmission).filter(
#         ClassroomQuizSubmission.assignment_id == assignment_id,
#         ClassroomQuizSubmission.student_id == current_user.id
#     ).all()
    
#     # Check for active session
#     active_session = db.query(QuizSession).filter(
#         QuizSession.user_id == current_user.id,
#         QuizSession.context_type == "classroom",
#         QuizSession.context_id == assignment_id,
#         QuizSession.status == SessionStatus.IN_PROGRESS
#     ).first()
    
#     now = datetime.utcnow()
#     is_overdue = assignment.due_date and now > assignment.due_date
#     can_attempt = len(submissions) < assignment.max_attempts
    
#     status = "not_started"
#     if submissions:
#         if len(submissions) >= assignment.max_attempts:
#             status = "completed"
#         elif active_session:
#             status = "in_progress"
#         else:
#             status = "can_retry"
#     elif active_session:
#         status = "in_progress"
#     elif is_overdue and not assignment.allow_late_submission:
#         status = "overdue"
    
#     return {
#         "assignment_id": assignment_id,
#         "status": status,
#         "attempts_made": len(submissions),
#         "max_attempts": assignment.max_attempts,
#         "can_attempt": can_attempt and (not is_overdue or assignment.allow_late_submission),
#         "is_overdue": is_overdue,
#         "due_date": assignment.due_date,
#         "active_session": {
#             "session_id": active_session.id,
#             "started_at": active_session.start_time,
#             "time_limit_minutes": assignment.time_limit_minutes
#         } if active_session else None,
#         "latest_score": submissions[-1].score_percentage if submissions else None
#     }
    


# app/routers/assignment_submission_router.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import uuid
from pydantic import BaseModel

from app.database.connection import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user_models import User, UserRole ,Notification
from app.database.quiz import (
    Quiz, Question, QuizSession, QuizAnswer,
    QuizType, QuizStatus, SessionStatus, QuizCreatorType
)
from app.models.classroom_models import (
    ClassroomQuizAssignment, ClassroomQuizSubmission, ClassroomMembership,
    AssignmentStatus, MembershipStatus
)
from app.services.email_service import EmailService
from app.schemas.classroom_schemas import AssignmentResponse
router = APIRouter()

# Pydantic models for assignment submissions
class AssignmentStartRequest(BaseModel):
    assignment_id: int

class AssignmentAnswerSubmit(BaseModel):
    question_id: int
    user_answer: str
    confidence_level: Optional[int] = None

class AssignmentSubmissionData(BaseModel):
    assignment_id: int
    session_id: str
    answers: List[AssignmentAnswerSubmit]
    total_time_seconds: int
    completed_at: str

def verify_student(current_user: User):
    """Verify user is a student"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )

def verify_assignment_access(db: Session, assignment_id: int, student_id: int):
    """Verify student has access to this assignment"""
    # Check if student is in the classroom
    assignment = db.query(ClassroomQuizAssignment).filter(
        ClassroomQuizAssignment.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    membership = db.query(ClassroomMembership).filter(
        ClassroomMembership.classroom_id == assignment.classroom_id,
        ClassroomMembership.student_id == student_id,
        ClassroomMembership.status == MembershipStatus.ACTIVE
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this assignment"
        )
    
    return assignment

@router.get("/student", response_model=List[Dict[str, Any]])
async def get_student_assignments(
    status_filter: Optional[str] = None,  # "pending", "submitted", "overdue"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all assignments for a student across all classrooms"""
    verify_student(current_user)
    
    # Get student's classrooms
    memberships = db.query(ClassroomMembership).filter(
        ClassroomMembership.student_id == current_user.id,
        ClassroomMembership.status == MembershipStatus.ACTIVE
    ).all()
    
    classroom_ids = [m.classroom_id for m in memberships]
    
    if not classroom_ids:
        return []
    
    # Get assignments from all classrooms
    assignments_query = db.query(ClassroomQuizAssignment).filter(
        ClassroomQuizAssignment.classroom_id.in_(classroom_ids),
        ClassroomQuizAssignment.status == AssignmentStatus.ACTIVE
    )
    
    assignments = assignments_query.order_by(
        ClassroomQuizAssignment.due_date.asc().nullslast(),
        ClassroomQuizAssignment.created_at.desc()
    ).all()
    
    result = []
    for assignment in assignments:
        # Check if student has submitted
        submission = db.query(ClassroomQuizSubmission).filter(
            ClassroomQuizSubmission.assignment_id == assignment.id,
            ClassroomQuizSubmission.student_id == current_user.id
        ).first()
        
        # Determine status
        now = datetime.utcnow()
        is_overdue = assignment.due_date and now > assignment.due_date
        has_submitted = submission is not None
        
        assignment_status = "completed" if has_submitted else ("overdue" if is_overdue else "pending")
        
        # Apply status filter
        if status_filter and assignment_status != status_filter:
            continue
        
        # Get quiz info
        quiz = assignment.quiz
        
        result.append({
            "id": assignment.id,
            "title": assignment.title,
            "description": assignment.description,
            "instructions": assignment.instructions,
            "due_date": assignment.due_date,
            "status": assignment_status,
            "created_at": assignment.created_at,
            "classroom": {
                "id": assignment.classroom.id,
                "name": assignment.classroom.name,
                "teacher_name": assignment.classroom.teacher.full_name
            },
            "quiz": {
                "id": quiz.id,
                "title": quiz.title,
                "total_questions": quiz.total_questions,
                "total_points": quiz.total_points,
                "estimated_time_minutes": quiz.estimated_time_minutes,
                "passing_score": quiz.passing_score
            },
            "assignment_settings": {
                "time_limit_minutes": assignment.time_limit_minutes,
                "max_attempts": assignment.max_attempts,
                "shuffle_questions": assignment.shuffle_questions,
                "show_results_immediately": assignment.show_results_immediately,
                "allow_late_submission": assignment.allow_late_submission
            },
            "submission": {
                "submitted_at": submission.submitted_at if submission else None,
                "score_percentage": submission.score_percentage if submission else None,
                "is_graded": submission.is_graded if submission else False,
                "attempt_number": submission.attempt_number if submission else 0
            } if submission else None
        })
    
    return result
@router.get("/{assignment_id}/student-view", response_model=Dict[str, Any])
async def get_assignment_for_student(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get assignment details for student to take the quiz"""
    verify_student(current_user)
    assignment = verify_assignment_access(db, assignment_id, current_user.id)
    
    # Check if assignment is still active and accessible
    now = datetime.utcnow()
    is_overdue = assignment.due_date and now > assignment.due_date
    
    if assignment.status != AssignmentStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment is not active"
        )
    
    # Check for existing submissions
    submissions = db.query(ClassroomQuizSubmission).filter(
        ClassroomQuizSubmission.assignment_id == assignment_id,
        ClassroomQuizSubmission.student_id == current_user.id
    ).order_by(ClassroomQuizSubmission.attempt_number.desc()).all()
    
    can_attempt = len(submissions) < assignment.max_attempts
    
    if not can_attempt and not (is_overdue and assignment.allow_late_submission):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No more attempts allowed or assignment is overdue"
        )
    
    quiz = assignment.quiz
    
    # Get questions (without answers for security)
    questions = db.query(Question).filter(
        Question.quiz_id == quiz.id
    ).order_by(Question.order_index).all()
    
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
            "negative_marking": assignment.negative_marking,  # ADD THIS LINE
            "status": assignment.status.value,
            "geofencing_enabled": assignment.geofencing_enabled,
            "allowed_latitude": assignment.allowed_latitude,
            "allowed_longitude": assignment.allowed_longitude,
            "allowed_radius": assignment.allowed_radius,
            "require_teacher_location": assignment.require_teacher_location,
        },
        "quiz": {
            "id": quiz.id,
            "external_id": quiz.external_id,
            "title": quiz.title,
            "description": quiz.description,
            "total_questions": quiz.total_questions,
            "total_points": quiz.total_points,
            "passing_score": quiz.passing_score,
            "estimated_time_minutes": quiz.estimated_time_minutes,
            "shuffle_options": quiz.shuffle_options,
            "allow_skip": quiz.allow_skip
        },
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "question_type": q.question_type.value,
                "order_index": q.order_index,
                "points": q.points,
                "options": q.options,
                "image_url": q.image_url,
                "video_url": q.video_url,
                "is_required": q.is_required,
                "estimated_time_seconds": q.estimated_time_seconds
                # Note: correct_answer and explanation excluded for security
            }
            for q in questions
        ],
        "classroom": {
            "id": assignment.classroom.id,
            "name": assignment.classroom.name,
            "teacher_name": assignment.classroom.teacher.full_name
        },
        "attempts_made": len(submissions),
        "can_attempt": can_attempt,
        "is_overdue": is_overdue,
        "last_submission": {
            "submitted_at": submissions[0].submitted_at,
            "score_percentage": submissions[0].score_percentage,
            "is_graded": submissions[0].is_graded
        } if submissions else None
    }

@router.post("/{assignment_id}/start", response_model=Dict[str, Any])
async def start_assignment_session(
    assignment_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new assignment session for the student"""
    verify_student(current_user)
    assignment = verify_assignment_access(db, assignment_id, current_user.id)
    
    # Verify student can start new attempt
    submissions_count = db.query(ClassroomQuizSubmission).filter(
        ClassroomQuizSubmission.assignment_id == assignment_id,
        ClassroomQuizSubmission.student_id == current_user.id
    ).count()
    
    if submissions_count >= assignment.max_attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum attempts reached"
        )
    
    # Check if assignment is still accessible
    now = datetime.utcnow()
    is_overdue = assignment.due_date and now > assignment.due_date
    
    if is_overdue and not assignment.allow_late_submission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment is overdue and late submission is not allowed"
        )
    
    # Create quiz session
    session_id = str(uuid.uuid4())
    quiz_session = QuizSession(
        id=session_id,
        quiz_id=assignment.quiz_id,
        user_id=current_user.id,
        context_type="classroom",
        context_id=assignment_id,
        status=SessionStatus.IN_PROGRESS,
        attempt_number=submissions_count + 1,
        start_time=now,
        ip_address=str(request.client.host),
        user_agent=request.headers.get("user-agent", ""),
        session_config={
            "assignment_id": assignment_id,
            "time_limit_minutes": assignment.time_limit_minutes,
            "shuffle_questions": assignment.shuffle_questions,
            "max_attempts": assignment.max_attempts
        }
    )
    
    db.add(quiz_session)
    db.commit()
    db.refresh(quiz_session)
    
    return {
        "session_id": session_id,
        "assignment_id": assignment_id,
        "quiz_id": assignment.quiz_id,
        "attempt_number": submissions_count + 1,
        "time_limit_minutes": assignment.time_limit_minutes,
        "started_at": now,
        "message": "Assignment session started successfully"
    }

@router.post("/{assignment_id}/submit", response_model=Dict[str, Any])
async def submit_assignment(
    assignment_id: int,
    submission_data: AssignmentSubmissionData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit assignment answers and create classroom submission record"""
    verify_student(current_user)
    assignment = verify_assignment_access(db, assignment_id, current_user.id)
    
    # Get the quiz session
    quiz_session = db.query(QuizSession).filter(
        QuizSession.id == submission_data.session_id,
        QuizSession.user_id == current_user.id,
        QuizSession.context_type == "classroom",
        QuizSession.context_id == assignment_id
    ).first()
    
    if not quiz_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz session not found"
        )
    
    if quiz_session.status != SessionStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is not in progress"
        )
    
    # Check if submission is late
    now = datetime.utcnow()
    is_late = assignment.due_date and now > assignment.due_date
    
    if is_late and not assignment.allow_late_submission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Late submission not allowed"
        )
    
    # Grade the assignment
    quiz = assignment.quiz
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
    question_dict = {q.id: q for q in questions}
    
    total_score = 0.0
    max_possible_score = sum(q.points for q in questions)
    correct_answers = 0
    
    total_marks = 0
    max_marks = 0
    incorrect_answers = 0

    
    # Process each answer
    for answer_data in submission_data.answers:
        question = question_dict.get(answer_data.question_id)
        if not question:
            continue
        
        
        def normalize_answer(answer_text):
            """Normalize answer text for comparison"""
            if not answer_text:
                return ""
            
            # Remove common prefixes like "A) ", "B) ", etc.
            import re
            normalized = re.sub(r'^[A-Za-z]\)\s*', '', answer_text.strip())
            return normalized.lower().strip()

        # In your grading loop, replace the comparison with:
        max_marks += question.points  # Add this
        user_answer_normalized = normalize_answer(answer_data.user_answer)
        correct_answer_normalized = normalize_answer(question.correct_answer)
        is_correct = user_answer_normalized == correct_answer_normalized
        
     
        points_earned = question.points if is_correct else 0.0
        total_score += points_earned
        
        if is_correct:
            total_marks += question.points
            correct_answers += 1
        else:
            incorrect_answers += 1
            # Apply negative marking if enabled
            if assignment.negative_marking:
                total_marks -= question.points
        
        # Save individual answer
        quiz_answer = QuizAnswer(
            session_id=submission_data.session_id,
            question_id=answer_data.question_id,
            user_answer=answer_data.user_answer,
            is_correct=is_correct,
            points_earned=points_earned,
            confidence_level=answer_data.confidence_level,
            time_taken_seconds=submission_data.total_time_seconds // len(submission_data.answers),  # Approximate
            answered_at=now
        )
        db.add(quiz_answer)
        
        # Update question analytics
        question.times_answered += 1
        if is_correct:
            question.correct_answer_count += 1
    
    # Calculate percentage
    percentage_score = (total_score / max_possible_score * 100) if max_possible_score > 0 else 0
    is_passed = percentage_score >= quiz.passing_score
    
    # Update quiz session
    quiz_session.status = SessionStatus.COMPLETED
    quiz_session.end_time = now
    quiz_session.total_time_seconds = submission_data.total_time_seconds
    quiz_session.questions_answered = len(submission_data.answers)
    quiz_session.total_score = total_score
    quiz_session.max_possible_score = max_possible_score
    quiz_session.percentage_score = percentage_score
    quiz_session.is_passed = is_passed
    
    # Create classroom submission record
    classroom_submission = ClassroomQuizSubmission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        quiz_session_id=submission_data.session_id,
        submitted_at=now,
        is_late=is_late,
        attempt_number=quiz_session.attempt_number,
        score_percentage=max(0, (total_marks / max_marks * 100)) if max_marks > 0 else 0,  # Cap negative percentages
        total_marks_scored=total_marks,  # ✅ Add this
        max_possible_marks=max_marks,    # ✅ Add this
        questions_incorrect=incorrect_answers,  # ✅ Add this
        questions_total=len(questions),  # ✅ Add this
        is_graded=True,
        time_taken_minutes=submission_data.total_time_seconds // 60,
        questions_attempted=len(submission_data.answers),
        questions_correct=correct_answers
    )
    
    db.add(classroom_submission)
    
    # Update assignment analytics
    assignment.completed_count = (assignment.completed_count or 0) + 1
    
    # Recalculate assignment average score
    all_submissions = db.query(ClassroomQuizSubmission).filter(
        ClassroomQuizSubmission.assignment_id == assignment_id,
        ClassroomQuizSubmission.is_graded == True
    ).all()
    
    if all_submissions:
        assignment.average_score = sum(s.score_percentage for s in all_submissions if s.score_percentage) / len(all_submissions)
    
    # Update quiz analytics
    quiz.total_attempts += 1
    completed_sessions = db.query(QuizSession).filter(
        QuizSession.quiz_id == quiz.id,
        QuizSession.status == SessionStatus.COMPLETED
    ).count()
    
    quiz.completion_rate = (completed_sessions / quiz.total_attempts) * 100
    
    if completed_sessions > 1:
        quiz.average_score = ((quiz.average_score * (completed_sessions - 1)) + percentage_score) / completed_sessions
    else:
        quiz.average_score = percentage_score
    
    db.commit()
    
    # Prepare response
    response_data = {
        "submission_id": classroom_submission.id,
        "session_id": submission_data.session_id,
        "assignment_id": assignment_id,
        "submitted_at": now,
        "is_late": is_late,
        "attempt_number": quiz_session.attempt_number,
        "total_score": total_score,
        "max_possible_score": max_possible_score,
        "percentage_score": percentage_score,
        "is_passed": is_passed,
        "questions_correct": correct_answers,
        "questions_total": len(questions),
        "time_taken_minutes": submission_data.total_time_seconds // 60,
        "message": "Assignment submitted successfully"
    }
    
    # Add detailed results if assignment allows showing results immediately
    if assignment.show_results_immediately:
        # Get the graded quiz answers that were just created
        quiz_answers = db.query(QuizAnswer).filter(
            QuizAnswer.session_id == submission_data.session_id
        ).all()

        answer_dict = {ans.question_id: ans for ans in quiz_answers}

        response_data["detailed_results"] = [
            {
                "question_id": ans.question_id,
                "question_text": question_dict[ans.question_id].question_text,
                "user_answer": ans.user_answer,
                "correct_answer": question_dict[ans.question_id].correct_answer,
                "is_correct": ans.is_correct,  # Now uses graded QuizAnswer
                "points_earned": ans.points_earned,  # Now uses graded QuizAnswer
                "explanation": question_dict[ans.question_id].explanation
            }
            for ans in quiz_answers  # Use graded answers instead of raw input
            if ans.question_id in question_dict
        ]
    
    return response_data

@router.get("/{assignment_id}/results", response_model=Dict[str, Any])
async def get_assignment_results(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student's results for an assignment"""
    verify_student(current_user)
    assignment = verify_assignment_access(db, assignment_id, current_user.id)
    
    # Get all submissions for this assignment by the student
    submissions = db.query(ClassroomQuizSubmission).filter(
        ClassroomQuizSubmission.assignment_id == assignment_id,
        ClassroomQuizSubmission.student_id == current_user.id
    ).order_by(ClassroomQuizSubmission.attempt_number.desc()).all()
    
    if not submissions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No submissions found for this assignment"
        )
    
    # Get the latest submission
    latest_submission = submissions[0]
    
    # Check if results should be shown
    if not assignment.show_results_immediately and not latest_submission.is_graded:
        return {
            "assignment_id": assignment_id,
            "submission_id": latest_submission.id,
            "submitted_at": latest_submission.submitted_at,
            "results_available": False,
            "message": "Results will be available after grading"
        }
    
    # Get detailed answers if results should be shown
    quiz_session = db.query(QuizSession).filter(
        QuizSession.id == latest_submission.quiz_session_id
    ).first()
    
    answers = []
    if quiz_session and assignment.show_results_immediately:
        quiz_answers = db.query(QuizAnswer).join(Question).filter(
            QuizAnswer.session_id == quiz_session.id
        ).order_by(Question.order_index).all()
        
        answers = [
            {
                "question_id": ans.question.id,
                "question_text": ans.question.question_text,
                "question_type": ans.question.question_type.value,
                "user_answer": ans.user_answer,
                "correct_answer": ans.question.correct_answer if assignment.quiz.show_correct_answers else None,
                "is_correct": ans.is_correct,
                "points_earned": ans.points_earned,
                "max_points": ans.question.points,
                "explanation": ans.question.explanation if ans.question.explanation else None
            }
            for ans in quiz_answers
        ]
    
    return {
        "assignment": {
            "id": assignment.id,
            "title": assignment.title,
            "due_date": assignment.due_date,
            "max_attempts": assignment.max_attempts
        },
        "quiz": {
            "id": assignment.quiz.id,
            "title": assignment.quiz.title,
            "passing_score": assignment.quiz.passing_score
        },
        "latest_submission": {
            "id": latest_submission.id,
            "submitted_at": latest_submission.submitted_at,
            "is_late": latest_submission.is_late,
            "attempt_number": latest_submission.attempt_number,
            "score_percentage": latest_submission.score_percentage,
            "is_passed": latest_submission.score_percentage >= assignment.quiz.passing_score if latest_submission.score_percentage else False,
            "questions_correct": latest_submission.questions_correct,
            "questions_total": assignment.quiz.total_questions,
            "time_taken_minutes": latest_submission.time_taken_minutes,
            "is_graded": latest_submission.is_graded,
            "grade_comments": latest_submission.grade_comments
        },
        "all_attempts": [
            {
                "attempt_number": sub.attempt_number,
                "submitted_at": sub.submitted_at,
                "score_percentage": sub.score_percentage,
                "is_late": sub.is_late
            }
            for sub in reversed(submissions)
        ],
        "answers": answers,
        "results_available": True
    }

@router.get("/{assignment_id}/status", response_model=Dict[str, Any])
async def get_assignment_status(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current status of assignment for student"""
    verify_student(current_user)
    assignment = verify_assignment_access(db, assignment_id, current_user.id)
    
    # Get submission count
    submissions = db.query(ClassroomQuizSubmission).filter(
        ClassroomQuizSubmission.assignment_id == assignment_id,
        ClassroomQuizSubmission.student_id == current_user.id
    ).all()
    
    # Check for active session
    active_session = db.query(QuizSession).filter(
        QuizSession.user_id == current_user.id,
        QuizSession.context_type == "classroom",
        QuizSession.context_id == assignment_id,
        QuizSession.status == SessionStatus.IN_PROGRESS
    ).first()
    
    now = datetime.utcnow()
    is_overdue = assignment.due_date and now > assignment.due_date
    can_attempt = len(submissions) < assignment.max_attempts
    
    status = "not_started"
    if submissions:
        if len(submissions) >= assignment.max_attempts:
            status = "completed"
        elif active_session:
            status = "in_progress"
        else:
            status = "can_retry"
    elif active_session:
        status = "in_progress"
    elif is_overdue and not assignment.allow_late_submission:
        status = "overdue"
    
    return {
        "assignment_id": assignment_id,
        "status": status,
        "attempts_made": len(submissions),
        "max_attempts": assignment.max_attempts,
        "can_attempt": can_attempt and (not is_overdue or assignment.allow_late_submission),
        "is_overdue": is_overdue,
        "due_date": assignment.due_date,
        "active_session": {
            "session_id": active_session.id,
            "started_at": active_session.start_time,
            "time_limit_minutes": assignment.time_limit_minutes
        } if active_session else None,
        "latest_score": submissions[-1].score_percentage if submissions else None
    }
    
