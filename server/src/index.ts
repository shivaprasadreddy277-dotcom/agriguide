import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
import { runMigrations } from "./db/migrate.js";

async function startServer() {
  try {
    console.log("🚀 Starting AgriGuide Backend Server...");
    
    // 1. Verify Database Connection Health
    console.log("🔌 Testing database connection...");
    await pool.query("SELECT 1");
    console.log("✅ Database connection successful!");

    // 2. Execute SQL Migrations
    await runMigrations();

    // 3. Bind Port Listener
    const server = app.listen(env.PORT, () => {
      console.log(`🌐 Server is running on port ${env.PORT} in ${env.NODE_ENV} mode.`);
      console.log(`🔗 Access at: ${env.APP_ORIGIN}`);
    });

    // 4. Graceful Shutdown Coordinator
    const shutdown = async (signal: string) => {
      console.log(`🛑 Received signal ${signal}. Starting graceful shutdown...`);
      server.close(() => {
        console.log("💤 Express server closed.");
      });
      await pool.end();
      console.log("🔌 Database pool closed.");
      console.log("👋 Graceful shutdown complete.");
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
