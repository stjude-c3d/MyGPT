from datasets import Dataset, load_dataset
from ragas import evaluate
from ragas.metrics import (context_relevancy, context_entity_recall)
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

# models = ['llama3', 'phi3', 'vicuna', 'gemma', 'mistral-latest', 'llama3-70b']
# embed_num = 6
embed_shorthands = ['mini-l6', 'mini-l12', 'qa-cos', 'qa-dot']
datasets = ['mygpt-CAR-T', 'mygpt-GPCR', 'mygpt-Kinase']

for shorthand in embed_shorthands:
	data = []
	for dataset in datasets:
		with open(f'evaluation/utils/eval_context/{shorthand}/{dataset}-{shorthand}.json', 'r') as f:
			data += json.load(f)

	df = pd.DataFrame.from_records(data)
	print(df)
	dataset = Dataset.from_pandas(df)
	scores = evaluate(dataset, metrics=[context_relevancy, context_entity_recall], embeddings=embeddings, llm=llm)

	df = scores.to_pandas()
	# save the scores to a csv file
	df.to_csv(f'scores/context_scores/{shorthand}.csv', index=False)