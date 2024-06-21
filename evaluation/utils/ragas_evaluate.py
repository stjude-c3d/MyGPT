from datasets import Dataset
from ragas import evaluate
from ragas.metrics import context_relevancy, context_entity_recall, answer_relevancy, answer_similarity, answer_correctness
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.chat_models import ChatOllama
import os
import pandas as pd
import json
import random

#  embeddin_models = [
# 	'multi-qa-MiniLM-l6-cos-v1', 
# 	'multi-qa-mpnet-base-dot-v1', 
# 	'all-MiniLM-L6-v2', 
# 	'all-MiniLM-L12-v2', 
# 	'snowflake/arctic-embed-s'
# ]
# embed_shorthands = ['mini-l6', 'mini-l12', 'qa-cos', 'qa-dot', 'snowflake']
# datasets = ['mygpt-GPCR', 'mygpt-Kinase','mygpt-CAR-T', 'mygpt-IDR', 'mygpt-PTM']
# models = ['llama3:latest', 'llama3:70b', 'llama2:latest', 'gemma:latest', 'mistral:latest', 'vicuna:latest']
embeddings = HuggingFaceEmbeddings(model_name="multi-qa-MiniLM-l6-cos-v1")
llm = ChatOllama(model="llama3:latest", base_url="http://10.220.17.160:11434")
os.environ["RAGAS_DO_NOT_TRACK"] = "false"

def generate_context_scores():
	embed_shorthands = ['mini-l6', 'mini-l12', 'qa-cos', 'qa-dot', 'snowflake']
	for shorthand in embed_shorthands:
		data = []
		with open(f'evaluation/utils/eval_context/{shorthand}/mygpt-all-{shorthand}.json', 'r', encoding = 'utf-8') as f:
			data = json.load(f)
			# create new dataset with 20 samples
			new_data = {
				'question': [],
				'contexts': [],
				'ground_truth': []
			}
			for i in random.sample(range(len(data), 20)):
				new_data['question'].append(data['question'][i])
				new_data['contexts'].append(data['contexts'][i])
				new_data['ground_truth'].append(data['ground_truth'][i])

		# df = pd.DataFrame.from_records(data)
		# print(df)
		dataset = Dataset.from_dict(new_data)
		scores = evaluate(dataset, metrics=[context_relevancy, context_entity_recall], embeddings=embeddings, llm=llm)

		df = scores.to_pandas()
		# save the scores to a csv file
		df.to_csv(f'evaluation/scores/context_scores/{shorthand}-context-recall.csv', index=False)

def generate_parameter_context_scores():
	shorthands = ['500', '1000', '1500', '500-overlap', '1000-overlap', '1500-overlap']
	model = 'llama3'
	for shorthand in shorthands:
		data = []
		with open(f'evaluation/utils/eval_parameters/results-{model}-{shorthand}.json', 'r', encoding = 'utf-8') as f:
			data = json.load(f)
			df = pd.DataFrame.from_records(data)
			new_data = {
				'question': df['question'].tolist(),
				'contexts': df['context'].tolist(),
				'ground_truth': df['ground_truth'].tolist()
			}
		# print(df)
		dataset = Dataset.from_dict(new_data)
		scores = evaluate(dataset, metrics=[context_relevancy, context_entity_recall], embeddings=embeddings, llm=llm)

		df = scores.to_pandas()
		# save the scores to a csv file
		df.to_csv(f'evaluation/scores/param_context_scores/test-chunksize-{shorthand}-context-recall.csv', index=False)

def generate_answer_scores():
	shorthands = ['qa-cos', 'mini-l6', 'snowflake']
	models = ['gemma', 'llama2', 'llama3', 'llama3-70b', 'mistral', 'vicuna']
	for shorthand in shorthands:
		for model in models:
			data = []
			with open(f'evaluation/utils/eval_answers/{model}/results-{model}-{shorthand}.json', 'r', encoding = 'utf-8') as f:
				data = json.load(f)
				# create new dataset with 20 samples
				new_data = {
					'question': [],
					'answer': [],
					'contexts': [],
					'ground_truth': []
				}
				for x in data:
					new_data['question'].append(x['question'])
					new_data['answer'].append(x['answer'])
					new_data['contexts'].append(x['context'])
					new_data['ground_truth'].append(x['ground_truth'])

			# df = pd.DataFrame.from_records(data)
			# print(df)
			dataset = Dataset.from_dict(new_data)
			scores = evaluate(dataset, metrics=[answer_correctness], embeddings=embeddings, llm=llm)

			df = scores.to_pandas()
			result_file_path = f'evaluation/scores/answer_scores/{model}/{model}-{shorthand}-answer-correctness.json'
			df.to_records(result_file_path)
			# save the scores to a csv file

def generate_parameter_answer_scores():
	shorthands = ['500', '1000', '1500', '500-overlap', '1000-overlap', '1500-overlap']
	model = 'llama3'
	for shorthand in shorthands:
		data = []
		with open(f'evaluation/utils/eval_parameters/results-{model}-{shorthand}.json', 'r', encoding = 'utf-8') as f:
			data = json.load(f)
			# create new dataset with 20 samples
			new_data = {
				'question': [],
				'answer': [],
				'contexts': [],
				'ground_truth': []
			}
			for i in random.sample(range(len(data), 20)):
				new_data['question'].append(data['question'][i])
				new_data['answer'].append(data['answer'][i])
				new_data['contexts'].append(data['contexts'][i])
				new_data['ground_truth'].append(data['ground_truth'][i])

		# df = pd.DataFrame.from_records(data)
		# print(df)
		dataset = Dataset.from_dict(new_data)
		scores = evaluate(dataset, metrics=[context_relevancy, context_entity_recall], embeddings=embeddings, llm=llm)

		df = scores.to_pandas()
		# save the scores to a csv file
		df.to_csv(f'evaluation/scores/param_answer_scores/chunksize-{shorthand}-answer-evaluation.csv', index=False)

def combine_json_files():
	question_answer_json = {
		'question': [],
		# 'answer': [],
		'contexts': [],
		'ground_truth': []
	}
	embed_shorthands = ['snowflake']
	datasets = ['mygpt-GPCR', 'mygpt-Kinase', 'mygpt-CAR-T', 'mygpt-IDR', 'mygpt-PTM']
	for shorthand in embed_shorthands:
		for dataset in datasets:
			with open(f'evaluation/utils/eval_context/{shorthand}/{dataset}-{shorthand}.json', 'r') as f:
				json_data = json.load(f)
				question_answer_json['question'] += [qa['question'] for qa in json_data]
				# question_answer_json['answer'] += [qa['answer'] for qa in json_data]
				question_answer_json['contexts'] += [qa['contexts'] for qa in json_data]
				question_answer_json['ground_truth'] += [qa['ground_truth'] for qa in json_data]

		with open(f'evaluation/utils/eval_context/{shorthand}/mygpt-all-{shorthand}.json', 'w') as f:
			json.dump(question_answer_json, f)

# combine_json_files()
generate_answer_scores()