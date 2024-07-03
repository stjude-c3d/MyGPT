import pandas as pd

models = ['llama3', 'llama3-70b', 'mistral', 'vicuna']
embeds = ['qa-cos', 'mini-l6', 'snowflake']

for model in models:
    for shorthand in embeds:
        correctness_data = pd.read_csv(f'evaluation/scores/correctness_scores/{model}/{model}-{shorthand}-answer-correctness.csv')
        similarity_data = pd.read_csv(f'evaluation/scores/answer_scores/{model}/{model}-{shorthand}-answer-evaluation.csv')

        questions = similarity_data['question'].tolist()
        answers = similarity_data['answer'].tolist()
        contexts = similarity_data['contexts'].tolist()
        ground_truths = similarity_data['ground_truth'].tolist()

        answer_similarities = similarity_data['answer_similarity'].tolist()
        correctness = correctness_data['correctness'].tolist()

        answer_correctness = [0.75 * float(x) + 0.25 * float(y) if x != None and y != None else None for x, y in zip(correctness, answer_similarities)]

        data = [{"question": q, "answer": a, "contexts": c, "ground_truth": g, "answer_correctness": correctness}
                for q, a, c, g, correctness in zip(questions, answers, contexts, ground_truths, answer_correctness)]
        df = pd.DataFrame.from_records(data=data)
        df.to_csv(f'evaluation/scores/correctness_scores/{model}/{model}-{shorthand}-correctness.csv', index=False)


        
