"""Agent Teams 编排层

使用 ClaudeSDKClient + Agent Teams 运行文档处理团队。
前向链: Lead 顺序启动 teammates（Agent 阻塞），保证数据依赖。
返工循环: teammates 横向通信（SendMessage），Lead 不介入。
Hooks 捕获生命周期事件 → WebSocket 推送到前端。
"""

import asyncio
import contextlib
import json
import logging
import re
from datetime import UTC, datetime
from pathlib import Path

from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient, HookMatcher
from claude_agent_sdk.types import StreamEvent

from backend.services.orchestrator.agents import AGENTS, docflow_tools
from backend.services.ws_manager import WSManager

logger = logging.getLogger("docflow.team")

AGENT_KEYS = ["content-generator", "content-editor", "format-designer", "quality-reviewer"]


def _match_agent_key(raw: str) -> str | None:
    """从原始字符串中匹配 agent key"""
    for key in AGENT_KEYS:
        if key in raw:
            return key
    return None


def _infer_agent_from_task(subject: str) -> str:
    """从任务标题推断 agent key"""
    if "生成" in subject:
        return "content-generator"
    if "编辑" in subject or "AI 味" in subject or "AI味" in subject:
        return "content-editor"
    if "格式" in subject or "排版" in subject:
        return "format-designer"
    if "审核" in subject or "评分" in subject:
        return "quality-reviewer"
    return "team-lead"


def _extract_score_from_text(text: str) -> dict | None:
    """从文本中提取评分（submit_score 未被调用时的 fallback）

    支持从 reviewer 回复或最终报告中提取，按优先级尝试:
    1. 各维度独立分数 → 加权计算总分
    2. 总分直接提取 → 均匀分配到各维度
    """
    # 维度关键词 → 字段名映射
    dim_patterns = {
        "vocabulary_naturalness": r"词汇自然[度感]?\**[：:]*\s*\**\s*(\d+\.?\d*)",
        "sentence_diversity": r"句式多样[性度]?\**[：:]*\s*\**\s*(\d+\.?\d*)",
        "format_humanity": r"格式人类[感度]?\**[：:]*\s*\**\s*(\d+\.?\d*)",
        "logical_coherence": r"逻辑连贯[性度]?\**[：:]*\s*\**\s*(\d+\.?\d*)",
        "domain_adaptation": r"领域适配[度性]?\**[：:]*\s*\**\s*(\d+\.?\d*)",
    }
    weights = {
        "vocabulary_naturalness": 0.3,
        "sentence_diversity": 0.2,
        "format_humanity": 0.25,
        "logical_coherence": 0.15,
        "domain_adaptation": 0.1,
    }

    # 尝试提取各维度分数
    dims: dict[str, float] = {}
    for key, pattern in dim_patterns.items():
        m = re.search(pattern, text)
        if m:
            dims[key] = float(m.group(1))

    if len(dims) >= 3:  # 至少匹配 3 个维度才有效
        for key in dim_patterns:
            if key not in dims:
                dims[key] = sum(dims.values()) / len(dims)  # 缺失维度用均值填充
        total = sum(dims.get(k, 0) * w for k, w in weights.items())
        passed = total >= 8.0
        return {**{k: round(v, 1) for k, v in dims.items()}, "total": round(total, 1), "passed": passed}

    # Fallback: 从总分直接提取
    match = re.search(r"评分\**[：:]*\s*\**\s*(\d+\.?\d*)\s*/\s*10", text)
    if not match:
        # 也尝试 "总分: 8.3" 格式
        match = re.search(r"总分\**[：:]*\s*\**\s*(\d+\.?\d*)", text)
    if not match:
        return None

    total = float(match.group(1))
    passed = total >= 8.0
    return {
        "vocabulary_naturalness": round(total, 1),
        "sentence_diversity": round(total, 1),
        "format_humanity": round(total, 1),
        "logical_coherence": round(total, 1),
        "domain_adaptation": round(total, 1),
        "total": round(total, 1),
        "passed": passed,
    }


