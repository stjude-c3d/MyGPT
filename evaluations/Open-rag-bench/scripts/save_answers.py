import json
import requests
import time
import pandas as pd
import re
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../../.env')

# Set start time for execution time measurement
start_time = time.time()

BACKEND_API_URL = os.environ.get('BACKEND_API_URL', '').strip().strip('"').rstrip('/')

### variables ###

MODELS = [
     'gpt-oss:20b'
]

LIBRARY_NAME = 'open-rag-bench-4'

EMBEDDING_MODEL = 'nomic'
EMBED_SHORTHANDS = [EMBEDDING_MODEL]

COLLECTED = []

### APIs ###
# answer distance api
# answer_api = 'http://10.48.179.211:8000/api/get_distance_between_answers/'
# save_answer_api = 'http://10.48.179.211:8000/api/save_answer/'
answer_api = f'{BACKEND_API_URL}/api/get_distance_between_answers/'
save_answer_api = f'{BACKEND_API_URL}/api/save_answer/'
 
# Load evaluation documents and questions
# EVAL_DOC = pd.read_csv('../inputs_topic_2/eval_dataset_pubp_q_0_3.csv', encoding='ISO-8859-1').dropna()
# QUESTION_LIST = EVAL_DOC['question'].tolist()
 

def get_jwt_token():
    # get jwt token
    # response = requests.post('http://10.48.179.211:8000/token/', json={
    response = requests.post(f'{BACKEND_API_URL}/token/', json={
        'username': os.environ.get('API_USERNAME'),
        'password': os.environ.get('API_PASSWORD')
    })
    if response.status_code == 200:
        token = response.json().get('access')
    else:
        token = ''
    return token
 
token = get_jwt_token()
print(token)
 
# Define API endpoints
#dataset_questions_api = 'https://svlpmygptbknd01.stjude.org/api/get_conversation_history/?dataset='
#question_detail_api = 'https://svlpmygptbknd01.stjude.org/api/get_question_details/?question_id='
# dataset_questions_api = 'http://10.48.179.211:8000/api/get_conversation_history/?dataset='
# question_detail_api = 'http://10.48.179.211:8000/api/get_question_details/?question_id='
dataset_questions_api = f'{BACKEND_API_URL}/api/get_conversation_history/?dataset='
question_detail_api = f'{BACKEND_API_URL}/api/get_question_details/?question_id='
 
def get_context_distances(input):
        with open(input, encoding='utf-8') as file:
            json_data = pd.DataFrame.from_dict(json.load(file))
            question_list = json_data['question'].tolist()
            context_lists = json_data['context'].tolist()
            answers_list = json_data['answer'].tolist()
            document_ids = json_data['document'].tolist()
        for model in MODELS:
            # if (model, shorthand) in COLLECTED:
            #     continue
            for shorthand in EMBED_SHORTHANDS:
                output = f'../outputs/answers/answers-scores-{LIBRARY_NAME}-{model}.csv'
            
            # Check if file exists and read already collected QIDs
            collected_qids = set()
            file_mode = 'w'
            if os.path.exists(output):
                try:
                    existing_df = pd.read_csv(output)
                    if 'QID' in existing_df.columns:
                        collected_qids = set(existing_df['QID'].tolist())
                        file_mode = 'a'
                        print(f"Found {len(collected_qids)} already collected questions. Resuming...", flush=True)
                except Exception as e:
                    print(f"Could not read existing file: {e}. Starting fresh.", flush=True)
            
            # Write header if starting fresh
            if file_mode == 'w':
                with open(output, 'w') as f:
                    f.write('QID,pubmed_id,mean_distance_a,relevance_score,hallucination_index,vector_distances,vector_scores,bm25_scores,rerank_sentiments\n')

            for j, (question, answer, contexts_full, document_id) in enumerate(zip(question_list, answers_list, context_lists, document_ids)):
                question_idx = j + 1
                # Skip if already collected
                if question_idx in collected_qids:
                    print(f'Q{question_idx} - Already collected, skipping...', flush=True)
                    continue
                print('\n')
                print(f'MODEL: {model}; EMBEDDING: {shorthand};')
                print(f'Loading Question {j + 1}...', flush=True)

                if contexts_full == []:
                    with open(output, 'a') as f:
                        f.write(f"{question_idx},{document_id},n/a,n/a,n/a,n/a,n/a,n/a,n/a\n")
                        continue

                response = requests.post(save_answer_api, json={
                    'question_text': question,
                    'answer_text': answer,
                    'answer_no_context_text': 'n/a',
                    'model_type': model,
                    'dataset': LIBRARY_NAME,
                    'no_context': False,
                    'use_default_ars': True,
                    'answer_best_distance':27.328,
                    'answer_worst_distance':303.994,
                    'use_default_hi': True,
                    'a_hi':1,
                    'b_hi':0.33,
                    'c_hi':0.66,
                    'temperature':0.4,
                    'top_k':20,
                    'top_p':0.7
                },
                headers={'Authorization': f'Bearer {token}'})

                if response.status_code == 200:
                    mean_distance_a = response.json().get('mean_distance_a')
                    relevance_score = response.json().get('relevance_score')
                    hallucination_index = response.json().get('hallucination_index')
                    sources = response.json().get('sources')
                    vector_distances = [source['answer_vector_distance_raw'] for source in sources]
                    vector_scores = [source['answer_vector_score'] for source in sources]
                    bm25_scores = [source['answer_bm25_score'] for source in sources]
                    rerank_sentiments = [source['rerank_sentiment'] for source in sources]
                # Write to CSV after each request
                with open(output, 'a') as f:
                    f.write(f"{question_idx},{document_id},{mean_distance_a},{relevance_score},{hallucination_index},\"{vector_distances}\",\"{vector_scores}\",\"{bm25_scores}\",\"{rerank_sentiments}\"\n")
                    f.flush()

 
def calculate_context_answers_distance():
    input = f'../outputs/answers/answers-{MODELS[0].replace(":","-")}-{LIBRARY_NAME}.json'
    get_context_distances(input)
 
calculate_context_answers_distance()

end_time = time.time()

elapsed_time = (end_time - start_time)/60
print(f"\n\nExecution time: {elapsed_time} min\n\n")