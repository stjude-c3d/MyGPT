import json
import requests

def add_data_to_django_database():

	django_username = 'admin'
	django_password = 'admin123'

	with open('evaluation/utils/best_settings/combined_results.json', 'r') as f:
		combined_results = json.load(f)

	for qa in combined_results:
		library = qa['library']

		# post dataset if it doesn't exist
		datasets = requests.get('http://localhost:8000/evaluation_dataset/libraries/', auth=(django_username, django_password)).json()['results']
		dataset_names = [dataset['dataset_name'] for dataset in datasets] if len(datasets) else []


		if library not in dataset_names:
			request_data = {'dataset_name': library, 'question_count': 0}
			response = requests.post('http://localhost:8000/evaluation_dataset/libraries/', data=request_data, auth=(django_username, django_password))
			if response.status_code == 201:
				print(f"Dataset {library} added successfully.")
			else:
				print(f"Error: {response.status_code}")
				print(response.reason)

		# get dataset id
		datasets = requests.get('http://localhost:8000/evaluation_dataset/libraries/', auth=(django_username, django_password)).json()['results']
		dataset_id = [dataset['id'] for dataset in datasets if dataset['dataset_name'] == library][0]

		# post question if it doesn't exist
		questions = requests.get(f'http://localhost:8000/evaluation_dataset/questions/', auth=(django_username, django_password)).json()['results']
		question_ids = [question['mygpt_dataset_question_id'] for question in questions] if len(questions) else []
		mygpt_dataset_question_id  = qa['question_id']
		question_text = qa['question']
		question_type = qa['question_type']
		ground_truth = qa['ground_truth']
		submitter = qa['submitter']

		if mygpt_dataset_question_id not in question_ids:
			request_data = {'question_text': question_text, 'question_type': question_type, 'ground_truth': ground_truth, 'submitter': submitter, 'mygpt_dataset_question_id': mygpt_dataset_question_id, 'dataset': dataset_id}
			response = requests.post('http://localhost:8000/evaluation_dataset/questions/', data=request_data, auth=(django_username, django_password))
			if response.status_code == 201:
				print(f"Question {question_text} added successfully.")
			else:
				print(f"Error: {response.status_code}")
				print(response.reason)

			# post answer
			answer_text_1 = qa['best_answer_1']
			answer_text_2 = qa['best_answer_2']
			answer_tag_1 = 'best_1'
			answer_tag_2 = 'best_2'
			context_1 = str(qa['contexts_1'])
			context_2 = str(qa['contexts_2'])

			# get question id
			questions = requests.get(f'http://localhost:8000/evaluation_dataset/questions/', auth=(django_username, django_password)).json()['results']
			question_id = [question['id'] for question in questions if question['mygpt_dataset_question_id'] == mygpt_dataset_question_id][0]

			# post answer 1
			request_data = {'answer_text': answer_text_1, 'answer_tag': answer_tag_1, 'context': context_1, 'question': question_id}
			response = requests.post('http://localhost:8000/evaluation_dataset/answers/', data=request_data, auth=(django_username, django_password))
			if response.status_code == 201:
				print(f"Answer 1 added successfully.")
			else:
				print(f"Error: {response.status_code}")
				print(response.reason)

			# post answer 2
			request_data = {'answer_text': answer_text_2, 'answer_tag': answer_tag_2, 'context': context_2, 'question': question_id}
			response = requests.post('http://localhost:8000/evaluation_dataset/answers/', data=request_data, auth=(django_username, django_password))
			if response.status_code == 201:
				print(f"Answer 2 added successfully.")
			else:
				print(f"Error: {response.status_code}")
				print(response.reason)

			# update question count in dataset
			dataset_question_count = [dataset['question_count'] for dataset in datasets if dataset['dataset_name'] == library][0]
			request_data = {'dataset_name': library, 'question_count': dataset_question_count + 1}
			response = requests.put(f'http://localhost:8000/evaluation_dataset/libraries/{dataset_id}/', data=request_data, auth=(django_username, django_password))

# add_data_to_django_database()

def add_mygpt_beta_answers_to_db():

	django_username = 'admin'
	django_password = 'admin123'

	with open('evaluation/utils/best_settings/mygpt_beta_answers.json', 'r') as f:
		mygpt_answers = json.load(f)

	for answer in mygpt_answers:

		request_data = {'answer_text': answer['MyGPT_beta'], 'answer_tag': 'mygpt_beta', 'context': '[]', 'question': str(answer['id'])}
		response = requests.post('http://localhost:8000/evaluation_dataset/answers/', data=request_data, auth=(django_username, django_password))
		if response.status_code == 201:
			print(f"Answer added successfully.")
		else:
			print(f"Error: {response.status_code}")
			print(response.reason)

add_mygpt_beta_answers_to_db()	
