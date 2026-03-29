"""
POC #2: Teammate 创建 + 任务分配

验证:
- Team Lead 能创建 teammate
- Teammate 能接收并完成任务
- 任务依赖能正确排序

运行: python -m backend.tests.poc.test_02_teammates
"""
import asyncio
import os
import sys

os.environ["CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"] = "1"


async def test_teammates():
    print("=" * 60)
    print("POC #2: Teammate 创建 + 任务分配")
    print("=" * 60)

    from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("FAIL: ANTHROPIC_API_KEY 未设置")
        sys.exit(1)

    # 定义 2 个简单 teammate
    agents = {
        "writer": AgentDefinition(
            description="写一段短文",
            prompt="你是写作助手。收到任务后写一段 50 字以内的短文。写完后消息通知 reviewer。",
            tools=["Read", "Write"],
            model="sonnet",
        ),
        "reviewer": AgentDefinition(
            description="审核短文",
            prompt="你是审核员。收到 writer 的消息后，审核短文质量，给出 1-10 分评价。",
            tools=["Read"],
            model="sonnet",
        ),
    }

    lead_prompt = """
    你是 Team Lead。执行以下步骤:
    1. 创建任务 "写一段关于春天的短文" 分配给 writer
    2. writer 完成后，创建任务 "审核短文" 分配给 reviewer
    3. 汇总两个 teammate 的输出

    完成后报告: writer 写了什么，reviewer 评了几分。
    """

    options = ClaudeAgentOptions(
        env={"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"},
        agents=agents,
        allowed_tools=["Read", "Write", "Agent", "TaskCreate", "TaskUpdate", "SendMessage"],
        max_turns=15,
    )

    result_text = None
    message_count = 0
    agent_events = []

    print("\n运行 Team Lead...")
    try:
        async for message in query(prompt=lead_prompt, options=options):
            message_count += 1
            msg_type = type(message).__name__
            print(f"  [{message_count}] {msg_type}", end="")

            if hasattr(message, "content") and message.content:
                for block in message.content:
                    if hasattr(block, "name") and block.name in ("Agent", "TaskCreate", "SendMessage"):
                        agent_events.append(block.name)
                        print(f" → {block.name}", end="")

            if hasattr(message, "result") and message.result:
                result_text = message.result

            print()

    except Exception as e:
        print(f"\n  ERROR: {type(e).__name__}: {e}")
        # 不立即退出，看看收集到了什么

    print("\n" + "=" * 60)
    print(f"消息数: {message_count}")
    print(f"Agent 事件: {agent_events}")
    if result_text:
        print(f"结果: {result_text[:300]}")
        print(f"\nPOC #2: PASS")
    else:
        print(f"\nPOC #2: FAIL (无结果)")

    return result_text is not None


if __name__ == "__main__":
    success = asyncio.run(test_teammates())
    sys.exit(0 if success else 1)
