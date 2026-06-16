/**
 * Better Auth Configuration
 *
 * Configures Better Auth with PostgreSQL, Google OAuth, and email/password authentication
 */

import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { env } from "./config/env";

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Configure Better Auth
export const auth = betterAuth({
  database: {
    provider: "postgres",
    pool: pool,
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
