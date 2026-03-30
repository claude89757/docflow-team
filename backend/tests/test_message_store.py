"""Message store 测试"""

from unittest.mock import patch

import pytest


@pytest.fixture(autouse=True)
def _temp_db(tmp_path):
    db_path = str(tmp_path / "test.db")
    with patch("backend.services.db.DB_PATH", db_path):
        from backend.services.db import init_db
        from backend.services.session_store import create_session

        init_db()
        create_session(task_id="test01", mode="generation")
        yield


def test_add_and_get_messages():
    from backend.services.message_store import add_message, get_messages

    add_message("test01", "team_status", {"status": "started"})
    add_message(
        "test01", "agent_status", {"agent": "content-generator", "status": "working"}, agent="content-generator"
    )

    msgs = get_messages("test01")
    assert len(msgs) == 2
    assert msgs[0]["type"] == "team_status"
    assert msgs[1]["agent"] == "content-generator"


def test_get_messages_after_id():
    from backend.services.message_store import add_message, get_messages

    id1 = add_message("test01", "team_status", {"status": "started"})
    id2 = add_message("test01", "agent_status", {"status": "working"})

    msgs = get_messages("test01", after_id=id1)
    assert len(msgs) == 1
    assert msgs[0]["id"] == id2


def test_add_and_get_conversations():
    from backend.services.message_store import add_conversation, get_conversations

    add_conversation("test01", "content-editor", "system", "你是内容编辑", token_count=10)
    add_conversation("test01", "content-editor", "assistant", "开始分析...", token_count=20)
    add_conversation("test01", "content-editor", "tool_use", '{"p": 1}', tool_name="replace_content", token_count=5)

    convos = get_conversations("test01", "content-editor")
    assert len(convos) == 3
    assert convos[0]["role"] == "system"
    assert convos[2]["tool_name"] == "replace_content"


def test_add_and_get_usage_snapshots():
    from backend.services.message_store import add_usage_snapshot, get_usage_timeline

    add_usage_snapshot("test01", "content-generator", 100, 50, 150, 200000)
    add_usage_snapshot("test01", "content-generator", 200, 100, 300, 200000)
    add_usage_snapshot("test01", "content-editor", 80, 40, 120, 200000)

    timeline = get_usage_timeline("test01")
    assert len(timeline) == 3
    assert timeline[0]["input_tokens"] == 100
    assert timeline[2]["agent"] == "content-editor"
