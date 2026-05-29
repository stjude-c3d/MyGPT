import csv
import json
import sys

csv.field_size_limit(sys.maxsize)

#############
# Variables #
#############

MODELS = [
     'gpt-oss:20b'
]

LIBRARY_NAME = 'open-rag-bench-4'

def collect_answers(json_file_path, csv_file_path):
    """
    Read a JSON file and collect answers into a CSV file.

    Args:
        json_file_path (str): Path to the input JSON file.
        csv_file_path (str): Path to the output CSV file.
    """
    # Read the JSON file
    with open(f'../outputs/answers/{json_file_path}', 'r', encoding='utf-8') as json_file:
        data = json.load(json_file)

    # Extract questions and answers from the JSON list
    answers = []
    pubmed_ids = []
    question_ids = []
    for qa in data:
        formatted_answer = qa['answer'].split(':\n\n[')
        pubmed_ids.append(qa['document'])
        question_ids.append(qa['question_number'])
        if len(formatted_answer) > 1:
            answer = formatted_answer[1].split(']')[0].replace('\n', ' ')
            answers.append(answer.replace("'", "").replace('"', ''))
        else:
            answers.append(qa['answer'].replace('\n', ' '))

    # Write the answers to a CSV file
    with open(f'../outputs/answers/{csv_file_path}', 'w', newline='', encoding='utf-8') as csv_file:
        writer = csv.writer(csv_file)

        # Write answers with sub-index and blank rows after every 34th question
        writer.writerow(['#', 'question_id', 'pubmed_id',  'answer'])
        # sub_index = 1
        for i, (question_id, pubmed_id, answer) in enumerate(zip(question_ids, pubmed_ids, answers)):
            writer.writerow([i, question_id, pubmed_id, answer])
        #     sub_index += 1
        #     if (i + 1) % 34 == 0:
        #         writer.writerow([])
        #         sub_index = 1

        # # Write answers with continuous numbering
        # writer.writerow(['#', 'answer'])
        # for i, answer in enumerate(answers):
        #     writer.writerow([i + 1, answer])

    print(f'Answer values have been written to {csv_file_path}')

# add question_body and exact_answer from bioasq_13b_final_3964.csv
def update_with_questions(csv_file_path, questions_csv_path):
    # update the csv file in the same order, it has same number of rows as questions_csv_path
    with open(csv_file_path, 'r', encoding='utf-8') as csv_file:
        reader = csv.reader(csv_file)
        rows = list(reader)
    with open(questions_csv_path, 'r', encoding='utf-8') as questions_file:
        questions_reader = csv.reader(questions_file)
        questions_header = next(questions_reader)
        question_body_idx = questions_header.index('query')
        exact_answer_idx = questions_header.index('answer')
        questions_data = list(questions_reader)

    # Add new headers
    rows[0].extend(['question', 'ground_truth'])
    for i in range(1, len(rows)):
        question_body = questions_data[i - 1][question_body_idx]
        exact_answer = questions_data[i - 1][exact_answer_idx]
        rows[i].extend([question_body, exact_answer])

    # Write back to the same CSV file
    with open(csv_file_path, 'w', newline='', encoding='utf-8') as csv_file:
        writer = csv.writer(csv_file)
        writer.writerows(rows)

def main():
    """
    Main function to process answers for each model.
    """
    for model in MODELS:
        model_name = model.removesuffix(":latest").replace(":", "-")
        collect_answers(
            f'answers-{model_name}-{LIBRARY_NAME}.json',
            f'answers-{model_name}-{LIBRARY_NAME}.csv'
        )
        update_with_questions(
            f'../outputs/answers/answers-{model_name}-{LIBRARY_NAME}.csv',
            '../inputs/text_queries_170.csv'
        )


if __name__ == "__main__":
    main()
