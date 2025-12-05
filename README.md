## QuizerAI – AI-Powered Assessment & Learning Platform

QuizerAI is an AI-first assessment and learning platform that helps educators create secure, adaptive, and engaging quizzes from documents, images, videos, and web links. It leverages OCR, AWS Bedrock, and modern web technologies to power everything from question generation and grading to AI tutoring and learning analytics.

QuizerAI is designed to be **hackathon-ready**, **cloud-native**, and **extensible**, making it an ideal starting point for teams building innovative edtech solutions.

---

### Key Features

- **AI Quiz Generation**
  - Generate quizzes from PDFs, images, YouTube links, or plain text.
  - Supports MCQs, short answers, long answers, and Bloom-level tagging.
  - Configurable difficulty, number of questions, and target learning outcomes.

- **OCR & Document Ingestion**
  - Extracts text from PDFs and images (including handwriting) using OCR (e.g., Amazon Textract, Tesseract, or other providers).
  - Cleans and normalizes text for downstream AI processing.

- **AWS Bedrock-Powered Intelligence**
  - Uses Bedrock models for quiz generation, summarization, answer evaluation, and AI tutoring.
  - Pluggable AI provider interface to support multiple LLMs.

- **Secure Exam System**
  - Exam session tokens and time limits.
  - Optional geo-fencing and IP-based constraints.
  - Anti-cheating mechanisms (tab activity, suspicious behavior logging, question randomization).

- **Teacher & Student Dashboards**
  - Teacher dashboard: manage classes, assignments, question banks, and analytics.
  - Student dashboard: take quizzes, view feedback, access AI tutor, and track progress.

- **Extensible API-First Backend**
  - FastAPI backend exposing REST endpoints for quiz generation, OCR, AI tutor, and assignment management.
  - JWT-based authentication & role-based authorization (Teacher / Student / Admin).

- **Modern Frontend**
  - Next.js frontend with a responsive, accessible UI.
  - Dashboard flows for teachers and students, including quiz taking, reviewing, and tutoring.

---

### Tech Stack

- **Frontend**
  - Next.js (React, TypeScript)
  - Tailwind CSS or similar utility-first CSS framework
  - Axios / Fetch for API calls

- **Backend**
  - Python 3.x
  - FastAPI
  - SQLAlchemy / async DB client (e.g., MySQL)
  - Redis (optional) for caching and rate limiting

- **AI & OCR**
  - AWS Bedrock (LLMs, embeddings)
  - Amazon Textract / OCR provider for PDFs & images

- **Infrastructure (suggested)**
  - AWS Lambda / ECS / EKS for backend
  - API Gateway / ALB
  - RDS / Aurora (MYSQL)
  - S3 for file storage
  - CloudFront for CDN

---

### System Architecture Overview

At a high level, QuizerAI consists of:

- **Frontend (Next.js)**
  - Browser-based dashboards for teachers and students.
  - Communicates with the backend via secure REST APIs.

- **Backend (FastAPI)**
  - Authentication and user management.
  - Quiz generation, grading, and assignment APIs.
  - OCR ingestion pipeline.
  - AI orchestration layer for Bedrock and other providers.

- **AI & OCR Services**
  - OCR extracts text from PDFs and images.
  - AI models (via Bedrock) generate quizzes, summaries, and tutoring responses.

- **Data Layer**
  - Relational database for users, classes, quizzes, attempts, and logs.
  - Object storage (S3) for uploaded assets (PDFs, images).

See detailed architecture documentation in the `architecture` folder:

- `architecture/architecture_overview.md`
- `architecture/data_flow.md`
- `architecture/aws_infrastructure.md`
- `architecture/module_interaction.md`
- `architecture/frontend_flow.md`
- `architecture/backend_flow.md`

**Diagram placeholders (replace with actual diagrams later):**

- System Architecture Diagram: `architecture/system_architecture_diagram.png`
- Data Flow Diagram: (add link in `architecture/data_flow.md`)

---

### Folder Structure

```text
Quizerai/
  README.md
  LICENSE
  CONTRIBUTING.md
  CODE_OF_CONDUCT.md
  SECURITY.md

  architecture/
    architecture_overview.md
    system_architecture_diagram.png
    data_flow.md
    aws_infrastructure.md
    module_interaction.md
    frontend_flow.md
    backend_flow.md

  sample_data/
    sample.pdf
    sample_image.jpg
    handwritten_sample.jpg
    sample_youtube_link.txt
    sample_quiz_output.json
    sample_summary.json

  tests/
    test_quiz_generation.py
    test_ocr_extraction.py
    test_ai_tutor.py
    test_assignment_api.py
    test_authentication.py

  QuizerAi_backend/
    app/
      main.py
      ... (FastAPI routers, models, services, etc.)

  QuizerAI_front/
    src/
      app/
        ... (Next.js routes, pages, and components)
    public/
      ... (static assets)
```

