import os
import json
import time
import requests
import pandas as pd
import re
import argparse
from pathlib import Path
from dotenv import load_dotenv

load_dotenv('../.env')
start_time = time.time()

OLLAMA_API_URL = os.environ.get('OLLAMA_API_URL', '').strip().strip('"').rstrip('/')

#############
# Variables #
#############

SCRIPTS_DIR = Path(__file__).resolve().parent
OUTPUTS_DIR = (SCRIPTS_DIR / '../outputs').resolve()
INPUTS_DIR = (SCRIPTS_DIR / '../inputs').resolve()


def safe_path(base_dir: Path, *parts: str) -> Path:
    """Resolve a path and ensure it stays within base_dir."""
    resolved = (base_dir / Path(*parts)).resolve()
    if not str(resolved).startswith(str(base_dir) + os.sep):
        raise ValueError(f"Path traversal detected: {resolved}")
    return resolved


def get_dataset_name():
    parser = argparse.ArgumentParser(description='Collect answers from API')
    parser.add_argument('--dataset', default='QRS-ARS-cutoff-bge', help='Dataset name')
    args = parser.parse_args()
    dataset = args.dataset
    if not re.match(r'^[a-zA-Z0-9_\-]+$', dataset):
        raise ValueError(f"Invalid dataset name: {dataset!r}. Only alphanumeric characters, hyphens, and underscores are allowed.")
    return dataset

LIBRARY_NAME = os.path.basename(get_dataset_name())
EMBEDDING_MODEL = 'bge'
MODELS = [
    'gpt-oss:20b'
]

##############

# Define API endpoints
ANSWER_API = f'{OLLAMA_API_URL}/api/generate/'

# Load evaluation documents and questions
EVAL_DOC = pd.read_csv(INPUTS_DIR / 'QRS_ARS_cutoff_dataset.csv', encoding='ISO-8859-1').dropna()
QUESTION_LIST = EVAL_DOC['question'].tolist()

# List of models and embeddings to evaluate
EMBED_SHORTHANDS = [EMBEDDING_MODEL]
COLLECTED = []  # Example: [('llama3:latest', 'mini-l6')]

def query_api(url, payload):
    """Query the API with the given payload and measure time taken."""
    headers = {'Content-Type': 'application/json'}
    start_time = time.time()
    response = requests.post(url, headers=headers, json=payload)
    end_time = time.time()
    print(f"API call to {url} took {end_time - start_time:.2f} seconds.")
    if response.status_code == 200:
        return response.json()
    print(f"Error: {response.text}")
    print(response.reason)
    return None

def collect_answers():
    """Main function to collect answers from the API."""
    
    # Load existing answers to check which questions have been answered
    model = MODELS[0]  # Just to get the sanitized model name
    sanitized_model = model.replace(':', '-')
    answers_file_path = safe_path(OUTPUTS_DIR, 'answers', f'answers-{sanitized_model}-{LIBRARY_NAME}.json')
    try:
        with open(answers_file_path, 'r', encoding='utf-8') as f:
            existing_answers = json.load(f)
        answered_questions = {item['question'] for item in existing_answers if 'question' in item}
    except FileNotFoundError:
        answered_questions = set()
    
    for shorthand in EMBED_SHORTHANDS:
        with open(safe_path(OUTPUTS_DIR, 'contexts', f'context_{LIBRARY_NAME}.json'), encoding='utf-8') as file:
            context_lists = pd.DataFrame.from_dict(json.load(file))['contexts'].tolist()
        for model in MODELS:
            if (model, shorthand) in COLLECTED:
                continue
            for i, question in enumerate(QUESTION_LIST):
                # Check if question was already answered
                if question in answered_questions:
                    print(f'Skipping Question {i + 1}: Already answered')
                    continue
                else:
                    print(f'Processing Question {i + 1}...')
                
                contexts_full = context_lists[i]
                # contexts_full = context_lists[(i * 3) + question_idx]
                contexts = []
                #  remove this kind of strings from the beginning of the context 'Page 4 - 38252844:  '
                contexts_regex = r'Page \d+ - \d+:  '
                for index, context in enumerate(contexts_full):
                    if re.match(contexts_regex, context):
                        # remove the string from the context
                        context = re.sub(contexts_regex, '', context)
                    contexts.append(context)
                print('\n')
                print(f'MODEL: {model}; EMBEDDING: {shorthand};')
                print(f'Loading Question {i + 1}...')

                system_prompt = '###INSTUCTIONS#### \nUse following information to answer the question in less than 200 words, try not to use any other information other than provided context. if the information is not in the context, then tell user that information is not found in the documents.\n ### CONTEXT ####  ' + str(contexts)
                
                answer_prompt = {
                    "model": model,
                    "prompt": question,
                    "stream": False,
                    "system": system_prompt,
                    "think": "medium", 
                    "options": {
                        "temperature": 0.4,
                        "top_k": 20,
                        "top_p": 0.7
                    }
                }
                answer = query_api(ANSWER_API, answer_prompt).get('response', '')
                if answer:
                    qa_result = {
                        'question': question,
                        'context': contexts_full,
                        'answer': answer,
                        "question_number": i + 1,
                        'model': model
                    }
                    print(f'Finished processing question {i+1}')
                    model_name = model.removesuffix(":latest").replace(":", "-")
                    result_file_path = safe_path(OUTPUTS_DIR, 'answers', f'answers-{model_name}-{LIBRARY_NAME}.json')
                    result_file_path.parent.mkdir(parents=True, exist_ok=True)

                    if result_file_path.exists():
                        with open(result_file_path, 'r+', encoding='utf-8') as result_file:
                            result_data = json.load(result_file)
                            result_data.append(qa_result)
                            result_file.seek(0)
                            json.dump(result_data, result_file, indent=4)
                    else:
                        with open(result_file_path, 'w', encoding='utf-8') as result_file:  # noqa: WPS515
                            json.dump([qa_result], result_file, indent=4)

collect_answers()

end_time = time.time()

elapsed_time = (end_time - start_time)/60
print(f"\n\nExecution time: {elapsed_time} min\n\n")

