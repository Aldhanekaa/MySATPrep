/**
 * Better Auth Configuration
 *
 * Configures Better Auth with PostgreSQL, Google OAuth, and email/password authentication.
 *
 * Uses @neondatabase/serverless instead of `pg` so that database connections
 * work in the Cloudflare Workers runtime (which has no Node.js TCP sockets).
 * The Neon serverless driver uses HTTP/WebSocket, both of which are available
 * in Workers.
 */

import { betterAuth } from "better-auth";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { env } from "./config/env";

// Use the `ws` package as the WebSocket implementation when running outside
// the browser (i.e. in Node.js during `next dev`) so the Neon serverless
// driver can open WebSocket connections.  In the Cloudflare Workers runtime
// the global `WebSocket` is already available, so this is only needed locally.
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

/**
 * Application query pool — uses the Neon pooler endpoint (PgBouncer).
 * Uses @neondatabase/serverless Pool which works in Cloudflare Workers via WebSocket.
 */
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

/**
 * Unpooled connection for better-auth.
 * better-auth uses prepared statements and SET commands that are incompatible
 * with PgBouncer's transaction-mode pooling, so it needs a direct connection.
 */
const authPool = new Pool({
  connectionString: env.DATABASE_URL_UNPOOLED,
});

console.log(
  "process.env.NEXT_PUBLIC_BASE_URL",
  process.env.NEXT_PUBLIC_BASE_URL,
);
// Configure Better Auth
export const auth = betterAuth({
  basePath: process.env.NEXT_PUBLIC_URL,
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
