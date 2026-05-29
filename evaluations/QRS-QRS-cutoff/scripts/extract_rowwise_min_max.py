#!/usr/bin/env python3
import argparse
import ast
import csv
from pathlib import Path
from typing import Dict, List, Optional, Tuple


TARGET_COLUMNS = [
    "vector_distances_a",
    "bm25_scores_a",
    "vector_distances_q",
    "bm25_scores_raw_q",
    "reranked_score_q",
]


def parse_numeric_list(cell_value: str) -> List[float]:
    if cell_value is None:
        return []

    text = cell_value.strip()
    if not text:
        return []

    try:
        parsed = ast.literal_eval(text)
    except (SyntaxError, ValueError) as exc:
        raise ValueError(f"Could not parse list value: {cell_value!r}") from exc

    if not isinstance(parsed, list):
        raise ValueError(f"Expected list value, got {type(parsed).__name__}")

    values: List[float] = []
    for item in parsed:
        if isinstance(item, (int, float)):
            values.append(float(item))
        elif isinstance(item, str):
            values.append(float(item))
        else:
            raise ValueError(f"Unsupported list item type: {type(item).__name__}")

    return values


def get_row_min_max(values: List[float]) -> Tuple[Optional[float], Optional[float]]:
    if not values:
        return None, None
    return min(values), max(values)


def process_file(input_csv: Path, output_csv: Path) -> None:
    with input_csv.open("r", newline="", encoding="utf-8") as in_handle:
        reader = csv.DictReader(in_handle)
        if reader.fieldnames is None:
            raise ValueError("Input CSV does not have a header row.")

        missing = [column for column in TARGET_COLUMNS if column not in reader.fieldnames]
        if missing:
            raise KeyError(f"Missing required columns: {', '.join(missing)}")

        extra_fields: List[str] = []
        for column in TARGET_COLUMNS:
            extra_fields.append(f"{column}_min")
            extra_fields.append(f"{column}_max")

        output_fields = list(reader.fieldnames) + extra_fields

        with output_csv.open("w", newline="", encoding="utf-8") as out_handle:
            writer = csv.DictWriter(out_handle, fieldnames=output_fields)
            writer.writeheader()

            for row in reader:
                for column in TARGET_COLUMNS:
                    values = parse_numeric_list(row.get(column, ""))
                    min_value, max_value = get_row_min_max(values)
                    row[f"{column}_min"] = "" if min_value is None else min_value
                    row[f"{column}_max"] = "" if max_value is None else max_value

                writer.writerow(row)


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Create a new CSV with row-wise min/max values for selected list-valued score columns."
        )
    )
    parser.add_argument(
        "--dataset",
        default="QRS-ARS-cutoff-bge",
        help="Dataset name (default: QRS-ARS-cutoff-bge)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Path to the output CSV file (default: <input_name>_row_min_max.csv)",
    )
    args = parser.parse_args()

    dataset = args.dataset
    input_csv = Path(f"../outputs/answers/answers-gpt-oss-20b-{dataset}-full.csv")
    output_csv = args.output or input_csv.with_name(f"{input_csv.stem}_row_min_max.csv")

    process_file(input_csv, output_csv)
    print(f"Created: {output_csv}")


if __name__ == "__main__":
    main()
