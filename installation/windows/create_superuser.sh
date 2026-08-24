## create super user for backend app

# find backend container id by image name
backend_container_id=$(docker ps -aqf "ancestor=mygpt-backend")

#ask for super username
echo "Enter superuser name for backend app:"
read superuser_name

#ask for super user email
echo "Enter superuser email for backend app:"
read superuser_email

# create super user and enroll it in TOTP authentication
# you will be prompted for a password, then a QR code will be shown to scan
# with an authenticator app before entering its current six-digit code
echo "Creating superuser for backend app..."
docker exec -it ${backend_container_id} python backend/manage.py create_superuser_with_otp --username $superuser_name --email $superuser_email