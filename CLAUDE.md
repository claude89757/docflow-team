# DocFlow Team

AI 文档润色团队 — FastAPI + React + Claude Agent Teams SDK

## Commands

```bash
make install        # 安装所有依赖（Python venv + npm）
make dev-backend    # 启动后端 (localhost:8000)
make dev-frontend   # 启动前端 (localhost:5173)
make test           # 单元测试（排除 poc/ 和 e2e）
make lint           # ruff + eslint
make typecheck      # mypy + tsc
```

## Environment

```bash
cp .env.example .env  # 需要 ANTHROPIC_API_KEY
# 必须设置 CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

## Gotchas

- PDF 输入会自动转换为 .docx 输出（PDF 不可原地修改）
- Pipeline 在 FastAPI background_tasks 中运行，单进程模型
- Agent Teams SDK 是实验性功能，依赖环境变量开关
- POC 和 E2E 测试被排除，需 `make test-poc` / `make test-e2e` 单独运行

# gstack

Use the /browse skill from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.

## Available skills

- /office-hours - YC-style office hours and brainstorming
- /plan-ceo-review - CEO/founder-mode plan review
- /plan-eng-review - Engineering manager plan review
- /plan-design-review - Designer's eye plan review
- /design-consultation - Design system consultation
- /design-shotgun - Generate multiple design variants
- /review - Pre-landing PR review
- /ship - Ship workflow (test, review, PR)
- /land-and-deploy - Merge, deploy, and verify
- /canary - Post-deploy canary monitoring
- /benchmark - Performance regression detection
- /browse - Headless browser for QA and browsing
- /connect-chrome - Launch real Chrome controlled by gstack
- /qa - QA test and fix bugs
- /qa-only - QA report only (no fixes)
- /design-review - Visual QA and fix
- /setup-browser-cookies - Import browser cookies
- /setup-deploy - Configure deployment settings
- /retro - Weekly engineering retrospective
- /investigate - Systematic debugging
- /document-release - Post-ship docs update
- /codex - OpenAI Codex CLI wrapper
- /cso - Security audit
- /autoplan - Auto-review pipeline
- /careful - Destructive command warnings
- /freeze - Restrict edits to a directory
- /guard - Full safety mode (careful + freeze)
- /unfreeze - Remove freeze boundary
- /gstack-upgrade - Upgrade gstack to latest
