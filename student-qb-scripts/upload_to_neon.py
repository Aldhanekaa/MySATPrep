#!/usr/bin/env python3
"""Upload JSON question data into a Neon (Postgres) database.

Usage:
  python upload_to_neon.py --file student-qb-all-questions.json --table questions

The script expects a `.env` file located in the same folder as this script containing
`DATABASE_URL` (or `NEON_DATABASE_URL`) with a valid Postgres connection string.
Each JSON object will be stored as a `JSONB` payload and the `questionId` field
will be used as the primary key.
"""
import argparse
import json
import os
from pathlib import Path
import logging

import psycopg2
import psycopg2.extras
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


def get_database_url():
    return os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")


def create_table_if_not_exists(conn, table_name: str):
    create_sql = sql.SQL(
        """
        CREATE TABLE IF NOT EXISTS {table} (
            questionid TEXT PRIMARY KEY,
            updatedate BIGINT,
            ppcc TEXT,
            skill_cd TEXT,
            score_band_range_cd INTEGER,
            uid TEXT,
            skill_desc TEXT,
            createdate BIGINT,
            program TEXT,
            primary_class_cd_desc TEXT,
            ibn TEXT,
            external_id TEXT UNIQUE,
            primary_class_cd TEXT,
            difficulty TEXT
        )
        """
    ).format(table=sql.Identifier(table_name))

    with conn.cursor() as cur:
        cur.execute(create_sql)

        # If the table already existed from an earlier version, add missing columns
        # and relax NOT NULL constraints on the optional fields.
        for column_name, column_type in [
            ("updatedate", "BIGINT"),
            ("ppcc", "TEXT"),
            ("skill_cd", "TEXT"),
            ("score_band_range_cd", "INTEGER"),
            ("uid", "TEXT"),
            ("skill_desc", "TEXT"),
            ("createdate", "BIGINT"),
            ("program", "TEXT"),
            ("primary_class_cd_desc", "TEXT"),
            ("ibn", "TEXT"),
            ("external_id", "TEXT"),
            ("primary_class_cd", "TEXT"),
            ("difficulty", "TEXT"),
        ]:
            cur.execute(
                sql.SQL("ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {column_type}").format(
                    table=sql.Identifier(table_name),
                    column=sql.Identifier(column_name),
                    column_type=sql.SQL(column_type),
                )
            )

        for column_name in [
            "updatedate",
            "ppcc",
            "skill_cd",
            "score_band_range_cd",
            "uid",
            "skill_desc",
            "createdate",
            "program",
            "primary_class_cd_desc",
            "ibn",
            "external_id",
            "primary_class_cd",
            "difficulty",
        ]:
            cur.execute(
                sql.SQL("ALTER TABLE {table} ALTER COLUMN {column} DROP NOT NULL").format(
                    table=sql.Identifier(table_name),
                    column=sql.Identifier(column_name),
                )
            )

        cur.execute(
            sql.SQL(
                "CREATE UNIQUE INDEX IF NOT EXISTS {index_name} ON {table} ({column})"
            ).format(
                index_name=sql.Identifier(f"{table_name}_external_id_unique"),
                table=sql.Identifier(table_name),
                column=sql.Identifier("external_id"),
            )
        )
    conn.commit()


def normalize_question_row(item):
    if not isinstance(item, dict):
        return None

    question_id = item.get("questionId")
    if not question_id:
        return None

    def as_int(key):
        value = item.get(key)
        if value is None or value == "":
            return None
        return int(value)

    def as_text(key):
        value = item.get(key)
        if value is None:
            return None
        return str(value)

    return (
        str(question_id),
        as_int("updateDate"),
        as_text("pPcc"),
        as_text("skill_cd"),
        as_int("score_band_range_cd"),
        as_text("uId"),
        as_text("skill_desc"),
        as_int("createDate"),
        as_text("program"),
        as_text("primary_class_cd_desc"),
        as_text("ibn"),
        as_text("external_id"),
        as_text("primary_class_cd"),
        as_text("difficulty"),
    )


