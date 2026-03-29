import json

from fastapi import WebSocket


class WSManager:
    """管理 WebSocket 连接，按 task_id 分组广播"""

    def __init__(self):
        self._connections: dict[str, set[WebSocket]] = {}

    async def connect(self, task_id: str, ws: WebSocket):
        await ws.accept()
        if task_id not in self._connections:
            self._connections[task_id] = set()
        self._connections[task_id].add(ws)

    def disconnect(self, task_id: str, ws: WebSocket):
        if task_id in self._connections:
            self._connections[task_id].discard(ws)
            if not self._connections[task_id]:
                del self._connections[task_id]

    async def send(self, task_id: str, data: dict):
        if task_id not in self._connections:
            return
        message = json.dumps(data, ensure_ascii=False)
        dead = []
        for ws in self._connections[task_id]:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._connections[task_id].discard(ws)


ws_manager = WSManager()
