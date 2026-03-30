"""Messages + agent_conversations + usage_snapshots CRUD"""

import json
from datetime import UTC, datetime

from backend.services.db import get_db


def _now() -> str:
    return datetime.now(UTC).isoformat()


def estimate_tokens(text: str) -> int:
    """粗略估算 token 数（中英文混合 ~4 字符/token）"""
    return len(text) // 4 if text else 0


# --- messages ---


def add_message(task_id: str, msg_type: str, payload: dict, agent: str | None = None) -> int:
    conn = get_db()
    try:
        cursor = conn.execute(
            "INSERT INTO messages (task_id, type, agent, payload, created_at) VALUES (?, ?, ?, ?, ?)",
            (task_id, msg_type, agent, json.dumps(payload, ensure_ascii=False), _now()),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_messages(task_id: str, after_id: int | None = None, limit: int = 1000) -> list[dict]:
    conn = get_db()
    try:
        if after_id:
            rows = conn.execute(
                "SELECT * FROM messages WHERE task_id = ? AND id > ? ORDER BY id LIMIT ?",
                (task_id, after_id, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM messages WHERE task_id = ? ORDER BY id LIMIT ?",
                (task_id, limit),
            ).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["payload"] = json.loads(d["payload"])
            result.append(d)
        return result
    finally:
        conn.close()


# --- agent_conversations ---


def add_conversation(
    task_id: str,
    agent: str,
    role: str,
    content: str,
    tool_name: str | None = None,
    token_count: int | None = None,
) -> int:
    if token_count is None:
        token_count = estimate_tokens(content)
    conn = get_db()
    try:
        cursor = conn.execute(
            """INSERT INTO agent_conversations (task_id, agent, role, content, tool_name, token_count, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (task_id, agent, role, content, tool_name, token_count, _now()),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_conversations(task_id: str, agent: str) -> list[dict]:
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM agent_conversations WHERE task_id = ? AND agent = ? ORDER BY id",
            (task_id, agent),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


# --- usage_snapshots ---


def add_usage_snapshot(
    task_id: str,
    agent: str,
    input_tokens: int,
    output_tokens: int,
    context_used: int,
    context_max: int,
) -> int:
    conn = get_db()
    try:
        cursor = conn.execute(
            """INSERT INTO usage_snapshots (task_id, agent, input_tokens, output_tokens, context_used, context_max, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (task_id, agent, input_tokens, output_tokens, context_used, context_max, _now()),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_usage_timeline(task_id: str) -> list[dict]:
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM usage_snapshots WHERE task_id = ? ORDER BY id",
            (task_id,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
