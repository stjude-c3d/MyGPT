## run docker containers as detached 
docker compose up -d db
sleep 10

# create backend folder with demo publiction library
docker compose up -d backend
sleep 60
open http://localhost:8000
sleep 60

# run frontend
docker compose up -d frontend