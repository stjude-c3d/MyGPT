# FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim
# ADD . /app
# WORKDIR /app
# COPY * /app/
# COPY requirements.txt /app/
# RUN pip install -r requirements.txt

# RUN uv sync --locked
# RUN uv run mygpt_backend.py

# Base Python image
FROM python:3.13.14-slim AS base

# Builder stage: setup environment and install dependencies using uv
FROM base AS builder
# Install uv package manager
RUN pip install --no-cache-dir uv==0.7.21
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
WORKDIR /app
COPY uv.lock pyproject.toml /app/
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev
COPY . /app

# Final runtime image
FROM base
COPY --from=builder /app /app
RUN pip install --no-cache-dir uv==0.7.21
ENV PATH="/app/.venv/bin:$PATH"
WORKDIR /app
CMD ["uv", "run", "mygpt_backend.py","--host", "0.0.0.0", "--port", "5001", "--log-level", "debug"]