FROM ghcr.io/abetlen/llama-cpp-python:latest
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
RUN mkdir /code
WORKDIR /code
RUN apt update
RUN pip install --upgrade pip
RUN pip install --upgrade setuptools wheel
RUN apt-get install -y build-essential iputils-ping
RUN apt install -y gcc-11 g++-11
RUN CMAKE_ARGS="-DLLAMA_METAL=on" FORCE_CMAKE=1 pip install llama-cpp-python==0.1.78
COPY requirements.txt /code/
RUN pip install -r requirements.txt
COPY . /code/