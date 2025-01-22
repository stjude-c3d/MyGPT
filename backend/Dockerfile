FROM ghcr.io/chroma-core/chroma:0.5.7
# please don't change the above line
# FROM --platform=amd64 ghcr.io/chroma-core/chroma:latest
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
RUN mkdir /code
WORKDIR /code
RUN apt update
RUN pip install --upgrade pip
RUN pip install --upgrade setuptools wheel
RUN apt install -y build-essential
RUN apt install -y curl
RUN apt install -y wkhtmltopdf
RUN apt install -y libreoffice
COPY requirements.txt /code/
RUN pip install -r requirements.txt
COPY . /code/
COPY ./env_example /code/.env