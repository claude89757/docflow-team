import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.models.schemas import UploadResponse

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".docx", ".pptx", ".xlsx", ".pdf"}


@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    # 验证扩展名
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"不支持的文件格式: {ext}。支持: {', '.join(ALLOWED_EXTENSIONS)}")

    # 读取并验证大小
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(400, "文件为空")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, f"文件超过 {MAX_FILE_SIZE // (1024*1024)}MB 限制")

    # 生成 task_id 并保存
    task_id = str(uuid.uuid4())[:8]
    task_dir = UPLOAD_DIR / task_id
    task_dir.mkdir(parents=True)

    file_path = task_dir / f"original{ext}"
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    return UploadResponse(
        task_id=task_id,
        filename=file.filename,
        format=ext.lstrip("."),
        size_bytes=len(content),
    )
