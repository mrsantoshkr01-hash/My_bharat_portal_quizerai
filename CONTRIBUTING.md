## Contributing to QuizerAI

Thank you for your interest in contributing to **QuizerAI**, an AI-powered assessment and learning platform. Contributions of all kinds are welcome: bug reports, feature requests, documentation, code, tests, and UX improvements.

Please take a moment to read this document before contributing.

---

### How to Contribute

- **1. Fork the Repository**
  - Click “Fork” on GitHub and clone your fork locally:
    ```bash
    git clone https://github.com/<your-username>/QuizerAI.git
    cd QuizerAI
    ```

- **2. Create a Branch**
  - Use a descriptive branch name (see [Branch Naming Conventions](#branch-naming-conventions)):
    ```bash
    git checkout -b feature/quiz-generation-ui
    ```

- **3. Make Your Changes**
  - Follow the coding conventions outlined below.
  - Keep changes focused and atomic; avoid mixing unrelated modifications in one PR.

- **4. Add/Update Tests**
  - If you add or change backend behavior, add/update tests in the `tests` folder.
  - Ensure `pytest` runs without errors:
    ```bash
    pytest
    ```

- **5. Commit with a Clear Message**
  - Use meaningful commit messages:
    ```bash
    git commit -m "Add OCR endpoint for image uploads"
    ```

- **6. Push and Open a Pull Request**
  - Push your branch and open a PR against the main repository’s default branch:
    ```bash
    git push origin feature/quiz-generation-ui
    ```
  - In your PR description:
    - Explain the problem you’re solving.
    - Summarize key changes.
    - Note any breaking changes or migration steps.

---

### Pull Request Rules

- **Keep PRs Focused**
  - Aim for PRs that address a single feature or bug.
  - Large, multi-purpose PRs are harder to review and more likely to be delayed.

- **Pass Checks**
  - Ensure:
    - Code builds successfully.
    - Tests pass (`pytest` for backend, relevant commands for frontend).
    - Linting (if configured) passes.

- **Code Review**
  - Be responsive to review comments.
  - Use follow-up commits rather than force-pushing where possible (unless the project explicitly prefers squashing).

- **Documentation**
  - Update relevant docs (e.g., `README.md`, `architecture/*`, or inline docstrings) when behavior or APIs change.

---

### Coding Conventions

- **General**
  - Prefer clarity over cleverness; optimize for readability.
  - Add docstrings and comments for non-obvious logic.

- **Python / FastAPI**
  - Follow **PEP 8** as a baseline.
  - Use type hints for all public functions and models where possible.
  - Keep request and response models in dedicated modules (e.g., `schemas` or `models`).
  - Ensure endpoints:
    - Validate inputs.
    - Return proper HTTP status codes.
    - Handle errors gracefully and consistently.

- **JavaScript / TypeScript (Next.js)**
  - Prefer **TypeScript** for new code.
  - Use functional React components and hooks.
  - Keep components small and reusable; use feature-based folder structures when appropriate.

- **Tests**
  - Use **pytest** for backend tests; follow existing patterns in the `tests` directory.
  - Strive for meaningful test names and clear assertions.

---

### Branch Naming Conventions

Use short, descriptive names prefixed by the type of change:

- **Features**
  - `feature/<short-description>`
  - Examples:
    - `feature/quiz-generation-ui`
    - `feature/ocr-workflow-textract`

- **Bug Fixes**
  - `fix/<short-description>`
  - Examples:
    - `fix/ocr-timeout-handling`
    - `fix/quiz-pagination-bug`

- **Chores / Refactors**
  - `chore/<short-description>`
  - Examples:
    - `chore/update-dependencies`
    - `chore/refactor-auth-module`

- **Docs**
  - `docs/<short-description>`
  - Examples:
    - `docs/update-architecture-diagram`
    - `docs/add-api-examples`

---

### Issue Reporting

When reporting issues, please include:

- A clear title and description.
- Steps to reproduce (if applicable).
- Expected vs actual behavior.
- Relevant logs, screenshots, or stack traces.

For **security-related issues**, please refer to `SECURITY.md` and do **not** open public issues with sensitive details.

---

### Code of Conduct

By participating in this project, you agree to abide by the standards in `CODE_OF_CONDUCT.md`. Be respectful and constructive in all interactions.

---

### Getting Help

If you’re unsure where to start:

- Look for issues labeled “good first issue” or “help wanted”.
- Open a discussion or lightweight issue describing your idea.

We appreciate your interest and contributions to QuizerAI!


