## AWS Infrastructure – QuizerAI

This document outlines a reference AWS architecture for deploying QuizerAI. It is intentionally flexible so you can adapt it to hackathon setups, serverless deployments, or production-ready stacks.

---

### Core AWS Services

- **Compute**
  - **AWS Lambda** (serverless) or **ECS/EKS** (containerized) for the FastAPI backend.
  - **Amplify / S3 + CloudFront** for hosting the Next.js frontend (or Vercel / other provider).

- **Networking & Access**
  - **Amazon API Gateway** or **Application Load Balancer (ALB)** for HTTPS routing to the backend.
  - **AWS WAF** and security groups for network protection.
  - **AWS IAM** for fine-grained access control to Bedrock, Textract, S3, and other services.

- **Storage & Databases**
  - **Amazon RDS (PostgreSQL / Aurora)** for relational data (users, quizzes, attempts).
  - **Amazon S3** for file uploads (PDFs, images, OCR outputs).

- **AI & OCR**
  - **AWS Bedrock** for LLM-based quiz generation, tutoring, and summarization.
  - **Amazon Textract** (or other OCR) for document text extraction.

- **Observability & Security**
  - **Amazon CloudWatch** for logs, metrics, and alerts.
  - **AWS CloudTrail** for auditing API calls.
  - **AWS Config** for compliance checks.

---

### Recommended Architecture (Reference)

1. **Frontend**
   - Build the Next.js app and deploy static assets to:
     - S3 bucket with `index.html` and assets, fronted by CloudFront, or
     - AWS Amplify hosting / Vercel.

2. **Backend**
   - Option A – **Serverless**:
     - Package FastAPI app with an adapter (e.g., Mangum) and deploy to Lambda.
     - Use API Gateway (REST or HTTP APIs) to route requests to Lambda.
   - Option B – **Containers**:
     - Package the backend as a Docker image and deploy on:
       - ECS Fargate, or
       - EKS (Kubernetes).
     - Use an ALB (Application Load Balancer) to route HTTPS traffic.

3. **Data & Storage**
   - **RDS** for transactional data.
   - **S3** for file uploads:
     - `quizerai-uploads-<env>` for raw PDFs/images.
     - Optionally a dedicated bucket or prefix for OCR outputs.

4. **AI & OCR**
   - **Textract workflow**:
     - Frontend uploads -> Backend -> S3.
     - Backend triggers Textract (synchronous or asynchronous).
     - Textract reads from S3 and writes results back (directly or via callback/polling).
   - **Bedrock workflow**:
     - Backend constructs Bedrock request and calls `InvokeModel`.
     - Bedrock returns quiz / summary / tutor responses.

5. **Security**
   - **IAM roles**:
     - Backend role with permissions to read/write S3 objects, invoke Textract and Bedrock, and access RDS.
   - **Network segmentation**:
     - RDS and Redis in private subnets.
     - Public ALB/API Gateway with TLS termination.
   - **Secrets management**:
     - Use AWS Secrets Manager or SSM Parameter Store for DB credentials, JWT secrets, etc.

---

### Quiz Generation & OCR in AWS Context

- **Quiz Generation**
  - Backend in Lambda/ECS calls Bedrock.
  - Bedrock model (e.g., Anthropic Claude or Amazon Titan) runs within AWS, no data leaves the region.
  - Results are stored in RDS and returned to the client.

- **OCR**
  - Uploaded files are stored in S3.
  - Textract reads the files and generates text plus layout data.
  - Backend fetches results from Textract and normalizes them for AI input.

Both flows are fully contained within AWS, keeping data under your account’s control and benefiting from VPC, IAM, and encryption features.

---

### Secure Exam, Geofencing & Anti-Cheating in AWS

- **Secure Exam**
  - Exam configuration, attempts, and logs stored in RDS.
  - Session tokens signed by backend, optionally cached in Redis/ElastiCache.

- **Geofencing**
  - Geofence configuration (center coordinates, radius) stored in RDS.
  - Backend evaluates each location event from the frontend.

- **Anti-Cheating**
  - Events (tab switches, suspicious actions) logged to:
     - RDS for structured querying, and/or
     - CloudWatch / Kinesis Firehose for analytics.
  - Optional: use AWS Athena / QuickSight on logs for analytics dashboards.

---

### Security Best Practices

- Enforce **HTTPS everywhere** using ACM-managed certificates.
- Use **least-privilege IAM policies** for Bedrock, Textract, and S3.
- Encrypt:
  - RDS at rest.
  - S3 buckets with SSE-S3 or SSE-KMS.
  - All in-transit connections with TLS.
- Use **WAF rules** to protect APIs against common web attacks.
- Regularly scan dependencies (see `SECURITY.md` for additional guidance).


