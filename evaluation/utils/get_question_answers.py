import requests
import json

def query_api(url):
	response = requests.get(url)
	
	if response.status_code == 200:
		data = response.json()
		# Process the data here
		return data
	else:
		print(f"Error: {response.status_code}")
		return None

# Example usage
question_answer_json = {
	'question': [],
	'answer': [],
	'contexts': [],
	'ground_truth': []
}
api_url = "http://localhost:8000/api/get_question_details/?question_id="
question_ids = [748, 749, 750, 751, 752, 753]
for question_id in question_ids:
	api = api_url + str(question_id)
	result = query_api(api)
	if result:
		# print(result)
		question_answer_json['question'].append(result['question'])
		question_answer_json['answer'].append(result['answers'][1]['answer'])
		contexts = []
		for context in result['sources']:
			contexts.append(str(context['context']))
		question_answer_json['contexts'].append(contexts)
		question_answer_json['ground_truth'].append(result['answers'][0]['answer'])

# save the json to a file
with open('question_answer.json', 'w') as f:
	json.dump(question_answer_json, f)
