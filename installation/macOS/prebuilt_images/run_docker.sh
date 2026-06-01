## run docker containers as detached 
## running frontend container will run the backend and db containers as well
docker compose down
docker compose up -d frontend