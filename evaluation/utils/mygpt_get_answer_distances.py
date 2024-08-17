import json
import requests
import tqdm
import pandas as pd

# answer distance api
answer_api = 'https://svlpmygptbknd01.stjude.org/api/get_distance_between_answers/'
# answer_api = 'http://localhost:8000/api/get_distance_between_answers/'
# save_answer_api = 'https://svlpmygptbknd01.stjude.org/api/save_answer/'
save_answer_api = 'http://localhost:8000/api/save_answer/'


def get_distances(input, output, compare_1, compare_2, compare_3):
	data = []
	with open(input, 'r', encoding = 'utf-8') as f:
		data = json.load(f)

	with open(output, 'a') as f:
		f.write('answers_distance,ground_truth_distance\n')

		# write for loop with tqdm
		for (i,x) in enumerate(tqdm.tqdm(data)):
			answer_1 = x[compare_1]
			answer_2 = x[compare_2]
			ground_truth = x[compare_3]

			# send post request to get distance between answers
			response = requests.post(answer_api, json={
				'sentence1': answer_1, 
				'sentence2': answer_2, 
				'sentence_transformer': 'multi-qa-MiniLM-L6-cos-v1'
			},
			timeout=None)

			if response.status_code == 200:
				distance = response.json().get('distances')
			else:
				distance = 0

			response2 = requests.post(answer_api, json={
				'sentence1': answer_1, 
				'sentence2': ground_truth, 
				'sentence_transformer': 'multi-qa-MiniLM-L6-cos-v1'
			},
			timeout=None)

			if response2.status_code == 200:
				distance2 = response2.json().get('distances')
			else:
				distance2 = 0

			# write distances to file
			with open(output, 'a') as f:
				f.write(f"{distance},{distance2}\n")
		
def calculate_answer_nocontext_answer_distance():

		input = f'evaluation/utils/context_answers/results-llama3-best-2.json'
		output = f'evaluation/scores/answers_distances/answers_distances_best-2.csv'
		get_distances(input, output, 'answer', 'answer_no_context', 'ground_truth')

		# output = f'evaluation/scores/answers_confidence/context_ground_truth.csv'
		# generate_scores(input, output, [answer_similarity], 'ground_truth', 'answer')

		# output = f'evaluation/scores/answers_confidence/nocontext_ground_truth.csv'
		# generate_scores(input, output, [answer_similarity], 'answer_no_context', 'ground_truth')
		
# calculate_answer_nocontext_answer_distance()
# Define API endpoints
dataset_questions_api = 'https://svlpmygptbknd01.stjude.org/api/get_conversation_history/?dataset='
question_detail_api = 'https://svlpmygptbknd01.stjude.org/api/get_question_details/?question_id='

# Load evaluation documents and questions
eval_doc = pd.read_csv('evaluation/documents/eval_dataset.csv', encoding = 'ISO-8859-1').dropna()
question_list = eval_doc['question'].tolist()
datasets = eval_doc['library'].tolist()

def get_context_distances(input, output):
	with open(input, 'r', encoding = 'utf-8') as f:
		data = json.load(f)

	with open(output, 'a') as f:
		f.write('mean_distance_n,relevance_score_n\n')

	for i, (question, dataset) in enumerate(zip(question_list, datasets)):
		# find question from data from json file
		for x in data:
			if x['question'] == question:
				contexts = x['context']
				answer = x['answer']
				answer_no_context = x['answer_no_context']
				break
		
		print(f"Processing question {i+1}... for dataset {dataset}")

		# save answer to database
		response = requests.post(save_answer_api, json={
			'question_text': question,
			'answer_text': answer,
			'answer_no_context_text': answer_no_context,
			'model_type': 'llama3:latest',
			'contexts': contexts,
			'dataset': dataset + '-best-2',
			'no_context': False
		})
		print(response.json())

		if response.status_code == 200:
			mean_distance_n = response.json().get('mean_distance')
			relevance_score_n = response.json().get('relevance_score')

		# write distances to file
		with open(output, 'a') as f:
			f.write(f"{mean_distance_n},{relevance_score_n}\n")
				


def calculate_context_answers_distance():
	input = f'evaluation/utils/context_answers/results-llama3-best-2.json'
	output = f'evaluation/scores/answers_distances/answer_nc_vs_context_best-2.csv'
	get_context_distances(input, output)

calculate_context_answers_distance()