import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.models.schemas import UploadResponse

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".docx", ".pptx", ".xlsx", ".pdf"}


@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    # 消毒文件名，防止路径遍历
    safe_name = Path(file.filename or "unnamed").name
    ext = Path(safe_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"不支持的文件格式: {ext}。支持: {', '.join(ALLOWED_EXTENSIONS)}")

    # 读取并验证大小
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(400, "文件为空")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, f"文件超过 {MAX_FILE_SIZE // (1024 * 1024)}MB 限制")

    # 生成 task_id 并保存
    task_id = str(uuid.uuid4())[:8]
    task_dir = UPLOAD_DIR / task_id
    try:
        task_dir.mkdir(parents=True)
    except OSError as e:
        raise HTTPException(507, f"无法创建任务目录: {e}") from None

    file_path = task_dir / f"original{ext}"
    try:
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)
    except OSError as e:
        raise HTTPException(507, f"文件写入失败: {e}") from None

    from backend.services.session_store import create_session

    create_session(task_id=task_id, mode="refinement", source_file=file.filename)

    return UploadResponse(
        task_id=task_id,
        filename=file.filename,
        format=ext.lstrip("."),
        size_bytes=len(content),
    )
