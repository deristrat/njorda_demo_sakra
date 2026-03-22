# Build stage
FROM python:3.12-slim AS builder

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy dependency files
COPY backend/pyproject.toml ./

# Install dependencies
RUN uv sync --no-dev --no-install-project

# Production stage
FROM python:3.12-slim

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code
COPY backend/alembic.ini ./
COPY backend/alembic ./alembic
COPY backend/src ./src
COPY test_pdfs ./test_pdfs

# Create uploads directory
RUN mkdir -p /app/uploads

# Set up environment
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Run migrations and start server
CMD ["sh", "-c", "alembic upgrade head && python -m src.seed && python -m src.seed_test_documents && uvicorn src.main:app --host 0.0.0.0 --port 8000"]
