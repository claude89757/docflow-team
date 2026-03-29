"""API 端点单元测试"""

import tempfile
from pathlib import Path

from fastapi.testclient import TestClient

from backend.main import app

FIXTURES = Path(__file__).parent / "fixtures"
client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["claude_agent_sdk"] is True


def test_upload_docx():
    with open(FIXTURES / "ai_flavored_doc.docx", "rb") as f:
        res = client.post("/api/upload", files={"file": ("test.docx", f)})
    assert res.status_code == 200
    data = res.json()
    assert "task_id" in data
    assert data["format"] == "docx"
    assert data["size_bytes"] > 0


def test_upload_empty_file():
    with tempfile.NamedTemporaryFile(suffix=".docx") as f:
        res = client.post("/api/upload", files={"file": ("empty.docx", f)})
    assert res.status_code == 400


def test_upload_wrong_format():
    import io

    res = client.post("/api/upload", files={"file": ("test.txt", io.BytesIO(b"hello"))})
    assert res.status_code == 400


def test_upload_too_large():
    import io

    large = io.BytesIO(b"x" * (11 * 1024 * 1024))
    res = client.post("/api/upload", files={"file": ("big.docx", large)})
    assert res.status_code == 400


def test_process_not_found():
    res = client.post("/api/process/nonexistent")
    assert res.status_code == 404


def test_download_not_found():
    res = client.get("/api/download/nonexistent")
    assert res.status_code == 404


def test_download_report_not_found():
    res = client.get("/api/download/nonexistent/report")
    assert res.status_code == 404


def test_status_not_found():
    res = client.get("/api/status/nonexistent")
    assert res.status_code == 404


def test_generate_missing_description():
    res = client.post("/api/generate", json={"description": "", "format": "docx"})
    assert res.status_code == 422


def test_generate_invalid_format():
    res = client.post("/api/generate", json={"description": "test", "format": "exe"})
    assert res.status_code == 422
