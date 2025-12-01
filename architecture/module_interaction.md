## Module Interaction – QuizerAI Backend

This document explains how major backend modules interact, especially for:

- Quiz generation.
- OCR processing.
- AWS Bedrock integration.
- Secure exam system.
- Teacher & student dashboard flows.
- Geofencing and anti-cheating workflows.

---

### High-Level Modules

- **Auth Module**
  - Handles sign up, login, password reset.
  - Issues and validates JWTs.
  - Enforces role-based access control (Teacher, Student, Admin).

- **User & Course Module**
  - Manages users, roles, courses, and enrollments.

- **Quiz Module**
  - Creates, updates, and stores quizzes.
  - Interfaces with the AI Orchestrator to generate quizzes.

- **OCR Module**
  - Accepts document uploads.
  - Integrates with Textract (or other OCR providers).
  - Produces normalized text for downstream modules.

- **AI Orchestrator**
  - Abstracts AI providers (mainly AWS Bedrock).
  - Exposes high-level methods:
    - `generate_quiz()`
    - `summarize_content()`
    - `tutor_reply()`
    - `grade_free_text_answer()`

- **Assignment & Exam Module**
  - Links quizzes to courses and specific assignment windows.
  - Manages exam sessions, attempts, and grading.

- **Security & Monitoring Module**
  - Collects geofencing and anti-cheating signals.
  - Exposes APIs for UI to log focus/tab events.
  - Persists security logs for analysis.

---

### Quiz Generation – Module Interactions

1. **Teacher Action (Frontend)**
   - Teacher configures quiz options and uploads or enters content.

2. **API Call**
   - Frontend calls `Quiz API` (`/api/quizzes/generate`) with:
     - `source_type` (text, pdf, image, youtube).
     - `config` (difficulty, count, etc.).

3. **Backend Flow**
   - **Auth Module**
     - Validates JWT and ensures `role=TEACHER`.
   - **OCR Module** (if file-based):
     - Stores incoming file.
     - Calls OCR provider.
     - Returns normalized text.
   - **AI Orchestrator**
     - Receives text and quiz config.
     - Calls Bedrock with a structured prompt.
     - Returns quiz object.
   - **Quiz Module**
     - Transforms quiz object into DB entities.
     - Associates quiz with the teacher and (optionally) a course/bank.

4. **Response**
   - Quiz data is returned to the frontend, which shows a preview for edits.

---

### OCR Processing – Module Interactions

1. **Upload Initiation**
   - Frontend calls `OCR API` (`/api/ocr/extract`).

2. **Backend Flow**
   - **Auth Module**
     - Validates user (Teacher or Student depending on flow).
   - **OCR Module**
     - Validates file.
     - Stores in S3 / local.
     - Dispatches Textract job via AWS SDK.
     - Polls or receives callback on completion.
   - **OCR Module -> Quiz Module (optional)**
     - If the endpoint is `from-document`, OCR passes text to Quiz module for quiz generation.

3. **Response**
   - Either:
     - Just OCR text (for manual editing), or
     - A fully generated quiz (if combined flow).

---

### AWS Bedrock Integration – Module Interactions

1. **Caller Modules**
   - **Quiz Module** for quiz generation.
   - **Tutor Module** (part of AI Orchestrator) for interactive tutoring.
   - **Summarization Module** for content summarization.
   - **Grading Module** for free-text answer evaluation.

2. **AI Orchestrator Abstraction**
   - Provides a unified interface to:
     - Select the model.
     - Construct prompts.
     - Parse results.
   - Handles:
     - Error and retry strategies.
     - Logging and metrics.

3. **Security Module**
   - Optionally logs AI usage (who generated what, when, from which course).

---

### Secure Exam System – Module Interactions

1. **Exam Configuration**
   - **Assignment & Exam Module**
     - Receives exam configuration from teacher (via API).
     - Stores exam metadata in DB.

2. **Start Exam**
   - **Auth Module**
     - Ensures user is a Student.
   - **Assignment & Exam Module**
     - Verifies exam availability and eligibility.
     - Creates `ExamSession` record and returns a session token.

3. **During Exam**
   - **Security & Monitoring Module**
     - Receives geolocation, focus, and suspicious event logs.
     - Evaluates against exam security config (geofence, anti-cheating thresholds).
   - **Assignment & Exam Module**
     - Tracks answer progress and intermediate saves.

4. **Submit Exam**
   - **Assignment & Exam Module**
     - Validates session.
     - Grades objective questions directly.
     - For open-ended answers, calls **AI Orchestrator** for ML-based scoring and feedback.
   - **Security & Monitoring Module**
     - Attaches incident logs to the attempt for teacher review.

---

### Teacher & Student Dashboards – Module Interactions

- **Teacher Dashboard**
  - Reads:
    - Courses (User & Course Module).
    - Quizzes (Quiz Module).
    - Assignments and exam results (Assignment & Exam Module).
    - Security incidents (Security & Monitoring Module).
  - Writes:
    - New quizzes, assignments, and exams.
    - Revised settings for geofencing and anti-cheating.

- **Student Dashboard**
  - Reads:
    - Enrollments and assignments.
    - Past attempts and feedback.
  - Writes:
    - New quiz attempts.
    - Requests for AI tutoring (Tutor Module via AI Orchestrator).

---

### Geofencing Workflow – Module Interactions

1. **Configuration**
   - Teacher configures geofence:
     - Latitude, longitude, and radius in meters.
   - **Assignment & Exam Module** stores these parameters in DB.

2. **Runtime**
   - Frontend obtains location (with user consent) and sends periodic updates during exams.
   - **Security & Monitoring Module**:
     - Computes distance from allowed center.
     - Compares with radius.
     - Writes geofence events (in/out of bounds) to security logs.

3. **Policy Enforcement**
   - **Assignment & Exam Module**:
     - Consults security logs and exam policies.
     - May:
       - Only log violations.
       - Apply scoring penalties.
       - Force end of exam or revoke session.

---

### Anti-Cheating Workflow – Module Interactions

1. **Signal Collection (Frontend)**
   - Frontend monitors:
     - Tab focus/blur.
     - Full-screen mode changes.
     - Copy/paste key events (where appropriate).
   - Sends events to `POST /api/exam/events`.

2. **Backend Processing**
   - **Security & Monitoring Module**
     - Validates and stores events tagged by `exam_session_id` and `user_id`.
     - Classifies severity (low, medium, high).
   - **Assignment & Exam Module**
     - Reads aggregated events when exam is submitted or reviewed.

3. **Review & Analytics**
   - Teacher dashboard:
     - Shows event counts and severity for each attempt.
     - Highlights suspicious patterns (e.g., frequent tab switches).

4. **AI-assisted Review (Optional)**
   - **AI Orchestrator**
     - Can be used to summarize exam logs for teacher review.

This modular design keeps security concerns centralized while still allowing each feature (quiz, tutor, assignments) to integrate with anti-cheating and geofencing policies.


