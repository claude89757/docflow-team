"""会话管理 API"""

from fastapi import APIRouter, BackgroundTasks, HTTPException

from backend.config import CONTEXT_WINDOW_MAX, MODEL_PRICING
from backend.services.message_store import get_conversations, get_messages, get_usage_timeline
from backend.services.session_store import get_session, list_sessions, update_session

router = APIRouter(prefix="/api", tags=["sessions"])


@router.get("/sessions")
async def list_sessions_endpoint(page: int = 1, size: int = 20, status: str | None = None):
    return list_sessions(page=page, size=size, status=status)


@router.get("/sessions/{task_id}")
async def get_session_endpoint(task_id: str):
    session = get_session(task_id)
    if not session:
        raise HTTPException(404, "会话不存在")
    return session


@router.get("/task/{task_id}/messages")
async def get_messages_endpoint(task_id: str, after_id: int | None = None):
    session = get_session(task_id)
    if not session:
        raise HTTPException(404, "会话不存在")
    msgs = get_messages(task_id, after_id=after_id)
    result = []
    for m in msgs:
        entry = {"id": m["id"], "type": m["type"], "agent": m["agent"], "created_at": m["created_at"]}
        entry.update(m["payload"])
        result.append(entry)
    return result


@router.post("/task/{task_id}/resume")
async def resume_task(task_id: str, background_tasks: BackgroundTasks):
    session = get_session(task_id)
    if not session:
        raise HTTPException(404, "会话不存在")
    if session["status"] in ("completed", "failed"):
        raise HTTPException(400, "任务已结束，无法恢复")

    from pathlib import Path

    from backend.services.orchestrator.team import run_team
    from backend.services.ws_manager import ws_manager

    task_dir = str(Path("uploads") / task_id)
    if not Path(task_dir).exists():
        raise HTTPException(404, "任务目录不存在")

    conversations = []
    for agent in ["content-generator", "content-editor", "format-designer", "quality-reviewer"]:
        convos = get_conversations(task_id, agent)
        if convos:
            summary = f"{agent}: {len(convos)} 条对话记录"
            conversations.append(summary)

    resume_context = (
        f"任务之前在 {session.get('interrupted_at', '未知')} 阶段中断。" if session.get("interrupted_at") else ""
    )
    if conversations:
        resume_context += " 已完成的工作: " + "; ".join(conversations)

    update_session(task_id, resumed_count=(session.get("resumed_count", 0) or 0) + 1, status="pending")

    source_file = None
    if session["mode"] == "refinement":
        for f in Path(task_dir).iterdir():
            if f.name.startswith("original"):
                source_file = str(f)
                break

    description = session.get("description")
    if resume_context:
        description = f"{description or ''}\n\n[恢复上下文] {resume_context}".strip()

    doc_format = "docx"
    if source_file:
        doc_format = Path(source_file).suffix.lstrip(".")

    background_tasks.add_task(
        run_team,
        task_id=task_id,
        task_dir=task_dir,
        description=description if not source_file else None,
        doc_format=doc_format,
        source_file=source_file,
        style_dna_id=None,
        ws_manager=ws_manager,
    )

    return {"task_id": task_id, "status": "resuming"}


@router.get("/task/{task_id}/usage-timeline")
async def get_usage_timeline_endpoint(task_id: str):
    return get_usage_timeline(task_id)


@router.get("/config/pricing")
async def get_pricing():
    return {**MODEL_PRICING, "context_window_max": CONTEXT_WINDOW_MAX}
