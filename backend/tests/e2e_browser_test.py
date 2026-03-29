"""
E2E 浏览器联调测试: 通过 Vite proxy (localhost:5173) 跑完整流程

模拟浏览器行为: 上传 → WebSocket → 团队协作 → 下载
"""
import asyncio
import json

import httpx
import websockets

PROXY = "http://localhost:5173"
WS_PROXY = "ws://localhost:5173"
TEST_DOC = "backend/tests/fixtures/ai_flavored_doc.docx"


async def main():
    print("=" * 60)
    print("E2E 浏览器联调 (通过 Vite proxy)")
    print("=" * 60)

    # 1. 上传
    print("\n[1/5] 上传...")
    async with httpx.AsyncClient() as client:
        with open(TEST_DOC, "rb") as f:
            res = await client.post(f"{PROXY}/api/upload", files={"file": ("test.docx", f)})
        upload = res.json()
        task_id = upload["task_id"]
        print(f"  task_id={task_id}")

    # 2. WebSocket
    print("\n[2/5] WebSocket 连接...")
    events = []
    agent_timeline = []

    async def listen():
        async with websockets.connect(f"{WS_PROXY}/ws/{task_id}") as ws:
            print("  连接成功")
            while True:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=300)
                    if msg == "pong":
                        continue
                    data = json.loads(msg)
                    events.append(data)
                    t = data.get("type", "")
                    if t == "agent_status":
                        agent = data.get("agent", "?")
                        status = data.get("status", "?")
                        agent_timeline.append(f"{agent}: {status}")
                        print(f"  [{len(events):3d}] Agent: {agent} → {status}")
                    elif t == "agent_message":
                        print(f"  [{len(events):3d}] Message: {data.get('from')} → {data.get('to')}")
                    elif t == "rework_cycle":
                        print(f"  [{len(events):3d}] Rework: round {data.get('round')}/{data.get('max')}")
                    elif t == "tool_call":
                        print(f"  [{len(events):3d}] Tool: {data.get('tool')} → {data.get('target', '')}")
                    elif t == "team_complete":
                        print(f"  [{len(events):3d}] COMPLETE")
                        return
                    elif t == "team_status" and data.get("status") == "failed":
                        print(f"  [{len(events):3d}] FAILED: {data.get('error')}")
                        return
                except TimeoutError:
                    print("  TIMEOUT")
                    return

    # 3. 触发处理
    print("\n[3/5] 触发团队处理...")
    ws_task = asyncio.create_task(listen())
    await asyncio.sleep(1)

    async with httpx.AsyncClient() as client:
        res = await client.post(f"{PROXY}/api/process/{task_id}")
        print(f"  {res.status_code}: {res.json()}")

    await ws_task

    # 4. 下载验证
    print("\n[4/5] 下载验证...")
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{PROXY}/api/download/{task_id}")
        if res.status_code == 200:
            size = len(res.content)
            print(f"  精修版: {size} bytes")
        else:
            print(f"  精修版: {res.status_code} ({res.text[:100]})")

        res2 = await client.get(f"{PROXY}/api/download/{task_id}/original")
        if res2.status_code == 200:
            print(f"  原始版: {len(res2.content)} bytes")
        else:
            print(f"  原始版: {res2.status_code}")

        res3 = await client.get(f"{PROXY}/api/status/{task_id}")
        print(f"  状态: {res3.json()}")

    # 5. 汇总
    print("\n[5/5] 汇总")
    print("=" * 60)
    print(f"WebSocket 事件: {len(events)}")

    types = {}
    for e in events:
        t = e.get("type", "?")
        types[t] = types.get(t, 0) + 1
    print(f"事件分布: {json.dumps(types, ensure_ascii=False)}")

    print("\nAgent 时间线:")
    for entry in agent_timeline:
        print(f"  {entry}")

    complete = any(e.get("type") == "team_complete" for e in events)
    has_agents = len(agent_timeline) > 0
    has_messages = any(e.get("type") == "agent_message" for e in events)
    download_ok = res.status_code == 200 if 'res' in dir() else False

    print(f"\n团队完成: {'YES' if complete else 'NO'}")
    print(f"Agent 事件: {'YES' if has_agents else 'NO'}")
    print(f"横向消息: {'YES' if has_messages else 'NO'}")
    print(f"下载可用: {'YES' if download_ok else 'NO'}")
    print(f"\nE2E 浏览器联调: {'PASS' if complete else 'FAIL'}")


if __name__ == "__main__":
    asyncio.run(main())
