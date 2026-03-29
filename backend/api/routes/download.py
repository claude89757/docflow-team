from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

UPLOAD_DIR = Path("uploads")

MIME_TYPES = {
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".pdf": "application/pdf",
}


@router.get("/download/{task_id}")
async def download_output(task_id: str):
    """下载精修后的文档"""
    task_dir = UPLOAD_DIR / task_id
    if not task_dir.exists():
        raise HTTPException(404, f"任务 {task_id} 不存在")

    # 找 output 文件
    for f in task_dir.iterdir():
        if f.name.startswith("output"):
            ext = f.suffix
            return FileResponse(
                path=str(f),
                filename=f"docflow_{task_id}{ext}",
                media_type=MIME_TYPES.get(ext, "application/octet-stream"),
            )

    raise HTTPException(404, "输出文件尚未生成，管线可能仍在运行")


@router.get("/download/{task_id}/original")
async def download_original(task_id: str):
    """下载原始上传文件"""
    task_dir = UPLOAD_DIR / task_id
    if not task_dir.exists():
        raise HTTPException(404, f"任务 {task_id} 不存在")

    for f in task_dir.iterdir():
        if f.name.startswith("original"):
            ext = f.suffix
            return FileResponse(
                path=str(f),
                filename=f"original_{task_id}{ext}",
                media_type=MIME_TYPES.get(ext, "application/octet-stream"),
            )

    raise HTTPException(404, "原始文件不存在")


@router.get("/status/{task_id}")
async def task_status(task_id: str):
    """查询任务状态和文件列表"""
    task_dir = UPLOAD_DIR / task_id
    if not task_dir.exists():
        raise HTTPException(404, f"任务 {task_id} 不存在")

    files = {}
    for f in task_dir.iterdir():
        files[f.name] = f.stat().st_size

    has_output = any(f.startswith("output") for f in files)
    return {
        "task_id": task_id,
        "status": "completed" if has_output else "processing",
        "files": files,
    }
