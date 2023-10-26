## Set environment for Mac

# download the model
cd MyGPT
aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGML/resolve/main/llama-2-7b-chat.ggmlv3.q5_K_S.bin -d ./llm_api/models/Llama2 -o llama-2-7b-chat.ggmlv3.q5_K_S.bin

# add IP address into .env
IP_ADD=$(ip address | grep "inet " | grep -Fv 127.0.0.1 | grep 'brd' | awk '{print $2}' | cut -d'/' -f1)
echo "IP_ADD=${IP_ADD}"
# replace the IP address in backend/env_example
sed -i '' "s/10.222.66.555/${IP_ADD}/g" backend/env_example
# replace the IP address in nginx/default.conf
sed -i '' "s/YOUR_IP_ADDRESS/${IP_ADD}/g" nginx/default.conf

# replace the env_example with .env
cp backend/env_example backend/.env
cp llm_api/env_example llm_api/.env
cp frontend/env_example frontend/.env