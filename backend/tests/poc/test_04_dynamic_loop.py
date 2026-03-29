"""
POC #4: 动态循环

验证:
- Reviewer 评分不过 → 消息 Editor 返工
- Editor 返工后 → 消息 Reviewer 重审
- 循环直到通过或达到最大轮次

这是 docflow 管线的核心差异化验证。

运行: python -m backend.tests.poc.test_04_dynamic_loop
"""
import asyncio
import os
import sys

os.environ["CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"] = "1"


async def test_dynamic_loop():
    print("=" * 60)
    print("POC #4: 动态审核循环")
    print("=" * 60)

    from claude_agent_sdk import AgentDefinition, ClaudeAgentOptions, query

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("FAIL: ANTHROPIC_API_KEY 未设置")
        sys.exit(1)

    agents = {
        "editor": AgentDefinition(
            description="内容编辑，负责写作和返工",
            prompt="""你是内容编辑。规则:
            1. 第一次写作: 故意写一段有 AI 味的短文（使用"此外"、"值得注意的是"等词汇），50字以内
            2. 当 reviewer 要求返工时，根据他的意见修改，去掉 AI 味词汇
            3. 每次修改后发消息给 reviewer: "已修改，请重审: [新内容]"
            """,
            tools=["Read", "Write"],
            model="sonnet",
        ),
        "reviewer": AgentDefinition(
            description="质量审核员，负责评分和触发返工",
            prompt="""你是质量审核员。规则:
            1. 审核 editor 发来的内容
            2. 如果发现 AI 味词汇（"此外"、"值得注意的是"、"综上所述"等），
               评分低于 8 分，发消息给 editor: "评分: X/10。返工要求: [具体要改什么]"
            3. 如果没有 AI 味词汇，评分 >= 8，发消息给 editor: "通过! 评分: X/10"
            4. 最多审核 3 轮
            """,
            tools=["Read"],
            model="sonnet",
        ),
    }

    lead_prompt = """
    你是 Team Lead，负责验证动态审核循环。

    步骤:
    1. 给 editor 分配任务: "写一段关于人工智能的短文（故意写成 AI 味的）"
    2. editor 写完后会消息 reviewer
    3. reviewer 审核后如果不通过，会消息 editor 返工
    4. 这个循环持续直到 reviewer 通过或达到 3 轮

    你不介入 editor 和 reviewer 的对话。等循环结束后汇总:
    - 循环了几轮
    - 每轮的评分
    - 最终是否通过
    """

    options = ClaudeAgentOptions(
        env={"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"},
        agents=agents,
        allowed_tools=["Read", "Write", "Agent", "TaskCreate", "TaskUpdate", "SendMessage"],
        max_turns=30,
    )

    result_text = None
    message_count = 0

    print("\n运行动态循环测试...")
    try:
        async for message in query(prompt=lead_prompt, options=options):
            message_count += 1
            msg_type = type(message).__name__

            if hasattr(message, "content") and message.content:
                for block in message.content:
                    if hasattr(block, "name"):
                        target = ""
                        if hasattr(block, "input") and isinstance(block.input, dict):
                            target = block.input.get("to", block.input.get("description", ""))
                        print(f"  [{message_count}] {block.name} → {target}")

            if hasattr(message, "result") and message.result:
                result_text = message.result

    except Exception as e:
        print(f"\n  ERROR: {type(e).__name__}: {e}")

    print("\n" + "=" * 60)
    print(f"消息总数: {message_count}")
    if result_text:
        print(f"结果:\n{result_text[:500]}")
        has_loop = any(kw in result_text for kw in ["轮", "循环", "返工", "round", "loop"])
        if has_loop:
            print("\nPOC #4: PASS (检测到循环)")
        else:
            print("\nPOC #4: PARTIAL (完成但未确认循环)")
    else:
        print("\nPOC #4: FAIL")

    return result_text is not None


if __name__ == "__main__":
    success = asyncio.run(test_dynamic_loop())
    sys.exit(0 if success else 1)
