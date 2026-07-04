/**
 * Better Auth Configuration
 *
 * Configures Better Auth with PostgreSQL, Google OAuth, and email/password authentication.
 *
 * Uses @neondatabase/serverless instead of `pg` so that database connections
 * work in the Cloudflare Workers runtime (which has no Node.js TCP sockets).
 * The Neon serverless driver uses HTTP/WebSocket, both of which are available
 * in Workers.
 *
 * IMPORTANT: The Pool instances and betterAuth instance are created lazily
 * (inside a factory function) rather than at module level. This is required for
 * Cloudflare Workers, which prohibits reusing I/O objects (WebSocket connections)
 * across different request contexts. See:
 * https://opennext.js.org/cloudflare/troubleshooting
 */

import { betterAuth, type BetterAuthOptions } from "better-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { withCloudflare } from "better-auth-cloudflare";

import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { validateEnv } from "./config/env";

// Use the `ws` package as the WebSocket implementation when running outside
// the browser (i.e. in Node.js during `next dev`) so the Neon serverless
// driver can open WebSocket connections.  In the Cloudflare Workers runtime
// the global `WebSocket` is already available, so this is only needed locally.
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

/**
 * Creates a new Better Auth instance with fresh Neon pool connections.
 *
 * Must be called once per request in Cloudflare Workers — pools created at
 * module scope are tied to the first request's I/O context and cannot be
 * reused in subsequent requests.
 */
export function createAuth() {
  const env = validateEnv();

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

  const authInstance = betterAuth({
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
  } satisfies BetterAuthOptions);

  return { auth: authInstance, pool };
}

// Export types derived from a transient instance (type-only, no runtime cost)
type AuthInstance = ReturnType<typeof createAuth>["auth"];
export type Session = AuthInstance["$Infer"]["Session"]["session"];
export type User = AuthInstance["$Infer"]["Session"]["user"];

/**
 * Convenience helper: get the current session from request headers.
 *
 * Creates a fresh auth instance per call (required for Cloudflare Workers —
 * see createAuth() docs). Use this in API route handlers instead of importing
 * `auth` directly.
 *
 * Usage: `const session = await getSession({ headers: request.headers })`
 */
export async function getSession(options: {
  headers: Headers;
}): Promise<{ session: Session; user: User } | null> {
  const { auth } = createAuth();
  return auth.api.getSession({ headers: options.headers });
}
