import requests

def query_api(url, payload):
	headers = {
		'Content-Type': 'application/json',
		'Authorization': 'Token f3663b9f29126f8dca2bc06f9f90a8e56ca89418'
  }

  #  run post query
	response = requests.post(url, headers=headers, json=payload)
	print(response)
	if response.status_code == 200:
		data = response.json()
		# Process the data here
		return data
	else:
		print(f"Error: {response.status_code}")
		return None

# Example usage
question = "List me the PAK4 construct boundaries in the experiments."
model_type = "llama2"
dataset = "Kinases"
api_url = "http://localhost:8000/api/get_context/"

#  run post call to api
api = api_url
payload = {
  "text": question,
  "model_type": model_type,
  "dataset": dataset,
  "new_conversation": True,
  "related_query": False,
  "previous_query": "",
  "no_context": False,
  "sentence_transformer": "all-MiniLM-L6-v2"
}
result = query_api(api, payload)
print(result)
