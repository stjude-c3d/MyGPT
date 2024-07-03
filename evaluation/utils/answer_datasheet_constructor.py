import pandas as pd
import json

def reconstruct_speed_data(models):
    data = []
    for model in models:
        df = pd.read_json(f'evaluation/answer_speeds/local/{model}-speeds.json')
        speeds = df['speed'].tolist()
        indices = df['index'].tolist()
        print(len(speeds))
        for i in range(len(speeds)):
            item = {'model': model, 'speed': speeds[i], 'index': indices[i]}
            data.append(item)
    final_df = pd.DataFrame.from_records(data=data)
    final_df.to_csv(f'evaluation/documents/local_speeds.csv')
        


def reconstruct_answer_data(feature, shorthands, models, folder, suffix, num_q):
    data = []
    for model in models:
        new_data = []
        for i in range(num_q):
            item = {'model': model, 'qa-cos': None, 'mini-l6': None, 'snowflake': None}
            for shorthand in shorthands:
                df = pd.read_csv(f'evaluation/scores/{folder}/{model}/{model}-{shorthand}-{suffix}.csv')
                item[shorthand] = df[feature].tolist()[i]
            new_data.append(item)
        data += new_data

    final_df = pd.DataFrame.from_records(data=data)
    final_df.to_csv(f'evaluation/documents/{feature}.csv')

def reconstruct_chunksize_data(feature, prefix, folder):
    dataset = {
        'with_overlap': [],
        '500 Characters': [],
        '1000 Characters': [],
        '1500 Characters': []
    }
    for overlap in [True, False]:
        add_overlap = True
        for chunksize in ['500', '1000', '1500']:
            if overlap:
                input_path = f'evaluation/scores/parameter_scores/{folder}/{prefix}-{chunksize}-overlap.csv'
            else:
                input_path = f'evaluation/scores/parameter_scores/{folder}/{prefix}-{chunksize}.csv'
            df = pd.read_csv(input_path)
            for x in df[feature].tolist():
                dataset[f'{chunksize} Characters'].append(x)
                if add_overlap:
                    if overlap:
                        dataset['with_overlap'].append("Overlap")
                    else:
                        dataset['with_overlap'].append("No Overlap")
            add_overlap = False
    final_df = pd.DataFrame.from_dict(dataset)
    final_df.to_csv(f'evaluation/documents/chunksize_{feature}.csv')


shorthands = ['qa-cos', 'mini-l6', 'snowflake']
models = ['gemma', 'llama2', 'llama3', 'llama3-70b', 'mistral', 'vicuna']
reconstruct_chunksize_data('answer_correctness', 'correctness', 'answer_correctness')