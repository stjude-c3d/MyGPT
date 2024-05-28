import requests
import pandas as pd
import json
import time

def query_api(url, payload):
	headers = {
		"Content-Type": "application/json",
		"Authorization": "Token f3663b9f29126f8dca2bc06f9f90a8e56ca89418"
  }

  #  run post query
	response = requests.post(url, headers=headers, json=payload)
	print(response)
	if response.status_code == 200:
		data = response
		# Process the data here
		return data
	else:
		print(f"Error: {response.status_code}")
		return None
	
df = pd.read_csv("question-groundtruth-library.csv")
questions = df["question"].tolist()
ground_truths = df["ground_truths"].tolist()
datasets = df["dataset"].tolist()



models = ["llama3:latest", "gemma:latest", "mistral:latest", "llama3:70b"]
embedders = ["all-MiniLM-L6-v2", "all-MiniLM-L12-v2", "multi-qa-MiniLM-L6-cos-v1", "all-mpnet-base-v2", "multi-qa-mpnet-base-dot-v1", "paraphrase-albert-small-v2"]

contexts = []
answers = []

# Example usage
# question = "List me the PAK4 construct boundaries in the experiments."
# embedder = "all-MiniLM-L6-v2"
# dataset = "Kinases-KATA"

context_url = "http://localhost:8000/api/get_context/"
answer_url = "http://10.220.17.160:11434/api/generate"


for model in models:
	for i, embedder in enumerate(embedders):
		answers = []
		contexts = []
		count = 0
		for question, dataset in zip(questions, datasets):
			count += 1
			print(f"model: {model}; embedder: {embedder};")
			print(f"QUESTION {count}")
			start_time = time.time()
			dataset += f"-{str(i+1)}"
			#  run post call to api
			payload = {
			"text": question,
			"model_type": "llama3",
			"dataset": dataset,
			"new_conversation": True,
			"related_query": False,
			"previous_query": "",
			"no_context": False,
			"sentence_transformer": embedder
			}

			context_response = query_api(context_url, payload).json()
			context = []
			for source in context_response["sources"]:
				context.append(source["context"])
			contexts.append(context)

			#  run post call to api
			payload = {
			"model": model,
			"prompt": question,
			"system": "Use following information to answer the question in less than 100 words, try not to use anything else: " + context_response["context"],
			"context": []
			}
			answer_response = query_api(answer_url, payload).text
			with open("Output.txt", "w") as text_file:
				text_file.write(answer_response)
			response_jsons = answer_response.split("\n")
			answer = ""
			for response in response_jsons:
				try:
					answer += json.loads(response)["response"]
				except:
					print("Done")
			answers.append(answer)
			print(answer)
			end_time = time.time()
			run_time = end_time - start_time
			print(f"Query runtime: {run_time} seconds")
		
		datafile = pd.DataFrame.from_dict({"question": questions, "answer": answers, "contexts": contexts, "ground_truth": ground_truths})
		datafile.to_json(f"results/{model.replace(':', '-')}/query_results_{model.replace(':', '-')}_embed{i+1}.json", orient="records")


