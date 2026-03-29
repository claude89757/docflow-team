import asyncio
import json
import logging

from fastapi import WebSocket

logger = logging.getLogger("docflow.ws")


class WSManager:
    """管理 WebSocket 连接，按 task_id 分组广播"""

    def __init__(self):
        self._connections: dict[str, set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, task_id: str, ws: WebSocket):
        await ws.accept()
        async with self._lock:
            if task_id not in self._connections:
                self._connections[task_id] = set()
            self._connections[task_id].add(ws)
        logger.info("ws connected task=%s", task_id)

    async def disconnect(self, task_id: str, ws: WebSocket):
        async with self._lock:
            if task_id in self._connections:
                self._connections[task_id].discard(ws)
                if not self._connections[task_id]:
                    del self._connections[task_id]
        logger.info("ws disconnected task=%s", task_id)

    async def send(self, task_id: str, data: dict):
        async with self._lock:
            conns = self._connections.get(task_id)
            if not conns:
                return
            # Copy to iterate safely
            ws_list = list(conns)

        message = json.dumps(data, ensure_ascii=False)
        dead: list[WebSocket] = []
        for ws in ws_list:
            try:
                await ws.send_text(message)
            except Exception:
                logger.warning("ws send failed task=%s, removing dead connection", task_id)
                dead.append(ws)

        if dead:
            async with self._lock:
                for ws in dead:
                    if task_id in self._connections:
                        self._connections[task_id].discard(ws)


ws_manager = WSManager()