def upsert_records(conn, table_name: str, records):
    column_names = [
        "questionid",
        "updatedate",
        "ppcc",
        "skill_cd",
        "score_band_range_cd",
        "uid",
        "skill_desc",
        "createdate",
        "program",
        "primary_class_cd_desc",
        "ibn",
        "external_id",
        "primary_class_cd",
        "difficulty",
    ]

    insert_sql = sql.SQL(
        """
        INSERT INTO {table} ({columns})
        VALUES %s
        ON CONFLICT (external_id) DO UPDATE SET
                    questionid = EXCLUDED.questionid,
                    updatedate = EXCLUDED.updatedate,
                    ppcc = EXCLUDED.ppcc,
          skill_cd = EXCLUDED.skill_cd,
          score_band_range_cd = EXCLUDED.score_band_range_cd,
                    uid = EXCLUDED.uid,
          skill_desc = EXCLUDED.skill_desc,
                    createdate = EXCLUDED.createdate,
          program = EXCLUDED.program,
          primary_class_cd_desc = EXCLUDED.primary_class_cd_desc,
          ibn = EXCLUDED.ibn,
          external_id = EXCLUDED.external_id,
          primary_class_cd = EXCLUDED.primary_class_cd,
          difficulty = EXCLUDED.difficulty
        """
    ).format(
        table=sql.Identifier(table_name),
        columns=sql.SQL(", ").join(sql.Identifier(column) for column in column_names),
    )

    with conn.cursor() as cur:
        psycopg2.extras.execute_values(cur, insert_sql.as_string(conn), records, template=None, page_size=100)
    conn.commit()


def main():
    parser = argparse.ArgumentParser(description="Upload JSON questions to Neon/Postgres")
    parser.add_argument("--file", "-f", default="student-qb-all-questions.json", help="Path to JSON file")
    parser.add_argument("--table", "-t", default="questions", help="Destination table name")
    parser.add_argument("--batch-size", "-b", type=int, default=500, help="Batch size for inserts")
    args = parser.parse_args()

    load_env_file()
    database_url = get_database_url()
    if not database_url:
        logging.error("DATABASE_URL (or NEON_DATABASE_URL) not set in .env or environment")
        return

    json_path = Path(args.file)
    if not json_path.exists():
        logging.error(f"JSON file not found: {json_path}")
        return

    with json_path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)

    # normalize to list of items
    # Expecting the input JSON to be an object with a `data` key containing an array
    # (e.g., { "data": [ PlainQuestionType, ... ] }). Fall back to other common shapes.
    if isinstance(data, dict):
        if "data" in data and isinstance(data["data"], list):
            items = data["data"]
        elif "questions" in data and isinstance(data["questions"], list):
            items = data["questions"]
        elif "items" in data and isinstance(data["items"], list):
            items = data["items"]
        else:
            # treat the dict as one item
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

    # sanitize table name: allow only letters, digits, and underscore
    table = args.table
    if not all(c.isalnum() or c == "_" for c in table):
        logging.error("Table name contains invalid characters; use only letters, digits, and underscore")
        return

    create_table_if_not_exists(conn, table)

    total = 0
    batch = []
    seen_external_ids = set()
    for idx, item in enumerate(items):
        row = normalize_question_row(item)
        if row is None:
            logging.debug(f"Skipping item {idx}: not a question object")
            continue

        external_id = row[11]
        if external_id and external_id in seen_external_ids:
            continue
        if external_id:
            seen_external_ids.add(external_id)

        batch.append(row)

        if len(batch) >= args.batch_size:
            upsert_records(conn, table, batch)
            total += len(batch)
            logging.info(f"Inserted/updated {total} records...")
            batch = []

    if batch:
        upsert_records(conn, table, batch)
        total += len(batch)

    logging.info(f"Finished uploading. Total records inserted/updated: {total}")
    conn.close()


if __name__ == "__main__":
    main()
