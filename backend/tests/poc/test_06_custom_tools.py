"""
POC #6: 自定义工具

验证:
- @tool 装饰器注册自定义工具
- create_sdk_mcp_server 创建 in-process MCP server
- Agent 能调用自定义工具并获取结果

运行: python -m backend.tests.poc.test_06_custom_tools
"""
import asyncio
import json
import os
import sys

os.environ["CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"] = "1"


async def test_custom_tools():
    print("=" * 60)
    print("POC #6: 自定义工具")
    print("=" * 60)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("FAIL: ANTHROPIC_API_KEY 未设置")
        sys.exit(1)

    # Step 1: 注册自定义工具
    print("\n[1/3] 注册自定义工具...")
    try:
        from claude_agent_sdk import ClaudeAgentOptions, create_sdk_mcp_server, query, tool

        tool_call_log = []

        @tool("analyze_document", "分析文档结构，返回段落数和字数统计", {"file_path": str})
        async def analyze_document(args):
            file_path = args["file_path"]
            tool_call_log.append(f"analyze_document({file_path})")
            # Mock 返回
            result = {
                "file_path": file_path,
                "format": "docx",
                "paragraphs": 12,
                "total_chars": 3500,
                "ai_indicators": ["此外 x3", "值得注意的是 x2", "综上所述 x1"],
                "ai_score": 4.2,
            }
            return {"content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False)}]}

        @tool("get_style_dna", "获取用户的文风 DNA 特征", {"user_id": str})
        async def get_style_dna(args):
            user_id = args["user_id"]
            tool_call_log.append(f"get_style_dna({user_id})")
            result = {
                "user_id": user_id,
                "vocabulary_preference": ["探讨", "分析", "研究表明"],
                "sentence_length_avg": 25,
                "formality_level": 0.8,
                "favorite_connectors": ["然而", "与此同时", "从另一个角度看"],
            }
            return {"content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False)}]}

        doc_server = create_sdk_mcp_server(
            name="docflow-tools",
            version="1.0.0",
            tools=[analyze_document, get_style_dna],
        )
        print("  OK: 2 个自定义工具注册成功")

    except Exception as e:
        print(f"  FAIL: {type(e).__name__}: {e}")
        sys.exit(1)

    # Step 2: Agent 调用自定义工具
    print("\n[2/3] Agent 调用自定义工具...")

    options = ClaudeAgentOptions(
        mcp_servers={"docflow-tools": doc_server},
        allowed_tools=["mcp__docflow-tools__analyze_document", "mcp__docflow-tools__get_style_dna"],
        max_turns=5,
    )

    result_text = None
    try:
        async for message in query(
            prompt='请使用 analyze_document 工具分析文件 "/tmp/test.docx"，然后使用 get_style_dna 获取用户 "user-001" 的文风。汇总两个工具的结果。',
            options=options,
        ):
            if hasattr(message, "content") and message.content:
                for block in message.content:
                    if hasattr(block, "name") and "docflow" in str(getattr(block, "name", "")):
                        print(f"  Agent 调用: {block.name}")

            if hasattr(message, "result") and message.result:
                result_text = message.result

    except Exception as e:
        print(f"  ERROR: {type(e).__name__}: {e}")

    # Step 3: 验证
    print("\n[3/3] 验证工具调用日志...")
    print(f"  工具被调用次数: {len(tool_call_log)}")
    for call in tool_call_log:
        print(f"    {call}")

    print("\n" + "=" * 60)
    if len(tool_call_log) >= 2:
        print("POC #6: PASS (两个工具都被调用)")
    elif len(tool_call_log) == 1:
        print("POC #6: PARTIAL (只有 1 个工具被调用)")
    else:
        print("POC #6: FAIL (没有工具被调用)")

    if result_text:
        print(f"结果: {result_text[:300]}")

    return len(tool_call_log) >= 2


if __name__ == "__main__":
    success = asyncio.run(test_custom_tools())
    sys.exit(0 if success else 1)
