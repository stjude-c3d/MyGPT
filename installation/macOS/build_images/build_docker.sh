# Create missing root runtime environment files without overwriting configured values.
[ -f .env_backend ] || cp .env_backend.example .env_backend
[ -f .env_frontend ] || cp .env_frontend.example .env_frontend

# build the docker image
docker compose build db
docker compose build backend
docker compose build frontend
docker compose build grobid