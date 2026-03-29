import tempfile
from pathlib import Path

from backend.models.schemas import ReportData, ScoreResult
from backend.services.report.pdf_generator import generate_report_pdf


def _make_scores(**overrides) -> ScoreResult:
    defaults = {
        "vocabulary_naturalness": 8.5,
        "sentence_diversity": 7.8,
        "format_humanity": 9.0,
        "logical_coherence": 8.2,
        "domain_adaptation": 8.5,
        "total": 8.4,
        "passed": True,
    }
    defaults.update(overrides)
    return ScoreResult(**defaults)


def _make_data(**overrides) -> ReportData:
    defaults = {
        "task_id": "test1234",
        "created_at": "2026-03-29T12:00:00+00:00",
        "input_format": "docx",
        "output_format": "docx",
        "rounds": 2,
        "scores": _make_scores(),
        "team_lead_summary": "## 处理报告\n- 处理轮次: 2\n- 内容修改: 去除了3处AI套话\n- 格式修改: 调整了字号和行距",
        "original_text": "此外，在人工智能方面取得了显著进展。\n\n值得注意的是，深度学习是核心技术。",
        "output_text": "人工智能取得了进展。\n\n深度学习是核心技术。",
        "is_generation_mode": False,
    }
    defaults.update(overrides)
    return ReportData(**defaults)


def test_generates_valid_pdf():
    with tempfile.TemporaryDirectory() as d:
        out = Path(d) / "report.pdf"
        result = generate_report_pdf(_make_data(), str(out))
        assert out.exists()
        assert out.stat().st_size > 0
        assert result == str(out)
        # Check PDF magic bytes
        assert out.read_bytes()[:4] == b"%PDF"


def test_with_scores():
    with tempfile.TemporaryDirectory() as d:
        out = Path(d) / "report.pdf"
        generate_report_pdf(_make_data(scores=_make_scores(total=9.2, passed=True)), str(out))
        assert out.stat().st_size > 1000


def test_without_scores():
    with tempfile.TemporaryDirectory() as d:
        out = Path(d) / "report.pdf"
        generate_report_pdf(_make_data(scores=None), str(out))
        assert out.exists()
        assert out.read_bytes()[:4] == b"%PDF"


def test_generation_mode_skips_diff():
    with tempfile.TemporaryDirectory() as d:
        out = Path(d) / "report.pdf"
        data = _make_data(is_generation_mode=True, original_text="")
        generate_report_pdf(data, str(out))
        assert out.exists()


def test_cjk_content():
    with tempfile.TemporaryDirectory() as d:
        out = Path(d) / "report.pdf"
        data = _make_data(
            team_lead_summary="这是一份包含大量中文内容的报告。\n\n包括标题、段落、列表等元素。",
            original_text="人工智能技术在教育领域的应用越来越广泛",
            output_text="AI 技术在教育中应用广泛",
        )
        generate_report_pdf(data, str(out))
        assert out.stat().st_size > 0


def test_large_diff():
    with tempfile.TemporaryDirectory() as d:
        out = Path(d) / "report.pdf"
        orig = "\n\n".join(f"原始段落内容{i}" for i in range(60))
        output = "\n\n".join(f"修改后段落内容{i}" for i in range(60))
        data = _make_data(original_text=orig, output_text=output)
        generate_report_pdf(data, str(out))
        # Should not crash, PDF should be reasonable size
        assert out.stat().st_size < 500_000  # <500KB
