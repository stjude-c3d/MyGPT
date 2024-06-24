import pandas as pd
import json

shorthands = ['qa-cos', 'mini-l6', 'snowflake']
models = ['gemma', 'llama2', 'llama3', 'llama3-70b', 'mistral', 'vicuna']

data = []

def reconstruct_answer_data(feature):
    for shorthand in shorthands:
        chunk = {
            'embed': None,
            'gemma': None,
            'llama2': None,
            'llama3': None,
            'llama3-70b': None,
            'mistral': None,
            'vicuna': None
        }
        for model in models:
            df = pd.read_csv(f'evaluation/scores/answer_scores/{model}/{model}-{shorthand}-answer-evaluation.csv')
            scores = df[feature].tolist()
            if chunk['embed'] == None:
                chunk['embed'] = [shorthand for _ in range(len(scores))]
            chunk[model] = scores
        for i, embed in enumerate(chunk['embed']):
            new_dict = {
                'embed': embed,
                'gemma': None,
                'llama2': None,
                'llama3': None,
                'llama3-70b': None,
                'mistral': None,
                'vicuna': None
            }
            if len(chunk['gemma']) > i: new_dict['gemma'] = chunk['gemma'][i]
            if len(chunk['llama2']) > i: new_dict['llama2'] = chunk['llama2'][i]
            if len(chunk['llama3']) > i: new_dict['llama3'] = chunk['llama3'][i]
            if len(chunk['llama3-70b']) > i: new_dict['llama3-70b'] = chunk['llama3-70b'][i]
            if len(chunk['mistral']) > i: new_dict['mistral'] = chunk['mistral'][i]
            if len(chunk['vicuna']) > i: new_dict['vicuna'] = chunk['vicuna'][i]
            data.append(new_dict)

    final_df = pd.DataFrame.from_records(data=data)
    final_df.to_csv(f'evaluation/documents/{feature}.csv')

def reconstruct_chunksize_data(feature):
    dataset = {
        'with_overlap': [],
        'chunksize_500': [],
        'chunksize_1000': [],
        'chunksize_1500': []
    }
    for overlap in [True, False]:
        add_overlap = True
        for chunksize in ['500', '1000', '1500']:
            if overlap:
                input_path = f'evaluation/scores/param_answer_scores/evaluation-{chunksize}-overlap.csv'
            else:
                input_path = f'evaluation/scores/param_answer_scores/evaluation-{chunksize}.csv'
            df = pd.read_csv(input_path)
            for x in df[feature].tolist():
                dataset[f'chunksize_{chunksize}'].append(x)
                if add_overlap:
                    dataset['with_overlap'].append(overlap)
            add_overlap = False
    final_df = pd.DataFrame.from_dict(dataset)
    final_df.to_csv(f'evaluation/documents/chunksize_{feature}.csv')



reconstruct_chunksize_data('answer_relevancy')
reconstruct_chunksize_data('answer_similarity')