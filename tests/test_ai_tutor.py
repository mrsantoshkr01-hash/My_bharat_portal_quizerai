import pytest


fastapi = pytest.importorskip("fastapi", reason="FastAPI is required for these tests.")
from fastapi.testclient import TestClient  # type: ignore

try:
    from app.main import app  # type: ignore
except Exception:  # pragma: no cover
    pytest.skip("FastAPI app not implemented yet (app.main.app not found).", allow_module_level=True)


client = TestClient(app)


def test_create_tutor_session_requires_auth() -> None:
    payload = {
        "topic": "photosynthesis",
        "context_type": "quiz_attempt",
        "context_id": "attempt_123",
    }
    response = client.post("/api/tutor/session", json=payload)
    assert response.status_code in (401, 403, 422)


@pytest.mark.skip(reason="Requires implemented tutor endpoint and auth fixtures.")
def test_tutor_session_flow_example() -> None:
    """
    Example of a more complete tutor session test once auth and endpoints exist.

    Steps:
    - Create a session (POST /api/tutor/session).
    - Send a message (POST /api/tutor/message).
    - Expect a helpful AI response using Bedrock or configured provider.
    """
    # This is a placeholder to guide future implementation.
    ...


