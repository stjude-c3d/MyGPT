# Create root runtime environment files from the tracked templates.
[ -f .env_backend ] || cp .env_backend.example .env_backend
[ -f .env_frontend ] || cp .env_frontend.example .env_frontend

## build docker images
docker compose build db
docker compose build backend
docker compose build frontend
docker compose build grobid