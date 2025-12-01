## Backend Flow – QuizerAI (FastAPI)

This document breaks down the major backend flows and how they implement:

- Quiz generation.
- OCR processing.
- AWS Bedrock calls.
- Secure exam system.
- Teacher & student dashboards.
- Geofencing and anti-cheating workflows.

---

### Core API Groups

- `/api/auth/*` – Authentication & authorization.
- `/api/quizzes/*` – Quiz creation, generation, retrieval, and submission.
- `/api/ocr/*` – OCR extraction endpoints.
- `/api/assignments/*` – Linking quizzes to courses and students.
- `/api/exams/*` – Secure exam workflows (start, events, submit).
- `/api/tutor/*` – AI tutoring (chat, explanations).
- `/api/dashboard/*` – Aggregated data for teacher/student dashboards.

---

### Quiz Generation Flow (Backend)

**Endpoint**: `POST /api/quizzes/generate`

1. **Auth & Validation**
   - Verify JWT token.
   - Ensure user is a Teacher.
   - Validate request payload:
     - `source_type` (text, pdf, image, youtube).
     - `config` (difficulty, question_types, etc.).

2. **Source Handling**
   - If `source_type=text`:
     - Use `input_text` directly.
   - If `source_type=youtube`:
     - Call transcript service or internal integration.
   - If `source_type=document` (PDF/image):
     - Delegate to OCR flow first (see below).

3. **AI Orchestrator**
   - Build a prompt with:
     - Cleaned content (text/transcript).
     - Teacher-provided quiz configuration.
   - Call AWS Bedrock via `boto3`.
   - Parse response into `Quiz` DTO.

4. **Persistence**
   - Save quiz to DB with:
     - Questions, options, answers, explanations.
     - Owner (teacher) and course (if provided).

5. **Response**
   - Return quiz JSON (similar to `sample_data/sample_quiz_output.json`).

---

### OCR Processing Flow (Backend)

**Endpoint**: `POST /api/ocr/extract`

1. **Auth & Validation**
   - Verify JWT.
   - Accept file via `multipart/form-data`.
   - Validate MIME type and size.

2. **Storage**
   - Store file locally or in S3 with a unique key.

3. **Textract Integration**
   - For small docs:
     - Call `detect_document_text` or equivalent.
   - For larger docs:
     - Use asynchronous Textract job:
       - `start_document_text_detection`.
       - Store job ID and poll until completion (or handle via callback).

4. **Normalization**
   - Convert provider-specific structures into uniform internal format.
   - Optionally concatenate text for simpler workloads.

5. **Response**
   - Return normalized text and blocks to client, or directly feed into quiz generation if it’s a combined flow.

---

### AWS Bedrock Call Flow (Backend)

**Used By**: quiz generation, AI tutor, summarization, free-text grading.

1. **Configuration**
   - Model ID, region, and common parameters from environment variables.

2. **Prompt Construction**
   - Compose system and user messages.
   - Embed instructions for strict JSON output when necessary.

3. **InvokeModel**
   - Use `boto3.client("bedrock-runtime").invoke_model(...)`.
   - Pass safety settings if available (model-dependent).

4. **Response Handling**
   - Parse JSON.
   - Log relevant metadata (latency, tokens) without logging raw sensitive content.

5. **Error Handling**
   - Wrap with retry logic for transient failures.
   - Return typed error responses to client.

---

### Secure Exam System Flow (Backend)

#### 1. Exam Creation

**Endpoint**: `POST /api/exams`

1. Teacher defines:
   - Associated quiz/assignment.
   - Time window and duration.
   - Security parameters:
     - `require_geofencing`.
     - `geofence_center` and `radius_meters`.
     - `max_tab_switches` and action thresholds.
2. Backend stores an `Exam` record and optional `ExamSecurityPolicy`.

#### 2. Exam Start

**Endpoint**: `POST /api/exams/{exam_id}/start`

1. Verify:
   - Student’s enrollment in the relevant course.
   - Exam availability within configured window.
2. Create `ExamSession` record:
   - `user_id`, `exam_id`, `started_at`, `expires_at`.
