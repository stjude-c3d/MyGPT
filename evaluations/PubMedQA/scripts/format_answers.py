import csv
import json

#############
# Variables #
#############

MODELS = [
     'gpt-oss:20b'
]

LIBRARY_NAME = 'PubMedQA-nomic-1000'

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


if __name__ == "__main__":
    main()
