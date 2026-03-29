from backend.services.report.diff import compute_text_diff


def test_identical_texts():
    blocks = compute_text_diff("段落一\n\n段落二", "段落一\n\n段落二")
    assert all(b.tag == "equal" for b in blocks)


def test_simple_replacement():
    blocks = compute_text_diff(
        "此外，这个方案值得注意的是效率很高",
        "这个方案效率很高",
    )
    changes = [b for b in blocks if b.tag != "equal"]
    assert len(changes) == 1
    assert changes[0].tag == "replace"


def test_insertion():
    blocks = compute_text_diff("段落一", "段落一\n\n新增段落")
    changes = [b for b in blocks if b.tag == "insert"]
    assert len(changes) == 1
    assert "新增段落" in changes[0].output_lines


def test_deletion():
    blocks = compute_text_diff("段落一\n\n要删除的段落", "段落一")
    changes = [b for b in blocks if b.tag == "delete"]
    assert len(changes) == 1
    assert "要删除的段落" in changes[0].original_lines


def test_cjk_text():
    orig = "人工智能在自然语言处理方面取得了显著进展\n\n深度学习是核心技术"
    out = "人工智能推动了自然语言处理的进步\n\n深度学习是核心技术"
    blocks = compute_text_diff(orig, out)
    changes = [b for b in blocks if b.tag != "equal"]
    assert len(changes) == 1


def test_empty_original():
    blocks = compute_text_diff("", "新文档内容\n\n第二段")
    changes = [b for b in blocks if b.tag == "insert"]
    assert len(changes) >= 1


def test_max_blocks_limit():
    orig = "\n\n".join(f"原始段落{i}" for i in range(100))
    out = "\n\n".join(f"修改段落{i}" for i in range(100))
    blocks = compute_text_diff(orig, out)
    changes = [b for b in blocks if b.tag != "equal"]
    assert len(changes) <= 51  # 50 + potential truncation marker