---

### Installation Guide

#### Backend (FastAPI)

The backend lives under `QuizerAi_backend/`.

1. **Create and activate a virtual environment**

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. **Install dependencies**

Create a `requirements.txt` similar to:

```bash
fastapi
uvicorn[standard]
python-multipart
Pillow
boto3
botocore
httpx
sqlalchemy
psycopg2-binary
python-jose[cryptography]
passlib[bcrypt]
pytest
pytest-asyncio
```

Then install (from within `QuizerAi_backend/`):

```bash
pip install -r requirements.txt
```

3. **Setup environment variables**

See **Environment Variables Setup** below.

4. **Start the backend server**

```bash
cd QuizerAi_backend
uvicorn app.main:app --reload
```

Make sure your FastAPI app is defined in `app/main.py` as `app = FastAPI(...)`.

#### Frontend (Next.js)

The frontend lives under `QuizerAI_front/`.

1. **Install Node.js and package manager**
   - Node.js 18+ is recommended.

2. **Install dependencies** (from within `QuizerAI_front/`):

```bash
npm install
# or
yarn install
```

3. **Setup environment variables**

See **Environment Variables Setup** below.

4. **Run the development server**

```bash
npm run dev
# or
yarn dev
```

---

### Environment Variables Setup

Use a `.env` file (backend) and `.env.local` (frontend). The exact variables may differ by implementation, but a typical setup looks like:

#### Backend `.env`

```bash
APP_ENV=development
APP_DEBUG=true
API_PREFIX=/api

DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/quizerai

JWT_SECRET=change_me_in_production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRES_MIN=60

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_AWS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET
AWS_BEDROCK_MODEL_ID=anthropic.claude-v2
AWS_TEXTRACT_ROLE_ARN=arn:aws:iam::123456789012:role/TextractRole
S3_BUCKET_UPLOADS=quizerai-uploads-dev

ALLOWED_ORIGINS=http://localhost:3000

GEOFENCE_RADIUS_METERS=200
GEOFENCE_ALLOWED_LAT=0.0
GEOFENCE_ALLOWED_LNG=0.0
```

#### Frontend `.env.local`

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_ENABLE_EXAM_SECURITY=true
```

Never commit real secrets to Git. Use environment variables or a secret manager.

---

### Running the Backend (FastAPI)

Assuming you have created `app/main.py`:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Common API groups you might implement:

- `POST /api/quizzes/generate` – Generate a quiz from text / document / media.
- `POST /api/ocr/extract` – Upload a file for OCR extraction.
- `POST /api/assignments` – Create a quiz assignment for a class.
- `POST /api/auth/login` – Authenticate user and obtain JWT token.
- `GET  /api/dashboard/teacher` – Teacher overview.
- `GET  /api/dashboard/student` – Student overview.

Refer to the tests in the `tests` folder for expected behavior and payload shapes.

---

### Running the Frontend (Next.js)

With dependencies installed in `QuizerAI_front/` and `NEXT_PUBLIC_API_BASE_URL` set:

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` to access:

- Teacher dashboard: e.g., `/teacher/dashboard`
- Student dashboard: e.g., `/student/dashboard`
- Exam taking UI: e.g., `/exam/[examId]`

---

### Using AI APIs (Bedrock / Textract / OCR)

QuizerAI is designed with an abstraction layer for AI and OCR:

- **OCR Layer**
  - Input: file (PDF / image) or S3 object key.
  - Output: normalized text blocks and metadata (page, coordinates, confidence).
  - Implementation options:
    - Amazon Textract (`boto3.client("textract")`).
    - Open-source OCR (e.g., Tesseract) for local development.

- **AI Orchestration Layer (Bedrock)**
  - Input: cleaned text, quiz configuration (num questions, difficulty), role (teacher/student).
  - Output: structured quiz objects (questions, options, answers, explanations).
  - Implemented via a client that wraps AWS Bedrock’s `InvokeModel` API.

Security considerations:

- Never send raw PII without masking, where regulations apply.
- Use strict IAM roles for Bedrock & Textract.
- Log only the minimum necessary metadata.

---

### Sample API Calls

