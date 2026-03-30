"""SQLite 数据库层测试"""

import sqlite3
import tempfile
from pathlib import Path
from unittest.mock import patch


def test_init_db_creates_tables():
    """init_db 应创建 4 张表"""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = str(Path(tmpdir) / "test.db")
        with patch("backend.services.db.DB_PATH", db_path):
            from backend.services.db import get_db, init_db

            init_db()
            conn = get_db()
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            tables = [row[0] for row in cursor.fetchall()]
            conn.close()

    assert "sessions" in tables
    assert "messages" in tables
    assert "agent_conversations" in tables
    assert "usage_snapshots" in tables


def test_init_db_idempotent():
    """init_db 多次调用不报错"""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = str(Path(tmpdir) / "test.db")
        with patch("backend.services.db.DB_PATH", db_path):
            from backend.services.db import init_db

            init_db()
            init_db()  # 不应报错


def test_get_db_returns_connection():
    """get_db 返回可用的 sqlite3 连接"""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = str(Path(tmpdir) / "test.db")
        with patch("backend.services.db.DB_PATH", db_path):
            from backend.services.db import get_db, init_db

            init_db()
            conn = get_db()
            assert isinstance(conn, sqlite3.Connection)
            conn.execute("SELECT 1")
            conn.close()
