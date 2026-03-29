from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend.processors.base import DocumentProcessor


def get_processor(file_path: str) -> DocumentProcessor:
    """根据文件扩展名返回对应的文档处理器"""
    ext = Path(file_path).suffix.lower()

    if ext == ".docx":
        from backend.processors.docx_processor import DocxProcessor

        return DocxProcessor()
    elif ext == ".pptx":
        from backend.processors.pptx_processor import PptxProcessor

        return PptxProcessor()
    elif ext == ".xlsx":
        from backend.processors.xlsx_processor import XlsxProcessor

        return XlsxProcessor()
    elif ext == ".pdf":
        from backend.processors.pdf_processor import PdfProcessor

        return PdfProcessor()
    else:
        raise ValueError(f"Unsupported format: {ext}")
