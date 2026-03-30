"""Token 用量追踪和持久化"""

import json
import logging
from datetime import UTC, datetime
from pathlib import Path

logger = logging.getLogger("docflow.usage")


class UsageTracker:
    """追踪单次任务的 token 消耗"""

    def __init__(self, task_id: str, task_dir: str, mode: str):
        self.task_id = task_id
        self.task_dir = task_dir
        self.mode = mode
        self.started_at = datetime.now(UTC).isoformat()
        self.agents: dict[str, dict[str, int]] = {}
        self.rounds = 1
        self.final_score: float | None = None
        self.status = "processing"

    def add_tokens(self, agent_key: str, input_tokens: int, output_tokens: int) -> dict:
        """累加 agent 的 token 消耗，返回当前 agent 累计值"""
        if agent_key not in self.agents:
            self.agents[agent_key] = {"input_tokens": 0, "output_tokens": 0}
        self.agents[agent_key]["input_tokens"] += input_tokens
        self.agents[agent_key]["output_tokens"] += output_tokens

        # 写入 SQLite
        try:
            from backend.config import CONTEXT_WINDOW_MAX
            from backend.services.message_store import add_usage_snapshot

            total = self.agents[agent_key]["input_tokens"] + self.agents[agent_key]["output_tokens"]
            add_usage_snapshot(
                self.task_id,
                agent_key,
                self.agents[agent_key]["input_tokens"],
                self.agents[agent_key]["output_tokens"],
                context_used=total,
                context_max=CONTEXT_WINDOW_MAX,
            )
        except Exception:
            pass  # non-fatal

        return self.agents[agent_key]

    def get_total(self) -> dict[str, int]:
        total_in = sum(a["input_tokens"] for a in self.agents.values())
        total_out = sum(a["output_tokens"] for a in self.agents.values())
        return {"input_tokens": total_in, "output_tokens": total_out}

    def save(self) -> None:
        """持久化到 usage.json"""
        total = self.get_total()
        completed_at = datetime.now(UTC).isoformat()
        started = datetime.fromisoformat(self.started_at)
        completed = datetime.fromisoformat(completed_at)
        duration_seconds = round((completed - started).total_seconds(), 1)

        data = {
            "task_id": self.task_id,
            "mode": self.mode,
            "started_at": self.started_at,
            "completed_at": completed_at,
            "duration_seconds": duration_seconds,
            "rounds": self.rounds,
            "final_score": self.final_score,
            "status": self.status,
            "agents": self.agents,
            "total": total,
        }

        path = Path(self.task_dir) / "usage.json"
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
        logger.info("usage saved task=%s total_tokens=%d", self.task_id, total["input_tokens"] + total["output_tokens"])


def load_all_usage(uploads_dir: str) -> list[dict]:
    """扫描所有任务目录，收集 usage.json"""
    results = []
    uploads = Path(uploads_dir)
    if not uploads.exists():
        return results
    for task_dir in uploads.iterdir():
        if not task_dir.is_dir():
            continue
        usage_file = task_dir / "usage.json"
        if usage_file.exists():
            try:
                data = json.loads(usage_file.read_text())
                results.append(data)
            except (json.JSONDecodeError, OSError):
                continue
    return results
