#!/usr/bin/env python3
"""Merge question records from the student QB JSON files.

By default this reads:
  - student-qb-all-questions.json
  - student-qb-nmsqt.json
  - student-qb-psat.json

It deduplicates question IDs and writes a JSON array containing only those IDs.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


DEFAULT_INPUT_FILES = [
	"student-qb-all-questions.json",
	"student-qb-nmsqt.json",
	"student-qb-psat.json",
]
DEFAULT_OUTPUT_FILE = "merged_question_ids.json"


def load_items(json_path: Path) -> list[dict[str, Any]]:
	with json_path.open("r", encoding="utf-8") as handle:
		payload = json.load(handle)

	if isinstance(payload, dict):
		for key in ("data", "questions", "items"):
			value = payload.get(key)
			if isinstance(value, list):
				return [item for item in value if isinstance(item, dict)]
		return [payload] if isinstance(payload, dict) else []

	if isinstance(payload, list):
		return [item for item in payload if isinstance(item, dict)]

	raise ValueError(f"Unsupported JSON structure in {json_path}")


def merge_question_ids(input_files: list[Path]) -> list[str]:
	merged_ids: set[str] = set()
	source_order: list[str] = []

	for json_path in input_files:
		for item in load_items(json_path):
			question_id = item.get("questionId")
			if not question_id:
				continue

			question_id = str(question_id)
			if question_id not in merged_ids:
				source_order.append(question_id)
				merged_ids.add(question_id)

	return source_order


def main() -> int:
	parser = argparse.ArgumentParser(description="Merge questionId data from student QB JSON files")
	parser.add_argument(
		"--input",
		"-i",
		nargs="*",
		default=DEFAULT_INPUT_FILES,
		help="Input JSON files to merge",
	)
	parser.add_argument(
		"--output",
		"-o",
		default=DEFAULT_OUTPUT_FILE,
		help="Output JSON file path",
	)
	args = parser.parse_args()

	script_dir = Path(__file__).resolve().parent
	input_paths = [Path(item) if Path(item).is_absolute() else script_dir / item for item in args.input]
	output_path = Path(args.output) if Path(args.output).is_absolute() else script_dir / args.output

	missing_files = [str(path) for path in input_paths if not path.exists()]
	if missing_files:
		raise FileNotFoundError(f"Missing input file(s): {', '.join(missing_files)}")

	merged_ids = merge_question_ids(input_paths)

	with output_path.open("w", encoding="utf-8") as handle:
		json.dump(merged_ids, handle, indent=2, ensure_ascii=False)
		handle.write("\n")

	print(f"Wrote {len(merged_ids)} question IDs to {output_path}")
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
