import json

def combine_json_files():
	question_answer_json = {
		'question': [],
		# 'answer': [],
		'contexts': [],
		'ground_truth': []
	}
	embed_shorthands = ['mini-l12', 'qa-dot']
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

def combine_best_answers():
	
	question_answer_json = {
		'question_id': 0,
		'question': '',
		'question_type': '',
		'best_answer_1': '',
		'best_answer_2': '',
		'contexts_1': [],
		'contexts_2': [],
		'ground_truth': '',
		'library': '',
		'submitter': '',
	}
	with open(f'evaluation/utils/best_settings/results-best-1.json', 'r') as f:
		best_1_data = json.load(f)
	
	with open(f'evaluation/utils/best_settings/results-best-2.json', 'r') as f:
		best_2_data = json.load(f)

	with open(f'evaluation/utils/best_settings/question_details.json', 'r') as f:
		question_details = json.load(f)

	with open(f'evaluation/utils/best_settings/combined_results.json', 'w') as f:
		json.dump([], f)

	for i, qa in enumerate(best_1_data):
		# print(f'Combining question {i+1}...')
		question_answer_json['question'] = qa['question']
		question_answer_json['best_answer_1'] = qa['answer']
		question_answer_json['best_answer_2'] = best_2_data[i]['answer']
		question_answer_json['contexts_1'] = qa['context']
		question_answer_json['contexts_2'] = best_2_data[i]['context']
		question_answer_json['ground_truth'] = qa['ground_truth']
		question_answer_json['library'] = question_details[i]['library']
		question_answer_json['submitter'] = question_details[i]['evaluator']
		question_answer_json['question_type'] = question_details[i]['question_type']
		question_answer_json['question_id'] = question_details[i]['mygpt_question_id']
			

		with open(f'evaluation/utils/best_settings/combined_results.json', 'r+') as f:
			combined_results = json.load(f)
			combined_results.append(question_answer_json)
			f.seek(0)
			json.dump(combined_results, f, indent=4)

# combine_best_answers()