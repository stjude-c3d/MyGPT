# Evaluations Folder Guide

This folder contains dataset-specific evaluation pipelines.

## 1) Environment Setup

1. Copy `env_example` to `.env` inside this folder.
2. Update `.env` values with your own credentials and service URLs.

From this folder:

```bash
cp env_example .env
```

Example `.env` values to update:

- `BACKEND_API_URL` (MyGPT backend URL)
- `OLLAMA_API_URL` (Ollama URL)
- `API_USERNAME` (your username)
- `API_PASSWORD` (your password)

Current template file: `evaluations/env_example`

## 2) Standard Dataset Folder Layout

Each evaluation dataset folder is expected to have:

- `inputs/`: source CSVs with questions used by scripts
- `outputs/`: generated artifacts (typically `answers/` and `contexts/`)
- `scripts/`: pipeline scripts

## 3) Standard Script Sequence

Run scripts in this order:

1. `collect_context.py`: Builds context JSON for the selected dataset.
2. `collect_answers.py`: Calls the LLM and stores answer JSON.
3. `save_answers.py`: Sends answers to scoring API and writes score CSV.
4. `format_answers.py`: Converts answer JSON into answer CSV.
5. `combine_answers.py`: Combines answer CSV, score CSV, and context data.

## 4) Dataset Subfolders And Expected Files

### BioASQ

- Folder: `evaluations/BioASQ`
- Expected input file(s):
  - `inputs/questions_final.csv`
- Expected output subfolders:
  - `outputs/contexts/`
  - `outputs/answers/`
- Scripts present:
  - `scripts/collect_context.py`
  - `scripts/collect_answers.py`
  - `scripts/save_answers.py`
  - `scripts/format_answers.py`
  - `scripts/combine_answers.py`

### Open-rag-bench

- Folder: `evaluations/Open-rag-bench`
- Expected input file(s):
  - `inputs/text_queries_170.csv`
- Expected output subfolders:
  - `outputs/contexts/`
  - `outputs/answers/`
- Scripts present:
  - `scripts/collect_context.py`
  - `scripts/collect_answers.py`
  - `scripts/save_answers.py`
  - `scripts/format_answers.py`
  - `scripts/combine_answers.py`

### PubMedQA

- Folder: `evaluations/PubMedQA`
- Expected input file(s):
  - `inputs/questions.csv`
- Expected output subfolders:
  - `outputs/contexts/`
  - `outputs/answers/`
- Scripts present:
  - `scripts/collect_context.py`
  - `scripts/collect_answers.py`
  - `scripts/save_answers.py`
  - `scripts/format_answers.py`
  - `scripts/combine_answers.py`

### QRS-QRS-cutoff

- Folder: `evaluations/QRS-QRS-cutoff`
- Expected input file(s):
  - `inputs/QRS_ARS_cutoff_dataset.csv`
- Expected output subfolders:
  - `outputs/contexts/`
  - `outputs/answers/`
- Standard scripts:
  - `scripts/collect_context.py`
  - `scripts/collect_answers.py`
  - `scripts/save_answers.py`
  - `scripts/format_answers.py`
  - `scripts/combine_answers.py`
- Additional scripts in this folder:
  - `scripts/copy_pubmedqa_pdfs.py`
  - `scripts/extract_rowwise_min_max.py`
  - `scripts/master_script.py`

## 5) Minimal Run Pattern

From a dataset's `scripts` folder:

```bash
python3 collect_context.py
python3 collect_answers.py
python3 save_answers.py
python3 format_answers.py
python3 combine_answers.py
```

If a folder provides an orchestrator (for example `QRS-QRS-cutoff/scripts/master_script.py`), you can use that instead.
