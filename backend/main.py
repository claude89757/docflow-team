import logging
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes.conversations import router as conversations_router
from backend.api.routes.download import router as download_router
from backend.api.routes.generate import router as generate_router
from backend.api.routes.preview import router as preview_router
from backend.api.routes.sessions import router as sessions_router
from backend.api.routes.upload import router as upload_router
from backend.api.routes.usage import router as usage_router
from backend.api.routes.ws import router as ws_router
from backend.services.db import init_db

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("docflow")

app = FastAPI(title="docflow-team", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    logger.info("%s %s %d %.2fs", request.method, request.url.path, response.status_code, duration)
    return response


app.include_router(upload_router, prefix="/api")
app.include_router(generate_router, prefix="/api")
app.include_router(download_router, prefix="/api")
app.include_router(usage_router)
app.include_router(ws_router)
app.include_router(sessions_router)
app.include_router(conversations_router)
app.include_router(preview_router)

# 初始化数据库
init_db()

# 确保上传目录存在
Path("uploads").mkdir(exist_ok=True)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "claude_agent_sdk": True,
        "agent_teams_enabled": os.environ.get("CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS") == "1",
    }
