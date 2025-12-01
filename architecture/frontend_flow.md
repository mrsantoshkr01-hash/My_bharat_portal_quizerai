## Frontend Flow – QuizerAI (Next.js)

This document describes the main frontend flows for teachers and students, and how they interact with backend APIs and AI/OCR features.

---

### High-Level Pages & Layout

- **Public**
  - `/` – Landing page and marketing content.
  - `/login`, `/register` – Authentication views.

- **Teacher Area**
  - `/teacher/dashboard` – Overview of courses, quizzes, and recent activity.
  - `/teacher/courses/[courseId]` – Course-specific management.
  - `/teacher/quizzes/new` – Quiz generation wizard (from text, PDF, image, YouTube).
  - `/teacher/quizzes/[quizId]/edit` – Quiz editor.
  - `/teacher/exams/[examId]` – Exam configuration, geofencing, and security settings.

- **Student Area**
  - `/student/dashboard` – Upcoming assignments, recent scores.
  - `/student/quizzes/[quizId]` – Non-secure practice quizzes.
  - `/exam/[examSessionId]` – Secure exam-taking flow.
  - `/tutor/[sessionId]` – AI tutor chat interface.

---

### How Quizzes Are Generated (Frontend Perspective)

1. **Teacher Opens Quiz Generator**
   - Navigates to `/teacher/quizzes/new`.
   - Chooses source type:
     - Text, PDF, image, handwritten image, YouTube link.

2. **Input Collection**
   - Text input area or file upload field appears based on choice.
   - Quiz configuration form:
     - Difficulty slider.
     - Number of questions.
     - Question types (MCQ, short answer, long answer).
     - Optional Bloom level focus and tags.

3. **Submit Request**
   - Frontend validates inputs and sends a request to:
     - `POST /api/quizzes/generate` (for text/transcript).
     - `POST /api/quizzes/from-document` (for file-based content).

4. **Loading & Feedback**
   - UI shows spinner and approximate ETA.
   - For longer operations, a polling mechanism or WebSocket can be used.

5. **Display Generated Quiz**
   - Once response is returned, UI shows:
     - List of generated questions and answers.
     - Inline editor for each question (text fields, options).
   - Teacher can:
     - Edit questions.
     - Remove or reorder items.
     - Save the quiz to a course or question bank.

---

### How OCR Works (Frontend Perspective)

1. **Upload Step**
   - Teacher selects a PDF or image file in `/teacher/quizzes/new`.
   - Component displays selected filename, size, and preview (if image).

2. **Upload & OCR Trigger**
   - On submit, the file is sent as `multipart/form-data` to `POST /api/ocr/extract` or a combined quiz-generation endpoint.

3. **Progress Display**
   - UI shows progress bar or “extracting text…” message.
   - Optional progress updates based on backend polling endpoints.

4. **Text Preview (Optional)**
   - Once OCR returns text, a side-by-side view may show:
     - Original file preview.
     - Extracted text editor.
   - Teacher can clean up text before initiating quiz generation.

---

### How AWS Bedrock Is Used in the UI

- **Quiz Generation**
  - Teachers indirectly trigger Bedrock calls by hitting quiz-generation endpoints.
  - UI abstracts AI details and focuses on configuration and reviewing outputs.

- **AI Tutor**
  - Students type questions or choose “Explain this question” on a quiz review page.
  - Frontend calls `POST /api/tutor/session` or `POST /api/tutor/message`.
  - Responses are rendered in a chat-like UI, optionally streaming.

- **Summarization**
  - Optionally, teacher can request a summary of a document or YouTube lecture.
  - UI calls `POST /api/summarize` and renders a summary (see `sample_summary.json`).

All of these flows rely on the same AI orchestration backend but appear as user-friendly features on the frontend.

---

### Secure Exam Flow (Frontend)

1. **Entry Point**
   - Student clicks an assignment or exam card on `/student/dashboard`.
   - If secure exam, the UI:
     - Shows pre-exam instructions.
     - Asks permission to access location (for geofencing).
     - Suggests full-screen mode and warns about tab switching.

2. **Session Initialization**
   - Frontend calls `POST /api/exams/{examId}/start`.
   - Receives an `examSessionId` and session token.
   - Navigates to `/exam/[examSessionId]`.

3. **Exam UI**
   - Displays questions one-by-one or in pages.
   - Timer component shows remaining time.
   - Action bar for:
     - Save & Next.
     - Flag question.
     - Submit exam.

4. **Geofencing Workflow**
   - On supported browsers:
     - Frontend requests geolocation access.
     - Periodically sends `(lat, lng)` to `/api/exam/events/location`.
   - UI shows warnings or blocking states if backend responds with policy violations.

5. **Anti-Cheating Workflow**
   - JavaScript listeners capture:
     - `window.onblur` / `visibilitychange` events.
     - Full-screen exit events.
   - Suspicious actions are batched and sent to `/api/exam/events`.
   - UI may:
     - Show a warning banner with each event.
     - Lock the exam if instructed by the backend.

6. **Submission & Post-Exam**
   - On submission, frontend posts answers to `POST /api/quizzes/{quizId}/submit`.
   - Student is redirected to:
     - Immediate results page, or
     - “Results pending” page, depending on exam settings.

---

### Teacher & Student Dashboard Interaction

- **Teacher Dashboard**
  - Fetches:
     - Assigned exams and their statuses.
     - Aggregated performance metrics (average scores, question difficulty).
     - Security summary (cheating flags, geofence violations).
  - Allows:
     - Drill-down into specific students or attempts.
     - Export of results.

- **Student Dashboard**
  - Fetches:
     - Active assignments and upcoming exams.
     - Past results and AI tutor links.
  - Provides:
     - Quick access to retake practice quizzes (where allowed).
     - Launch entry to `/tutor/[sessionId]` for review support.

---

### Error Handling & UX Considerations

- **Backend Errors / AI Timeouts**
  - Show clear, non-technical messages with retry options.
  - Provide fallback views (e.g., partial quiz generation with manual editing).

- **Network Interruptions During Exams**
  - Implement local autosave in browser storage.
  - Retry loop for saving answers.
  - Clear indication of connectivity status to student.

- **Accessibility**
  - Use semantic HTML and ARIA labels.
  - Ensure color contrast and keyboard navigation in critical flows (exam, dashboards).

These flows are designed to be intuitive for hackathon demos yet robust enough to evolve into production-grade UX.


