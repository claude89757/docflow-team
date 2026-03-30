import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException

from backend.models.schemas import GenerateRequest, GenerateResponse, TaskStatus
from backend.services.orchestrator.team import run_team
from backend.services.ws_manager import ws_manager

router = APIRouter()

UPLOAD_DIR = Path("uploads")


@router.post("/generate", response_model=GenerateResponse)
async def generate_document(req: GenerateRequest, background_tasks: BackgroundTasks):
    """从需求描述生成文档（无需上传）"""
    task_id = str(uuid.uuid4())[:8]
    task_dir = UPLOAD_DIR / task_id
    task_dir.mkdir(parents=True, exist_ok=True)

    from backend.services.session_store import create_session

    create_session(task_id=task_id, mode="generation", description=req.description)

    background_tasks.add_task(
        run_team,
        task_id=task_id,
        task_dir=str(task_dir),
        description=req.description,
        doc_format=req.format,
        source_file=None,
        style_dna_id=req.style_dna_id,
        ws_manager=ws_manager,
    )

    return GenerateResponse(task_id=task_id, status=TaskStatus.PENDING)


@router.post("/process/{task_id}", response_model=GenerateResponse)
async def process_uploaded(task_id: str, background_tasks: BackgroundTasks):
    """处理已上传的文档"""
    task_dir = UPLOAD_DIR / task_id
    if not task_dir.exists():
        raise HTTPException(404, f"任务 {task_id} 不存在")

    # 找到上传的原始文件
    source_file = None
    for f in task_dir.iterdir():
        if f.name.startswith("original"):
            source_file = str(f)
            break

    if not source_file:
        raise HTTPException(404, "未找到上传的文件")

    background_tasks.add_task(
        run_team,
        task_id=task_id,
        task_dir=str(task_dir),
        description=None,
        doc_format=Path(source_file).suffix.lstrip("."),
        source_file=source_file,
        style_dna_id=None,
        ws_manager=ws_manager,
    )

    return GenerateResponse(task_id=task_id, status=TaskStatus.PENDING)
