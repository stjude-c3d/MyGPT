:: run docker containers as detached 
start docker compose up -d db
waitfor /t 60

:: create backend folder with demo publiction library
mkdir backend/data/pdfs/GPCR
copy -r backend/sample_dataset/pdfs/* backend/data/pdfs/GPCR/.
copy backend/sample_dataset/data_chunks/GPCR.txt backend/data/data_chunks/.
start docker compose up -d backend
waitfor /t 60
:: open http://localhost:8000
waitfor /t 60

start docker compose up -d frontend