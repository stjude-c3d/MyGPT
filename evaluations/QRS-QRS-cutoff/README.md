# QRS-QRS-cutoff Scripts

## Purpose 

MyGPT provides precalculated QRS-ARS cutoff for 5 embedding models.
You can find details at `/backend/data/cutoff_examples/embedding_models_cutoffs.csv`
But to calcualte QRS-ARS cutoff for new embedding mdodels, following the instructions.

This folder contains the end-to-end pipeline scripts used to generate context, collect answers, compute scores, and build final CSV outputs.

# uplad a library
First collect PDFs for this dataset, and create a MyGPT library with an embedding model for which you wnat to get QCbest, QCworst, ACbest and ACworst.

## Scripts

- `collect_context.py`: Builds context JSON for the selected dataset.
- `collect_answers.py`: Calls the LLM and stores answer JSON.
- `save_answers.py`: Sends answers to scoring API and writes score CSV.
- `format_answers.py`: Converts answer JSON into answer CSV.
- `combine_answers.py`: Combines answer CSV, score CSV, and context data.
- `extract_rowwise_min_max.py`: Adds row-wise min/max features for list-valued columns.
- `master_script.py`: Orchestrates all steps in order.

## Run

From this folder:

```bash
python3 master_script.py --dataset QRS-ARS-cutoff-bge
```

You can replace the dataset value, for example:

```bash
python3 master_script.py --dataset QRS-ARS-cutoff-nomic-moe
```

## Resume / Checkpoint Behavior

`master_script.py` supports resume behavior:

- Skips scripts whose expected output files already exist.
- For CSV checkpoints, requires at least 55 data rows (header not counted).
- If all final outputs are present and valid, it exits without rerunning steps.

## Expected Output Location

Outputs are written under:

- `../outputs/contexts/`
- `../outputs/answers/`

Typical final artifact:

- `../outputs/answers/answers-gpt-oss-20b-<dataset>-full_row_min_max.csv`

## Notes

- `save_answers.py` depends on the local API server (`http://localhost:8000`).
- If that service is unavailable, the pipeline will fail at scoring and can be resumed once the service is back.
