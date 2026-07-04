/**
 * Test Database Utilities
 *
 * Provides helpers for connecting to, setting up, and cleaning up
 * a test PostgreSQL database in Jest test suites.
 *
 * Requires TEST_DATABASE_URL environment variable.
 */

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

let testPool: Pool | null = null;

/**
 * Returns a PostgreSQL pool connected to the test database.
 * Reads TEST_DATABASE_URL from the environment.
 */
export function getTestPool(): Pool {
  if (!testPool) {
    const connectionString = process.env.TEST_DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "TEST_DATABASE_URL environment variable is not set. " +
          "Please set it to a PostgreSQL connection string for the test database.",
      );
    }
    testPool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });

    testPool.on("error", (err) => {
      console.error("Test database pool error:", err);
    });
  }
  return testPool;
}

/**
 * Runs the initial schema migration SQL to create all tables if they don't exist.
 * Safe to call multiple times (all statements use IF NOT EXISTS).
 */
export async function setupTestDb(): Promise<void> {
  const pool = getTestPool();
  const migrationPath = path.resolve(
    __dirname,
    "../../../migrations/001_initial_schema.sql",
  );

  const sql = fs.readFileSync(migrationPath, "utf-8");
  await pool.query(sql);
}

/**
 * Truncates all user-related tables to provide a clean state between tests.
 * Uses TRUNCATE ... CASCADE to handle foreign key dependencies.
 */
export async function cleanupTestDb(): Promise<void> {
  const pool = getTestPool();
  await pool.query(`
    TRUNCATE TABLE
      user_preferences,
      vocabulary_progress,
      saved_collections,
      saved_questions,
      practice_sessions,
      practice_statistics,
      user_profiles,
      users
    RESTART IDENTITY CASCADE
  `);
}

/**
 * Closes the test database pool. Call this in afterAll() to clean up connections.
 */
export async function closeTestDb(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}
