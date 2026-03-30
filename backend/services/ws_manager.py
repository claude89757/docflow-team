import asyncio
import contextlib
import json
import logging

from fastapi import WebSocket

logger = logging.getLogger("docflow.ws")


class WSManager:
    """管理 WebSocket 连接，按 task_id 分组广播"""

    def __init__(self):
        self._connections: dict[str, set[WebSocket]] = {}
        self._user_queues: dict[str, asyncio.Queue] = {}
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

    def get_user_queue(self, task_id: str) -> asyncio.Queue:
        """获取或创建指定任务的用户消息队列"""
        if task_id not in self._user_queues:
            self._user_queues[task_id] = asyncio.Queue()
        return self._user_queues[task_id]

    async def handle_user_input(self, task_id: str, content: str, sender_ws: WebSocket):
        """处理用户输入: 持久化 + 入队 + 回显"""
        from backend.services.message_store import add_message

        payload = {"type": "user_input", "content": content}
        add_message(task_id, "user_input", payload)

        queue = self.get_user_queue(task_id)
        await queue.put(content)

        # Echo to other connections (not sender)
        async with self._lock:
            conns = self._connections.get(task_id)
            if not conns:
                return
            ws_list = [ws for ws in conns if ws is not sender_ws]

        echo = json.dumps({"type": "user_input_echo", "content": content}, ensure_ascii=False)
        for ws in ws_list:
            with contextlib.suppress(Exception):
                await ws.send_text(echo)


ws_manager = WSManager()
