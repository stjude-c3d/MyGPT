## Set environment for Mac

# download the model
cd MyGPT
aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGML/resolve/main/llama-2-7b-chat.ggmlv3.q5_K_S.bin -d ./llm_api/models/Llama2 -o llama-2-7b-chat.ggmlv3.q5_K_S.bin

# Create root runtime environment files from the tracked templates.
[ -f .env_backend ] || cp .env_backend.example .env_backend
[ -f .env_frontend ] || cp .env_frontend.example .env_frontend

# add IP address into .env_backend
IP_ADD=$(ifconfig | grep "inet " | grep -Fv 127.0.0.1 | grep 'broadcast' | awk '{print $2}')
echo "IP_ADD=${IP_ADD}"
# replace the IP address in .env_backend
sed -i '' "s/10.222.66.555/${IP_ADD}/g" .env_backend
# replace the IP address in llm_api/nginx.conf
sed -i '' "s/YOUR_IP_ADDRESS/${IP_ADD}/g" llm_api/nginx.conf

cp llm_api/env_example llm_api/.env
cp docker-compose-gpu.yml docker-compose.yml