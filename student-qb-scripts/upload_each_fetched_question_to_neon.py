#!/usr/bin/env python3
"""Fetch questions by external_id from a remote API and upload to Neon/Postgres.

For each entry in the provided JSON file, this script extracts an `external_id`,
fetches the full question data from the specified API endpoint, and upserts it into
a Postgres table using `external_id` as the PRIMARY KEY and storing the payload as JSONB.

Usage:
  python upload_each_fetched_question_to_neon.py --file student-qb-all-questions.json --table questions_by_external

The script expects a `.env` file in the same folder containing `DATABASE_URL` (or `NEON_DATABASE_URL`).
"""
import argparse
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import psycopg2
import psycopg2.extras
import requests
from psycopg2 import sql
from dotenv import load_dotenv


logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def load_env_file():
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        logging.info(f"Loaded .env from {env_path}")
    else:
        logging.info("No .env file found in script folder; falling back to environment variables")


def get_database_url() -> Optional[str]:
    return os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")


def create_table_if_not_exists(conn, table_name: str):
    create_sql = sql.SQL(
        """
        CREATE TABLE IF NOT EXISTS {table} (
            externalid TEXT PRIMARY KEY,
            answeroptions JSONB,
            correct_answer TEXT[],
            rationale TEXT,
            stem TEXT,
            type TEXT,
            stimulus TEXT,
            ibn TEXT
        )
        """
    ).format(table=sql.Identifier(table_name))

    with conn.cursor() as cur:
        cur.execute(create_sql)

        for column_name, column_type in [
            ("answeroptions", "JSONB"),
            ("correct_answer", "TEXT[]"),
            ("rationale", "TEXT"),
            ("stem", "TEXT"),
            ("type", "TEXT"),
            ("stimulus", "TEXT"),
            ("ibn", "TEXT"),
        ]:
            cur.execute(
                sql.SQL("ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {column_type}").format(
                    table=sql.Identifier(table_name),
                    column=sql.Identifier(column_name),
                    column_type=sql.SQL(column_type),
                )
            )
    conn.commit()


def extract_external_id(item: Any) -> Optional[str]:
    if isinstance(item, dict):
        for key in ("externalid", "external_id", "externalId", "externalID", "external-id"):
            if key in item and item[key]:
                return str(item[key])
    return None


def save_fetched_backup(backup_dir: str, external_id: str, fetched: Dict) -> None:
    """Save fetched question data as JSON backup."""
    try:
        Path(backup_dir).mkdir(parents=True, exist_ok=True)
        backup_file = Path(backup_dir) / f"{external_id}.json"
        with backup_file.open("w", encoding="utf-8") as f:
            json.dump(fetched, f, indent=2)
        logging.debug(f"Saved backup to {backup_file}")
    except Exception as e:
        logging.warning(f"Failed to save backup for {external_id}: {e}")


def fetch_question(api_base: str, external_id: str, timeout: int = 10) -> Optional[Dict]:
    url = api_base.rstrip("/") + "/" + external_id
    try:
        resp = requests.get(url, timeout=timeout)
        if resp.status_code == 200:
            return resp.json()
        else:
            logging.warning(f"Failed to fetch {external_id}: {resp.status_code}")
            return None
    except Exception as e:
        logging.warning(f"Error fetching {external_id}: {e}")
        return None


def normalize_answer_options(answer_options: Optional[Dict[str, str]]) -> Optional[Dict[str, str]]:
    if not isinstance(answer_options, dict):
        return None

    return answer_options


def normalize_fetched_question(fetched: Dict[str, Any]) -> Optional[tuple]:
    if not isinstance(fetched, dict):
        return None

    question_data = fetched.get("data")
    if not isinstance(question_data, dict):
        return None

    externalid = question_data.get("externalid")
    if not externalid:
        return None

    answer_options = normalize_answer_options(question_data.get("answerOptions"))
    correct_answer = question_data.get("correct_answer")
    if correct_answer is not None and not isinstance(correct_answer, list):
        correct_answer = [str(correct_answer)]

    return (
        str(externalid),
        None if answer_options is None else psycopg2.extras.Json(answer_options),
        correct_answer,
        None if question_data.get("rationale") is None else str(question_data.get("rationale")),
        None if question_data.get("stem") is None else str(question_data.get("stem")),
        None if question_data.get("type") is None else str(question_data.get("type")),
        None if question_data.get("stimulus") is None else str(question_data.get("stimulus")),
        None if question_data.get("ibn") is None else str(question_data.get("ibn")),
    )


def upsert_records(conn, table_name: str, records: List[tuple]):
    column_names = [
        "externalid",
        "answeroptions",
        "correct_answer",
        "rationale",
        "stem",
        "type",
        "stimulus",
        "ibn",
    ]

    insert_sql = sql.SQL(
        """
        INSERT INTO {table} ({columns})
        VALUES %s
        ON CONFLICT (externalid) DO UPDATE SET
            answeroptions = EXCLUDED.answeroptions,
            correct_answer = EXCLUDED.correct_answer,
            rationale = EXCLUDED.rationale,
            stem = EXCLUDED.stem,
            type = EXCLUDED.type,
            stimulus = EXCLUDED.stimulus,
            ibn = EXCLUDED.ibn
        """
    ).format(
        table=sql.Identifier(table_name),
        columns=sql.SQL(", ").join(sql.Identifier(column) for column in column_names),
    )

    with conn.cursor() as cur:
        psycopg2.extras.execute_values(cur, insert_sql.as_string(conn), records, template=None, page_size=100)
    conn.commit()


