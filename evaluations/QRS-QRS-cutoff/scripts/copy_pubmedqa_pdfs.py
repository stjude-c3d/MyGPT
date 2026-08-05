#!/usr/bin/env python3
import argparse
import csv
import os
import shutil
from pathlib import Path
from typing import List, Set


def read_document_ids(csv_path: Path, column_name: str) -> List[str]:
    with csv_path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise ValueError("Input CSV does not have a header row.")
        if column_name not in reader.fieldnames:
            raise KeyError(f"Column not found: {column_name}")

        ids: List[str] = []
        seen: Set[str] = set()
        for row in reader:
            value = (row.get(column_name) or "").strip()
            if not value or value in seen:
                continue
            seen.add(value)
            ids.append(value)

    return ids


def copy_matching_files(document_ids: List[str], source_dir: Path, destination_dir: Path) -> List[str]:
    destination_dir.mkdir(parents=True, exist_ok=True)
    resolved_source = source_dir.resolve()
    resolved_dest = destination_dir.resolve()
    missing_ids: List[str] = []

    for document_id in document_ids:
        source_file = (source_dir / f"{document_id}.pdf").resolve()
        destination_file = (destination_dir / source_file.name).resolve()

        # Guard against path traversal: ensure both paths stay within their directories
        if not str(source_file).startswith(str(resolved_source) + "/"):
            raise ValueError(f"Path traversal detected in document ID: {document_id!r}")
        if not str(destination_file).startswith(str(resolved_dest) + "/"):
            raise ValueError(f"Path traversal detected in destination for ID: {document_id!r}")

        if not source_file.exists():
            missing_ids.append(document_id)
            continue

        shutil.copy2(os.path.realpath(source_file), os.path.realpath(destination_file))

    return missing_ids


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Copy PubMedQA PDF files whose IDs appear in a CSV column."
    )
    parser.add_argument(
        "csv_path",
        type=Path,
        help="Path to the CSV containing the document IDs",
    )
    parser.add_argument(
        "source_dir",
        type=Path,
        help="Directory containing source PDF files named <id>.pdf",
    )
    parser.add_argument(
        "destination_dir",
        type=Path,
        help="Directory where matching PDF files should be copied",
    )
    parser.add_argument(
        "--column",
        default="pubmed_id",
        help="CSV column containing the document IDs (default: pubmed_id)",
    )
    args = parser.parse_args()

    document_ids = read_document_ids(args.csv_path, args.column)
    missing_ids = copy_matching_files(document_ids, args.source_dir, args.destination_dir)

    copied_count = len(document_ids) - len(missing_ids)
    print(f"Requested IDs: {len(document_ids)}")
    print(f"Copied files: {copied_count}")
    print(f"Missing files: {len(missing_ids)}")
    if missing_ids:
        print("Missing document IDs:")
        for document_id in missing_ids:
            print(document_id)


if __name__ == "__main__":
    main()
