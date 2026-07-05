import { Pool as PgPool } from "pg";
import { pool } from "@/lib/auth";

const databaseUrl =
  process.env.POSTGRES_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL;

const pg = databaseUrl ? new PgPool({ connectionString: databaseUrl }) : null;

const sql = pg
  ? {
      query: async (text: string, params?: any[]) => {
        const res = await pg.query(text, params);
        return res.rows;
      },
    }
  : null;

// Revalidation presets for route-level caching
export const REVALIDATE_LONG = 3600; // 1 hour
export const REVALIDATE_MEDIUM = 300; // 5 minutes

export const config = {
  databaseUrl,
  sql,
  REVALIDATE_LONG,
  REVALIDATE_MEDIUM,
};

// Re-export Pool for use in API routes and db operations
// Validates: Requirements 1.3, 18.7
export { pool };
