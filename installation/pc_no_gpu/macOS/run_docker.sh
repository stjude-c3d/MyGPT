## run docker containers as detached 
docker compose up -d db
sleep 10

# create backend folder with demo publiction library
mkdir backend/data/pdfs/GPCR
cp -r backend/sample_dataset/pdfs/* backend/data/pdfs/GPCR/.
cp backend/sample_dataset/data_chunks/GPCR.txt backend/data/data_chunks/.
docker compose up -d backend
sleep 60
open http://localhost:8000
sleep 60

docker compose up -d llm_api
docker compose up -d nginx
docker compose up -d frontend