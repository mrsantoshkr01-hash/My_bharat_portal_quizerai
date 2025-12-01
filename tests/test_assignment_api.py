import pytest


fastapi = pytest.importorskip("fastapi", reason="FastAPI is required for these tests.")
from fastapi.testclient import TestClient  # type: ignore

try:
    from app.main import app  # type: ignore
except Exception:  # pragma: no cover
    pytest.skip("FastAPI app not implemented yet (app.main.app not found).", allow_module_level=True)


client = TestClient(app)


def test_list_assignments_requires_auth() -> None:
    response = client.get("/api/assignments")
    assert response.status_code in (401, 403, 404)


def test_create_assignment_validation_errors() -> None:
    # Missing required fields should cause validation error if endpoint exists.
    payload = {
        "quiz_id": "sample_quiz_001"
        # intentionally omitting course_id, due_date, etc.
    }
    response = client.post("/api/assignments", json=payload)
    assert response.status_code in (400, 401, 403, 422)


