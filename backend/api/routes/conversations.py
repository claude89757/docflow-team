"""智能体对话详情 API"""

from fastapi import APIRouter

from backend.services.message_store import get_conversations

router = APIRouter(prefix="/api", tags=["conversations"])


@router.get("/task/{task_id}/agent/{agent}/conversations")
async def get_agent_conversations(task_id: str, agent: str):
    return get_conversations(task_id, agent)
