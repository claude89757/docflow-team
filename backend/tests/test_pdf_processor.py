"""PdfProcessor 单元测试"""

import os
import tempfile

import fitz
from docx import Document

from backend.processors.pdf_processor import PdfProcessor


def _create_simple_pdf(path: str, pages: list[list[tuple[str, int | float]]]):
    """创建测试用 PDF

    pages: [[("文本", font_size), ...], ...]
    """
    doc = fitz.open()
    for page_texts in pages:
        page = doc.new_page()
        y: float = 72  # 起始 y 坐标
        for text, size in page_texts:
            page.insert_text((72, y), text, fontsize=float(size), fontname="china-s")
            y += float(size) + 10
    doc.save(path)
    doc.close()


def test_parse():
    processor = PdfProcessor()
    with tempfile.TemporaryDirectory() as tmpdir:
        path = os.path.join(tmpdir, "test.pdf")
        _create_simple_pdf(path, [[("Hello World", 14), ("Body text here", 11)]])

        result = processor.parse(path)
        assert result["format"] == "pdf"
        assert result["page_count"] == 1
        assert len(result["pages"][0]["blocks"]) >= 1


def test_extract_text():
    processor = PdfProcessor()
    with tempfile.TemporaryDirectory() as tmpdir:
        path = os.path.join(tmpdir, "test.pdf")
        _create_simple_pdf(path, [[("Test Content", 12), ("More text", 12)]])

        text = processor.extract_text(path)
        assert "Test Content" in text
        assert "More text" in text


def test_get_stats():
    processor = PdfProcessor()
    with tempfile.TemporaryDirectory() as tmpdir:
        path = os.path.join(tmpdir, "test.pdf")
        _create_simple_pdf(path, [[("Block one", 12)], [("Block two", 12)]])

        stats = processor.get_stats(path)
        assert stats["page_count"] == 2
        assert stats["total_chars"] > 0


def test_to_docx():
    processor = PdfProcessor()
    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = os.path.join(tmpdir, "test.pdf")
        docx_path = os.path.join(tmpdir, "output.docx")
        _create_simple_pdf(
            pdf_path,
            [[("Big Title", 20), ("Normal paragraph content", 11)]],
        )

        result = processor.to_docx(pdf_path, docx_path)
        assert os.path.exists(result)

        doc = Document(result)
        assert len(doc.paragraphs) >= 1


def test_replace_text_converts_to_docx():
    processor = PdfProcessor()
    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = os.path.join(tmpdir, "test.pdf")
        out_path = os.path.join(tmpdir, "output.pdf")
        _create_simple_pdf(pdf_path, [[("Original text", 12), ("Keep this", 12)]])

        result = processor.replace_text(pdf_path, {"0": "Replaced text"}, out_path)
        # 输出应为 .docx
        assert result.endswith(".docx")
        assert os.path.exists(result)


def test_apply_format_converts_to_docx():
    processor = PdfProcessor()
    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = os.path.join(tmpdir, "test.pdf")
        out_path = os.path.join(tmpdir, "output.pdf")
        _create_simple_pdf(pdf_path, [[("Test content", 12)]])

        changes = [{"target": "font_size", "scope": "all", "value_pt": 14}]
        result = processor.apply_format_changes(pdf_path, changes, out_path)
        assert result.endswith(".docx")
        assert os.path.exists(result)
