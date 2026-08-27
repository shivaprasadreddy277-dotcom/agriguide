import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

/**
 * Runs a callback block in a Postgres transaction.
 * Injects the current user's UUID into `app.user_id` for RLS evaluation.
 */
export async function executeInTransaction<T>(
  userId: string | null,
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (userId) {
      await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
    } else {
      await client.query("SELECT set_config('app.user_id', '', true)");
    }
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
