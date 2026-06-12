import json
import requests
import time
import pandas as pd
import re
import os
from dotenv import load_dotenv

load_dotenv('../.env')

start_time = time.time()

BACKEND_API_URL = os.environ.get('BACKEND_API_URL', '').strip().strip('"').rstrip('/')
### variables ###

MODELS = [
     'gpt-oss:20b'
]

LIBRARY_NAME = 'PubMedQA-nomic-1000'

EMBEDDING_MODEL = 'nomic'
EMBED_SHORTHANDS = [EMBEDDING_MODEL]

COLLECTED = []

### APIs ###
# answer distance api
#answer_api = 'https://svlpmygptbknd01.stjude.org/api/get_distance_between_answers/'
answer_api = f'{BACKEND_API_URL}/api/get_distance_between_answers/'
#save_answer_api = 'https://svlpmygptbknd01.stjude.org/api/save_answer/'
save_answer_api = f'{BACKEND_API_URL}/api/save_answer/'
 
# Load evaluation documents and questions
# EVAL_DOC = pd.read_csv('../inputs_topic_2/eval_dataset_pubp_q_0_3.csv', encoding='ISO-8859-1').dropna()
# QUESTION_LIST = EVAL_DOC['question'].tolist()
 

def get_jwt_token():
    # get jwt token
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
dataset_questions_api = f'{BACKEND_API_URL}/api/get_conversation_history/?dataset='
question_detail_api = f'{BACKEND_API_URL}/api/get_question_details/?question_id='
 
def get_context_distances(input):
        with open(input, encoding='utf-8') as file:
            json_data = pd.DataFrame.from_dict(json.load(file))
            question_list = json_data['question'].tolist()
            context_lists = json_data['context'].tolist()
            answers_list = json_data['answer'].tolist()
        for model in MODELS:
            # if (model, shorthand) in COLLECTED:
            #     continue
            for shorthand in EMBED_SHORTHANDS:
                output = f'../outputs/answers/answers-scores-{LIBRARY_NAME}-{model}.csv'
            with open(output, 'w') as f:
                f.write('mean_distance_a,relevance_score,hallucination_index,vector_distances,vector_scores,bm25_scores,rerank_sentiments\n')
           
                for j, (question, answer, contexts_full) in enumerate(zip(question_list, answers_list, context_lists)):
                    # print(contexts_full)
                    # if j < 57:
                    #     continue
                    if contexts_full == []:
                        f.write(f"n/a,n/a,n/a,n/a,n/a,n/a,n/a\n")
                        continue
                    #  remove this kind of strings from the beginning of the context 'Page 4 - 38252844:  '
                    contexts_regex = r'Page \d+ - \d+:  '
                    # for index, context in enumerate(contexts_full):
                    #     if re.match(contexts_regex, context):
                    #         # remove the string from the context
                    #         context = re.sub(contexts_regex, '', context)
                    #         contexts.append(context)
                    # answer = answers_list[question_idx - 1]
                    print('\n')
                    print(f'MODEL: {model}; EMBEDDING: {shorthand};')
                    print(f'Loading Question {j + 1}...')

                    # save answer to database
                    response = requests.post(save_answer_api, json={
                        'question_text': question,
                        'answer_text': answer,
                        'answer_no_context_text': 'n/a',
                        'model_type': model,
                        # 'contexts': contexts,
                        'dataset': LIBRARY_NAME,
                        'no_context': False,
                        'use_default_ars': True,
                        'answer_best_distance':27.328,
                        'answer_worst_distance':303.994,
                        # 'answer_best_distance':0.126,
                        # 'answer_worst_distance':1.424,
                        # 'answer_best_distance':0.414,
                        # 'answer_worst_distance':1.01,
                        'use_default_hi': True,
                        'a_hi':1,
                        'b_hi':0.33,
                        'c_hi':0.66,
                        'temperature':0.4,
                        'top_k':20,
                        'top_p':0.7
                    },
                    headers={'Authorization': f'Bearer {token}'})
                    print(response.json())
                   
                    if response.status_code == 200:
                        # mean_distance_n = response.json().get('mean_distance_n')
                        # relevance_score_n = response.json().get('relevance_score')
                        mean_distance_a = response.json().get('mean_distance_a')
                        # mean_distance = response.json().get('mean_distance')
                        relevance_score = response.json().get('relevance_score')
                        hallucination_index = response.json().get('hallucination_index')
                        sources = response.json().get('sources')
                        vector_distances = [source['answer_vector_distance_raw'] for source in sources]
                        vector_scores = [source['answer_vector_score'] for source in sources]
                        bm25_scores = [source['answer_bm25_score'] for source in sources]
                        rerank_sentiments = [source['rerank_sentiment'] for source in sources]
                        # vector_distances = response.json().get('vector_distances')
                        # vector_scores = response.json().get('vector_scores')
                        # bm25_scores = response.json().get('bm25_scores')
                        # rerank_sentiments = response.json().get('rerank_sentiments')
                        # bm25_rerank_scores = response.json().get('bm25_rerank_scores')
                    
                    f.write(f"{mean_distance_a},{relevance_score},{hallucination_index},\"{vector_distances}\",\"{vector_scores}\",\"{bm25_scores}\",\"{rerank_sentiments}\"\n")
 
def calculate_context_answers_distance():
    input = f'../outputs/answers/answers-{MODELS[0].replace(":","-")}-{LIBRARY_NAME}.json'
    get_context_distances(input)
 
calculate_context_answers_distance()

end_time = time.time()

elapsed_time = (end_time - start_time)/60
print(f"\n\nExecution time: {elapsed_time} min\n\n")