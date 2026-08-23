@echo off
setlocal

:: run from repository root
cd /d "%~dp0\..\.."

:: run docker containers as detached
docker compose down
docker compose up -d db
timeout /t 10 /nobreak >nul

:: create backend folder with demo publication library
if not exist "backend\data\pdfs\MyGPT" mkdir "backend\data\pdfs\MyGPT"
powershell -NoProfile -Command "Get-ChildItem 'backend/data/pdfs' -Force | Where-Object { $_.Name -ne 'MyGPT' } | Copy-Item -Destination 'backend/data/pdfs/MyGPT' -Recurse -Force"
copy /Y "backend\data\data_chunks\MyGPT.txt" "backend\data\data_chunks\" >nul

docker compose up -d backend
timeout /t 60 /nobreak >nul
start "" "http://localhost:8000"
timeout /t 60 /nobreak >nul

:: run frontend
docker compose up -d frontend
timeout /t 30 /nobreak >nul
start "" "http://localhost:3000"