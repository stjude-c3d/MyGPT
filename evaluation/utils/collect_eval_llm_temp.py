import requests
import os
import pandas as pd
import time
import json

# Define API endpoints
answer_api = 'https://svlpgpt001a.stjude.org/api/generate/'
# answer_api = 'http://localhost:11434/api/generate/'

# Load evaluation documents and questions
eval_doc = pd.read_csv('evaluation/documents/eval_dataset.csv', encoding = 'ISO-8859-1').dropna()
question_list = eval_doc['question'].tolist()
groundtruth_list = eval_doc['ground_truth'].tolist()
with open(f'evaluation/utils/eval_context/qa-cos/mygpt-all-qa-cos.json') as f:
    context_lists = pd.DataFrame.from_dict(json.loads(f.read()))['contexts'].tolist()

# List of models and embeddings to evaluate
embed_shorthands = ['qa-cos']
models = ['llama3:latest']
llm_params = [ 
    # {'temperature': 0.0, 'top_k': 10, 'top_p': 0.5},
    # {'temperature': 0.2, 'top_k': 20, 'top_p': 0.6},
    # {'temperature': 0.4, 'top_k': 40, 'top_p': 0.7},
    # {'temperature': 0.6, 'top_k': 60, 'top_p': 0.7},
    {'temperature': 0.8, 'top_k': 80, 'top_p': 0.8}, 
    # {'temperature': 1.0, 'top_k': 100, 'top_p': 0.95},
]

# Function to query APIs with payload and measure time taken
def query_api(url, payload):
    headers = {'Content-Type': 'application/json'}
    start_time = time.time()
    response = requests.post(url, headers=headers, json=payload)
    end_time = time.time()
    print(f"API call to {url} took {end_time - start_time:.2f} seconds.")
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        print(response.reason)
        return None

def collect_answers():
    # Main processing loop
    for params in llm_params:
        shorthand = f"temp-{params['temperature']}-top-k-{params['top_k']}-top-p-{params['top_p']}"
        dataset_name = f'mygpt-{shorthand}'
        # Process each model for QA
        for model in models:
            for j, (question, groundtruth, contexts) in enumerate(zip(question_list, groundtruth_list, context_lists)):
                # Log query info
                print('\n')
                print(f'MODEL: {model}; PRARMS: {shorthand};')
                print(f'Loading Question {str(j+1)}...')

                # Generate answer prompt (assuming query_api function remains unchanged)
                system_prompt = 'Use following information to answer the question in less than 100 words, try not to use anything else: ' + str(contexts)
                answer_prompt = {
                    "model": model,
                    "prompt": question,
                    "stream": False,
                    'system': system_prompt,
                    "options": {
                        "temperature": params['temperature'],
                        "top_k": params['top_k'],
                        "top_p": params['top_p']
                    }
                }

                # Choose API endpoint based on model type (assuming query_api function remains unchanged)
                answer = query_api(answer_api, answer_prompt).get('response', '')

                # Store QA results
                if answer:
                    qa_result = {'question': question, 'context': contexts, 'answer': answer, 'ground_truth': groundtruth}
                    # Prepare file path
                    result_file_path = f'evaluation/utils/eval_llm_temp_top-k_top-p/results-{dataset_name}.json'

                    # Check if the file exists to decide whether to append or create new
                    if os.path.exists(result_file_path):
                        with open(result_file_path, 'r+') as result_file:
                            result_data = json.load(result_file)
                            result_data.append(qa_result)
                            result_file.seek(0)
                            json.dump(result_data, result_file, indent=4)
                    else:
                        with open(result_file_path, 'w') as result_file:
                            json.dump([qa_result], result_file, indent=4)

collect_answers()