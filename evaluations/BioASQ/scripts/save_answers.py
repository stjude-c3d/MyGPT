import json
import requests
import time
import pandas as pd
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env')

start_time = time.time()

BACKEND_API_URL = os.environ.get('BACKEND_API_URL', '').strip().strip('"').rstrip('/')

# --- CONFIGURATION ---

LIBRARY_NAME = 'Bioasq'
EMBEDDING_MODEL = 'nomic'
MODELS = [
    'gpt-oss:20b'
]

EMBED_SHORTHANDS = [EMBEDDING_MODEL]

# --- API ENDPOINTS ---
BASE_URL = BACKEND_API_URL
SAVE_ANSWER_API = f'{BASE_URL}/api/save_answer/'
TOKEN_API = f'{BASE_URL}/token/'

def get_jwt_token():
    # get jwt token
    response = requests.post(TOKEN_API, json={
        'username': os.environ.get('API_USERNAME'),
        'password': os.environ.get('API_PASSWORD')
    })
    if response.status_code == 200:
        token = response.json().get('access')
    else:
        token = ''
    return token

def process_evaluation():
    token = get_jwt_token()
    if not token:
        return

    # Loop through models
    for model in MODELS:
        # Sanitize model name for filenames (replace : with -)
        sanitized_model = model.replace(':', '-')
        
        # Define File Paths
        input_json_path = f'../outputs/answers/answers-{sanitized_model}-{LIBRARY_NAME}.json'
        output_csv_path = f'../outputs/answers/answers-scores-{LIBRARY_NAME}-{sanitized_model}.csv'
        
        print(f"\nProcessing Model: {model}")
        print(f"Reading Input: {input_json_path}")
        print(f"Writing Output: {output_csv_path}")

        # Check if input file exists
        if not os.path.exists(input_json_path):
            print(f"❌ Error: Input file not found: {input_json_path}")
            continue

        # Load Data
        with open(input_json_path, encoding='utf-8') as file:
            raw_data = json.load(file)
            json_data = pd.DataFrame(raw_data)
            
            # Extract standard lists
            question_list = json_data['question'].tolist()
            answers_list = json_data['answer'].tolist()
            
            # Handle 'contexts' vs 'context'
            if 'contexts' in json_data.columns:
                context_lists = json_data['contexts'].tolist()
            elif 'context' in json_data.columns:
                context_lists = json_data['context'].tolist()
            else:
                context_lists = [[] for _ in range(len(question_list))]

            # --- NEW LOGIC: EXTRACT QUESTION ID ---
            # We try to find a valid ID column. If none, we use the row number.
            if 'question_id' in json_data.columns:
                id_list = json_data['question_id'].tolist()
            elif 'pubmed_id' in json_data.columns:
                id_list = json_data['pubmed_id'].tolist()
            elif 'question_number' in json_data.columns:
                id_list = json_data['question_number'].tolist()
            elif 'document' in json_data.columns: # Sometimes used as ID in previous steps
                id_list = json_data['document'].tolist()
            else:
                # Fallback: Just use 1, 2, 3...
                id_list = [i + 1 for i in range(len(question_list))]

        # Open CSV for writing
        with open(output_csv_path, 'w', buffering=1) as f:
            # --- MODIFIED HEADER: Added question_id ---
            f.write('question_id,mean_distance_a,relevance_score,hallucination_index,vector_distances,vector_scores,bm25_scores,rerank_sentiments\n')
            
            success_count = 0
            fail_count = 0

            # Iterate through questions
            # Added q_id to the loop
            for j, (question, answer, contexts, q_id) in enumerate(zip(question_list, answers_list, context_lists, id_list)):
                
                print(f"Processing Q{j + 1}/{len(question_list)} (ID: {q_id})...", end="\r")

                if contexts == []:
                    f.write(f"n/a,n/a,n/a,n/a,n/a,n/a,n/a\n")
                    continue

                # Prepare Payload
                payload = {
                    'question_text': question,
                    'answer_text': answer,
                    'answer_no_context_text': 'n/a',
                    # NOTE: I switched this back to the loop variable 'model'
                    # If you explicitly want 'gemma3:latest', change this back to 'gemma3:latest'
                    'model_type': model, 
                    'dataset': LIBRARY_NAME,
                    'no_context': False,
                    'use_default_ars': True,
                    'answer_best_distance': 27.328,
                    'answer_worst_distance': 303.994,
                    'use_default_hi': True,
                    'a_hi': 1,
                    'b_hi': 0.33,
                    'c_hi': 0.66,
                    'temperature': 0.4,
                    'top_k': 20,
                    'top_p': 0.7
                }

                try:
                    # Send Request
                    response = requests.post(
                        SAVE_ANSWER_API, 
                        json=payload,
                        headers={'Authorization': f'Bearer {token}'}
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        m_dist = data.get('mean_distance_a', '')
                        rel_score = data.get('relevance_score', '')
                        hal_idx = data.get('hallucination_index', '')
                        sources = response.json().get('sources')
                        vector_distances = [source['answer_vector_distance_raw'] for source in sources]
                        vector_scores = [source['answer_vector_score'] for source in sources]
                        bm25_scores = [source['answer_bm25_score'] for source in sources]
                        rerank_sentiments = [source['rerank_sentiment'] for source in sources]
                        
                        # --- MODIFIED WRITE: Added q_id ---
                        f.write(f"{q_id},{m_dist},{rel_score},{hal_idx},\"{vector_distances}\",\"{vector_scores}\",\"{bm25_scores}\",\"{rerank_sentiments}\"\n")
                        f.flush() 
                        success_count += 1
                        
                    elif response.status_code == 500:
                        # Now printing the ID so you can check which specific questions failed
                        print(f"\n⚠️ Q{j+1} (ID: {q_id}): Server Error (500). Likely duplicate or missing in DB.")
                        fail_count += 1
                        
                    else:
                        print(f"\n❌ Q{j+1} (ID: {q_id}): API Error {response.status_code}: {response.text[:100]}")
                        fail_count += 1

                except Exception as e:
                    print(f"\n❌ Q{j+1} (ID: {q_id}): Connection Error: {e}")
                    fail_count += 1

            print(f"\n\nDone. Success: {success_count}, Failed/Skipped: {fail_count}")

if __name__ == "__main__":
    process_evaluation()
    
    end_time = time.time()
    elapsed_time = (end_time - start_time) / 60
    print(f"Total Execution time: {elapsed_time:.2f} min")