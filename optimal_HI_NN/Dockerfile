FROM --platform=linux/arm64 python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python

# Set work directory
WORKDIR /code

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
	build-essential \
	curl \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt /code/

RUN pip install --upgrade pip
RUN pip install --upgrade setuptools wheel
RUN pip install -r requirements.txt

COPY . /code/