
# replace the env_example with .env
cp backend/env_example backend/.env
cp frontend/env_example frontend/.env

# build the docker image
docker compose build db
docker compose build backend
docker compose build frontend
docker compose build grobid