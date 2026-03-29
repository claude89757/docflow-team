"""
POC #1: SDK + Agent Teams 启动验证

验证:
- claude-agent-sdk 能正常 import
- query() 能返回结果
- CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 环境变量生效

运行: python -m backend.tests.poc.test_01_sdk_startup
"""
import asyncio
import os
import sys

os.environ["CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"] = "1"


async def test_basic_query():
    """验证 SDK 基本 query 能力"""
    print("=" * 60)
    print("POC #1: SDK + Agent Teams 启动验证")
    print("=" * 60)

    # Step 1: Import 验证
    print("\n[1/3] Import claude_agent_sdk...")
    try:
        from claude_agent_sdk import ClaudeAgentOptions, query
        print("  OK: claude_agent_sdk imported")
    except ImportError as e:
        print(f"  FAIL: {e}")
        sys.exit(1)

    # Step 2: 检查 API key
    print("\n[2/3] 检查 ANTHROPIC_API_KEY...")
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("  FAIL: ANTHROPIC_API_KEY 未设置")
        print("  运行: export ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)
    print(f"  OK: API key 已设置 (sk-ant-...{api_key[-4:]})")

    # Step 3: 基本 query
    print("\n[3/3] 运行基本 query (Agent Teams 模式)...")
    options = ClaudeAgentOptions(
        env={"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"},
        max_turns=1,
    )

    result_text = None
    message_count = 0

    try:
        async for message in query(
            prompt="回复一个字: OK",
            options=options,
        ):
            message_count += 1
            msg_type = type(message).__name__
            print(f"  收到消息 #{message_count}: {msg_type}")

            if hasattr(message, "result") and message.result:
                result_text = message.result
                print(f"  结果: {result_text[:100]}")

    except Exception as e:
        print(f"  FAIL: {type(e).__name__}: {e}")
        sys.exit(1)

    # 结果
    print("\n" + "=" * 60)
    if result_text:
        print("POC #1: PASS")
        print(f"  消息数: {message_count}")
        print(f"  结果: {result_text[:200]}")
    else:
        print(f"POC #1: PARTIAL (收到 {message_count} 条消息但无 result)")

    return result_text is not None


if __name__ == "__main__":
    success = asyncio.run(test_basic_query())
    sys.exit(0 if success else 1)