def _build_refine_prompt(
    source_file: str,
    edited_path: str,
    formatted_path: str,
    output_path: str,
) -> str:
    """精修模式的 Team Lead prompt"""
    return f"""你是文档精修团队的 Team Lead。

【关键规则】你一次只能调用一个 Agent 工具。在当前 Agent 返回结果之前，绝对不要调用下一个 Agent。每次回复中最多包含一个 Agent 工具调用。

按以下顺序执行:

1) 现在，使用 Agent 工具启动 content-editor（description 设为 "content-editor"），prompt 设为:
   "读取 {source_file}，使用 parse_document 解析文档，然后用 replace_content 去除 AI 味词汇，输出到 {edited_path}。完成后回复修改摘要。"

2) 收到 content-editor 的结果后，使用 Agent 工具启动 format-designer（description 设为 "format-designer"），prompt 设为:
   "读取 {edited_path}，使用 parse_document 分析排版，然后用 apply_format 人类化排版，输出到 {formatted_path}。完成后回复格式摘要。"

3) 收到 format-designer 的结果后，使用 Agent 工具启动 quality-reviewer（description 设为 "quality-reviewer"），prompt 设为:
   "严格按顺序执行三步: 1) 调用 parse_document 读取 {formatted_path} 的内容。2) 调用 submit_score 提交评分，scores 参数为 JSON 字符串，例如 '{{\"vocabulary_naturalness\": 8, \"sentence_diversity\": 7, \"format_humanity\": 8, \"logical_coherence\": 9, \"domain_adaptation\": 7}}'。3) 读取 submit_score 返回的 total 和 passed，基于此回复。你不能跳过 submit_score 工具调用。"

4) 收到 quality-reviewer 的结果后判断:
   - 通过（>= 8.0）或已 3 轮: 用 Bash 执行 `cp {formatted_path} {output_path}`，然后输出最终报告
   - 未通过（< 8.0）且 < 3 轮: 用 SendMessage 给 content-editor 发返工指令，等回复；再 SendMessage 给 format-designer，等回复；再 SendMessage 给 quality-reviewer 要求重审，等回复。然后重复步骤 4 判断

最终报告格式:
## 处理报告
- 处理轮次: X
- 最终评分: X.X/10
- 是否通过: 是/否
- 内容修改: [摘要]
- 格式修改: [摘要]
- 审核意见: [摘要]"""


def _build_generate_prompt(
    description: str,
    draft_path: str,
    edited_path: str,
    formatted_path: str,
    output_path: str,
) -> str:
    """生成模式的 Team Lead prompt"""
    return f"""你是文档精修团队的 Team Lead。

【关键规则】你一次只能调用一个 Agent 工具。在当前 Agent 返回结果之前，绝对不要调用下一个 Agent。每次回复中最多包含一个 Agent 工具调用。

按以下顺序执行:

1) 现在，使用 Agent 工具启动 content-generator（description 设为 "content-generator"），prompt 设为:
   "根据以下需求生成文档: {description}。使用 write_document 工具写入 {draft_path}。完成后回复文档结构摘要。"

2) 收到 content-generator 的结果后，使用 Agent 工具启动 content-editor（description 设为 "content-editor"），prompt 设为:
   "读取 {draft_path}，使用 parse_document 解析文档，然后用 replace_content 去除 AI 味词汇，输出到 {edited_path}。完成后回复修改摘要。"

3) 收到 content-editor 的结果后，使用 Agent 工具启动 format-designer（description 设为 "format-designer"），prompt 设为:
   "读取 {edited_path}，使用 parse_document 分析排版，然后用 apply_format 人类化排版，输出到 {formatted_path}。完成后回复格式摘要。"

4) 收到 format-designer 的结果后，使用 Agent 工具启动 quality-reviewer（description 设为 "quality-reviewer"），prompt 设为:
   "严格按顺序执行三步: 1) 调用 parse_document 读取 {formatted_path} 的内容。2) 调用 submit_score 提交评分，scores 参数为 JSON 字符串，例如 '{{\"vocabulary_naturalness\": 8, \"sentence_diversity\": 7, \"format_humanity\": 8, \"logical_coherence\": 9, \"domain_adaptation\": 7}}'。3) 读取 submit_score 返回的 total 和 passed，基于此回复。你不能跳过 submit_score 工具调用。"

5) 收到 quality-reviewer 的结果后判断:
   - 通过（>= 8.0）或已 3 轮: 用 Bash 执行 `cp {formatted_path} {output_path}`，然后输出最终报告
   - 未通过（< 8.0）且 < 3 轮: 用 SendMessage 给 content-editor 发返工指令，等回复；再 SendMessage 给 format-designer，等回复；再 SendMessage 给 quality-reviewer 要求重审，等回复。然后重复步骤 5 判断

最终报告格式:
## 处理报告
- 处理轮次: X
- 最终评分: X.X/10
- 是否通过: 是/否
- 内容生成: [摘要]
- 内容修改: [摘要]
- 格式修改: [摘要]
- 审核意见: [摘要]

返工不需要重新生成初稿，只从编辑步骤开始。"""


