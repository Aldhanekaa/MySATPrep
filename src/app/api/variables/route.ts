import { NextResponse } from "next/server";
import { env } from "@/lib/config/env";

/**
 * GET /api/variables
 * Returns the list of required environment variable keys and their presence status.
 * Values are intentionally masked for security — only key names and a boolean are exposed.
 */
export async function GET() {
  const variables = Object.entries(env).map(([key, value]) => ({
    key,
    present: Boolean(value),
    // Uncomment to expose actual values — only do this in trusted/internal environments
    // value,
  }));

  return NextResponse.json({ variables });
}
