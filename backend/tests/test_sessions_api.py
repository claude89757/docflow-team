"""Sessions API 测试"""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _temp_db(tmp_path):
    db_path = str(tmp_path / "test.db")
    with patch("backend.services.db.DB_PATH", db_path):
        from backend.services.db import init_db

        init_db()
        yield


@pytest.fixture
def client():
    from backend.main import app

    return TestClient(app)


def test_list_sessions_empty(client):
    res = client.get("/api/sessions")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 0


def test_get_session_not_found(client):
    res = client.get("/api/sessions/nonexist")
    assert res.status_code == 404


def test_get_messages_not_found(client):
    res = client.get("/api/task/nonexist/messages")
    assert res.status_code == 404


def test_resume_not_found(client):
    res = client.post("/api/task/nonexist/resume")
    assert res.status_code == 404


def test_get_conversations(client):
    res = client.get("/api/task/test01/agent/content-editor/conversations")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_get_pricing(client):
    res = client.get("/api/config/pricing")
    assert res.status_code == 200
    data = res.json()
    assert "input_price_per_mtok" in data
    assert "context_window_max" in data


def test_preview_not_found(client):
    res = client.get("/api/task/nonexist/preview")
    assert res.status_code == 404


def test_usage_timeline(client):
    res = client.get("/api/task/test01/usage-timeline")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
