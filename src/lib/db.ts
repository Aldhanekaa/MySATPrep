import { neon } from "@neondatabase/serverless";

export const databaseUrl =
  process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

export const sql = databaseUrl ? neon(databaseUrl) : null;

// Revalidation presets for route-level caching
export const REVALIDATE_LONG = 3600; // 1 hour
export const REVALIDATE_MEDIUM = 300; // 5 minutes
