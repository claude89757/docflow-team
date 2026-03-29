"""处理报告 PDF 生成器"""

import logging
from datetime import datetime
from pathlib import Path

from fpdf import FPDF

from backend.models.schemas import ReportData
from backend.services.report.diff import compute_text_diff

logger = logging.getLogger("docflow.report")

FONT_DIR = Path(__file__).parent / "fonts"
FONT_FILE = FONT_DIR / "NotoSansSC-Regular.ttf"

# 颜色
COLOR_GREEN = (22, 163, 74)
COLOR_RED = (220, 38, 38)
COLOR_AMBER = (217, 119, 6)
COLOR_GRAY = (107, 114, 128)
COLOR_BLACK = (0, 0, 0)
COLOR_WHITE = (255, 255, 255)
COLOR_LIGHT_GREEN = (220, 252, 231)
COLOR_LIGHT_RED = (254, 226, 226)
COLOR_LIGHT_AMBER = (254, 243, 199)
COLOR_LIGHT_GRAY = (243, 244, 246)
COLOR_HEADER_BG = (79, 70, 229)  # indigo-600

SCORE_LABELS = {
    "vocabulary_naturalness": "词汇自然度",
    "sentence_diversity": "句式多样性",
    "format_humanity": "格式人类感",
    "logical_coherence": "逻辑连贯性",
    "domain_adaptation": "领域适配度",
}

SCORE_WEIGHTS = {
    "vocabulary_naturalness": "30%",
    "sentence_diversity": "20%",
    "format_humanity": "25%",
    "logical_coherence": "15%",
    "domain_adaptation": "10%",
}


