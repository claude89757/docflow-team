# Contributing

## Setup

```bash
# Clone
git clone https://github.com/claude89757/docflow-team.git
cd docflow-team

# Backend
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
pip install ruff mypy pytest pytest-asyncio pre-commit
pre-commit install

# Frontend
cd frontend && npm ci

# Environment
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY
```

## Development

```bash
# Backend
make dev-backend

# Frontend (separate terminal)
make dev-frontend
```

## Before Committing

Pre-commit hooks run automatically. You can also run manually:

```bash
make lint       # ruff + eslint
make format     # ruff format + prettier
make typecheck  # mypy + tsc
make test       # pytest
```

## Pull Requests

1. Create a branch from `main`
2. Make your changes
3. Ensure all checks pass: `make lint && make typecheck && make test`
4. Push and open a PR
5. Fill in the PR template

## Code Style

- Python: Ruff (configured in pyproject.toml)
- TypeScript: ESLint + Prettier
- Line length: 120 (Python), default (TypeScript)
