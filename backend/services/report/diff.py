"""段落级文本 diff 计算"""

from dataclasses import dataclass, field
from difflib import SequenceMatcher

MAX_DIFF_BLOCKS = 50


@dataclass
class DiffBlock:
    tag: str  # 'equal', 'replace', 'insert', 'delete'
    original_lines: list[str] = field(default_factory=list)
    output_lines: list[str] = field(default_factory=list)


def compute_text_diff(original: str, output: str) -> list[DiffBlock]:
    """计算段落级 diff。

    按双换行分割段落，用 SequenceMatcher 对比。
    返回最多 MAX_DIFF_BLOCKS 个变更块（跳过 equal 块的计数）。
    """
    orig_paras = _split_paragraphs(original)
    out_paras = _split_paragraphs(output)

    matcher = SequenceMatcher(None, orig_paras, out_paras)
    blocks: list[DiffBlock] = []
    change_count = 0

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            # 保留少量上下文
            ctx = orig_paras[i1:i2]
            if len(ctx) > 2:
                ctx = ctx[:1] + ["..."] + ctx[-1:]
            blocks.append(DiffBlock(tag="equal", original_lines=ctx, output_lines=ctx))
            continue

        if change_count >= MAX_DIFF_BLOCKS:
            blocks.append(
                DiffBlock(
                    tag="equal",
                    original_lines=["... 省略剩余变更 ..."],
                    output_lines=["... 省略剩余变更 ..."],
                )
            )
            break

        blocks.append(
            DiffBlock(
                tag=tag,
                original_lines=orig_paras[i1:i2],
                output_lines=out_paras[j1:j2],
            )
        )
        change_count += 1

    return blocks


def _split_paragraphs(text: str) -> list[str]:
    """按双换行分割段落，过滤空段落。"""
    if not text.strip():
        return []
    return [p.strip() for p in text.split("\n\n") if p.strip()]
