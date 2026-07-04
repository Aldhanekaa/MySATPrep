/**
 * Better Auth Configuration
 *
 * Configures Better Auth with PostgreSQL, Google OAuth, and email/password authentication
 */

import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { env } from "./config/env";

// Strip SSL-related params that conflict with the `ssl` option object in pg.
// When sslmode/channel_binding are present in the URL, pg's connection-string
// parser overrides the `ssl` option, preventing proper certificate verification.
function stripSslParams(url: string): string {
  return url
    .replace(/[?&]sslmode=[^&]*/g, "")
    .replace(/[?&]channel_binding=[^&]*/g, "")
    .replace(/&&/g, "&")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");
}

/**
 * Application query pool — uses the Neon pooler endpoint (PgBouncer).
 * This is the pool used for all user-facing DB queries. The pooler can
 * handle many concurrent connections without exhausting Postgres limits.
 */
const pool = new Pool({
  connectionString: stripSslParams(env.POSTGRES_URL),
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

/**
 * Unpooled connection for better-auth.
 * better-auth uses prepared statements and SET commands that are incompatible
 * with PgBouncer's transaction-mode pooling, so it needs a direct connection.
 */
const authPool = new Pool({
  connectionString: stripSslParams(env.POSTGRES_URL_NON_POOLING),
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

// Configure Better Auth
export const auth = betterAuth({
  database: authPool,
  advanced: {
    database: {
      // Generate RFC 4122 UUIDs so better-auth's user IDs are compatible with
      // our PostgreSQL schema, which uses the uuid column type throughout.
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
});

// Export types for use throughout the app
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;

// Export the app query pool for direct database access
export { pool };