class ReportPDF(FPDF):
    def __init__(self, data: ReportData):
        super().__init__()
        self.data = data
        self._has_cjk = False

        if FONT_FILE.exists():
            self.add_font("CJK", "", str(FONT_FILE))
            self._has_cjk = True
        else:
            logger.warning("CJK font not found at %s, using fallback", FONT_FILE)

        self.set_auto_page_break(auto=True, margin=20)

    def _font(self, size: float = 10):
        if self._has_cjk:
            self.set_font("CJK", "", size)
        else:
            self.set_font("Helvetica", "", size)

    def header(self):
        self.set_fill_color(*COLOR_HEADER_BG)
        self.rect(0, 0, 210, 28, "F")

        self.set_text_color(*COLOR_WHITE)
        self._font(16)
        self.set_y(6)
        self.cell(0, 8, "DocFlow 处理报告", align="C", new_x="LMARGIN", new_y="NEXT")

        self._font(9)
        task_str = f"Task: {self.data.task_id}"
        try:
            dt = datetime.fromisoformat(self.data.created_at)
            task_str += f"    {dt.strftime('%Y-%m-%d %H:%M')}"
        except (ValueError, TypeError):
            pass
        self.cell(0, 6, task_str, align="C", new_x="LMARGIN", new_y="NEXT")

        self.set_text_color(*COLOR_BLACK)
        self.ln(8)

    def footer(self):
        self.set_y(-15)
        self.set_text_color(*COLOR_GRAY)
        self._font(8)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def _section_title(self, num: int, title: str):
        self._font(13)
        self.set_text_color(*COLOR_HEADER_BG)
        self.cell(0, 10, f"{num}. {title}", new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(*COLOR_BLACK)
        self.ln(2)

    def add_summary_section(self):
        self._section_title(1, "处理概要")

        rows = [
            ("输入格式", self.data.input_format),
            ("输出格式", self.data.output_format),
            ("处理模式", "从描述生成" if self.data.is_generation_mode else "精修已有文档"),
            ("处理轮次", str(self.data.rounds)),
        ]
        if self.data.scores:
            rows.append(("最终评分", f"{self.data.scores.total}/10"))
            rows.append(("是否通过", "是" if self.data.scores.passed else "否"))

        col_w = [45, 100]
        self._font(10)
        for label, value in rows:
            self.set_fill_color(*COLOR_LIGHT_GRAY)
            self.cell(col_w[0], 8, f"  {label}", border=1, fill=True)
            self.cell(col_w[1], 8, f"  {value}", border=1, new_x="LMARGIN", new_y="NEXT")

        self.ln(6)

    def add_scores_section(self):
        if not self.data.scores:
            return

        self._section_title(2, "质量评分")

        # 表头
        col_w = [60, 40, 30, 15]
        self._font(10)
        self.set_fill_color(*COLOR_HEADER_BG)
        self.set_text_color(*COLOR_WHITE)
        for header, w in zip(["评分维度", "分数", "权重", ""], col_w, strict=True):
            self.cell(w, 8, f"  {header}", border=1, fill=True)
        self.ln()
        self.set_text_color(*COLOR_BLACK)

        # 每行
        scores_dict = self.data.scores.model_dump()
        for key, label in SCORE_LABELS.items():
            score = scores_dict.get(key, 0)
            weight = SCORE_WEIGHTS.get(key, "")

            # 分数颜色
            if score >= 8:
                bg = COLOR_LIGHT_GREEN
                bar_color = COLOR_GREEN
            elif score >= 5:
                bg = COLOR_LIGHT_AMBER
                bar_color = COLOR_AMBER
            else:
                bg = COLOR_LIGHT_RED
                bar_color = COLOR_RED

            self.cell(col_w[0], 8, f"  {label}", border=1)
            self.set_fill_color(*bg)
            self.cell(col_w[1], 8, f"  {score:.1f}", border=1, fill=True)
            self.set_fill_color(*COLOR_LIGHT_GRAY)
            self.cell(col_w[2], 8, f"  {weight}", border=1, fill=True)

            # 小色块指示
            self.set_fill_color(*bar_color)
            self.cell(col_w[3], 8, "", border=1, fill=True)
            self.ln()

        # 总分行
        self.set_fill_color(*COLOR_LIGHT_GRAY)
        self._font(11)
        self.cell(col_w[0], 9, "  总分", border=1, fill=True)
        passed = self.data.scores.passed
        self.set_fill_color(*(COLOR_LIGHT_GREEN if passed else COLOR_LIGHT_RED))
        self.cell(col_w[1], 9, f"  {self.data.scores.total:.1f}", border=1, fill=True)
        self.cell(col_w[2], 9, "", border=1)
        status_text = "PASS" if passed else "FAIL"
        self.set_fill_color(*(COLOR_GREEN if passed else COLOR_RED))
        self.set_text_color(*COLOR_WHITE)
        self.cell(col_w[3], 9, status_text, border=1, fill=True, align="C")
        self.ln()
        self.set_text_color(*COLOR_BLACK)

        self.ln(6)

    def add_modifications_section(self):
        summary = self.data.team_lead_summary.strip()
        if not summary:
            return

        self._section_title(3, "修改说明")

        self._font(10)
        self.set_fill_color(*COLOR_LIGHT_GRAY)
        w = self.w - 2 * self.l_margin
        self.multi_cell(w, 6, summary)

        self.ln(6)

    def add_diff_section(self):
        if self.data.is_generation_mode:
            return
        if not self.data.original_text and not self.data.output_text:
            return

        self._section_title(4, "文本变更对照")

        blocks = compute_text_diff(self.data.original_text, self.data.output_text)
        if not blocks or all(b.tag == "equal" for b in blocks):
            self._font(10)
            self.set_text_color(*COLOR_GRAY)
            self.cell(0, 8, "无文本变更", new_x="LMARGIN", new_y="NEXT")
            self.set_text_color(*COLOR_BLACK)
            return

        self._font(9)
        w = self.w - 2 * self.l_margin

        for block in blocks:
            if block.tag == "equal":
                self.set_text_color(*COLOR_GRAY)
                for line in block.original_lines:
                    self.multi_cell(w, 5, f"  {line}")
                self.set_text_color(*COLOR_BLACK)
                continue

            if block.tag in ("delete", "replace"):
                self.set_fill_color(*COLOR_LIGHT_RED)
                self.set_text_color(*COLOR_RED)
                for line in block.original_lines:
                    self.multi_cell(w, 5, f"- {line}", fill=True)

            if block.tag in ("insert", "replace"):
                self.set_fill_color(*COLOR_LIGHT_GREEN)
                self.set_text_color(*COLOR_GREEN)
                for line in block.output_lines:
                    self.multi_cell(w, 5, f"+ {line}", fill=True)

            self.set_text_color(*COLOR_BLACK)
            self.ln(2)

        self.ln(4)


def generate_report_pdf(data: ReportData, output_path: str) -> str:
    """生成处理报告 PDF。

    Args:
        data: 报告数据
        output_path: PDF 输出路径

    Returns:
        输出路径
    """
    pdf = ReportPDF(data)
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.add_summary_section()
    pdf.add_scores_section()
    pdf.add_modifications_section()
    pdf.add_diff_section()
    pdf.output(output_path)
    logger.info("report PDF generated: %s", output_path)
    return output_path
