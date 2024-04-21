FROM python:3.8

RUN mkdir /code
WORKDIR /code
RUN apt update
RUN pip install --upgrade pip
COPY requirements.txt /code/
RUN pip install -r requirements.txt
COPY . /code/
EXPOSE 8001
# CMD [ "python", "test_ragas.py"]
CMD ["python", "utils/get_question_answer.py"]