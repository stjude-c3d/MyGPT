import requests
import os
import pandas as pd
import time
import json
from tqdm import tqdm

# Define API endpoints
answer_api = 'https://svlpgpt001a.stjude.org/api/generate/'

# Load evaluation documents and questions
eval_doc = pd.read_csv('evaluation/documents/eval_dataset.csv', encoding = 'ISO-8859-1').dropna()
question_list = eval_doc['question'].tolist()
groundtruth_list = eval_doc['ground_truth'].tolist()

# List of models and embeddings to evaluate
models = ['llama3:latest', 'gemma:latest', 'mistral:latest', 'llama3:70b', 'llama2:latest', 'vicuna:latest']
embed_shorthands = ['mini-l6', 'snowflake']
collected = [('llama3:latest', 'mini-l6'), ('gemma:latest', 'mini-l6'), ('mistral:latest', 'mini-l6')]

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
    for shorthand in embed_shorthands:
        dataset_name = f'mygpt-all-{shorthand}'
        with open(f'evaluation/utils/eval_context/{shorthand}/{dataset_name}.json') as f:
            context_lists = pd.DataFrame.from_dict(json.loads(f.read()))['contexts'].tolist()
        # Process each model for QA
        for model in models:
            if (model, shorthand) in collected:
                continue
            for j, (question, groundtruth, contexts) in enumerate(zip(question_list, groundtruth_list, context_lists)):
                # Log query info
                print('\n')
                print(f'MODEL: {model}; EMBEDDING: {shorthand};')
                print(f'Loading Question {str(j+1)}...')

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
                    # Prepare file path
                    model_name = model.removesuffix(":latest").replace(":", "-")
                    result_file_path = f'evaluation/utils/eval_answers/{model_name}/results-{model_name}-{shorthand}.json'

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
def repair_incomplete(model, shorthand):
    print(f'Repairing MODEL {model} EMBED {shorthand} data...')
    model_name = model.removesuffix(':latest').replace(':', '-')
    with open(f'evaluation/utils/eval_context/{shorthand}/mygpt-all-{shorthand}.json') as f:
        df = pd.DataFrame.from_dict(json.loads(f.read()))
        context_lists = df['contexts'].tolist()
        full_questions = df['question'].tolist()
        full_groundtruths = df['ground_truth'].tolist()
    with open(f'evaluation/utils/eval_answers/{model_name}/results-{model_name}-{shorthand}.json') as f:
        current_df = pd.DataFrame.from_records(json.loads(f.read()))
    print(current_df)
    broken = {
        'question': current_df['question'].tolist(),
        'answer': current_df['answer'].tolist(),
        'context': current_df['context'].tolist(),
        'ground_truth': current_df['ground_truth'].tolist()
    }

    for i, (question, groundtruth, contexts) in tqdm(enumerate(zip(full_questions, full_groundtruths, context_lists)), desc='Repair Progress: '):
        if question not in broken['question']:
            print('\n')
            print(f'Repairing on Question {i + 1}...')
            broken['question'].insert(i, question)
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
            broken['answer'].insert(i, answer)
            broken['context'].insert(i, contexts)
            broken['ground_truth'].insert(i, groundtruth)
    fixed_df = pd.DataFrame.from_dict(broken)
    fixed_df.to_json(f'evaluation/utils/eval_answers/{model_name}/results-{model_name}-{shorthand}.json', orient='records')

repair_incomplete('llama3:70b', 'snowflake')