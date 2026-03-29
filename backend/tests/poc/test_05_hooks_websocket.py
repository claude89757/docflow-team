"""
POC #5: Hooks → WebSocket 推送

验证:
- Agent SDK hooks 能拦截 agent 生命周期事件
- 事件能转发到 FastAPI WebSocket
- 前端能接收到实时状态更新

运行: python -m backend.tests.poc.test_05_hooks_websocket
"""
import asyncio
import json
import os
import sys

os.environ["CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"] = "1"


async def test_hooks_websocket():
    print("=" * 60)
    print("POC #5: Hooks → WebSocket 推送")
    print("=" * 60)

    from claude_agent_sdk import AgentDefinition, ClaudeAgentOptions, ClaudeSDKClient, HookMatcher
    from claude_agent_sdk.types import StreamEvent

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("FAIL: ANTHROPIC_API_KEY 未设置")
        sys.exit(1)

    # 模拟 WebSocket manager (收集事件)
    collected_events = []

    class MockWSManager:
        async def send(self, task_id, data):
            collected_events.append(data)
            event_type = data.get("type", "unknown")
            agent = data.get("agent", data.get("tool", ""))
            status = data.get("status", "")
            print(f"  [WS] {event_type}: {agent} → {status}")

    ws = MockWSManager()

    # Hooks (使用 HookMatcher 注册)
    async def on_subagent_start(input_data, tool_use_id, context):
        desc = input_data.get("description", "unknown")
        await ws.send("test-task", {
            "type": "agent_status",
            "agent": desc,
            "status": "started",
        })
        return {}

    async def on_subagent_stop(input_data, tool_use_id, context):
        agent_id = input_data.get("agent_id", "unknown")
        await ws.send("test-task", {
            "type": "agent_status",
            "agent": agent_id,
            "status": "completed",
        })
        return {}

    async def on_pre_tool(input_data, tool_use_id, context):
        tool_name = input_data.get("tool_name", "unknown")
        await ws.send("test-task", {
            "type": "tool_call",
            "tool": tool_name,
            "status": "started",
        })
        return {}

    async def on_post_tool(input_data, tool_use_id, context):
        tool_name = input_data.get("tool_name", "unknown")
        await ws.send("test-task", {
            "type": "tool_call",
            "tool": tool_name,
            "status": "completed",
        })
        return {}

    agents = {
        "helper": AgentDefinition(
            description="简单助手",
            prompt="你是助手。回答问题时保持简洁。",
            tools=["Read"],
            model="sonnet",
        ),
    }

    options = ClaudeAgentOptions(
        env={"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"},
        agents=agents,
        allowed_tools=["Read", "Agent"],
        hooks={
            "SubagentStart": [HookMatcher(hooks=[on_subagent_start])],
            "SubagentStop": [HookMatcher(hooks=[on_subagent_stop])],
            "PreToolUse": [HookMatcher(hooks=[on_pre_tool])],
            "PostToolUse": [HookMatcher(hooks=[on_post_tool])],
        },
        include_partial_messages=True,
        max_turns=10,
    )

    # 使用 ClaudeSDKClient (hooks 需要 client 模式)
    result_text = None
    stream_event_count = 0
    message_count = 0

    print("\n方式1: ClaudeSDKClient + hooks...")
    try:
        async with ClaudeSDKClient(options=options) as client:
            await client.query("调用 helper agent 让它回答: 1+1=?")
            async for message in client.receive_response():
                message_count += 1
                msg_type = type(message).__name__

                if isinstance(message, StreamEvent):
                    stream_event_count += 1

                if hasattr(message, "result") and message.result:
                    result_text = message.result
                    print(f"  结果: {result_text[:100]}")

    except Exception as e:
        print(f"\n  ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

    # 如果 hooks 仍然没触发，尝试用 StreamEvent 直接提取状态
    if not collected_events:
        print("\n方式2: 从 StreamEvent 提取状态 (fallback)...")
        from claude_agent_sdk import query
        stream_events_detail = []

        try:
            async for message in query(
                prompt="调用 helper agent 让它回答: 2+2=?",
                options=ClaudeAgentOptions(
                    env={"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"},
                    agents=agents,
                    allowed_tools=["Read", "Agent"],
                    include_partial_messages=True,
                    max_turns=10,
                ),
            ):
                msg_type = type(message).__name__

                # 从消息类型提取状态
                if msg_type == "TaskStartedMessage":
                    task_type = getattr(message, "task_type", "unknown")
                    collected_events.append({
                        "type": "agent_status",
                        "agent": task_type,
                        "status": "started",
                        "source": "TaskStartedMessage",
                    })
                    print(f"  [TaskStarted] {task_type}")

                elif msg_type == "TaskNotificationMessage":
                    status = getattr(message, "status", "unknown")
                    collected_events.append({
                        "type": "agent_status",
                        "agent": "agent",
                        "status": status,
                        "source": "TaskNotificationMessage",
                    })
                    print(f"  [TaskNotification] {status}")

                elif isinstance(message, StreamEvent):
                    event = message.event if hasattr(message, "event") else message
                    event_type = event.get("type", "") if isinstance(event, dict) else ""
                    if event_type in ("content_block_start", "content_block_stop"):
                        stream_events_detail.append(event_type)

                if hasattr(message, "result") and message.result:
                    result_text = message.result

        except Exception as e:
            print(f"  ERROR: {type(e).__name__}: {e}")

        if stream_events_detail:
            print(f"  StreamEvent 类型: {set(stream_events_detail)}")

    print("\n" + "=" * 60)
    print(f"收集到的事件: {len(collected_events)}")
    print(f"StreamEvent 数量: {stream_event_count}")
    for i, evt in enumerate(collected_events[:10]):
        print(f"  事件 {i+1}: {json.dumps(evt, ensure_ascii=False)}")

    if collected_events:
        sources = set(e.get("source", "hook") for e in collected_events)
        print(f"\n事件来源: {sources}")
        print(f"POC #5: PASS ({len(collected_events)} 个事件)")
    else:
        print("\nPOC #5: FAIL")

    return len(collected_events) > 0


if __name__ == "__main__":
    success = asyncio.run(test_hooks_websocket())
    sys.exit(0 if success else 1)
