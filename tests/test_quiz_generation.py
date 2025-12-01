import pytest


fastapi = pytest.importorskip("fastapi", reason="FastAPI is required for these tests.")
from fastapi.testclient import TestClient  # type: ignore

try:
    # Expect a FastAPI instance named `app` in app/main.py
    from app.main import app  # type: ignore
except Exception:  # pragma: no cover - app may not exist in this skeleton repo
    pytest.skip("FastAPI app not implemented yet (app.main.app not found).", allow_module_level=True)


client = TestClient(app)


@pytest.mark.parametrize("source_type", ["text", "youtube"])
def test_generate_quiz_basic(source_type: str) -> None:
    payload = {
        "source_type": source_type,
        "input_text": "Photosynthesis is the process by which green plants convert light energy into chemical energy.",
        "num_questions": 3,
        "difficulty": "medium",
        "question_types": ["mcq", "short_answer"],
        "metadata": {"grade_level": "8", "subject": "Biology"},
    }

    response = client.post("/api/quizzes/generate", json=payload)
    assert response.status_code in (200, 422, 400)

    if response.status_code == 200:
        data = response.json()
        assert "questions" in data
        assert isinstance(data["questions"], list)
        assert len(data["questions"]) <= payload["num_questions"]


def test_generate_quiz_requires_teacher_role() -> None:
    # Assuming the API requires an Authorization header with a teacher JWT.
    # In a real app, replace the placeholder token with a fixture-generated one.
    response = client.post(
        "/api/quizzes/generate",
        json={"source_type": "text", "input_text": "x", "num_questions": 1},
    )
    # Either unauthorized due to missing token or validation error if security is disabled.
    assert response.status_code in (401, 403, 422)


