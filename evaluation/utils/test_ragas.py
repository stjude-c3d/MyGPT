from datasets import Dataset, load_dataset
from ragas import evaluate
from ragas.metrics import (answer_relevancy, answer_similarity, context_relevancy)
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.chat_models import ChatOllama
import os
import pandas as pd
import json

embeddings = HuggingFaceEmbeddings(model_name="multi-qa-MiniLM-L6-cos-v1")
headers = {
	"Authorization": "Token f3663b9f29126f8dca2bc06f9f90a8e56ca89418"
}
llm = ChatOllama(model="llama3:latest", base_url="http://10.220.17.160:11434", headers=headers)

os.environ["RAGAS_DO_NOT_TRACK"] = "false"

models = ['llama3', 'phi3', 'vicuna', 'gemma', 'mistral-latest', 'llama3-70b']
embed_num = 6

for model in models:
	for n in range(embed_num):
		with open(f'results/{model}/query_results_{model}_embed{n+1}.json', 'r') as f:
			data = json.load(f)

		df = pd.DataFrame.from_records(data)
		print(df)
		dataset = Dataset.from_pandas(df)
		scores = evaluate(dataset, metrics=[context_relevancy, answer_similarity, answer_relevancy], embeddings=embeddings, llm=llm)

		df = scores.to_pandas()
		# save the scores to a csv file
		df.to_csv(f'scores/{model}/{model}_embed{n+1}_score.csv', index=False)