3. Issue secure session token (JWT or signed token).
4. Return `exam_session_id`, token, and exam metadata.

#### 3. Answer Submission

**Endpoint**: `POST /api/quizzes/{quiz_id}/submit`

1. Validate:
   - Session token and `exam_session_id`.
   - That the exam is not expired and within allowed attempts.
2. Grade:
   - Objective questions using stored correct answers.
   - Free-text questions via AI orchestrator (Bedrock).
3. Persist:
   - `ExamAttempt` with answers, scores, and security flags.

#### 4. Result Access

**Endpoints**:
- `GET /api/exams/{exam_id}/results` (Teacher).
- `GET /api/exams/{exam_id}/my-result` (Student).

Backend enforces role-based access and reveals appropriate details (e.g., hide correct answers until after an exam window).

---

### Geofencing Workflow (Backend)

**Endpoints**:
- `POST /api/exam/events/location`

1. **Receive Event**
   - Expect:
     - `exam_session_id`
     - `lat`, `lng`
     - Timestamp.

2. **Policy Lookup**
   - Load `ExamSecurityPolicy` for the associated `Exam`.

3. **Distance Calculation**
   - Compute distance between `(lat, lng)` and configured `center`.
   - Compare with `radius_meters`.

4. **Enforcement**
   - If outside:
     - Create `SecurityEvent` of type `GEOFENCE_VIOLATION`.
     - Depending on policy:
       - Just log.
       - Return warning to frontend.
       - Invalidate session or require proctor approval.

---

### Anti-Cheating Workflow (Backend)

**Endpoint**: `POST /api/exam/events`

1. **Receive Events**
   - Payload may include:
     - `exam_session_id`.
     - List of events like:
       - `TAB_BLUR`, `TAB_FOCUS`, `FULLSCREEN_EXIT`, `CLIPBOARD_COPY`, etc.

2. **Validation**
   - Authenticate via session token.
   - Ensure events are within active exam time.

3. **Storage**
   - Insert batched events into `SecurityEvents` table.
   - Optionally aggregate counters in real-time.

4. **Policy Evaluation**
   - Compare counts against thresholds (e.g., `max_tab_switches`).
   - If violation:
     - Mark session with a security flag.
     - Optionally respond with an action (lock exam, warn, etc.).

5. **Reporting**
   - Teacher analytics endpoints summarize:
     - Incidents per exam and per student.
     - Severity scoring.

---

### Teacher & Student Dashboard Flow (Backend)

#### Teacher Dashboard

**Endpoint examples**:

- `GET /api/dashboard/teacher`
  - Aggregated overview: courses, quizzes, upcoming exams, high-level stats.
- `GET /api/courses/{course_id}/quizzes`
  - List of quizzes per course.
- `GET /api/exams/{exam_id}/attempts`
  - Detailed attempts including security flags.

The backend composes data from:

- `User & Course` module.
- `Quiz` module.
- `Assignment & Exam` module.
- `Security & Monitoring` module.

#### Student Dashboard

**Endpoint examples**:

- `GET /api/dashboard/student`
  - List of:
    - Assigned quizzes & exams.
    - Past attempts with scores.
    - Recommendations (e.g., “retake quiz”).
- `GET /api/tutor/sessions`
  - Previous tutor conversations and topics.

Data is always filtered by authenticated `user_id` to protect privacy.

---

### AI Tutor Flow (Backend)

**Endpoints**:
- `POST /api/tutor/session`
- `POST /api/tutor/message`

1. **Session Creation**
   - Student requests help on a topic or specific quiz.
   - Backend:
     - Creates `TutorSession` with reference to user and optionally quiz/attempt.
     - Calls AI orchestrator with initial context (wrong answers, topics, objectives).

2. **Message Exchange**
   - Frontend sends new messages.
   - AI orchestrator:
     - Includes chat history and learning objectives.
     - Calls Bedrock to generate a pedagogical response.

3. **Storage & Access**
   - All messages stored in DB.
   - Accessible from student dashboard for later review.

This flow ensures that the AI tutor has access to relevant context while keeping sensitive exam data secured and audit-ready.