def main():
    parser = argparse.ArgumentParser(description="Fetch by external_id and upload to Neon/Postgres")
    parser.add_argument("--file", "-f", default="student-qb-all-questions.json", help="Path to input JSON file")
    parser.add_argument("--table", "-t", default="questions_by_external", help="Destination table name")
    parser.add_argument("--api-base", default="https://alpha.mysatprep.fun/api/student-qb/question", help="Base API URL (no trailing slash required)")
    parser.add_argument("--batch-size", "-b", type=int, default=200, help="Batch size for upserts")
    parser.add_argument("--start-from", type=int, default=1, help="Start processing from this iteration number (1-indexed)")
    parser.add_argument("--end-at", type=int, default=None, help="End processing at this iteration number (1-indexed, inclusive)")
    args = parser.parse_args()

    load_env_file()
    database_url = get_database_url()
    if not database_url:
        logging.error("DATABASE_URL (or NEON_DATABASE_URL) not set in .env or environment")
        return

    path = Path(args.file)
    if not path.exists():
        logging.error(f"Input JSON file not found: {path}")
        return

    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)

    # normalize to iterable list
    # Primary expected shape: { "data": [ PlainQuestionType, ... ] }
    if isinstance(data, dict):
        if "data" in data and isinstance(data["data"], list):
            items = data["data"]
        elif "questions" in data and isinstance(data["questions"], list):
            items = data["questions"]
        elif "items" in data and isinstance(data["items"], list):
            items = data["items"]
        else:
            items = [data]
    elif isinstance(data, list):
        items = data
    else:
        logging.error("Unsupported JSON root type; must be array or object")
        return

    try:
        conn = psycopg2.connect(database_url, sslmode="require")
    except Exception as e:
        logging.error(f"Unable to connect to database: {e}")
        return

    # sanitize table name
    table = args.table
    if not all(c.isalnum() or c == "_" for c in table):
        logging.error("Table name contains invalid characters; use only letters, digits, and underscore")
        return

    create_table_if_not_exists(conn, table)

    total = 0
    fetched_count = 0
    batch: List[tuple] = []
    seen_external_ids = set()
    total_items = len(items)

    start_from = max(1, args.start_from)
    end_at = args.end_at if args.end_at is not None else total_items
    end_at = min(end_at, total_items)
    
    if start_from > 1 or end_at < total_items:
        logging.info(f"Starting upload of questions {start_from} to {end_at} out of {total_items} total")
    else:
        logging.info(f"Starting upload of {total_items} source questions")

    for idx, item in enumerate(items):
        current_iteration = idx + 1
        
        if current_iteration < start_from:
            logging.debug(f"Skipping iteration {current_iteration}/{total_items} (before start-from={start_from})")
            continue
        
        if current_iteration > end_at:
            logging.debug(f"Skipping iteration {current_iteration}/{total_items} (after end-at={end_at})")
            continue
        
        remaining = end_at - current_iteration
        logging.info(f"Processing question {current_iteration}/{total_items} ({remaining} left in range)")

        external_id = extract_external_id(item)
        if not external_id:
            logging.info(f"Skipping question {current_iteration}/{total_items}: no external_id found")
            continue

        if external_id in seen_external_ids:
            logging.info(f"Skipping question {current_iteration}/{total_items}: duplicate external_id {external_id}")
            continue
        seen_external_ids.add(external_id)

        fetched = fetch_question(args.api_base, external_id)
        if fetched is None:
            logging.info(f"No data returned for question {current_iteration}/{total_items} external_id={external_id}")
            continue

        backup_dir = Path(args.file).parent / "backup_fetched_questions"
        save_fetched_backup(str(backup_dir), external_id, fetched)

        row = normalize_fetched_question(fetched)
        if row is None:
            logging.info(f"Skipping question {current_iteration}/{total_items}: response missing data.externalid")
            continue

        batch.append(row)
        fetched_count += 1
        logging.info(
            f"Queued {fetched_count} fetched questions for upload; batch size {len(batch)}/{args.batch_size}"
        )

        if len(batch) >= args.batch_size:
            upsert_records(conn, table, batch)
            total += len(batch)
            logging.info(
                f"Uploaded {total} records so far; {total_items - total} source questions still pending"
            )
            batch = []

    if batch:
        upsert_records(conn, table, batch)
        total += len(batch)
        logging.info(
            f"Uploaded final batch. Total uploaded records: {total}; 0 source questions left to process"
        )

    logging.info(f"Finished uploading. Total records inserted/updated: {total}")
    conn.close()


if __name__ == "__main__":
    main()
