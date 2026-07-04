import postgres from "postgres";

import { createAuth } from "@/lib/auth";

console.log("process.env.HYPERDRIVE", process.env.HYPERDRIVE)
const databaseUrl = process.env.HYPERDRIVE || process.env.NEON_DATABASE_URL;

const sql = databaseUrl ? postgres(databaseUrl) : null;

// Revalidation presets for route-level caching
export const REVALIDATE_LONG = 3600; // 1 hour
export const REVALIDATE_MEDIUM = 300; // 5 minutes

export const config = {
  databaseUrl,
  sql,
  REVALIDATE_LONG,
  REVALIDATE_MEDIUM,
};

/**
 * Returns a per-request Pool instance for use in API routes and db operations.
 * Must be called inside a request handler — never at module scope.
 */
export function getPool() {
  return createAuth().pool;
}
