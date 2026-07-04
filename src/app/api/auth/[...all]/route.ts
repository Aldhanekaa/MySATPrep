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
 */

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Export handlers for all HTTP methods
export const { GET, POST } = toNextJsHandler(auth);
