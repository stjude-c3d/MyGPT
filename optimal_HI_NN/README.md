# Get Optimal HI

## Build docker images
use following command from the root directory of the project to build docker images:
```
sudo docker compose build optimal_hi
```

## Run docker containers for predicting HI
You can run the python script `predict_module/predict.py` to predict HI by providing QRS and ARS values.

Here is an example of how to run the script:
```
docker run -i -t mygpt-optimal_hi python predict_module/predict.py 0.05 0.05
```