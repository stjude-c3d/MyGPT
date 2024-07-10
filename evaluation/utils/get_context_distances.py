import requests
import pandas as pd

# Define API endpoints
dataset_questions_api = 'https://svlpmygptbknd01.stjude.org/api/get_conversation_history/?dataset='
question_detail_api = 'https://svlpmygptbknd01.stjude.org/api/get_question_details/?question_id='
# context_api = 'http://localhost:8000/api/get_context/'

# Load evaluation documents and questions
eval_doc = pd.read_csv('evaluation/documents/eval_dataset.csv', encoding = 'ISO-8859-1').dropna()
question_list = eval_doc['question'].tolist()

datasets = ['mygpt-GPCR','mygpt-Kinase','mygpt-CAR-T','mygpt-IDR','mygpt-PTM']
# dataset = 'mygpt-PTM-qa-cos'

with open('evaluation/utils/context_distances/mygpt-all-qa-cos.csv', 'a') as f:
	f.write('question,distances,mean_distance\n')

# get conversation history using dataset questions api
for dataset in datasets:
	response = requests.get(dataset_questions_api + dataset + '-qa-cos')
	if response.status_code == 200:
		conversation_history = response.json()
	else:
		print(f"Error: {response.status_code}")
		print(response.reason)
		conversation_history = None

	# get question details using question detail api
	if conversation_history:
		# write distances to file
		for question in question_list:
			# find question by comparing question text in the conversation history
			question_id = None
			for conversation in conversation_history['conversations']:
				if conversation['questions_answers'][0]['question'] == question:
					question_id = conversation['questions_answers'][0]['question_id']
					break

			if question_id:
				print(question_id)
				response = requests.get(question_detail_api + str(question_id))
				if response.status_code == 200:
					question_details = response.json()
				else:
					print(f"Error: {response.status_code}")
					print(response.reason)

				# get distances from question details
				if question_details:
					sources = question_details['sources']
					distances = []
					for source in sources:
						distances.append(source['distance'])
					mean_distance = "%.2f" % (sum(distances) / len(distances))

					# write distances to file
					with open('evaluation/utils/context_distances/mygpt-all-qa-cos.csv', 'a') as f:
						f.write(f"\"{question}\",{';'.join(str(x) for x in distances)},{mean_distance}\n")