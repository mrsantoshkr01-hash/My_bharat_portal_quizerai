## Data Flow – QuizerAI

This document describes the end-to-end data flow in QuizerAI, focusing on:

- Quiz generation from multiple content types.
- OCR extraction pipeline.
- AWS Bedrock calls for intelligence.
- Secure exam operations.
- Interactions between teacher and student dashboards.

---

### 1. Quiz Generation Flow

#### 1.1 From PDF / Image / Handwritten Notes

1. **Upload**
   - Teacher uploads `sample.pdf`, `sample_image.jpg`, or `handwritten_sample.jpg` via the frontend.
   - The browser sends a `multipart/form-data` request to `POST /api/ocr/extract` or `POST /api/quizzes/from-document`.

2. **Temporary Storage**
   - FastAPI receives the file, validates size/type, and stores it to:
     - Local temp storage (development) or
     - An S3 bucket (production), e.g., `s3://quizerai-uploads/{tenant}/{uuid}.pdf`.

3. **OCR Dispatch**
   - Backend enqueues or directly performs an OCR request:
     - Synchronous call for small docs using Textract’s `detect_document_text`.
     - Asynchronous job (start + poll) for large documents using `start_document_text_detection`.

4. **OCR Extraction**
   - OCR provider returns structured data with pages, blocks, lines, words, and confidence scores.

5. **Normalization & Cleaning**
   - Backend converts provider-specific objects into an internal representation:
     - `DocumentPage`, `DocumentBlock`, `DocumentParagraph`.
   - Text is cleaned (removal of headers/footers, page numbers if identifiable).

6. **AI Prompt Construction**
   - Teacher’s quiz configuration (difficulty, number of questions, target grade) is merged with extracted text.
   - A structured prompt is created for AWS Bedrock, specifying:
     - Desired question types (MCQ, short answer, long answer).
     - Bloom levels (remember, understand, apply, analyze, evaluate, create).
     - Output format (strongly encouraged JSON).

7. **Bedrock Invocation**
   - Backend sends the prompt to AWS Bedrock via `boto3` (e.g., `bedrock-runtime.invoke_model`).

8. **Model Output & Parsing**
   - The LLM returns a JSON-like output with:
     - Questions, answer choices, correct answer(s).
     - Explanations / rationales.
   - Backend parses and validates structure, applying fallbacks for minor formatting issues.

9. **Persistence & Response**
   - Parsed quiz is stored in the database.
   - A normalized quiz JSON is returned to the frontend and can also be downloaded.

See sample quiz format in `sample_data/sample_quiz_output.json`.

---

#### 1.2 From Text or YouTube Link

1. **Input**
   - Teacher enters raw text into a textarea or uploads a `sample_youtube_link.txt` with a URL.

2. **Transcript Acquisition (for video)**
   - Backend fetches a transcript from YouTube (or an external service).
   - Transcript text is combined with title and description metadata.

3. **Prompting**
   - Similar to the document flow, but the source content is transcript or raw text.

4. **AI Generation**
   - The AI orchestrator calls Bedrock to produce quiz questions, answers, and explanations.

5. **Storage & Response**
   - Quiz is saved in the database and returned to the frontend in a consistent JSON schema.

---

### 2. OCR Extraction Flow

1. **API Call**
   - `POST /api/ocr/extract` receives file or S3 key.
2. **Security & Validation**
   - Authentication via JWT.
   - File type, size, and rate limits enforced.
3. **Upload to Storage**
   - Store to S3 or local disk with a unique identifier.
4. **OCR Job Execution**
   - Invoke OCR provider SDK with reference to the stored file.
   - For asynchronous jobs, store OCR job ID and polling metadata.
5. **Result Aggregation**
   - Once done, read structured OCR output.
6. **Normalization & Response**
   - Normalize text into `blocks` or `pages`.
   - Return:
     - Raw blocks.
     - Concatenated text.
     - Optional statistics (word count, confidence summary).

This normalized text can then be fed into the quiz generation process or summarization.

---

### 3. AWS Bedrock Call Flow

1. **Request Formation**
   - Backend constructs Bedrock input including:
     - Model ID (from env).
     - System and user messages.
     - Generation parameters (max tokens, temperature, etc.).
2. **Secure Invocation**
   - AWS credentials and IAM roles limit Bedrock access.
3. **Response Handling**
   - Parse JSON response or text with JSON snippet.
   - Validate and map to internal DTOs (e.g., `Quiz`, `Summary`, `TutorMessage`).
4. **Error Handling**
   - Timeouts, rate limits, and malformed responses handled with retry strategies and explicit error messages.

---

### 4. Secure Exam System Data Flow

1. **Exam Setup (Teacher)**
   - Teacher configures:
     - Exam title, quizzes included, time window, duration.
     - Security settings (geofence radius, anti-cheating flags).
   - Backend stores an `Exam` entity linked to relevant `Quiz` entities.

2. **Exam Start (Student)**
   - Student navigates to exam URL and authenticates.
   - Backend checks:
     - Time window validity.
     - Student enrollment in course.
   - Backend issues:
     - `ExamSession` record in DB.
     - Signed token containing `exam_id`, `user_id`, expiration.

3. **Geofencing & Anti-Cheating**
   - Frontend periodically sends:
     - Geo-coordinates (if enabled and permitted).
     - Focus/blur and full-screen events.
   - Backend validates:
     - Geo within radius from configured center.
     - Abnormal number of suspicious events.
   - Policy-based decisions:
     - Log and continue.
     - Warn student.
     - Terminate session or flag attempt.

4. **Answer Submission**
   - On each save or final submit:
     - Student answers are sent to `POST /api/quizzes/{quiz_id}/submit`.
   - Backend:
     - Validates session token and exam state.
     - Grades answers (either rule-based or via AI for free text).
     - Stores attempt details and cheating metadata.

5. **Result Propagation**
   - Teacher dashboard reads aggregated attempt data and cheating logs.
   - Student dashboard shows results and feedback (immediate or delayed).

---

### 5. Teacher & Student Dashboard Interaction

1. **Teacher Actions**
   - Create/update courses, upload materials, generate quizzes, configure exams.
   - Backend writes to `Course`, `Quiz`, `Exam`, `Assignment`, and related tables.

2. **Student View**
   - Student dashboard fetches:
     - Enrolled courses and assigned quizzes.
     - Upcoming exams with security requirements.
     - Historical performance data.

3. **AI Tutor**
   - Student selects a past attempt or topic.
   - Frontend calls `POST /api/tutor/session` with:
     - Context (quiz questions, wrong answers).
     - Student intent (e.g., “help me understand photosynthesis”).
   - Backend:
     - Fetches relevant models and content.
     - Calls Bedrock with a tutoring-specific prompt.
   - Responses are streamed or paginated to the client.

See also:

- `frontend_flow.md` – Detailed front-end flows for teachers and students.
- `backend_flow.md` – API route-level breakdown of the same flows.


