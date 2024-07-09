import typing as t
from datasets import Dataset
from ragas import evaluate
from ragas.metrics.base import MetricWithLLM, EvaluationMode
from langchain_core.callbacks import Callbacks
from ragas.run_config import RunConfig
from ragas.metrics import context_relevancy, context_entity_recall, context_precision, answer_relevancy, answer_similarity, answer_correctness, faithfulness
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.chat_models import ChatOllama
import os
import pandas as pd
import json
import random
import itertools
from tqdm import tqdm

embeddings = SentenceTransformerEmbeddings(model_name="multi-qa-MiniLM-l6-cos-v1")
llm = ChatOllama(model="llama3:latest", base_url="https://svlpgpt001a.stjude.org")
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
				new_data['answer'].append(data[i]['answer'])
				if data[i]['context'][0] in ['"', "'"]:
					new_data['contexts'].append(json.loads(data[i]['context']))
				else:
					new_data['contexts'].append(list(data[i]['context']))
				new_data['ground_truth'].append(data[i]['ground_truth'])
		else:
			for x in data:
				new_data['question'].append(x['question'])
				new_data['answer'].append(x['answer'])
				if x['context'][0] in ['"', "'"]:
					new_data['contexts'].append(json.loads(x['context']))
				else:
					new_data['contexts'].append(list(x['context']))
				new_data['ground_truth'].append(x['ground_truth'])

	dataset = Dataset.from_dict(new_data)
	scores = evaluate(dataset, metrics=metrics, embeddings=embeddings, llm=llm, is_async=True)

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
	
class Correctness(MetricWithLLM):
	name: str = "correctness"
	evaluation_mode: EvaluationMode = EvaluationMode.ga

	def init(self, run_config: RunConfig):
		super().init(run_config)

	async def _ascore(self, row: t.Dict, callbacks: Callbacks, is_async: bool) -> float:
		answer = row["answer"]
		ground_truth = row["ground_truth"].replace('\n', ' ')
		instructions = """
		Answer like EXAMPLE OUTPUT in properly formatted json.

		Given a ground truth and an answer statement, break each answer statement and ground truth statement into lists of substatements (typically sentences).
		Classify each substatement in both the answer and ground truth substatement lists into one of the following categories:

		- TP (true positive): answer substatements that are also directly supported by the one or more statements in ground truth,
		- FP (false positive): answer substatements not directly supported by any statement in ground truth,
		- FN (false negative): ground truth substatements not present in answer.

		Each statement can only belong to one of the categories. Provide a reason for each classification.
		"""
		example = {
			"answer": [
				"The sun is powered by nuclear fission, similar to nuclear reactors on Earth.",
				"The primary function of the sun is to provide light to the solar system.",
			],
			"ground_truth": [
				"The sun is powered by nuclear fusion, where hydrogen atoms fuse to form helium.",
				"This fusion process in the sun's core releases a tremendous amount of energy.",
				"The energy from the sun provides heat and light, which are essential for life on Earth.",
				"The sun's light plays a critical role in Earth's climate system.",
				"Sunlight helps to drive the weather and ocean currents.",
			],
			"classification": {
				"TP": [
					{
						"statement": "The primary function of the sun is to provide light to the solar system.",
						"reason": "This statement is somewhat supported by the ground truth mentioning the sun providing light and its roles, though it focuses more broadly on the sun's energy.",
					}
				],
				"FP": [
					{
						"statement": "The sun is powered by nuclear fission, similar to nuclear reactors on Earth.",
						"reason": "This statement is incorrect and contradicts the ground truth which states that the sun is powered by nuclear fusion.",
					}
				],
				"FN": [
					{
						"statement": "The sun is powered by nuclear fusion, where hydrogen atoms fuse to form helium.",
						"reason": "This accurate description of the sun’s power source is not included in the answer.",
					},
					{
						"statement": "This fusion process in the sun's core releases a tremendous amount of energy.",
						"reason": "This process and its significance are not mentioned in the answer.",
					},
					{
						"statement": "The energy from the sun provides heat and light, which are essential for life on Earth.",
						"reason": "The answer only mentions light, omitting the essential aspects of heat and its necessity for life, which the ground truth covers.",
					},
					{
						"statement": "The sun's light plays a critical role in Earth's climate system.",
						"reason": "This broader impact of the sun’s light on Earth's climate system is not addressed in the answer.",
					},
					{
						"statement": "Sunlight helps to drive the weather and ocean currents.",
						"reason": "The effect of sunlight on weather patterns and ocean currents is omitted in the answer.",
					},
				],
			}
		}
		
		final_prompt = f"""
		INSTRUCTIONS: {instructions}

		EXAMPLE OUTPUT: {example}

		INPUT: {{
			"answer": {answer}
			"ground_truth": {ground_truth}
		}}

		OUTPUT: """
		content = llm.invoke(final_prompt)
		content = content.content
		response = content[content.index('{'):content.rindex('}')+1]
		response = json.loads(response)
		print(response)

		TP_num = len(response["classification"]["TP"])
		FP_num = len(response["classification"]["FP"])
		FN_num = len(response["classification"]["FN"])

		f1_score = TP_num / (TP_num + 0.5 * (FP_num + FN_num)) if TP_num > 0 else 0
		print(f1_score)
		return float(f1_score)

correctness = Correctness()

