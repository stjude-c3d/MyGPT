'''this script combines answer data, scores, questions data, and ground truth into a single CSV file'''

import pandas as pd
import re
import json

library_name = 'PubMedQA-nomic-1000'

# Load first two CSV files (answers and scores)
df1 = pd.read_csv(f"../outputs/answers/answers-gpt-oss-20b-{library_name}.csv")
df2 = pd.read_csv(f"../outputs/answers/answers-scores-{library_name}-gpt-oss:20b.csv")
# Extract first word (yes, no, or maybe) from answer column
def extract_short_answer(answer):
    if pd.isna(answer):
        return None
    # Extract first word and convert to lowercase
    match = re.match(r'^\s*(\w+)', str(answer))
    if match:
        first_word = match.group(1).lower()
        if first_word in ['yes', 'no', 'maybe']:
            return first_word
    return None

df1['short_answer'] = df1['answer'].apply(extract_short_answer)

# Combine first two dataframes
combined = pd.concat([df1, df2], axis=1)

# Rename relevance_score to ARS in the combined dataframe
if 'relevance_score' in combined.columns:
    combined.rename(columns={'relevance_score': 'ARS'}, inplace=True)

# Load the contexts JSON file
with open(f'../outputs/contexts/context_{library_name}.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Extract only the specified columns from contexts
extracted_data = []
for item in data:
    extracted_data.append({
        'question_id': item.get('question_id'),
        'question': item.get('question'),
        'relevance_score': item.get('relevance_score'),
        'vector_distances': item.get('vector_distances'),
        'vector_scores': item.get('vector_scores'),
        'bm25_scores_raw': item.get('bm25_scores_raw'),
        'bm25_scores': item.get('bm25_scores'),
        'reranked_score': item.get('reranked_score'),
        'ranks': item.get('ranks')
    })

# Convert to DataFrame
df_contexts = pd.DataFrame(extracted_data)

# Merge with the combined dataframe on 'question_id' column
final_combined = pd.merge(combined, df_contexts, on='question_id', how='left', suffixes=('', '_question'))

# Rename relevance_score from contexts to QRS
if 'relevance_score' in final_combined.columns:
    final_combined.rename(columns={'relevance_score': 'QRS'}, inplace=True)

# Delete rows where mean_distance_a = 500.0 AND ARS = 500.0 AND hallucination_index = 100.0 (rows with no contexts)
if all(col in final_combined.columns for col in ['mean_distance_a', 'ARS', 'hallucination_index']):
    mask = (
        (final_combined['mean_distance_a'] == 500.0) & 
        (final_combined['ARS'] == 500.0) & 
        (final_combined['hallucination_index'] == 100.0)
    )
    deleted_count = mask.sum()
    final_combined = final_combined[~mask]
    print(f"Deleted {deleted_count} rows with mean_distance_a=500.0, ARS=500.0, hallucination_index=100.0")

# Load ground truth data from dataset_with_pdfs.csv
df_ground_truth = pd.read_csv("../inputs/dataset_with_pdfs.csv")
# Extract only question_id and final_decision columns
# Create question_id based on row number (1-indexed to match the data)
df_ground_truth['question_id'] = df_ground_truth.index + 1
df_ground_truth_subset = df_ground_truth[['question_id', 'final_decision']].rename(columns={'final_decision': 'ground_truth'})

# Merge ground_truth column with final_combined
final_combined = pd.merge(final_combined, df_ground_truth_subset, on='question_id', how='left')

# Add correctness column comparing short_answer with ground_truth
def check_correctness(row):
    if pd.isna(row['short_answer']) or pd.isna(row['ground_truth']):
        return None
    # Convert both to lowercase string for comparison
    short_ans = str(row['short_answer']).lower().strip()
    ground = str(row['ground_truth']).lower().strip()
    return 'correct' if short_ans == ground else 'incorrect'

final_combined['correctness'] = final_combined.apply(check_correctness, axis=1)

# read "outputs/answers/answers-gpt-oss-20b-{library_name}-no-context.json" to get no_context_answer column
with open(f'../outputs/answers/answers-gpt-oss-20b-{ library_name}-no-context.json', 'r', encoding='utf-8') as f:
    no_context_data = json.load(f)
    # check for correctness of no_context_answer
    no_context_answers = {}
    for item in no_context_data:
        question_id = item.get('question_number')
        answer = item.get('answer')
        no_context_answers[question_id] = answer

# save it to final_combined
final_combined['no_context_answer'] = final_combined['question_id'].map(no_context_answers)
final_combined['no_context_short_answer'] = final_combined['no_context_answer'].apply(extract_short_answer)
final_combined['no_context_correctness'] = final_combined.apply(
    lambda row: 'correct' if str(row['no_context_short_answer']).lower().strip() == str(row['ground_truth']).lower().strip() 
    else 'incorrect' if pd.notna(row['no_context_short_answer']) and pd.notna(row['ground_truth']) 
    else None, axis=1)

# Save final combined CSV
final_combined.to_csv(f"../outputs/answers/answers-gpt-oss-20b-{library_name}-full.csv", index=False)

print(f"Combined {len(final_combined)} records")
print(f"Output saved to: ../outputs/answers/answers-gpt-oss-20b-{library_name}-full.csv")