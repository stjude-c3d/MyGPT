## Stop docker containers
cd MyGPT
docker compose stop db
docker compose stop backend
docker compose stop llm_api
docker compose stop nginx
docker compose stop frontend