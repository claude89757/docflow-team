"""Session store 测试"""

from unittest.mock import patch

import pytest


@pytest.fixture(autouse=True)
def _temp_db(tmp_path):
    db_path = str(tmp_path / "test.db")
    with patch("backend.services.db.DB_PATH", db_path):
        from backend.services.db import init_db

        init_db()
        yield


def test_create_and_get_session():
    from backend.services.session_store import create_session, get_session

    create_session(
        task_id="abc12345",
        mode="generation",
        description="测试描述",
    )
    session = get_session("abc12345")
    assert session is not None
    assert session["task_id"] == "abc12345"
    assert session["mode"] == "generation"
    assert session["status"] == "pending"
    assert session["description"] == "测试描述"


def test_get_session_not_found():
    from backend.services.session_store import get_session

    assert get_session("nonexistent") is None


def test_update_session():
    from backend.services.session_store import create_session, get_session, update_session

    create_session(task_id="upd123", mode="refinement", source_file="test.docx")
    update_session("upd123", status="editing", rounds=2, final_score=8.5)
    session = get_session("upd123")
    assert session["status"] == "editing"
    assert session["rounds"] == 2
    assert session["final_score"] == 8.5


def test_list_sessions():
    from backend.services.session_store import create_session, list_sessions

    create_session(task_id="list01", mode="generation")
    create_session(task_id="list02", mode="refinement")
    create_session(task_id="list03", mode="generation")

    result = list_sessions(page=1, size=2)
    assert result["total"] == 3
    assert len(result["items"]) == 2

    result2 = list_sessions(page=2, size=2)
    assert len(result2["items"]) == 1


def test_list_sessions_filter_status():
    from backend.services.session_store import create_session, list_sessions, update_session

    create_session(task_id="flt01", mode="generation")
    create_session(task_id="flt02", mode="refinement")
    update_session("flt02", status="completed")

    result = list_sessions(status="completed")
    assert result["total"] == 1
    assert result["items"][0]["task_id"] == "flt02"


def test_get_interrupted_sessions():
    from backend.services.session_store import create_session, get_interrupted_sessions, update_session

    create_session(task_id="int01", mode="generation")
    create_session(task_id="int02", mode="refinement")
    update_session("int01", status="editing")
    update_session("int02", status="completed")

    interrupted = get_interrupted_sessions()
    task_ids = [s["task_id"] for s in interrupted]
    assert "int01" in task_ids
    assert "int02" not in task_ids
