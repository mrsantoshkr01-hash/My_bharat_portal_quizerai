## QuizerAI Architecture Overview

QuizerAI is an AI-powered assessment and learning platform composed of a **Next.js frontend**, a **FastAPI backend**, and **AWS-based AI/OCR services** (Bedrock, Textract, S3, etc.). This document provides a conceptual overview of the major components and how they work together.

---

### High-Level Components

- **Client Applications (Web)**
  - Teacher dashboard (course management, quiz design, analytics).
  - Student dashboard (quiz taking, feedback, AI tutor).
  - Secure exam interface (proctoring, anti-cheating, geofencing).

- **API Gateway / Backend (FastAPI)**
  - Authentication & authorization (JWT, roles).
  - Quiz generation and management APIs.
  - OCR ingestion and preprocessing APIs.
  - AI orchestration for Bedrock / other LLM providers.
  - Assignment and gradebook services.
  - Anti-cheating & geofencing enforcement.

- **AI & OCR Services**
  - **AWS Bedrock** for LLM inference (quiz generation, explanation, tutoring, summarization).
  - **OCR provider** (e.g., Amazon Textract) for extracting text from PDFs and images.

- **Data & Storage**
  - Relational database (e.g., PostgreSQL) for users, quizzes, attempts, logs.
  - Object storage (e.g., S3) for PDFs, images, and OCR results.
  - Caching layer (e.g., Redis) for session data, rate limiting, and AI cache.

---

### System Architecture Diagram (Placeholder)

The following ASCII diagram is a placeholder representation of the system. The final repository should replace this with a proper diagram (e.g., draw.io, Excalidraw, or any diagramming tool) exported to `system_architecture_diagram.png`.

```text
+---------------------+          +-------------------------+
|  Web Client (Next) | <------> |   API Gateway / CORS    |
| - Teacher UI       |          +-----------+-------------+
| - Student UI       |                      |
+---------+-----------+                      v
          |                        +----------------------+
          | HTTPS                  |    FastAPI Backend   |
          |                        | - Auth & RBAC       |
          |                        | - Quiz Service      |
          |                        | - OCR Service       |
          |                        | - AI Orchestrator   |
          |                        | - Assignment/Grades |
          |                        | - Anti-cheating     |
          |                        +----------+----------+
          |                                   |
          |                          +--------+--------+
          |                          |                 |
          v                          v                 v
+----------------+          +----------------+   +-------------+
|   PostgreSQL   |          |   AWS Bedrock  |   |   Textract  |
|  (Relational)  |          | (LLM, Embeds)  |   |   (OCR)     |
+----------------+          +----------------+   +-------------+
          ^
          |
          v
   +-------------+
   |    S3       |
   | (Uploads)   |
   +-------------+
```

See also:

- `system_architecture_diagram.png` – PNG placeholder with similar ASCII diagram.
- `data_flow.md` – Detailed data flow for quiz generation, OCR, and AI.
- `aws_infrastructure.md` – AWS infrastructure layout and recommended services.
- `module_interaction.md` – Interactions between backend modules.

---

### How Quizzes Are Generated

1. **Source Acquisition**
   - Teacher uploads a **PDF**, **image**, **handwritten note**, or provides a **YouTube link / text content** from the frontend.
   - The frontend sends the file or link to the backend via a secure API call.

2. **Preprocessing & OCR**
   - For PDFs and images:
     - The backend stores the file in S3 (or equivalent object storage).
     - An OCR job is submitted (e.g., via Textract).
     - OCR results are normalized into a unified `DocumentText` representation.
   - For YouTube links:
     - A transcript fetcher (e.g., YouTube API or internal service) retrieves the transcript.
   - For raw text:
     - The text is validated and cleaned.

3. **AI Orchestration (Bedrock)**
   - The backend constructs a **prompt** or **structured request** for the LLM using:
     - Extracted text.
     - Quiz configuration (difficulty, question count, types).
     - Domain/subject metadata (grade, topic, curriculum hints).
   - The request is sent to AWS Bedrock (or configured AI provider).
   - The AI response is parsed into a canonical quiz schema:
     - Questions with IDs, type, difficulty, and Bloom level.
     - Choices and correct answers.
     - Rationales / explanations.

4. **Post-Processing & Validation**
   - Optional heuristics to:
     - Remove duplicates or low-confidence questions.
     - Normalize formatting (e.g., lettered options).
     - Enforce constraints (e.g., at least X higher-order thinking questions).

