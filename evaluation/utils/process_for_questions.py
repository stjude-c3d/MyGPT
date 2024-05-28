import pandas as pd

names = ['kata', 'preethi']
full_questions = []
full_groundtruths = []
datasets = []

for name in names:
    df = pd.read_csv(f'excel_docs/{name}.csv',encoding='cp1252')
    questions = [' '.join(x.split()) for x in df['question'].tolist()]
    corrections = df['ground_truth'].tolist()
    refs = df['ref'].tolist()
    
    gemini = df['gemini'].tolist()
    llama2 = df['llama2'].tolist()
    chatgpt = df['chat_gpt'].tolist()
    mygpt = df['my_gpt'].tolist()

    model_answers = {'gemini': gemini, 'llama2': llama2, 'chat_gpt': chatgpt, 'my_gpt': mygpt}

    ground_truths = []
    for i, ref in enumerate(refs):
        if ref == 'none':
            ground_truths.append(corrections[i])
        else:
            ground_truths.append(f'Best Answer: {model_answers[ref][i]}; Corrections: {corrections[i]}')
        datasets.append(f'Kinases-{name.upper()}')

    ground_truths = [' '.join(x.split()) for x in ground_truths]

    full_questions += questions
    full_groundtruths += ground_truths
new_df = pd.DataFrame(data = {'question': full_questions, 'ground_truths': full_groundtruths, 'dataset': datasets})

contexts = []

new_df.to_csv('questions-groundtruths.csv', index=False)
