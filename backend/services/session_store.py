"""Sessions 表 CRUD"""

from datetime import UTC, datetime

from backend.services.db import get_db


def _now() -> str:
    return datetime.now(UTC).isoformat()


def create_session(
    task_id: str,
    mode: str,
    description: str | None = None,
    source_file: str | None = None,
) -> dict:
    now = _now()
    conn = get_db()
    try:
        conn.execute(
            """INSERT INTO sessions (task_id, mode, status, description, source_file, created_at, updated_at)
               VALUES (?, ?, 'pending', ?, ?, ?, ?)""",
            (task_id, mode, description, source_file, now, now),
        )
        conn.commit()
        return dict(conn.execute("SELECT * FROM sessions WHERE task_id = ?", (task_id,)).fetchone())
    finally:
        conn.close()


def get_session(task_id: str) -> dict | None:
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM sessions WHERE task_id = ?", (task_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def update_session(task_id: str, **kwargs) -> None:
    allowed = {
        "status",
        "description",
        "source_file",
        "output_file",
        "final_score",
        "rounds",
        "resumed_count",
        "interrupted_at",
    }
    updates = {k: v for k, v in kwargs.items() if k in allowed}
    if not updates:
        return
    updates["updated_at"] = _now()
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [task_id]
    conn = get_db()
    try:
        conn.execute(f"UPDATE sessions SET {set_clause} WHERE task_id = ?", values)
        conn.commit()
    finally:
        conn.close()


def list_sessions(page: int = 1, size: int = 20, status: str | None = None) -> dict:
    conn = get_db()
    try:
        where = ""
        params: list = []
        if status:
            where = "WHERE status = ?"
            params.append(status)

        total = conn.execute(f"SELECT COUNT(*) FROM sessions {where}", params).fetchone()[0]
        offset = (page - 1) * size
        rows = conn.execute(
            f"SELECT * FROM sessions {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [size, offset],
        ).fetchall()
        return {"total": total, "page": page, "size": size, "items": [dict(r) for r in rows]}
    finally:
        conn.close()


def get_interrupted_sessions() -> list[dict]:
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM sessions WHERE status NOT IN ('completed', 'failed') ORDER BY updated_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
