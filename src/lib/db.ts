import { pool } from "@/lib/auth";

// Revalidation presets for route-level caching
export const REVALIDATE_LONG = 3600; // 1 hour
export const REVALIDATE_MEDIUM = 300; // 5 minutes

/**
 * sql wraps the shared `pool` from auth.ts so that student-qb routes
 * can keep their existing config.sql call pattern without creating a
 * third Pool instance.  Previously this module created its own PgPool
 * which burned extra connections toward Supabase's session-mode cap.
 */
const sql = {
  query: async (text: string, params?: unknown[]) => {
    const res = await pool.query(text, params);
    return res.rows;
  },
};

export const config = {
  sql,
  REVALIDATE_LONG,
  REVALIDATE_MEDIUM,
};

// Re-export pool for use in API routes and db operations
export { pool };
