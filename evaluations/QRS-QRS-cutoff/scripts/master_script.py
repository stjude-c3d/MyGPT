#!/usr/bin/env python3
"""
Master script to orchestrate all 6 processing scripts in sequence.
Usage: python master_script.py --dataset <dataset_name>
"""

import argparse
import csv
import subprocess
import sys
from pathlib import Path
from typing import Dict, List


SCRIPTS = [
    "collect_context.py",
    "collect_answers.py",
    "save_answers.py",
    "format_answers.py",
    "combine_answers.py",
    "extract_rowwise_min_max.py",
]

MODEL_TAG = "gpt-oss-20b"
MIN_CSV_ROWS = 55


def expected_outputs(dataset: str) -> Dict[str, List[Path]]:
    base_dir = Path(__file__).parent.parent / "outputs"
    answers_dir = base_dir / "answers"
    contexts_dir = base_dir / "contexts"

    return {
        "collect_context.py": [
            contexts_dir / f"context_{dataset}.json",
        ],
        "collect_answers.py": [
            answers_dir / f"answers-{MODEL_TAG}-{dataset}.json",
        ],
        "save_answers.py": [
            answers_dir / f"answers-scores-{MODEL_TAG}-{dataset}.csv",
        ],
        "format_answers.py": [
            answers_dir / f"answers-{MODEL_TAG}-{dataset}.csv",
        ],
        "combine_answers.py": [
            answers_dir / f"answers-{MODEL_TAG}-{dataset}-full.csv",
            contexts_dir / f"context_{dataset}.json",
        ],
        "extract_rowwise_min_max.py": [
            answers_dir / f"answers-{MODEL_TAG}-{dataset}-full_row_min_max.csv",
        ],
    }


def csv_meets_min_rows(csv_path: Path, min_rows: int) -> bool:
    """Return True when CSV has at least min_rows data rows (header excluded)."""
    try:
        with csv_path.open("r", newline="", encoding="utf-8") as handle:
            reader = csv.reader(handle)
            # Skip header row.
            next(reader, None)
            row_count = sum(1 for _ in reader)
        return row_count >= min_rows
    except Exception:
        return False


def script_completed(script_name: str, dataset: str) -> bool:
    checks = expected_outputs(dataset).get(script_name, [])
    if not checks:
        return False

    for path in checks:
        if not path.exists():
            return False
        if path.suffix.lower() == ".csv" and not csv_meets_min_rows(path, MIN_CSV_ROWS):
            print(
                f"⚠️  Incomplete CSV checkpoint detected: {path} "
                f"(requires at least {MIN_CSV_ROWS} rows)"
            )
            return False

    return True


def run_script(script_name: str, dataset: str) -> bool:
    """
    Run a single script with the dataset parameter.
    
    Args:
        script_name: Name of the script to run
        dataset: Dataset name to pass to the script
    
    Returns:
        True if successful, False otherwise
    """
    script_path = Path(__file__).parent / script_name
    
    if not script_path.exists():
        print(f"❌ Error: Script not found: {script_path}")
        return False
    
    cmd = [sys.executable, str(script_path), "--dataset", dataset]
    
    print(f"\n{'='*60}")
    print(f"Running: {script_name} (dataset: {dataset})")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(cmd, check=True)
        print(f"✓ {script_name} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running {script_name}: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error running {script_name}: {e}")
        return False


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Master script to run all processing scripts in sequence. "
            "Takes only dataset as a variable."
        )
    )
    parser.add_argument(
        "--dataset",
        default="QRS-ARS-cutoff-bge",
        help="Dataset name to process (default: QRS-ARS-cutoff-bge)",
    )
    args = parser.parse_args()
    
    dataset = args.dataset
    print(f"\n🚀 Starting pipeline for dataset: {dataset}")
    
    failed_scripts = []
    skipped_scripts = []

    script_checks = expected_outputs(dataset)
    first_missing_index = 0
    for idx, script in enumerate(SCRIPTS):
        if script_completed(script, dataset):
            skipped_scripts.append(script)
            continue
        first_missing_index = idx
        break
    else:
        first_missing_index = len(SCRIPTS)

    if first_missing_index == len(SCRIPTS):
        print("\n✓ All outputs are already present. Nothing to run.")
        print(f"Final output: {script_checks['extract_rowwise_min_max.py'][0]}")
        sys.exit(0)

    if skipped_scripts:
        print("\nSkipping completed scripts:")
        for script in skipped_scripts:
            print(f"  - {script}")
    
    for script in SCRIPTS[first_missing_index:]:
        success = run_script(script, dataset)
        if not success:
            failed_scripts.append(script)
    
    print(f"\n{'='*60}")
    print("Pipeline Summary")
    print(f"{'='*60}")
    print(f"Dataset: {dataset}")
    print(f"Total scripts: {len(SCRIPTS)}")
    print(f"Skipped (already complete): {len(skipped_scripts)}")
    print(f"Completed: {len(SCRIPTS) - len(failed_scripts)}")
    print(f"Failed: {len(failed_scripts)}")
    
    if failed_scripts:
        print(f"\n❌ Failed scripts:")
        for script in failed_scripts:
            print(f"  - {script}")
        sys.exit(1)
    else:
        print(f"\n✓ All scripts completed successfully!")
        sys.exit(0)


if __name__ == "__main__":
    main()
