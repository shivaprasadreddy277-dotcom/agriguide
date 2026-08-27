import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log("🔄 Starting database migrations...");
    // Create migrations tracker table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        run_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.log("⚠️ No migrations directory found at:", migrationsDir);
      return;
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

    for (const file of files) {
      // Check if migration already ran
      const checkRes = await client.query(
        "SELECT id FROM schema_migrations WHERE name = $1",
        [file]
      );
      if (checkRes.rows.length > 0) {
        console.log(`⏭️ Migration ${file} already applied.`);
        continue;
      }

      console.log(`🏃 Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (name) VALUES ($1)",
          [file]
        );
        await client.query("COMMIT");
        console.log(`✅ Applied migration: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`❌ Failed applying migration: ${file}`);
        throw err;
      }
    }
    console.log("🎉 Database migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (process.argv[1] === __filename || process.argv[1]?.endsWith("migrate.ts")) {
  runMigrations()
    .then(() => {
      console.log("Migrations run complete. Exiting.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration script failed:", err);
      process.exit(1);
    });
}
