## create super user for backend app

# find backend container id by image name
backend_container_id=$(docker ps -aqf "ancestor=mygpt-backend")

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