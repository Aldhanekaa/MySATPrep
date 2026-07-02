/**
 * Better Auth Configuration
 *
 * Configures Better Auth with PostgreSQL, Google OAuth, and email/password authentication
 */

import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";
import { env } from "./config/env";

// Load DigitalOcean's CA certificate so Node.js trusts their managed PostgreSQL
// TLS chain. The cert is bundled in the repo root as ca-certificate.crt.
const caCertPath =
  process.env.NODE_EXTRA_CA_CERTS ?? join(process.cwd(), "ca-certificate.crt");
const ca = readFileSync(caCertPath, "utf-8");

// Strip SSL-related params from the connection string. When sslmode/channel_binding
// are present in the URL, pg's connection-string parser overrides the `ssl` option
// below, preventing the custom CA cert from being used for certificate verification.
function stripSslParams(url: string): string {
  return url
    .replace(/[?&]sslmode=[^&]*/g, "")
    .replace(/[?&]channel_binding=[^&]*/g, "")
    .replace(/&&/g, "&")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: stripSslParams(env.DATABASE_URL_UNPOOLED),
  ssl: {
    rejectUnauthorized: true,
    ca, // trust DigitalOcean's CA explicitly
  },
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

// Configure Better Auth
export const auth = betterAuth({
  database: pool,
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
  baseURL: env.NEXT_PUBLIC_BASE_URL,
});

// Export types for use throughout the app
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;

// Export the pool for direct database access
export { pool };
