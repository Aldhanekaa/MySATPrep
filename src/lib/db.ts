import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

const sql = databaseUrl ? neon(databaseUrl) : null;

// Revalidation presets for route-level caching
const REVALIDATE_LONG = 3600; // 1 hour
const REVALIDATE_MEDIUM = 300; // 5 minutes

export const config = {
  databaseUrl,
  sql,
  REVALIDATE_LONG,
  REVALIDATE_MEDIUM,
};
