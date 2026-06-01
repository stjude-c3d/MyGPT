# stop docker containers
docker compose down

# remove docker images
imageNames=("ghcr.io/stjude-c3d/mygpt-frontend:latest" "ghcr.io/stjude-c3d/mygpt-backend:latest")
for imageName in "${imageNames[@]}"
do
	containerIds=$(docker ps -aq --filter "ancestor=$imageName")
	if [ -n "$containerIds" ]; then
		docker stop $containerIds
		docker rm $containerIds
	fi
	docker rmi "$imageName" 2>/dev/null || true
done