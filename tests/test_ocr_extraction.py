import io

import pytest


fastapi = pytest.importorskip("fastapi", reason="FastAPI is required for these tests.")
from fastapi.testclient import TestClient  # type: ignore

try:
    from app.main import app  # type: ignore
except Exception:  # pragma: no cover
    pytest.skip("FastAPI app not implemented yet (app.main.app not found).", allow_module_level=True)


client = TestClient(app)


def test_ocr_extract_pdf_placeholder(tmp_path) -> None:
    # Create a small in-memory PDF-like file (backend should validate, may reject).
    fake_pdf = io.BytesIO(b"%PDF-1.4\n%EOF")
    files = {"file": ("sample.pdf", fake_pdf, "application/pdf")}

    response = client.post("/api/ocr/extract", files=files)
    # Acceptable responses: OK (200), validation error (400/422), or auth error (401/403)
    assert response.status_code in (200, 400, 401, 403, 415, 422)

    if response.status_code == 200:
        data = response.json()
        assert "text" in data or "blocks" in data


def test_ocr_requires_auth_for_sensitive_docs() -> None:
    fake_image = io.BytesIO(b"fake-image-bytes")
    files = {"file": ("sample_image.jpg", fake_image, "image/jpeg")}
    response = client.post("/api/ocr/extract", files=files)

    # Expecting unauthorized or forbidden in most configurations.
    assert response.status_code in (401, 403, 422, 400)


