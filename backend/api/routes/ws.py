from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.services.ws_manager import ws_manager

router = APIRouter()


@router.websocket("/ws/{task_id}")
async def websocket_endpoint(ws: WebSocket, task_id: str):
    await ws_manager.connect(task_id, ws)
    try:
        while True:
            # 保持连接，接收客户端消息（心跳等）
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(task_id, ws)
