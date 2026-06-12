import os
import json
import time
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv('../.env')
start_time = time.time()

BACKEND_API_URL = os.environ.get('BACKEND_API_URL', '').strip().strip('"').rstrip('/')

#############
# Variables #
#############

LIBRARY_NAME = 'QRS-QRS-cutoff-qwen3'
model =  'gpt-oss:20b' #'gpt-oss:20b'

##############

# Define API endpoints
CONTEXT_API = f'{BACKEND_API_URL}/api/get_context/'
DATASET_API = f'{BACKEND_API_URL}/api/get_documents/'

# Load evaluation documents and questions
EVAL_DOC = pd.read_csv('../inputs/QRS_ARS_cutoff_dataset.csv', encoding='ISO-8859-1').dropna()
QUESTION_LIST = EVAL_DOC['question'].tolist()

# Get bearer token for backend API calls
def get_token():
    """Fetch the bearer token for API calls."""
    url = f'{BACKEND_API_URL}/token/'
    payload = {
        'username': os.environ.get('API_USERNAME'),
        'password': os.environ.get('API_PASSWORD')
    }
    #print("testing "*100)
    #print(payload)

    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json().get('access')
    print(f"Error: {response.status_code}")
    print(response.reason)
    return None

# Get token
TOKEN = get_token()
print(TOKEN)

def query_api(url, payload):
    """Query the API with the given payload and measure time taken."""
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {TOKEN}'
    }
    start_time = time.time()
    response = requests.post(url, headers=headers, json=payload)
    end_time = time.time()
    print(f"API call to {url} took {end_time - start_time:.2f} seconds.")
    if response.status_code == 200:
        return response.json()
    print(f"Error: {response.status_code}")
    print(response.reason)
    return None

def collect_contexts():
    """Collect contexts for each question and document."""
    for i, (question) in enumerate(zip(QUESTION_LIST)):
        proper_dataset = f'{LIBRARY_NAME}'
        context_payload = {
            "text": question[0],
            "translated_text": '',
            "model_type": model,
            "focused_document_titles": [],
            "maximum_chunks_count": 15,
            "no_cutoff": False,
            "use_default_qrs": True,
            "dataset": proper_dataset,
            "new_conversation": True,
            "related_query": False,
            "previous_query": "",
            "no_context": False,
            "question_best_distance": 0.2,
            "question_worst_distance": 1.7,
            "skip_highlight": True
        }

        context_raw = query_api(CONTEXT_API, context_payload)
        if context_raw:
            contexts = [source['context'] for source in context_raw.get('sources', [])]
            document_titles = [source['document'] for source in context_raw.get('sources', [])]
            pages = [source['page'] for source in context_raw.get('sources', [])]
            vector_distances = [source['vector_distance_raw'] for source in context_raw.get('sources', [])]
            vector_scores = [source['vector_score'] for source in context_raw.get('sources', [])]
            bm25_scores_raw = [source['bm25_score_raw'] for source in context_raw.get('sources', [])]
            bm25_scores = [source['bm25_score'] for source in context_raw.get('sources', [])]
            ranks = [source['rank'] for source in context_raw.get('sources', [])]
            reranked_score = [source['reranked_score'] for source in context_raw.get('sources', [])]
            relevance_score = context_raw.get('relevance_score', [])
            question_id = i + 1
        else:
            contexts = []
            document_titles = []
            pages = []
            vector_distances = []
            vector_scores = []
            bm25_scores_raw = []
            bm25_scores = []
            ranks = []
            reranked_score = []
            relevance_score = []
            question_id = i + 1

        full_contexts = [
            f'Page {page} - {document_title}:  {context}'
            for document_title, page, context in zip(document_titles, pages, contexts)
        ]

        qa_result = {
            'question': question,
            'relevance_score': relevance_score,
            'contexts': full_contexts,
            'pages': pages,
            'document_titles': document_titles,
            'vector_distances': vector_distances,
            'vector_scores': vector_scores,
            'bm25_scores_raw': bm25_scores_raw,
            'bm25_scores': bm25_scores,
            'ranks': ranks,
            'reranked_score': reranked_score,
            'dataset': proper_dataset,
            'question_id': question_id,
        }
        result_file_path = f'../outputs/contexts/context_{proper_dataset}.json'
        print(f'Writing to {result_file_path}...')

        # -----
        os.makedirs(os.path.dirname(result_file_path), exist_ok=True)
        # ---------------------

        if os.path.exists(result_file_path):
            with open(result_file_path, 'r+', encoding='utf-8') as result_file:
                result_data = json.load(result_file)
                result_data.append(qa_result)
                result_file.seek(0)
                json.dump(result_data, result_file, indent=4)
        else:
            with open(result_file_path, 'w', encoding='utf-8') as result_file:
                json.dump([qa_result], result_file, indent=4)
    print(f'Finished processing question {i+1} for document {i+1}')
            
end_time = time.time()

elapsed_time = (end_time - start_time)/60
print(f"\n\nExecution time: {elapsed_time} min\n\n")

if __name__ == "__main__":
    collect_contexts()
