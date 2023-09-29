FROM ghcr.io/chroma-core/chroma:latest
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
RUN mkdir /code
WORKDIR /code
# RUN apt update
RUN pip install --upgrade pip
RUN pip install --upgrade setuptools wheel
RUN apt install -y build-essential
# RUN pip install llama-cpp-python --force-reinstall --upgrade --no-cache-dir
COPY requirements.txt /code/
RUN pip install -r requirements.txt
COPY . /code/