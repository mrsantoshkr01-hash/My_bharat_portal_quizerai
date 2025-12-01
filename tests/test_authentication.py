import pytest


fastapi = pytest.importorskip("fastapi", reason="FastAPI is required for these tests.")
from fastapi.testclient import TestClient  # type: ignore

try:
    from app.main import app  # type: ignore
except Exception:  # pragma: no cover
    pytest.skip("FastAPI app not implemented yet (app.main.app not found).", allow_module_level=True)


client = TestClient(app)


def test_login_missing_credentials() -> None:
    response = client.post("/api/auth/login", json={})
    assert response.status_code in (400, 422)


def test_protected_route_requires_jwt() -> None:
    # This assumes a protected endpoint such as /api/dashboard/teacher
    response = client.get("/api/dashboard/teacher")
    assert response.status_code in (401, 403)