def get_correctness(ans, ground):
	answer = ans.replace('\n', '. ').split('. ')
	ground_truth = ground.replace('\n', '. ').split('. ')
	answer = [x for x in answer if len(x) > 10]
	ground_truth = [x for x in ground_truth if len(x)  > 10]
	instructions = """
		Answer like EXAMPLE OUTPUT in properly formatted json.
		Classify each substatement in both the answer and ground truth substatement lists into one of the following categories:

		- TP (true positive): answer substatements that are also directly supported by the one or more statements in ground truth,
		- FP (false positive): answer substatements not directly supported by any statement in ground truth,
		- FN (false negative): ground truth substatements not present in answer.

		Each statement can only belong to one of the categories. Provide a reason for each classification.
		"""
	example = {
		"answer": [
			"The sun provides light."
		],
		"ground_truth": [
			"The sun generates energy through nuclear fusion.",
			"This energy gives heat and light.",
			"Sunlight is essential for Earth's climate."
		],
		"classification": {
			"TP": [
				{
					"statement": "The sun provides light.",
					"reason": "Ground truth confirms the sun gives light."
				}
			],
			"FP": [],
			"FN": [
				{
					"statement": "The sun generates energy through nuclear fusion.",
					"reason": "The answer does not mention nuclear fusion."
				},
				{
					"statement": "This energy gives heat and light.",
					"reason": "The answer only mentions light, not heat."
				},
				{
					"statement": "Sunlight is essential for Earth's climate.",
					"reason": "The impact of sunlight on Earth's climate is omitted."
				}
			]
		}
	}
	
	final_prompt = f"""
	INSTRUCTIONS: {instructions}

	EXAMPLE OUTPUT: {example}

	INPUT: {{
		"answer": {answer}
		"ground_truth": {ground_truth}
	}}

	OUTPUT: """
	try:
		content = llm.invoke(final_prompt)
		content = content.content
		response = content[content.index('{'):content.rindex('}')+1]
		response = json.loads(response)
	
		tqdm.write(content)

		TP_num = len(response["classification"]["TP"])
		FP_num = len(response["classification"]["FP"])
		FN_num = len(response["classification"]["FN"])
	except:
		return(None)

	f1_score = TP_num / (TP_num + 0.5 * (FP_num + FN_num)) if TP_num > 0 else 0
	tqdm.write(f"{f1_score}")
	return float(f1_score)

def generate_correctness_scores(input, output):
	scores = []
	with open(input, 'r', encoding = 'utf-8') as f:
		data = json.load(f)
		for x in tqdm(data, desc='Evaluating: ', total=232):
			score = get_correctness(x['answer'], x['ground_truth'])
			scores.append({'question': x['question'],
				  'answer': x['answer'],
				  'ground_truth': x['ground_truth'],
				  'correctness': score})

	df = pd.DataFrame.from_records(data=scores)
	df.to_csv(output, index=False)

shorthands = ['qa-cos', 'mini-l6', 'snowflake']
models = ['gemma', 'llama2', 'llama3', 'llama3-70b', 'mistral', 'vicuna']

q_sample = random.sample(range(232), 50)

print('Scoring answer correctness on model and embed variants...')
for model, embed in itertools.product(models, shorthands):
	print(f'MODEL: {model}; EMBED: {embed};')
	input = f'evaluation/utils/eval_answers/{model}/results-{model}-{embed}.json'
	output = f'evaluation/scores/correctness_scores/{model}/{model}-{embed}-answer-correctness.csv'
	generate_correctness_scores(input, output)

print('Scoring answer correctness on chunk variants...')
for suffix in ['500', '1000', '1500', '500-overlap', '1000-overlap', '1500-overlap']:
	print(f'CHUNKSIZE: {suffix};')
	input = f'evaluation/utils/eval_parameters/chunksize-{suffix}.json'
	output = f'evaluation/scores/param_answer_scores/correctness-{suffix}.csv'
	generate_correctness_scores(input, output)



# print('Scoring context relevancy on chunk variants...')
# for suffix in ['1500-overlap']:
# 	print(f'CHUNKSIZE: {suffix};')
# 	input = f'evaluation/utils/eval_parameters/chunksize-{suffix}.json'
# 	output = f'evaluation/scores/param_context_scores/evaluation-{suffix}.csv'
# 	generate_scores(input, output, [context_relevancy])

# print('Scoring context entity recall on chunk variants...')
# for suffix in ['500', '1000', '1500', '500-overlap', '1000-overlap', '1500-overlap']:
# 	print(f'CHUNKSIZE: {suffix};')
# 	input = f'evaluation/utils/eval_parameters/chunksize-{suffix}.json'
# 	output = f'evaluation/scores/param_context_scores/recall-{suffix}.csv'
# 	generate_scores(input, output, [context_entity_recall])

def calculate_llm_param_answer_similarity():

	# List of llm params
	llm_params = [ 
		{'temperature': 0.2, 'top_k': 10, 'top_p': 0.5},
		{'temperature': 0.4, 'top_k': 20, 'top_p': 0.7},
		{'temperature': 0.8, 'top_k': 40, 'top_p': 0.9}, 
		{'temperature': 1.0, 'top_k': 80, 'top_p': 0.95},
	]

	for params in llm_params:
		shorthand = f"temp-{params['temperature']}-top-k-{params['top_k']}-top-p-{params['top_p']}"
		input = f'evaluation/utils/eval_llm_temp_top-k_top-p/results-mygpt-{shorthand}.json'
		output = f'evaluation/scores/llm_temp_top-k_top-p/similarity-{shorthand}.csv'
		generate_scores(input, output, [answer_similarity])
		
# calculate_llm_param_answer_similarity()