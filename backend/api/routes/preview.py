"""文件预览 API"""

from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["preview"])

UPLOAD_DIR = Path("uploads")

STAGE_FILES = {
    "original": "original",
    "draft": "draft",
    "edited": "edited",
    "formatted": "formatted",
    "output": "output",
}


@router.get("/task/{task_id}/preview")
async def get_file_preview(task_id: str, stage: str = "output"):
    task_dir = UPLOAD_DIR / task_id
    if not task_dir.resolve().is_relative_to(UPLOAD_DIR.resolve()):
        raise HTTPException(400, "invalid task_id")
    if not task_dir.exists():
        raise HTTPException(404, "任务不存在")

    prefix = STAGE_FILES.get(stage, "output")

    target = None
    for f in task_dir.iterdir():
        if f.name.startswith(prefix) and f.suffix in (".docx", ".pptx", ".xlsx", ".pdf"):
            target = f
            break

    if not target:
        raise HTTPException(404, f"阶段 '{stage}' 的文件不存在")

    from backend.processors import get_processor

    processor = get_processor(str(target))
    text = processor.extract_text(str(target))
    stats = processor.get_stats(str(target))

    return {"text": text, "stats": stats, "stage": stage}
