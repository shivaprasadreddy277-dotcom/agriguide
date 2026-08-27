import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

router.get("/health", async (req, res) => {
  try {
    // Check database connection health
    await pool.query("SELECT 1");
    return res.json({
      success: true,
      data: {
        status: "ok",
        database: "ok",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Health check database failure:", error);
    return res.status(500).json({
      success: false,
      data: {
        status: "error",
        database: "error",
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
