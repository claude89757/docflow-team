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


def _safe_task_dir(task_id: str) -> Path:
    """验证 task_id 指向的目录在 UPLOAD_DIR 内，防止路径遍历"""
    task_dir = (UPLOAD_DIR / task_id).resolve()
    if not str(task_dir).startswith(str(UPLOAD_DIR.resolve())):
        raise HTTPException(403, "无效的任务 ID")
    if not task_dir.exists():
        raise HTTPException(404, f"任务 {task_id} 不存在")
    return task_dir


@router.get("/download/{task_id}")
async def download_output(task_id: str):
    """下载精修后的文档"""
    task_dir = _safe_task_dir(task_id)

    for f in task_dir.iterdir():
        if f.name.startswith("output"):
            ext = f.suffix
            return FileResponse(
                path=str(f),
                filename=f"docflow_{task_id}{ext}",
                media_type=MIME_TYPES.get(ext, "application/octet-stream"),
            )

    raise HTTPException(404, "输出文件尚未生成，任务可能仍在处理")


@router.get("/download/{task_id}/original")
async def download_original(task_id: str):
    """下载原始上传文件"""
    task_dir = _safe_task_dir(task_id)

    for f in task_dir.iterdir():
        if f.name.startswith("original"):
            ext = f.suffix
            return FileResponse(
                path=str(f),
                filename=f"original_{task_id}{ext}",
                media_type=MIME_TYPES.get(ext, "application/octet-stream"),
            )

    raise HTTPException(404, "原始文件不存在")


@router.get("/download/{task_id}/report")
async def download_report(task_id: str):
    """下载处理报告 PDF"""
    task_dir = _safe_task_dir(task_id)
    report_path = task_dir / "report.pdf"

    if not report_path.exists():
        raise HTTPException(404, "处理报告尚未生成")

    return FileResponse(
        path=str(report_path),
        filename=f"report_{task_id}.pdf",
        media_type="application/pdf",
    )


@router.get("/status/{task_id}")
async def task_status(task_id: str):
    """查询任务状态和文件列表"""
    task_dir = _safe_task_dir(task_id)

    files = {}
    for f in task_dir.iterdir():
        files[f.name] = f.stat().st_size

    has_output = any(f.startswith("output") for f in files)
    return {
        "task_id": task_id,
        "status": "completed" if has_output else "processing",
        "files": files,
    }
