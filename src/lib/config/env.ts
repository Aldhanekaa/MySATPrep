/**
 * Environment Variable Configuration and Validation
 *
 * This module defines required environment variables and validates them at startup.
 * Throws configuration errors if required variables are missing.
 */

interface EnvConfig {
  DATABASE_URL: string;
  DATABASE_URL_UNPOOLED: string;
  POSTGRES_URL: string;
  POSTGRES_URL_NON_POOLING: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  // NEXT_PUBLIC_BASE_URL: string;
}

/**
 * Validates that all required environment variables are present
 * Throws an error with clear message if any are missing
 */
export function validateEnv(): EnvConfig {
  const requiredVars = [
    "DATABASE_URL",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL",
    "POSTGRES_URL_NON_POOLING",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "BETTER_AUTH_SECRET",
    // "NEXT_PUBLIC_BASE_URL",
  ] as const;

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Configuration Error: Missing required environment variables:\n` +
        missingVars.map((v) => `  - ${v}`).join("\n") +
        `\n\nPlease add these variables to your .env file.`,
    );
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED!,
    POSTGRES_URL: process.env.POSTGRES_URL!,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING!,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
    // NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL!,
  };
}

/**
 * Validated environment configuration
 * This will throw an error if validation fails
 */
export const env = validateEnv();
