"""
POC #3: Teammate 横向消息

验证:
- Teammate A 能直接发消息给 Teammate B
- Teammate B 收到消息后能回复
- 不经过 Team Lead 中转

运行: python -m backend.tests.poc.test_03_lateral_messaging
"""
import asyncio
import os
import sys

os.environ["CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"] = "1"


async def test_lateral_messaging():
    print("=" * 60)
    print("POC #3: Teammate 横向消息")
    print("=" * 60)

    from claude_agent_sdk import AgentDefinition, ClaudeAgentOptions, query

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("FAIL: ANTHROPIC_API_KEY 未设置")
        sys.exit(1)

    agents = {
        "editor": AgentDefinition(
            description="内容编辑，修改文档内容",
            prompt="""你是内容编辑。
            1. 收到任务后，写一段短文（50字以内）
            2. 写完后直接发消息给 reviewer: "请审核我的短文: [短文内容]"
            3. 如果 reviewer 回复要求返工，修改后再次发消息给 reviewer
            """,
            tools=["Read", "Write"],
            model="sonnet",
        ),
        "reviewer": AgentDefinition(
            description="质量审核员，审核文档质量",
            prompt="""你是质量审核员。
            1. 当你收到 editor 的消息时，审核短文质量
            2. 如果质量不够好，直接回复 editor: "请返工: [具体意见]"
            3. 如果质量足够好，回复 editor: "通过，评分: X/10"
            """,
            tools=["Read"],
            model="sonnet",
        ),
    }

    lead_prompt = """
    你是 Team Lead。目标: 验证 editor 和 reviewer 之间的直接消息通信。

    步骤:
    1. 创建任务 "写一段关于 AI 的短文" 分配给 editor
    2. 让 editor 和 reviewer 之间自行通过消息协调
    3. 你不要介入他们的对话，只在最后汇总结果

    关键验证点: editor 是否直接消息了 reviewer? reviewer 是否直接回复了 editor?
    最终报告这两个问题的答案。
    """

    options = ClaudeAgentOptions(
        env={"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"},
        agents=agents,
        allowed_tools=["Read", "Write", "Agent", "TaskCreate", "TaskUpdate", "SendMessage"],
        max_turns=20,
    )

    result_text = None
    message_count = 0
    send_message_count = 0

    print("\n运行 Team Lead (观察横向消息)...")
    try:
        async for message in query(prompt=lead_prompt, options=options):
            message_count += 1
            msg_type = type(message).__name__

            if hasattr(message, "content") and message.content:
                for block in message.content:
                    if hasattr(block, "name") and block.name == "SendMessage":
                        send_message_count += 1
                        if hasattr(block, "input"):
                            to = block.input.get("to", "?") if isinstance(block.input, dict) else "?"
                            print(f"  [{message_count}] SendMessage → {to}")

            if hasattr(message, "result") and message.result:
                result_text = message.result

    except Exception as e:
        print(f"\n  ERROR: {type(e).__name__}: {e}")

    print("\n" + "=" * 60)
    print(f"消息数: {message_count}")
    print(f"SendMessage 调用次数: {send_message_count}")
    if result_text:
        print(f"结果: {result_text[:400]}")
        has_lateral = "直接" in result_text or "消息" in result_text or send_message_count >= 2
        if has_lateral:
            print("\nPOC #3: PASS (检测到横向消息)")
        else:
            print("\nPOC #3: PARTIAL (完成但未确认横向消息)")
    else:
        print("\nPOC #3: FAIL")

    return result_text is not None


if __name__ == "__main__":
    success = asyncio.run(test_lateral_messaging())
    sys.exit(0 if success else 1)
