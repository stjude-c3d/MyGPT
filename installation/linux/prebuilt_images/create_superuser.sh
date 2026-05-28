## create super user for backend app

# find backend container id by image name
backend_container_id=$(docker ps -aqf "ancestor=ghcr.io/stjude-c3d/mygpt-backend:latest")

if [ -z "$backend_container_id" ]; then
	backend_container_id=$(docker ps -aqf "ancestor=ghcr.io/stjude-c3d/mygpt-backend:latest-amd64")
	if [ -z "$backend_container_id" ]; then
		echo "Backend container not found. Please ensure the backend is running."
		exit 1
	fi
fi

#  get only the first container id
backend_container_id=$(echo $backend_container_id | awk '{print $1}')

#ask for super username
echo "Enter superuser name for backend app:"
read superuser_name

#ask for super user email
echo "Enter superuser email for backend app:"
read superuser_email

# create super user
echo "Creating superuser for backend app..."
echo "enter password for superuser:"
docker exec -it ${backend_container_id} python manage.py createsuperuser --username $superuser_name --email $superuser_email