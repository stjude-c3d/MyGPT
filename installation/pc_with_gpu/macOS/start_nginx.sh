brew install nginx
scp llm_api/nginx.conf /opt/homebrew/etc/nginx/nginx.conf
brew services reload nginx