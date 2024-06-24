import requests
import os
import pandas as pd
import time
import json
from tqdm import tqdm

# Define API endpoints
context_api = 'http://localhost:8000/api/get_context/'
answer_api = 'https://svlpgpt001a.stjude.org/api/generate/'

# Load evaluation documents and questions
eval_doc = pd.read_csv('evaluation/documents/eval_dataset.csv', encoding = 'ISO-8859-1').dropna()
datasets = eval_doc['library'].tolist()
# questions = [x for i, x in enumerate(eval_doc['question'].tolist()) if datasets[i] == 'GPCR']
questions = eval_doc['question'].tolist()
groundtruths = eval_doc['ground_truth'].tolist()
libraries = eval_doc['library'].tolist()

# List of models and embeddings to evaluate
model = 'llama3:latest'
shorthand = 'qa-cos'

# Function to query APIs with payload and measure time taken
def query_api(url, payload):
    headers = {'Content-Type': 'application/json'}
    start_time = time.time()
    response = requests.post(url, headers=headers, json=payload)
    end_time = time.time()
    # print(f"API call to {url} took {end_time - start_time:.2f} seconds.")
    if response.status_code == 200:
        return response.json()
    else:
        # print(f"Error: {response.status_code}")
        print(response.reason)
        return None

def collect_answers():
    # Main processing loop
    collected = ['500-overlap', '1000-overlap', '1500-overlap']
    for dataset_ref in ['500', '1000', '1500', '500-overlap', '1000-overlap', '1500-overlap']:
        if dataset_ref in collected:
            continue
        # Prepare file path
        result_file_path = f'evaluation/utils/eval_parameters/chunksize-{dataset_ref}.json'
        print(f'MODEL: {model}; EMBEDDING: {shorthand};')
        for i, (question, groundtruth, library) in tqdm(enumerate(zip(questions, groundtruths, libraries)),
                                                        total = len(questions),
                                                        desc = f"Loading for chunksize {dataset_ref}..."):
            # Log query info
            if library != 'Kinase':
                continue
            context_payload = {
                "text": f"Represent this sentence for searching relevant passages: {question}",
                "model_type": "llama3:latest",
                "dataset": f'mygpt-{library}-{dataset_ref}',
                "new_conversation": True,
                "related_query": False,
                "previous_query": "",
                "no_context": False,
                "skip_highlight": True
            }
            context_raw = query_api(context_api, context_payload)
            if context_raw:
                contexts = [source['context'] for source in context_raw.get('sources', [])]
            else:
                contexts = []

            # Generate answer prompt (assuming query_api function remains unchanged)
            system_prompt = 'Use following information to answer the question in less than 100 words, try not to use anything else: ' + str(contexts)
            answer_prompt = {
                "model": model,
                "prompt": question,
                "stream": False,
                'system': system_prompt,
                "options": {
                    "temperature": 0.4,
                    "top_k": 20,
                    "top_p": 0.7
                }
            }

            # Choose API endpoint based on model type (assuming query_api function remains unchanged)
            answer = query_api(answer_api, answer_prompt).get('response', '')

            # Store QA results
            if answer:
                qa_result = {'question': question, 'context': contexts, 'answer': answer, 'ground_truth': groundtruth}
                # Check if the file exists to decide whether to append or create new
                if os.path.exists(result_file_path):
                    with open(result_file_path, 'r+') as result_file:
                        result_data = json.load(result_file)
                        result_data.insert(i, qa_result)
                        result_file.seek(0)
                        json.dump(result_data, result_file, indent=4)
                else:
                    with open(result_file_path, 'w') as result_file:
                        json.dump([qa_result], result_file, indent=4)

collect_answers()