from datasets import Dataset
from ragas import evaluate
from ragas.metrics import context_relevancy, context_entity_recall, answer_relevancy, answer_similarity, answer_correctness
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.chat_models import ChatOllama
import os
import pandas as pd
import json
import random
import itertools

embeddings = HuggingFaceEmbeddings(model_name="multi-qa-MiniLM-l6-cos-v1")
llm = ChatOllama(model="llama3:latest", base_url="http://10.220.17.160:11434")
os.environ["RAGAS_DO_NOT_TRACK"] = "false"

def generate_scores(input, output, metrics, random_sample = None):
	data = []
	with open(input, 'r', encoding = 'utf-8') as f:
		data = json.load(f)
		new_data = {
			'question': [],
			'answer': [],
			'contexts': [],
			'ground_truth': []
		}
		if random_sample:
			for i in random_sample:
				new_data['question'].append(data[i]['question'])
				new_data['answer'].append(data[i]['answer'])#.split('. '))
				new_data['contexts'].append(data[i]['context'])
				new_data['ground_truth'].append(data[i]['ground_truth'])#.split('. '))
		else:
			for x in data:
				new_data['question'].append(x['question'])
				new_data['answer'].append(x['answer'])#.split('. '))
				new_data['contexts'].append(x['context'])
				new_data['ground_truth'].append(x['ground_truth'])#.split('. '))

	dataset = Dataset.from_dict(new_data)
	scores = evaluate(dataset, metrics=metrics, embeddings=embeddings, llm=llm)

	df = scores.to_pandas()
	df.to_csv(output, index=False)

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

def repair_answer_scores(score_doc, answer_doc):
	current_score_df = pd.read_csv(score_doc)
	questions = current_score_df['question'].tolist()
	relevancy_scores = current_score_df['answer_relevancy'].tolist()
	data = []
	with open(answer_doc, 'r', encoding = 'utf-8') as f:
		data = json.load(f)
		# create new dataset with 20 samples
		new_data = {
			'index': [],
			'question': [],
			'answer': [],
			'contexts': [],
			'ground_truth': []
		}
		all_questions = []
		for i, x in enumerate(data):
			all_questions.append(x['question'])
			if (x['question'] not in questions) or (relevancy_scores[questions.index(x['question'])] in [None, 0, '', 0.0]):
				new_data['question'].append(x['question'])
				new_data['answer'].append(x['answer'])
				if x['context'][0] not in ["'", '"']:
					new_data['contexts'].append(list(x['context']))
				else:
					new_data['contexts'].append(json.loads(x['context']))
				new_data['ground_truth'].append(x['ground_truth'])
				new_data['index'].append(str(i))

	rescore_df = pd.DataFrame.from_dict(new_data)
	rescore_df.to_json('evaluation/utils/test.json', orient='records')
	rescore_dataset = Dataset.from_dict(new_data)
	new_scores_raw = evaluate(rescore_dataset, metrics=[answer_relevancy, answer_similarity], embeddings=embeddings, llm=llm)

	new_score_records = new_scores_raw.to_pandas().to_dict('records')
	score_records = current_score_df.to_dict('records')

	next_score = iter(new_score_records)
	for i, question in zip(rescore_df['index'].tolist(), rescore_df['question'].tolist()):
		if question in questions:
			score_records[questions.index(question)] = next(next_score)
		else:
			score_records.insert(i, next(next_score))

	full_score_df = pd.DataFrame.from_records(score_records).drop(columns=['index'])
	full_score_df.to_csv(score_doc, index=False)


# shorthands = ['qa-cos', 'mini-l6', 'snowflake']
# models = ['gemma', 'llama2', 'llama3', 'llama3-70b', 'mistral', 'vicuna']

# # needs_rescoring = [('gemma', 'qa-cos'), ('llama2', 'qa-cos'), ('llama3', 'qa-cos'),
# # 				   ('llama3-70b', 'qa-cos'), ('mistral', 'qa-cos'), ('vicuna', 'qa-cos'),
# # 				   ('llama3', 'mini-l6')]

# for model, embed in itertools.product(models, shorthands):
# 	print(f'MODEL: {model}; EMBED: {embed};')
# 	input = f'evaluation/utils/eval_answers/{model}/results-{model}-{embed}.json'
# 	output = f'evaluation/scores/answer_scores/{model}/{model}-{embed}-answer-correctness.csv'
# 	generate_scores(input, output, [answer_correctness], random_sample=random.sample(range(232), 20))

for suffix in ['500', '1000', '1500', '500-overlap', '1000-overlap', '1500-overlap']:
	print(f'CHUNKSIZE: {suffix};')
	input = f'evaluation/utils/eval_parameters/chunksize-{suffix}.json'
	output = f'evaluation/scores/param_answer_scores/evaluation-{suffix}.csv'
	generate_scores(input, output, [answer_relevancy, answer_similarity])