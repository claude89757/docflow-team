import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.services.ws_manager import ws_manager

logger = logging.getLogger("docflow.ws")

router = APIRouter()


@router.websocket("/ws/{task_id}")
async def websocket_endpoint(ws: WebSocket, task_id: str):
    await ws_manager.connect(task_id, ws)
    try:
        while True:
            try:
                data = await asyncio.wait_for(ws.receive_text(), timeout=60.0)
                if data == "ping":
                    await ws.send_text("pong")
                    continue

                # Try to parse JSON message
                try:
                    msg = json.loads(data)
                    if msg.get("type") == "user_input" and msg.get("content"):
                        await ws_manager.handle_user_input(task_id, msg["content"], ws)
                        await ws.send_text(
                            json.dumps(
                                {"type": "user_input_ack", "content": msg["content"]},
                                ensure_ascii=False,
                            )
                        )
                except (json.JSONDecodeError, TypeError):
                    pass

            except TimeoutError:
                # 连接空闲，发送 ping 检测存活
                try:
                    await ws.send_text("ping")
                except Exception:
                    break
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.warning("ws error task=%s", task_id, exc_info=True)
    finally:
        await ws_manager.disconnect(task_id, ws)
