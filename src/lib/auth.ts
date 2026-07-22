/**
 * Better Auth Configuration
 *
 * Uses the standard `pg` driver with two pools:
 *  - pool       : pooler/PgBouncer endpoint — for reads
 *  - directPool : direct unpooled endpoint  — for writes (syncOperations,
 *                 migrationOperations, better-auth itself)
 *
 * SSL is always enabled with rejectUnauthorized: false. Supabase (and most
 * hosted Postgres providers) use intermediate CA chains that don't verify
 * cleanly in Node.js — the connection is still TLS-encrypted regardless.
 */

import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { env } from "./config/env";

const SSL = { ssl: { rejectUnauthorized: false } };

// Pooler / PgBouncer endpoint — high-concurrency reads
// Keep max low: Supabase session-mode pooler holds one real Postgres connection
// per client connection for its lifetime. Too many clients = EMAXCONNSESSION.
// Rule of thumb: total across all pools/workers ≤ Supabase pool_size (default 15).
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ...SSL,
  max: 3,
  idleTimeoutMillis: 10_000, // release idle connections faster
  connectionTimeoutMillis: 10_000,
});

// Direct unpooled endpoint — writes and better-auth
// Goes straight to Postgres (bypasses PgBouncer), so it doesn't count toward
// the session-mode cap — but Supabase still limits direct connections, so keep small.
const directPool = new Pool({
  connectionString: env.DATABASE_URL_UNPOOLED,
  ...SSL,
  max: 3,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});

export const auth = betterAuth({
  basePath: process.env.NEXT_PUBLIC_URL,
  database: directPool,
  advanced: {
    database: { generateId: "uuid" },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,

      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;

// pool       → pooler (reads)
// directPool → direct (writes)
export { pool, directPool };
