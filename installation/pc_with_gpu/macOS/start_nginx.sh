cd MyGPT
brew install nginx
scp llm_api/nginx.conf /opt/homebrew/etc/nginx/nginx.conf
# TODO: might remove above line
scp llm_api/nginx.conf /usr/local/etc/nginx/nginx.conf
brew services reload nginx