#### Generate Quiz from Text

```bash
curl -X POST "http://localhost:8000/api/quizzes/generate" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "source_type": "text",
    "input_text": "Photosynthesis is the process by which green plants...",
    "num_questions": 10,
    "difficulty": "medium",
    "question_types": ["mcq", "short_answer"],
    "metadata": {
      "grade_level": "8",
      "subject": "Biology"
    }
  }'
```

#### OCR Extraction from PDF

```bash
curl -X POST "http://localhost:8000/api/ocr/extract" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "file=@sample_data/sample.pdf"
```

#### Submit Quiz Attempt

```bash
curl -X POST "http://localhost:8000/api/quizzes/{quiz_id}/submit" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "attempt_id": "attempt_123",
    "answers": [
      { "question_id": "q1", "answer": "B" },
      { "question_id": "q2", "answer": "The chloroplast..." }
    ],
    "client_metadata": {
      "browser_focus_events": 2,
      "suspicious_events": ["tab_switch"],
      "geo": {
        "lat": 12.9716,
        "lng": 77.5946
      }
    }
  }'
```

---

### Running Tests

Tests are implemented using **pytest** and **FastAPI’s** `TestClient`. They are designed to be realistic but are safe to run even if you have not yet implemented the full app.

From the repository root:

```bash
pytest
```

The tests will:

- Attempt to import `app.main:app` (FastAPI instance).
- Skip gracefully (with a clear message) if the app or FastAPI is not yet present.
- Validate endpoints related to quiz generation, OCR, AI tutor, assignments, and authentication when implemented.

See:

- `tests/test_quiz_generation.py`
- `tests/test_ocr_extraction.py`
- `tests/test_ai_tutor.py`
- `tests/test_assignment_api.py`
- `tests/test_authentication.py`

---

### Sample Data Description

Sample data is provided for local development and testing in the `sample_data` folder:

- `sample.pdf` – Placeholder academic PDF document used for OCR and quiz generation.
- `sample_image.jpg` – Placeholder printed text image (e.g., a page from a textbook).
- `handwritten_sample.jpg` – Placeholder image representing handwritten notes for OCR robustness testing.
- `sample_youtube_link.txt` – Text file containing a sample YouTube URL and description for video-based quiz generation.
- `sample_quiz_output.json` – Example quiz JSON generated by the AI orchestration layer.
- `sample_summary.json` – Example summary of learning content generated from the same source document.

These files contain **placeholder text only** (no proprietary content) and illustrate the expected shapes and usage.

---

### Contribution Guide

Contributions are welcome! Please read `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` before opening an issue or pull request.

High-level expectations:

- Use feature branches and clear branch names (e.g., `feature/quiz-builder-ui`, `fix/ocr-timeout`).
- Add or update tests where appropriate.
- Keep PRs focused and well-described.

See:

- `CONTRIBUTING.md` – Contribution workflow, coding standards, and PR rules.
- `CODE_OF_CONDUCT.md` – Expected behavior for all contributors.

---

### Troubleshooting

- **Backend won’t start**
  - Check that `DATABASE_URL` and other required env vars are set.
  - Confirm that the database is reachable and migrations (if any) are applied.
  - Verify that `uvicorn app.main:app` points to the correct module.

- **CORS errors from frontend**
  - Ensure `ALLOWED_ORIGINS` includes the frontend origin (e.g., `http://localhost:3000`).
  - Verify CORS middleware is configured in FastAPI.

- **OCR failures**
  - Confirm AWS credentials are configured and valid.
  - Check that the Textract IAM role and permissions are correct.
  - Verify that the sample files are under the size and format limits of your OCR provider.

- **Bedrock / AI failures**
  - Ensure Bedrock is enabled in the selected AWS region.
  - Confirm the correct `AWS_BEDROCK_MODEL_ID`.
  - Check CloudWatch logs for model invocation errors.

- **Geofencing / anti-cheating not working**
  - Make sure the frontend is collecting geo and focus/tab events (if implemented).
  - Confirm geofence configuration in environment variables.
  - Review anti-cheating logs in your database or logging system.

---

### License

This project is licensed under the **MIT License** – see `LICENSE` for details.

---

### Contact Information

For questions, support, or collaboration:

- **Project**: QuizerAI
- **Maintainer**: [Your Name or Organization]
- **Email**: [your-email@example.com]
- **Issues & Feature Requests**: Use the GitHub Issues tab.

If you are reporting a security vulnerability, please refer to `SECURITY.md` for responsible disclosure guidelines.