async def run_team(
    task_id: str,
    task_dir: str,
    description: str | None,
    doc_format: str,
    source_file: str | None,
    style_dna_id: str | None,
    ws_manager: WSManager,
):
    """运行文档处理团队"""

    await ws_manager.send(
        task_id,
        {
            "type": "team_status",
            "status": "started",
            "task_id": task_id,
        },
    )

    # PDF 输入 → 输出为 docx（PDF 不支持原地修改）
    out_format = "docx" if doc_format == "pdf" else doc_format

    output_path = str(Path(task_dir) / f"output.{out_format}")
    edited_path = str(Path(task_dir) / f"edited.{out_format}")
    formatted_path = str(Path(task_dir) / f"formatted.{out_format}")
    draft_path = str(Path(task_dir) / f"draft.{out_format}")

    if source_file:
        lead_prompt = _build_refine_prompt(source_file, edited_path, formatted_path, output_path)
    else:
        lead_prompt = _build_generate_prompt(description or "", draft_path, edited_path, formatted_path, output_path)

    if style_dna_id:
        lead_prompt += (
            f"\n\n文风 DNA ID: {style_dna_id}，在 content-editor 的 prompt 中加入: '套用文风 DNA {style_dna_id}'。"
        )

    # 状态追踪（闭包变量）
    rework_state = {"round": 1}

    # Token 追踪
    from backend.services.usage_tracker import UsageTracker

    usage_tracker = UsageTracker(
        task_id=task_id,
        task_dir=task_dir,
        mode="generation" if description else "refinement",
    )

    agent_id_map: dict[str, str] = {}  # SDK UUID → agent key
    last_agent_desc = {"value": ""}  # 最近一次 Agent 调用的 description
    score_sent = {"count": 0}  # 已发送 score_update 的次数

    # === Hooks ===

    async def on_pre_tool(input_data, tool_use_id, context):
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})

        if tool_name == "SendMessage":
            to_raw = str(tool_input.get("to", ""))
            content = str(tool_input.get("content", ""))

            # 推断发送者: 先查 agent_id_map，再 fallback 到匹配
            raw_id = str(input_data.get("agent_id", ""))
            from_agent = agent_id_map.get(raw_id)
            if not from_agent:
                from_agent = _match_agent_key(raw_id or str(input_data.get("agent_type", ""))) or "team-lead"

            to_agent = agent_id_map.get(to_raw) or _match_agent_key(to_raw) or to_raw

            await ws_manager.send(
                task_id,
                {
                    "type": "agent_message",
                    "from": from_agent,
                    "to": to_agent,
                    "content": content[:200],
                },
            )

            if "返工" in content or "rework" in content.lower():
                rework_state["round"] += 1
                await ws_manager.send(
                    task_id,
                    {
                        "type": "rework_cycle",
                        "round": rework_state["round"],
                        "max": 3,
                        "reviewer_notes": content[:300],
                    },
                )

        elif tool_name == "TaskCreate":
            subject = str(tool_input.get("subject", ""))
            agent = _infer_agent_from_task(subject)
            await ws_manager.send(
                task_id,
                {
                    "type": "agent_status",
                    "agent": agent,
                    "status": "pending",
                    "task": subject,
                },
            )

        elif tool_name == "TaskUpdate":
            status = str(tool_input.get("status", ""))
            raw_id = str(input_data.get("agent_id", ""))
            agent = agent_id_map.get(raw_id) or _match_agent_key(raw_id) or "team-lead"
            status_map = {"in_progress": "working", "completed": "completed"}
            if status in status_map:
                await ws_manager.send(
                    task_id,
                    {
                        "type": "agent_status",
                        "agent": agent,
                        "status": status_map[status],
                    },
                )

        elif tool_name == "Agent":
            desc = str(tool_input.get("description", ""))
            last_agent_desc["value"] = desc
            agent_key = _match_agent_key(desc) or desc
            await ws_manager.send(
                task_id,
                {
                    "type": "tool_call",
                    "tool": "Agent",
                    "target": agent_key,
                    "status": "started",
                },
            )

        return {}

    async def on_subagent_start(input_data, tool_use_id, context):
        raw_id = str(input_data.get("agent_id", ""))
        agent_type = str(input_data.get("agent_type", ""))

        # 建立 UUID → agent key 映射
        agent_key = _match_agent_key(agent_type) or _match_agent_key(last_agent_desc["value"])
        if agent_key and raw_id:
            agent_id_map[raw_id] = agent_key

        display_name = agent_key or raw_id
        await ws_manager.send(
            task_id,
            {
                "type": "agent_status",
                "agent": display_name,
                "status": "working",
            },
        )
        return {}

    async def on_subagent_stop(input_data, tool_use_id, context):
        raw_id = str(input_data.get("agent_id", "unknown"))
        agent_key = agent_id_map.get(raw_id) or _match_agent_key(raw_id) or raw_id
        await ws_manager.send(
            task_id,
            {
                "type": "agent_status",
                "agent": agent_key,
                "status": "completed",
            },
        )

        # 尝试从 input_data 提取 token usage
        usage = input_data.get("usage", {})
        if usage:
            input_t = int(usage.get("input_tokens", 0))
            output_t = int(usage.get("output_tokens", 0))
            if input_t or output_t:
                agent_usage = usage_tracker.add_tokens(agent_key, input_t, output_t)
                await ws_manager.send(
                    task_id,
                    {
                        "type": "token_update",
                        "agent": agent_key,
                        "input_tokens": agent_usage["input_tokens"],
                        "output_tokens": agent_usage["output_tokens"],
                        "total_tokens": agent_usage["input_tokens"] + agent_usage["output_tokens"],
                    },
                )

        return {}

    async def on_post_tool(input_data, tool_use_id, context):
        tool_name = input_data.get("tool_name", "")
        if "submit_score" in tool_name:
            tool_result = input_data.get("tool_result", "")
            try:
                scores = json.loads(tool_result) if isinstance(tool_result, str) else tool_result
                await _emit_score(scores)
            except (json.JSONDecodeError, TypeError):
                pass

        # 当 quality-reviewer Agent 完成时，从回复文本中提取评分作为 fallback
        elif tool_name == "Agent" and _match_agent_key(last_agent_desc["value"]) == "quality-reviewer":
            tool_response = input_data.get("tool_response", "")
            if score_sent["count"] < rework_state["round"] and isinstance(tool_response, str):
                fallback = _extract_score_from_text(tool_response)
                if fallback:
                    await _emit_score(fallback)

        return {}

    async def _emit_score(scores: dict):
        """推送评分并持久化"""
        with contextlib.suppress(OSError):
            (Path(task_dir) / "scores.json").write_text(json.dumps(scores, ensure_ascii=False))
        await ws_manager.send(task_id, {"type": "score_update", "scores": scores})
        score_sent["count"] += 1

    options = ClaudeAgentOptions(
        env={"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"},
        agents=AGENTS,
        hooks={
            "PreToolUse": [HookMatcher(hooks=[on_pre_tool])],
            "SubagentStart": [HookMatcher(hooks=[on_subagent_start])],
            "SubagentStop": [HookMatcher(hooks=[on_subagent_stop])],
            "PostToolUse": [HookMatcher(hooks=[on_post_tool])],
        },
        mcp_servers={"docflow-tools": docflow_tools},
        allowed_tools=[
            "Read",
            "Write",
            "Bash",
            "Agent",
            "TaskCreate",
            "TaskUpdate",
            "TaskList",
            "TaskGet",
            "SendMessage",
            "mcp__docflow-tools__parse_document",
            "mcp__docflow-tools__replace_content",
            "mcp__docflow-tools__apply_format",
            "mcp__docflow-tools__write_document",
            "mcp__docflow-tools__submit_score",
        ],
        permission_mode="acceptEdits",
        include_partial_messages=True,
        max_turns=100,
    )

    logger.info("team started task=%s format=%s", task_id, doc_format)

    try:
        async with asyncio.timeout(900):  # 15 分钟超时（3 轮返工 × 3 agent × ~1.5 min）
            async with ClaudeSDKClient(options=options) as client:
                await client.query(lead_prompt)
                async for message in client.receive_response():
                    if isinstance(message, StreamEvent):
                        event = message.event if hasattr(message, "event") else {}
                        event_type = event.get("type", "") if isinstance(event, dict) else ""
                        if event_type in ("content_block_start", "content_block_stop"):
                            await ws_manager.send(
                                task_id,
                                {
                                    "type": "stream_event",
                                    "event_type": event_type,
                                },
                            )

                    if hasattr(message, "result") and message.result:
                        # 最终 fallback: 如果从未收到评分，从报告文本中提取
                        if score_sent["count"] == 0:
                            fallback = _extract_score_from_text(message.result)
                            if fallback:
                                await _emit_score(fallback)

                        output_exists = Path(output_path).exists() and Path(output_path).stat().st_size > 0

                        # 生成处理报告 PDF（non-fatal）
                        report_path = str(Path(task_dir) / "report.pdf")
                        try:
                            _generate_report(
                                task_id=task_id,
                                task_dir=task_dir,
                                doc_format=doc_format,
                                out_format=out_format,
                                source_file=source_file,
                                result_text=message.result,
                            )
                        except Exception:
                            logger.warning("report generation failed task=%s", task_id, exc_info=True)
                            report_path = None

                        # 持久化 usage
                        usage_tracker.status = "completed"
                        usage_tracker.rounds = rework_state["round"]
                        if score_sent["count"] > 0:
                            scores_file = Path(task_dir) / "scores.json"
                            if scores_file.exists():
                                import json as _json

                                _scores = _json.loads(scores_file.read_text())
                                usage_tracker.final_score = _scores.get("total")
                        usage_tracker.save()

                        await ws_manager.send(
                            task_id,
                            {
                                "type": "team_complete",
                                "status": "completed",
                                "result": message.result,
                                "output_file": output_path if output_exists else None,
                                "report_file": report_path,
                            },
                        )
                        logger.info("team completed task=%s", task_id)

    except TimeoutError:
        logger.error("team timeout task=%s", task_id)
        usage_tracker.status = "failed"
        usage_tracker.save()
        await ws_manager.send(
            task_id,
            {
                "type": "team_status",
                "status": "failed",
                "error": "处理超时（15 分钟），请检查文档复杂度或稍后重试",
            },
        )
    except Exception as e:
        logger.error("team failed task=%s", task_id, exc_info=True)
        usage_tracker.status = "failed"
        usage_tracker.save()
        await ws_manager.send(
            task_id,
            {
                "type": "team_status",
                "status": "failed",
                "error": f"{type(e).__name__}: {str(e)}",
            },
        )


