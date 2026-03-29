"""Usage API — token 消耗统计"""

from pathlib import Path

from fastapi import APIRouter, HTTPException

from backend.services.usage_tracker import load_all_usage

router = APIRouter(prefix="/api/usage", tags=["usage"])

UPLOADS_DIR = str(Path(__file__).resolve().parent.parent.parent / "uploads")


@router.get("/summary")
async def usage_summary():
    records = load_all_usage(UPLOADS_DIR)
    if not records:
        return {"total_tasks": 0, "total_tokens": 0, "success_rate": 0, "avg_duration_seconds": 0}

    total_tasks = len(records)
    total_tokens = sum(
        r.get("total", {}).get("input_tokens", 0) + r.get("total", {}).get("output_tokens", 0) for r in records
    )
    success_count = sum(1 for r in records if r.get("status") == "completed")
    success_rate = round(success_count / total_tasks * 100, 1) if total_tasks > 0 else 0

    durations = []
    for r in records:
        started = r.get("started_at", "")
        completed = r.get("completed_at", "")
        if started and completed:
            from datetime import datetime

            try:
                s = datetime.fromisoformat(started)
                c = datetime.fromisoformat(completed)
                durations.append((c - s).total_seconds())
            except ValueError:
                pass

    avg_duration = round(sum(durations) / len(durations), 1) if durations else 0

    return {
        "total_tasks": total_tasks,
        "total_tokens": total_tokens,
        "success_rate": success_rate,
        "avg_duration_seconds": avg_duration,
    }


@router.get("/history")
async def usage_history(page: int = 1, size: int = 20):
    records = load_all_usage(UPLOADS_DIR)
    records.sort(key=lambda r: r.get("started_at", ""), reverse=True)

    start = (page - 1) * size
    end = start + size
    return {
        "total": len(records),
        "page": page,
        "size": size,
        "items": records[start:end],
    }


@router.get("/{task_id}")
async def usage_detail(task_id: str):
    task_dir = Path(UPLOADS_DIR) / task_id
    if not task_dir.resolve().is_relative_to(Path(UPLOADS_DIR).resolve()):
        raise HTTPException(status_code=400, detail="invalid task_id")
    usage_file = task_dir / "usage.json"
    if not usage_file.exists():
        raise HTTPException(status_code=404, detail="not found")
    import json

    return json.loads(usage_file.read_text())
