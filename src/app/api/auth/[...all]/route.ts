/**
 * Better Auth API Route Handler
 *
 * Handles all Better Auth authentication requests:
 * - Email/password sign in and sign up
 * - Google OAuth flow
 * - Session management
 * - Sign out
 *
 * This catch-all route handler delegates all auth operations to Better Auth.
 *
 * NOTE: `createAuth()` is called inside each handler rather than at module
 * scope. This is required for Cloudflare Workers — Neon WebSocket pool
 * connections are I/O objects that cannot be reused across different request
 * contexts. Creating them per-request avoids the "Cannot perform I/O on
 * behalf of a different request" error on the OAuth callback.
 */

import { createAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export function GET(request: Request) {
  const { auth } = createAuth();
  return toNextJsHandler(auth).GET(request);
}

export function POST(request: Request) {
  const { auth } = createAuth();
  return toNextJsHandler(auth).POST(request);
}
