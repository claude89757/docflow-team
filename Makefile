.PHONY: install dev lint format typecheck test build clean

# === Setup ===
install:
	python -m venv .venv
	. .venv/bin/activate && pip install -r backend/requirements.txt
	cd frontend && npm ci

download-fonts:
	@mkdir -p backend/services/report/fonts
	@if [ ! -f backend/services/report/fonts/NotoSansSC-Regular.ttf ]; then \
		echo "Downloading Noto Sans SC..."; \
		curl -sL "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf" \
			-o backend/services/report/fonts/NotoSansSC-Regular.ttf; \
		echo "Done."; \
	else \
		echo "Font already exists."; \
	fi

# === Development ===
dev-backend:
	. .venv/bin/activate && set -a && . .env && set +a && uvicorn backend.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

dev:
	@echo "Run in two terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

# === Quality ===
lint:
	ruff check backend/
	cd frontend && npx eslint src/

format:
	ruff format backend/
	cd frontend && npx prettier --write src/

typecheck:
	mypy backend/ --ignore-missing-imports --no-strict-optional
	cd frontend && npx tsc --noEmit

test:
	pytest backend/tests/ -v --ignore=backend/tests/poc --ignore=backend/tests/e2e_test.py --ignore=backend/tests/e2e_browser_test.py

test-poc:
	. .venv/bin/activate && set -a && . .env && set +a && python -m backend.tests.poc.test_01_sdk_startup

test-e2e:
	. .venv/bin/activate && set -a && . .env && set +a && python backend/tests/e2e_browser_test.py

# === Build ===
build:
	cd frontend && npm run build

clean:
	rm -rf frontend/dist frontend/node_modules .venv __pycache__ uploads/
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
