/**
 * Database Migration Utility
 *
 * Executes SQL migration files and provides rollback capability
 */

import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

export async function runMigration(
  pool: Pool,
  migrationPath: string,
): Promise<void> {
  const client = await pool.connect();

  try {
    // Read migration file
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Begin transaction
    await client.query("BEGIN");

    try {
      // Execute migration
      await client.query(migrationSQL);

      // Commit transaction
      await client.query("COMMIT");

      console.log(`✅ Migration executed successfully: ${migrationPath}`);
    } catch (error) {
      // Rollback on error
      await client.query("ROLLBACK");
      console.error(`❌ Migration failed, rolled back: ${migrationPath}`);
      throw error;
    }
  } finally {
    client.release();
  }
}

export async function runAllMigrations(pool: Pool): Promise<void> {
  const migrationsDir = join(process.cwd(), "migrations");

  try {
    // For now, we only have one migration file
    // In the future, this could be extended to track applied migrations
    const migrationPath = join(migrationsDir, "001_initial_schema.sql");

    await runMigration(pool, migrationPath);

    console.log("✅ All migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration process failed:", error);
    throw error;
  }
}