def _generate_report(
    task_id: str,
    task_dir: str,
    doc_format: str,
    out_format: str,
    source_file: str | None,
    result_text: str,
) -> None:
    """生成 report.pdf 到 task 目录。"""
    from backend.models.schemas import ReportData, ScoreResult
    from backend.processors import get_processor
    from backend.services.report.pdf_generator import generate_report_pdf

    task_path = Path(task_dir)

    # 加载持久化的评分
    scores = None
    scores_file = task_path / "scores.json"
    if scores_file.exists():
        raw = json.loads(scores_file.read_text())
        scores = ScoreResult(**raw)

    # 提取原文和输出文本
    original_text = ""
    if source_file and Path(source_file).exists():
        processor = get_processor(source_file)
        original_text = processor.extract_text(source_file)

    output_text = ""
    for f in task_path.iterdir():
        if f.name.startswith("output"):
            processor = get_processor(str(f))
            output_text = processor.extract_text(str(f))
            break

    # 从 result 文本中解析轮次
    rounds = 1
    m = re.search(r"处理轮次:\s*(\d+)", result_text)
    if m:
        rounds = int(m.group(1))

    data = ReportData(
        task_id=task_id,
        created_at=datetime.now(UTC).isoformat(),
        input_format=doc_format,
        output_format=out_format,
        rounds=rounds,
        scores=scores,
        team_lead_summary=result_text,
        original_text=original_text,
        output_text=output_text,
        is_generation_mode=source_file is None,
    )

    generate_report_pdf(data, str(task_path / "report.pdf"))
