"""
E2E 测试: 上传 docx → 团队协作处理 → 收集 WebSocket 事件

运行: python backend/tests/e2e_test.py
"""
import asyncio
import json
import sys

import httpx
import websockets

API = "http://localhost:8000"
WS = "ws://localhost:8000"
TEST_DOC = "backend/tests/fixtures/ai_flavored_doc.docx"


async def main():
    print("=" * 60)
    print("E2E 测试: 上传 → 团队协作 → WebSocket")
    print("=" * 60)

    # Step 1: 上传文件
    print("\n[1/4] 上传测试文档...")
    async with httpx.AsyncClient() as client:
        with open(TEST_DOC, "rb") as f:
            res = await client.post(
                f"{API}/api/upload",
                files={"file": ("test.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            )
        if res.status_code != 200:
            print(f"  FAIL: {res.status_code} {res.text}")
            sys.exit(1)

        upload_data = res.json()
        task_id = upload_data["task_id"]
        print(f"  OK: task_id={task_id}, size={upload_data['size_bytes']} bytes")

    # Step 2: 连接 WebSocket
    print(f"\n[2/4] 连接 WebSocket ws://.../ws/{task_id}")
    ws_events = []

    async def listen_ws():
        try:
            async with websockets.connect(f"{WS}/ws/{task_id}") as ws:
                print("  OK: WebSocket 已连接")
                while True:
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=900)
                        if not msg or msg in ("pong", "ping"):
                            continue
                        try:
                            data = json.loads(msg)
                        except json.JSONDecodeError:
                            continue
                        ws_events.append(data)
                        evt_type = data.get("type", "?")
                        if evt_type == "agent_status":
                            print(f"  [WS] {evt_type}: {data.get('agent', '?')} → {data.get('status', '?')}")
                        elif evt_type == "agent_message":
                            print(f"  [WS] 消息: {data.get('from', '?')} → {data.get('to', '?')}")
                        elif evt_type == "rework_cycle":
                            print(f"  [WS] 返工: 第 {data.get('round', '?')}/{data.get('max', '?')} 轮")
                        elif evt_type == "score_update":
                            scores = data.get("scores", {})
                            print(f"  [WS] 评分: total={scores.get('total', '?')} passed={scores.get('passed', '?')}")
                        elif evt_type == "team_complete":
                            result = str(data.get("result", ""))[:150]
                            print(f"  [WS] 团队完成: {result}...")
                            return
                        elif evt_type == "team_status":
                            print(f"  [WS] 团队状态: {data.get('status', '?')}")
                            if data.get("status") == "failed":
                                print(f"  [WS] 错误: {data.get('error', '?')}")
                                return
                        elif evt_type == "tool_call":
                            print(f"  [WS] 工具: {data.get('tool', '?')} → {data.get('target', '')}")
                        else:
                            print(f"  [WS] {evt_type}")
                    except TimeoutError:
                        print("  TIMEOUT: 等待超时 (5 min)")
                        return
        except Exception as e:
            print(f"  WS ERROR: {e}")

    # Step 3: 触发处理（同时监听 WS）
    print("\n[3/4] 触发团队处理...")
    ws_task = asyncio.create_task(listen_ws())

    # 等一下让 WS 连上
    await asyncio.sleep(1)

    async with httpx.AsyncClient() as client:
        res = await client.post(f"{API}/api/process/{task_id}")
        if res.status_code != 200:
            print(f"  FAIL: {res.status_code} {res.text}")
            ws_task.cancel()
            sys.exit(1)
        print("  OK: 团队已启动")

    # 等待完成
    await ws_task

    # Step 4: 汇总
    print("\n[4/4] 汇总")
    print("=" * 60)
    print(f"WebSocket 事件总数: {len(ws_events)}")

    event_types = {}
    for e in ws_events:
        t = e.get("type", "unknown")
        event_types[t] = event_types.get(t, 0) + 1
    print(f"事件类型分布: {json.dumps(event_types, ensure_ascii=False)}")

    has_agent_events = any(e.get("type") == "agent_status" for e in ws_events)
    has_agent_messages = any(e.get("type") == "agent_message" for e in ws_events)
    has_complete = any(e.get("type") == "team_complete" for e in ws_events)
    has_score = any(e.get("type") == "score_update" for e in ws_events)

    print(f"\nAgent 状态事件: {'YES' if has_agent_events else 'NO'}")
    print(f"Agent 横向消息: {'YES' if has_agent_messages else 'NO'}")
    print(f"团队完成事件: {'YES' if has_complete else 'NO'}")
    print(f"评分事件: {'YES' if has_score else 'NO'}")

    if has_complete:
        print("\nE2E: PASS")
    elif has_agent_events:
        print("\nE2E: PARTIAL (有 agent 事件但团队未完成)")
    else:
        print("\nE2E: FAIL")

    return has_complete


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