5. **Persistence & Exposure**
   - The resulting quiz is stored in the database (with optional question bank reuse).
   - The quiz is associated with the teacher, course, and assignment (if requested).
   - A clean JSON representation is returned to the frontend.

See: `data_flow.md` for a step-by-step request/response trace.

---

### How OCR Works

The OCR subsystem is responsible for robustly extracting text from heterogeneous sources:

- **Input Types**
  - PDFs (multi-page, scanned or digital).
  - Images (JPEG/PNG) including scanned textbooks.
  - Handwritten notes (less reliable but supported with best-effort OCR).

- **Processing Steps**
  1. **Upload** – Files are uploaded from the frontend and stored in an S3 bucket with a secure key.
  2. **Job Dispatch** – The backend issues an OCR request:
     - Synchronous for small documents.
     - Asynchronous for large documents (with status polling).
  3. **Extraction** – OCR provider returns:
     - Page-wise content.
     - Layout information (blocks, lines, words).
     - Confidence scores.
  4. **Normalization** – The backend converts provider-specific structures into a provider-agnostic internal format.
  5. **Text Cleaning & Segmentation** – Headings, paragraphs, tables, and figures are identified as best as possible.

- **Error Handling**
  - Timeouts and partial results are handled gracefully.
  - Fallback strategies may be used (e.g., alternative OCR provider or local Tesseract).

See: `backend_flow.md` (OCR service flow) and `aws_infrastructure.md` (Textract integration).

---

### How AWS Bedrock Is Called

- **AI Orchestrator Module**
  - Provides a high-level interface: `generate_quiz`, `summarize_content`, `tutor_response`, etc.
  - Uses AWS SDK (`boto3`) to call Bedrock’s `InvokeModel` or `InvokeModelWithResponseStream`.

- **Security & Configuration**
  - IAM roles restrict Bedrock usage to specific models and operations.
  - Environment variables store the Bedrock model ID and region.
  - Secrets (API keys, if any) are never hard-coded; they are injected at runtime.

- **Prompting Strategy**
  - System messages define role (expert teacher, exam setter, tutor).
  - User messages provide cleaned text and quiz constraints.
  - Output format is enforced via instructions or JSON schema shaping.

See: `module_interaction.md` for how the AI orchestrator integrates with quiz, tutor, and summarization services.

---

### How the Secure Exam System Works

- **Exam Creation**
  - Teacher creates an exam from one or more quizzes.
  - Security settings: time window, duration, randomization, geofencing, and anti-cheating flags.

- **Session Management**
  - When a student starts an exam:
    - The backend issues an **exam session token** bound to:
      - User ID.
      - Exam ID.
      - IP / device fingerprint (optional).
      - Start time and expiration.

- **Proctoring & Anti-Cheating**
  - The frontend reports:
    - Focus / blur events (tab switching).
    - Fullscreen exits (if enforced).
    - Suspicious events (copy/paste, screenshots).
  - The backend logs these events and may:
    - Flag the attempt for review.
    - Automatically reduce score or invalidate (configurable).

- **Geofencing**
  - For exams requiring location constraints:
    - The frontend requests geo-permissions and sends (lat, lng) periodically.
    - The backend validates that coordinates are within configured radius around an allowed point.
    - Violations may pause, terminate, or flag the attempt.

See: `backend_flow.md` (exam and anti-cheating flows) and `frontend_flow.md` (client behavior).

---

### How Teacher & Student Dashboards Interact

- **Teacher Dashboard**
  - Manages:
    - Course and class rosters.
    - Quizzes and question banks.
    - Assignments and exam configuration.
  - Visualizes:
    - Student performance.
    - Question difficulty and discrimination.
    - Suspicious exam events.

- **Student Dashboard**
  - Lists:
    - Upcoming and active assignments.
    - Past quiz attempts and grades.
    - Personalized recommendations and AI tutor sessions.
  - Provides:
    - Entry points to secure exam sessions.
    - Access to AI tutoring on previous attempts.

- **Interaction Model**
  - Teacher actions (e.g., assign quiz to class) create entries in the database.
  - Student dashboard queries those entries scoped to the authenticated user.
  - Both dashboards consume the same set of backend APIs, with role-based filtering and authorization.

See: `frontend_flow.md` for UI and navigation flows; `module_interaction.md` for backend module coverage.


