## run docker containers as detached 
docker compose up -d db
sleep 10

# create backend folder with demo publiction library
mkdir backend/data/pdfs/MyGPT
cp -r backend/sample_dataset/pdfs/* backend/data/pdfs/MyGPT/.
cp backend/sample_dataset/data_chunks/MyGPT.txt backend/data/data_chunks/.
docker compose up -d backend
sleep 60
open http://localhost:8000
sleep 60

# run frontend
docker compose up -d frontend
sleep 30
open http://localhost:3000