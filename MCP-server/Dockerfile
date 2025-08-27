# FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim
# ADD . /app
# WORKDIR /app
# COPY * /app/
# COPY requirements.txt /app/
# RUN pip install -r requirements.txt

# RUN uv sync --locked
# RUN uv run mygpt_backend.py

# Base Python image
FROM python:3.13-alpine3.20 AS base
# Stage to copy the uv binary from the external image
FROM ghcr.io/astral-sh/uv:0.7.21 AS uv-binary
# Builder stage: setup environment and install dependencies using uv
FROM base AS builder
COPY --from=uv-binary /uv /bin/uv
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
COPY --from=builder /bin/uv /bin/uv
ENV PATH="/app/.venv/bin:$PATH"
WORKDIR /app
CMD ["uv", "run", "mygpt_backend.py","--host", "0.0.0.0", "--port", "5001", "--log-level", "debug"]