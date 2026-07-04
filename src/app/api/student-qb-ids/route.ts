import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const QUESTION_IDS_FILE = path.join(
  process.cwd(),
  "student-qb-scripts",
  "merged_question_ids.json",
);

export async function GET() {
  try {
    const fileContents = await readFile(QUESTION_IDS_FILE, "utf8");
    const ids = JSON.parse(fileContents);

    if (!Array.isArray(ids)) {
      return NextResponse.json([], { status: 500 });
    }

    return NextResponse.json(ids);
  } catch (error) {
    console.error("Failed to load StudentQB question IDs:", error);
    return NextResponse.json([], { status: 500 });
  }
}
