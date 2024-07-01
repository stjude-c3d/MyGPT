import requests
import os
import pandas as pd
import time
import json
from tqdm import tqdm

# Define API endpoint
ANSWER_API = 'http://localhost:11434/api/generate/'

# Load evaluation documents and questions
eval_doc = pd.read_csv('evaluation/documents/eval_dataset.csv', encoding='ISO-8859-1').dropna()
question_list = eval_doc['question'].tolist()

# List of models and embeddings to evaluate
models = ['llama2:latest']

def query_api(url, payload):
    """Query the API with the payload and measure the time taken."""
    headers = {'Content-Type': 'application/json'}
    start_time = time.time()
    response = requests.post(url, headers=headers, json=payload)
    end_time = time.time()
    elapsed_time = end_time - start_time
    
    # print(f"API call to {url} took {elapsed_time} seconds.")
    
    if response.status_code == 200:
        return response.json(), elapsed_time
    else:
        print(f"Error: {response.status_code} - {response.reason}")
        return None

def collect_answer_speeds_local(shorthand, sample):
    """Collect answer speeds for local models."""
    with open(f'evaluation/utils/eval_context/{shorthand}/mygpt-all-{shorthand}.json') as f:
        context_lists = pd.DataFrame.from_dict(json.load(f))['contexts'].tolist()

    for model in models:
        print(f'\nMODEL: {model};')
        model_name = model.replace(":latest", "").replace(":", "-")
        result_file_path = f'evaluation/answer_speeds/local/{model_name}-speeds.json'
        for count, i in tqdm(enumerate(sample), total=len(sample), desc=f"Answering questions with {model_name}..."):
            if count in range(11) and model_name=="llama3":
                continue
            question = question_list[i]
            contexts = context_lists[i]

            system_prompt = (
                'Use the following information to answer the question in less than 100 words, '
                'try not to use anything else: ' + str(contexts)
            )
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

            response = query_api(ANSWER_API, answer_prompt)
            if response:
                answer = response[0].get('response', '')
                if answer:
                    qa_result = {
                        'index': i,
                        'question': question,
                        'answer': answer,
                        'speed': response[1]
                    }

                    if os.path.exists(result_file_path):
                        with open(result_file_path, 'r+') as result_file:
                            result_data = json.load(result_file)
                            result_data.append(qa_result)
                            result_file.seek(0)
                            json.dump(result_data, result_file, indent=4)
                    else:
                        with open(result_file_path, 'w') as result_file:
                            json.dump([qa_result], result_file, indent=4)

sample = [16, 19, 38, 41, 51, 52, 71, 91, 92, 125, 133, 139, 153, 189, 206, 208, 211, 224, 226, 228]
collect_answer_speeds_local('qa-cos', sample)
