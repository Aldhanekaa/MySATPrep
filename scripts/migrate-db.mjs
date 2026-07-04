#!/usr/bin/env node
/**
 * Database Migration Script
 *
 * Runs in two steps:
 *   1. Creates the app-level tables (migrations/001_initial_schema.sql)
 *   2. Creates the Better Auth core tables (user, session, account, verification)
 *
 * Usage: npm run db:migrate
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Load .env manually (no dotenv dependency required)
// ---------------------------------------------------------------------------
function loadEnv() {
  try {
    const envPath = join(__dirname, "..", ".env");
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      // Strip surrounding quotes from value
      let value = trimmed.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    console.warn(
      "Warning: could not read .env file, relying on existing env vars.",
    );
  }
}

loadEnv();

const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

// ---------------------------------------------------------------------------
// Step 1: App-level tables (001_initial_schema.sql)
// ---------------------------------------------------------------------------
async function runAppMigration(client) {
  console.log("\n→ Running app schema migration (001_initial_schema.sql)...");
  const sqlPath = join(__dirname, "..", "migrations", "001_initial_schema.sql");
  const sql = readFileSync(sqlPath, "utf8");
  await client.query(sql);
  console.log("  ✓ App schema migration complete.");
}

// ---------------------------------------------------------------------------
// Step 1b: Fix FK references to better-auth's "user" table (002)
// ---------------------------------------------------------------------------
async function runFkFixMigration(client) {
  console.log(
    "\n→ Running FK fix migration (002_fix_fk_to_better_auth_user.sql)...",
  );
  const sqlPath = join(
    __dirname,
    "..",
    "migrations",
    "002_fix_fk_to_better_auth_user.sql",
  );
  const sql = readFileSync(sqlPath, "utf8");
  await client.query(sql);
  console.log("  ✓ FK fix migration complete.");
}

// ---------------------------------------------------------------------------
// Step 2: Better Auth core tables
//   Better Auth 1.x expects: user, session, account, verification
//   (table names are lowercase, no "s" — differs from our custom "users" table)
// ---------------------------------------------------------------------------
const BETTER_AUTH_SCHEMA = `
-- Better Auth core tables
-- https://www.better-auth.com/docs/concepts/database

CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  image TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  password TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session("userId");
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_account_user_id ON account("userId");
CREATE INDEX IF NOT EXISTS idx_account_provider ON account("providerId", "accountId");
`;

async function runBetterAuthMigration(client) {
  console.log(
    "\n→ Creating Better Auth core tables (user, session, account, verification)...",
  );
  await client.query(BETTER_AUTH_SCHEMA);
  console.log("  ✓ Better Auth core tables ready.");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("Database Migration");
  console.log("==================");
  console.log(`Connecting to: ${DATABASE_URL.replace(/:([^:@]+)@/, ":***@")}`);

  const client = await pool.connect();
  try {
    await runAppMigration(client);
    await runBetterAuthMigration(client);
    await runFkFixMigration(client);
    console.log("\n✅ All migrations completed successfully.\n");
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
