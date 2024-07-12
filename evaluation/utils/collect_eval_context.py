import requests
import os
import pandas as pd
import time
import json

# Define API endpoints
context_api = 'https://svlpmygptbknd01.stjude.org/api/get_context/'
# context_api = 'http://localhost:8000/api/get_context/'

# Load evaluation documents and questions
eval_doc = pd.read_csv('evaluation/documents/eval_dataset.csv', encoding = 'ISO-8859-1').dropna()
question_list = eval_doc['question'].tolist()
groundtruth_list = eval_doc['ground_truth'].tolist()
lib_list = eval_doc['library'].tolist()

# List of models and embeddings to evaluate
# embeds = ['multi-qa-MiniLM-L6-cos-v1','multi-qa-mpnet-base-dot-v1', 'all-MiniLM-L6-v2', 'all-MiniLM-L12-v2', 'Snowflake/snowflake-arctic-embed-m']
# embed_shorthands = ['qa-cos', 'qa-dot', 'mini-l6', 'mini-l12', 'snowflake']
# datasets = ['mygpt-IDR', 'mygpt-PTM']
embed_shorthands = ['qa-cos']
datasets = ['mygpt-GPCR','mygpt-Kinase','mygpt-CAR-T','mygpt-IDR','mygpt-PTM']

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

# Main processing loop
for shorthand in embed_shorthands:
    # Process each model for QA
    for dataset in datasets:
        for j, (question, library, groundtruth) in enumerate(zip(question_list, lib_list, groundtruth_list)):
            if f'mygpt-{library}' == dataset:
                # Log query info
                print('\n')
                proper_dataset = f'mygpt-{library}-{shorthand}'
                print(f'DATASET: {proper_dataset}; EMBEDDING: {shorthand};')
                print(f'Loading Question {str(j+1)}...')
                # Get context for the question (assuming query_api function remains unchanged)
                context_payload = {
                    "text": question,
                    "model_type": "llama3:latest",
                    "dataset": proper_dataset,
                    "new_conversation": True,
                    "related_query": False,
                    "previous_query": "",
                    "no_context": False,
                    # "sentence_transformer": embed,
                    "skip_highlight": True
                }
                context_raw = query_api(context_api, context_payload)
                if context_raw:
                    contexts = [source['context'] for source in context_raw.get('sources', [])]
                else:
                    contexts = []

                # Store QA results
                qa_result = {'question': question, 'contexts': contexts, 'ground_truth': groundtruth, 'dataset': dataset}
                # Prepare file path
                result_file_path = f'evaluation/utils/eval_context/{shorthand}/{proper_dataset}.json'

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