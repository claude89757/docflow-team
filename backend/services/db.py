"""SQLite 连接管理 + 表初始化"""

import logging
import sqlite3
from pathlib import Path

from backend.config import DB_PATH

logger = logging.getLogger("docflow.db")

_SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    task_id        TEXT PRIMARY KEY,
    mode           TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'pending',
    description    TEXT,
    source_file    TEXT,
    output_file    TEXT,
    final_score    REAL,
    rounds         INTEGER DEFAULT 0,
    resumed_count  INTEGER DEFAULT 0,
    interrupted_at TEXT,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id     TEXT NOT NULL REFERENCES sessions(task_id),
    type        TEXT NOT NULL,
    agent       TEXT,
    payload     TEXT NOT NULL,
    created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_task ON messages(task_id, created_at);

CREATE TABLE IF NOT EXISTS agent_conversations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id     TEXT NOT NULL REFERENCES sessions(task_id),
    agent       TEXT NOT NULL,
    role        TEXT NOT NULL,
    content     TEXT NOT NULL,
    tool_name   TEXT,
    token_count INTEGER DEFAULT 0,
    created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conversations_task_agent ON agent_conversations(task_id, agent, created_at);

CREATE TABLE IF NOT EXISTS usage_snapshots (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id       TEXT NOT NULL REFERENCES sessions(task_id),
    agent         TEXT NOT NULL,
    input_tokens  INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    context_used  INTEGER DEFAULT 0,
    context_max   INTEGER DEFAULT 200000,
    created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_snapshots_task ON usage_snapshots(task_id, created_at);
"""


def get_db() -> sqlite3.Connection:
    """获取 SQLite 连接（每次调用新建连接，调用方负责关闭）"""
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    """初始化数据库表（幂等）"""
    conn = get_db()
    try:
        conn.executescript(_SCHEMA)
        conn.commit()
        logger.info("database initialized at %s", DB_PATH)
    finally:
        conn.close()
