:: replace the env_example with .env
copy backend/env_example backend/.env
copy frontend/env_example frontend/.env

:: build docker images
start docker compose build db
start docker compose build backend
start docker compose build frontend
docker compose build grobid