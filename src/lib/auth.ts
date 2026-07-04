/**
 * Better Auth Configuration
 *
 * Uses:
 * - drizzle-orm/postgres-js for standard PostgreSQL access (works with any
 *   Postgres provider — Neon, Supabase, self-hosted, etc.)
 * - @better-auth/drizzle-adapter to connect Better Auth to the Drizzle client
 * - better-auth-cloudflare's `withCloudflare` for IP detection, geolocation
 *   tracking, and optional KV-backed rate limiting
 *
 * Two separate clients are kept deliberately:
 *   • `db`     — pooled connection string, for all app queries
 *   • `authDb` — unpooled / direct connection for Better Auth, which uses
 *                prepared statements and SET commands that are incompatible
 *                with PgBouncer transaction-mode pooling
 *
 * Cloudflare Workers note:
 *   postgres-js uses raw TCP sockets, which are not available in Workers
 *   without Cloudflare Hyperdrive. Add a Hyperdrive binding in wrangler.toml
 *   and pass its .connectionString as DATABASE_URL at runtime on Cloudflare.
 *   During local `next dev` the raw TCP connection works normally.
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { withCloudflare } from "better-auth-cloudflare";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./config/env";
import { appSchema } from "./db/schema";

// ---------------------------------------------------------------------------
// App query client — pooled connection string, max_connections capped so the
// process doesn't exhaust the server's connection limit (tune as needed).
// ---------------------------------------------------------------------------
const appPgClient = postgres(env.DATABASE_URL, {
  max: 10,
  prepare: false, // disable prepared statements for PgBouncer compatibility
});
export const db = drizzle(appPgClient, { schema: appSchema });

// ---------------------------------------------------------------------------
// Auth-only client — unpooled / direct connection for Better Auth.
// `prepare: false` is already safe here but kept for clarity.
// ---------------------------------------------------------------------------
const authPgClient = postgres(env.DATABASE_URL_UNPOOLED, { prepare: false });
const authDb = drizzle(authPgClient, { schema: appSchema });

// ---------------------------------------------------------------------------
// Better Auth instance
//
// `withCloudflare` wraps the core betterAuth options and injects:
//   - IP auto-detection from the CF-Connecting-IP / X-Forwarded-For headers
//   - Geolocation tracking in the session table (city, country, timezone, …)
//   - Optional KV-backed secondary storage for rate-limiting (pass `kv` when
//     running on Cloudflare; omit it during local dev — auth still works)
//
// The `postgres` key is how better-auth-cloudflare integrates with a
// Drizzle/PostgreSQL setup instead of D1.
// ---------------------------------------------------------------------------
export const auth = betterAuth(
  withCloudflare(
    {
      autoDetectIpAddress: true,
      geolocationTracking: true,
      // `cf` is the Cloudflare request context (contains geo data).
      // It is intentionally omitted here; the route handler passes it at
      // request time via `withCloudflare`'s request-aware middleware.
      postgres: {
        db: authDb,
        options: {
          // better-auth generates RFC 4122 UUIDs, which is what our PostgreSQL
          // schema expects (uuid column type throughout).
          usePlural: false,
        },
      },
    },
    // ── Core Better Auth options ──────────────────────────────────────────
    {
      database: drizzleAdapter(authDb, {
        provider: "pg",
        usePlural: false,
      }),
      advanced: {
        database: {
          generateId: "uuid",
        },
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
        cookieCache: {
          enabled: true,
          maxAge: 5 * 60, // 5 minutes
        },
      },
      secret: env.BETTER_AUTH_SECRET,
      baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    },
  ),
);

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;

// ---------------------------------------------------------------------------
// Legacy pool export shim
//
// All db/userOperations.ts and siblings import `pool` from "@/lib/auth" and
// call pool.query(). Rather than rewriting every operation file in this PR,
// we expose a thin compatibility object that delegates to a new pg Pool.
//
// Migrate each operations file to use Drizzle queries when convenient.
// ---------------------------------------------------------------------------
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});
