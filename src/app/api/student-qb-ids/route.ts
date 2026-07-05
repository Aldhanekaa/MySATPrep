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

    let ids: unknown;
    try {
      ids = JSON.parse(fileContents);
    } catch {
      console.error("Failed to parse StudentQB question IDs JSON");
      return NextResponse.json(
        { success: false, error: "Question IDs file contains invalid JSON" },
        { status: 500 },
      );
    }

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { success: false, error: "Question IDs file has unexpected format" },
        { status: 500 },
      );
    }

    return NextResponse.json(ids);
  } catch (error) {
    console.error("Failed to load StudentQB question IDs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load question IDs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
