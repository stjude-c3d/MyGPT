import pandas as pd
import json
import re
import os
import argparse
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
OUTPUTS_DIR = (SCRIPTS_DIR / '../outputs').resolve()


def safe_path(base_dir: Path, *parts: str) -> Path:
    """Resolve a path and ensure it stays within base_dir."""
    resolved = (base_dir / Path(*parts)).resolve()
    if not str(resolved).startswith(str(base_dir) + os.sep):
        raise ValueError(f"Path traversal detected: {resolved}")
    return resolved


def get_dataset_name():
    parser = argparse.ArgumentParser(description='Combine answers with context')
    parser.add_argument('--dataset', default='QRS-ARS-cutoff-bge', help='Dataset name')
    args = parser.parse_args()
    dataset = args.dataset
    if not re.match(r'^[a-zA-Z0-9_\-]+$', dataset):
        raise ValueError(f"Invalid dataset name: {dataset!r}. Only alphanumeric characters, hyphens, and underscores are allowed.")
    return os.path.basename(dataset)

def combine_context_with_answers(
	answers_csv,
	scores_csv,
	contexts_json,
	output_csv
):
	"""
	Combines answer, score, context, and ground truth files, and adds a correctness column from label studio JSON.
	"""
	# Load answer and score CSVs
	df1 = pd.read_csv(answers_csv)
	df2 = pd.read_csv(scores_csv)
	combined = pd.concat([df1, df2], axis=1)

	# Rename relevance_score to ARS if present
	if 'relevance_score' in combined.columns:
		combined.rename(columns={'relevance_score': 'ARS'}, inplace=True)

	# Load contexts JSON
	with open(os.path.realpath(contexts_json), 'r', encoding='utf-8') as f:
		data = json.load(f)
	extracted_data = []
	for item in data:
		extracted_data.append({
			'question_id': item.get('question_id'),
			'question': item.get('question'),
			'relevance_score_q': item.get('relevance_score'),
			'vector_distances_q': item.get('vector_distances'),
			'vector_scores_q': item.get('vector_scores'),
			'bm25_scores_raw_q': item.get('bm25_scores_raw'),
			'bm25_scores_q': item.get('bm25_scores'),
			'reranked_score_q': item.get('reranked_score'),
			'ranks_q': item.get('ranks')
		})
	df_contexts = pd.DataFrame(extracted_data)
	
	# Reset index to ensure both DataFrames have matching indices
	combined.reset_index(drop=True, inplace=True)
	df_contexts.reset_index(drop=True, inplace=True)
	
	# Handle duplicate columns before concatenating
	duplicate_cols = set(combined.columns) & set(df_contexts.columns)
	if duplicate_cols:
		# Rename duplicate columns in df_contexts
		rename_dict = {col: f"{col}_q" for col in duplicate_cols}
		df_contexts = df_contexts.rename(columns=rename_dict)
	
	# Merge using index by concatenating along axis=1
	final_combined = pd.concat([combined, df_contexts], axis=1)
	
	if 'relevance_score' in final_combined.columns:
		final_combined.rename(columns={'relevance_score': 'QRS'}, inplace=True)

	# Remove rows with no contexts
	if all(col in final_combined.columns for col in ['mean_distance_a', 'ARS', 'hallucination_index']):
		mask = (
			(final_combined['mean_distance_a'] == 500.0) &
			(final_combined['ARS'] == 500.0) &
			(final_combined['hallucination_index'] == 100.0)
		)
		final_combined = final_combined[~mask]

	final_combined.to_csv(os.path.realpath(output_csv), index=False)
	print(f"Saved combined CSV to: {output_csv}")

if __name__ == "__main__":
	library_name = get_dataset_name()
	answers_csv = safe_path(OUTPUTS_DIR, 'answers', f'answers-gpt-oss-20b-{library_name}.csv')
	scores_csv = safe_path(OUTPUTS_DIR, 'answers', f'answers-scores-gpt-oss-20b-{library_name}.csv')
	contexts_json = safe_path(OUTPUTS_DIR, 'contexts', f'context_{library_name}.json')
	label_studio_json = safe_path(OUTPUTS_DIR, 'answers', f'label_studio_data_{library_name}.json')
	output_csv = safe_path(OUTPUTS_DIR, 'answers', f'answers-gpt-oss-20b-{library_name}-full.csv')

	combine_context_with_answers(
		answers_csv,
		scores_csv,
		contexts_json,
		output_csv
	)