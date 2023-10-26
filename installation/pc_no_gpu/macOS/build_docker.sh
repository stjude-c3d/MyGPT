## build docker image
cd MyGPT
docker compose build db
docker compose build backend
docker compose build llm_api
docker compose build nginx
docker compose build frontend