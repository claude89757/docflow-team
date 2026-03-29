import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

load_dotenv()

app = FastAPI(title="docflow-team", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由注册
from backend.api.routes.upload import router as upload_router
from backend.api.routes.generate import router as generate_router
from backend.api.routes.ws import router as ws_router

app.include_router(upload_router, prefix="/api")
app.include_router(generate_router, prefix="/api")
app.include_router(ws_router)

# 确保上传目录存在
Path("uploads").mkdir(exist_ok=True)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "claude_agent_sdk": True,
        "agent_teams_enabled": os.environ.get("CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS") == "1",
    }
