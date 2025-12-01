## Security Policy

This document describes how to report vulnerabilities and outlines basic security practices for the QuizerAI project.

---

### Reporting Vulnerabilities

If you discover a security vulnerability in QuizerAI:

- **Do not** create a public GitHub issue with sensitive details.
- Instead, please contact the maintainers directly:
  - Email: [your-email@example.com]

When reporting, please include:

- A description of the issue and its potential impact.
- Steps to reproduce (if possible).
- Any relevant logs, configuration snippets, or environment details.

We aim to:

- Acknowledge receipt of your report within a reasonable time.
- Provide an initial assessment and next steps.
- Keep you updated as we triage and address the issue.

---

### Supported Versions

As this is an open-source project, support may vary. In general:

- The **default branch** (e.g., `main`) is considered the actively maintained version.
- Older branches may not receive security updates unless explicitly noted.

---

### Secure Coding Practices

Contributors are encouraged to follow these practices when working on QuizerAI:

- **Authentication & Authorization**
  - Use JWT or equivalent mechanisms for session management.
  - Implement role-based access control (Teacher, Student, Admin).
  - Do not expose endpoints that modify state without proper authorization checks.

- **Input Validation & Output Encoding**
  - Validate and sanitize all user inputs, especially:
    - File uploads (type, size).
    - Free-form text (for potential prompt injection or XSS vectors).
  - Use proper output encoding in the frontend to prevent XSS.

- **Secrets Management**
  - Never commit secrets (API keys, DB passwords, JWT keys) to the repository.
  - Use environment variables, secret managers, or vaults.

- **Cryptography**
  - Use established libraries and algorithms; do not roll your own crypto.
  - Keep JWT signing keys and encryption keys secure and rotated when necessary.

- **Error Handling & Logging**
  - Avoid leaking sensitive information in error messages or logs.
  - Use structured logging that can be filtered and monitored.

---

### Dependency Monitoring

Dependencies (backend and frontend) should be monitored for known vulnerabilities:

- Use tools such as:
  - `pip-audit`, `pip-tools`, or similar for Python.
  - `npm audit` or `yarn audit` for Node.js dependencies.
- Keep dependencies up to date:
  - Apply security patches promptly.
  - Regularly review dependency upgrade PRs from bots (e.g., Dependabot).

Before releasing or deploying:

- Run security-focused checks as part of CI (linting, dependency audits, basic SAST where available).

---

### Data Protection & Privacy

QuizerAI may process educational content and potentially student information. When running QuizerAI in a real environment:

- Ensure compliance with local regulations (e.g., FERPA, GDPR, or equivalents).
- Minimize data collection and retention where possible.
- Limit access to sensitive data to authorized roles.

---

### Infrastructure Security

If you deploy QuizerAI to cloud platforms (e.g., AWS):

- Use least-privilege IAM roles for:
  - AWS Bedrock.
  - OCR services (e.g., Textract).
  - S3 buckets and databases.
- Enforce HTTPS/TLS for all external communication.
- Use private networks/VPCs for databases and internal services.
- Configure backups and apply patches regularly.

For more about recommended infrastructure, see `architecture/aws_infrastructure.md`.


