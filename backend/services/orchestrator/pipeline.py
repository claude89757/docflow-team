"""Agent Teams 管线编排层

使用 ClaudeSDKClient + Agent Teams 运行 4-agent 文档处理管线。
Hooks 捕获生命周期事件 → WebSocket 推送到前端。
"""
import os
import json
import traceback
from pathlib import Path

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, HookMatcher
from claude_agent_sdk.types import StreamEvent

from backend.services.orchestrator.agents import AGENTS, docflow_tools
from backend.services.ws_manager import WSManager


async def run_pipeline(
    task_id: str,
    task_dir: str,
    description: str | None,
    doc_format: str,
    source_file: str | None,
    style_dna_id: str | None,
    ws_manager: WSManager,
):
    """运行完整文档处理管线"""

    await ws_manager.send(task_id, {
        "type": "pipeline_status",
        "status": "started",
        "task_id": task_id,
    })

    # 构建 Team Lead prompt
    output_path = str(Path(task_dir) / f"output.{doc_format}")
    edited_path = str(Path(task_dir) / f"edited.{doc_format}")
    formatted_path = str(Path(task_dir) / f"formatted.{doc_format}")

    draft_path = str(Path(task_dir) / f"draft.{doc_format}")

    if source_file:
        # 精修模式：已有文档
        lead_prompt = f"""你是文档精修团队的 Team Lead。你必须按顺序完成所有步骤，不能提前结束。

## 文件路径
- 源文件: {source_file}
- 编辑后: {edited_path}
- 格式化后: {formatted_path}
- 最终输出: {output_path}

## 你必须依次执行以下 3 个步骤

### 步骤 1: 内容编辑
使用 Agent 工具启动 content-editor，在 prompt 中告诉它:
"读取 {source_file}，使用 parse_docx 工具解析文档，然后用 replace_paragraphs 工具去除 AI 味词汇，输出到 {edited_path}。完成后回复你的修改摘要。"

等 content-editor 返回结果后，记录它的修改摘要。然后继续步骤 2。

### 步骤 2: 格式设计
使用 Agent 工具启动 format-designer，在 prompt 中告诉它:
"读取 {edited_path}，使用 parse_docx 分析排版，然后用 apply_format_changes 工具人类化排版，输出到 {formatted_path}。完成后回复你的格式修改摘要。"

等 format-designer 返回结果后，记录它的修改摘要。然后继续步骤 3。

### 步骤 3: 质量审核
使用 Agent 工具启动 quality-reviewer，在 prompt 中告诉它:
"读取 {formatted_path}，使用 parse_docx 工具分析文档内容和格式，逐维度评分 (词汇自然度、句式多样性、格式人类感、逻辑连贯性、领域适配度)，使用 submit_score 工具提交评分。如果总分 < 8.0，列出需要返工的具体段落和问题。"

等 quality-reviewer 返回结果后:
- 如果通过 (>= 8.0): 用 Bash 工具执行 `cp {formatted_path} {output_path}`，然后输出最终报告
- 如果未通过且轮次 < 3: 重复步骤 1-3（content-editor 读取 {formatted_path} 而不是源文件）
- 如果未通过且已 3 轮: 用 Bash 工具执行 `cp {formatted_path} {output_path}`，输出最终报告说明未达标

## 最终报告格式
```
## 处理报告
- 处理轮次: X
- 最终评分: X.X/10
- 是否通过: 是/否
- 内容修改: [content-editor 的摘要]
- 格式修改: [format-designer 的摘要]
- 审核意见: [quality-reviewer 的摘要]
```

重要: 你必须完成所有 3 个步骤才能结束。不要在启动第一个 agent 后就返回。
"""
    else:
        # 生成模式：从需求描述生成
        lead_prompt = f"""你是文档精修团队的 Team Lead。你必须按顺序完成所有步骤，不能提前结束。

## 文件路径
- 初稿: {draft_path}
- 编辑后: {edited_path}
- 格式化后: {formatted_path}
- 最终输出: {output_path}

## 你必须依次执行以下 4 个步骤

### 步骤 1: 内容生成
使用 Agent 工具启动 content-generator，在 prompt 中告诉它:
"根据以下需求生成文档: {description}。使用 write_document 工具写入 {draft_path}。完成后回复文档结构摘要。"

等 content-generator 返回结果后，记录摘要。继续步骤 2。

### 步骤 2: 内容编辑
使用 Agent 工具启动 content-editor，在 prompt 中告诉它:
"读取 {draft_path}，使用 parse_docx 工具解析文档，然后用 replace_paragraphs 工具去除 AI 味词汇，输出到 {edited_path}。完成后回复你的修改摘要。"

等 content-editor 返回结果后，记录修改摘要。继续步骤 3。

### 步骤 3: 格式设计
使用 Agent 工具启动 format-designer，在 prompt 中告诉它:
"读取 {edited_path}，使用 parse_docx 分析排版，然后用 apply_format_changes 工具人类化排版，输出到 {formatted_path}。完成后回复你的格式修改摘要。"

等 format-designer 返回结果后，记录修改摘要。继续步骤 4。

### 步骤 4: 质量审核
使用 Agent 工具启动 quality-reviewer，在 prompt 中告诉它:
"读取 {formatted_path}，使用 parse_docx 工具分析文档内容和格式，逐维度评分 (词汇自然度、句式多样性、格式人类感、逻辑连贯性、领域适配度)，使用 submit_score 工具提交评分。如果总分 < 8.0，列出需要返工的具体段落和问题。"

等 quality-reviewer 返回结果后:
- 如果通过 (>= 8.0): 用 Bash 工具执行 `cp {formatted_path} {output_path}`，然后输出最终报告
- 如果未通过且轮次 < 3: 重复步骤 2-4（content-editor 读取上轮输出而不是初稿）
- 如果未通过且已 3 轮: 用 Bash 工具执行 `cp {formatted_path} {output_path}`，输出最终报告说明未达标

## 最终报告格式
```
## 处理报告
- 处理轮次: X
- 最终评分: X.X/10
- 是否通过: 是/否
- 内容生成: [content-generator 的摘要]
- 内容修改: [content-editor 的摘要]
- 格式修改: [format-designer 的摘要]
- 审核意见: [quality-reviewer 的摘要]
```

重要: 你必须完成所有 4 个步骤才能结束。不要在启动某个 agent 后就返回。
"""

    if style_dna_id:
        lead_prompt += f"\n文风 DNA ID: {style_dna_id}，通知 content-editor 套用该风格。"

    # Hooks → WebSocket
    async def on_pre_tool(input_data, tool_use_id, context):
        tool_name = input_data.get("tool_name", "")
        if tool_name in ("Agent", "SendMessage"):
            tool_input = input_data.get("tool_input", {})
            await ws_manager.send(task_id, {
                "type": "tool_call",
                "tool": tool_name,
                "target": tool_input.get("to", tool_input.get("description", "")),
                "status": "started",
            })
        return {}

    async def on_subagent_start(input_data, tool_use_id, context):
        desc = input_data.get("description", "unknown")
        await ws_manager.send(task_id, {
            "type": "agent_status",
            "agent": desc,
            "status": "working",
        })
        return {}

    async def on_subagent_stop(input_data, tool_use_id, context):
        agent_id = input_data.get("agent_id", "unknown")
        await ws_manager.send(task_id, {
            "type": "agent_status",
            "agent": agent_id,
            "status": "completed",
        })
        return {}

    async def on_post_tool(input_data, tool_use_id, context):
        tool_name = input_data.get("tool_name", "")
        # 捕获评分结果
        if "submit_score" in tool_name:
            tool_result = input_data.get("tool_result", "")
            try:
                scores = json.loads(tool_result) if isinstance(tool_result, str) else tool_result
                await ws_manager.send(task_id, {
                    "type": "score_update",
                    "scores": scores,
                })
            except (json.JSONDecodeError, TypeError):
                pass
        return {}

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
            "Read", "Write", "Bash", "Agent", "TaskCreate", "TaskUpdate", "SendMessage",
            "mcp__docflow-tools__*",
        ],
        permission_mode="acceptEdits",
        include_partial_messages=True,
        max_turns=100,
    )

    try:
        async with ClaudeSDKClient(options=options) as client:
            await client.query(lead_prompt)
            async for message in client.receive_response():
                msg_type = type(message).__name__

                # 转发流式事件
                if isinstance(message, StreamEvent):
                    event = message.event if hasattr(message, "event") else {}
                    event_type = event.get("type", "") if isinstance(event, dict) else ""
                    # 只转发关键事件，不转发每个 token
                    if event_type in ("content_block_start", "content_block_stop"):
                        await ws_manager.send(task_id, {
                            "type": "stream_event",
                            "event_type": event_type,
                        })

                # 最终结果
                if hasattr(message, "result") and message.result:
                    await ws_manager.send(task_id, {
                        "type": "pipeline_complete",
                        "status": "completed",
                        "result": message.result,
                        "output_file": output_path if Path(output_path).exists() else None,
                    })

    except Exception as e:
        await ws_manager.send(task_id, {
            "type": "pipeline_status",
            "status": "failed",
            "error": f"{type(e).__name__}: {str(e)}",
        })
        traceback.print_exc()
