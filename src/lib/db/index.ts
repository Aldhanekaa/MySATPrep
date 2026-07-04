/**
 * Drizzle ORM database client
 *
 * Uses drizzle-orm/postgres-js — standard PostgreSQL, works with any provider
 * (Neon, Supabase, self-hosted Postgres, etc.).
 *
 * On Cloudflare Workers, postgres-js requires a Hyperdrive binding to proxy
 * TCP connections. Pass the Hyperdrive .connectionString as DATABASE_URL at
 * runtime and it works transparently.
 *
 * The `sql` tagged-template export is a thin postgres-js wrapper kept for
 * compatibility with the question-bank routes that build parameterised query
 * strings manually.
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { appSchema } from "./schema";

// ---------------------------------------------------------------------------
// Connection string
// ---------------------------------------------------------------------------
const databaseUrl =
  process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "";

// ---------------------------------------------------------------------------
// Drizzle client — primary interface for all database operations
// ---------------------------------------------------------------------------
const pgClient = postgres(databaseUrl, {
  max: 10,
  prepare: false, // PgBouncer transaction-mode compatibility
});

export const db = drizzle(pgClient, { schema: appSchema });

// ---------------------------------------------------------------------------
// Legacy `sql` shim — used by question-bank routes that call sql.query(...)
//
// postgres-js uses tagged templates, not .query(). We wrap it in a thin
// adapter so the existing callers don't need to change.
// ---------------------------------------------------------------------------
type SqlShim = {
  query: (text: string, values?: unknown[]) => Promise<unknown[]>;
};

export const sql: SqlShim = {
  async query(text: string, values: unknown[] = []) {
    // postgres-js accepts (template, ...values) but also supports unsafe()
    // for pre-built query strings with a separate values array.
    const rows = await pgClient.unsafe(
      text,
      values as postgres.ParameterOrJSON<never>[],
    );
    return rows as unknown[];
  },
};

// ---------------------------------------------------------------------------
// Re-export schema tables for use in queries throughout the app
// ---------------------------------------------------------------------------
export * from "./schema";

// ---------------------------------------------------------------------------
// Legacy constants kept for backwards compat with routes that import
// `config` from "@/lib/db"
// ---------------------------------------------------------------------------
export const REVALIDATE_LONG = 3600; // 1 hour
export const REVALIDATE_MEDIUM = 300; // 5 minutes

export const config = {
  databaseUrl,
  sql,
  REVALIDATE_LONG,
  REVALIDATE_MEDIUM,
};
