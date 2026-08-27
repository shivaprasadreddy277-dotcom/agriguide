import pg from "pg";
import { randomBytes, createHash } from "crypto";
import { pool } from "../db/pool.js";
import { env } from "../config/env.js";

/**
 * Hashes a plaintext token for safe database storage.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a new session in the database and returns the plaintext session token.
 */
export async function createSession(
  userId: string,
  userAgent: string | null,
  ip: string | null,
  client?: pg.PoolClient
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.SESSION_TTL_DAYS);

  const ipHash = ip ? createHash("sha256").update(ip).digest("hex") : null;

  const db = client || pool;
  await db.query(
    `INSERT INTO user_sessions (user_id, token_hash, expires_at, user_agent, ip_hash)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, userAgent, ipHash]
  );

  return token;
}

/**
 * Verifies a plaintext session token, updates its last_seen_at field, and returns user_id if valid.
 */
export async function verifySession(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);
  const res = await pool.query(
    `UPDATE user_sessions
     SET last_seen_at = NOW()
     WHERE token_hash = $1 AND expires_at > NOW()
     RETURNING user_id`,
    [tokenHash]
  );

  if (res.rows.length === 0) {
    return null;
  }
  return res.rows[0].user_id;
}

/**
 * Revokes a session by deleting it from the database.
 */
export async function revokeSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await pool.query(
    "DELETE FROM user_sessions WHERE token_hash = $1",
    [tokenHash]
  );
}

/**
 * Cleans up expired sessions from the database.
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await pool.query(
    "DELETE FROM user_sessions WHERE expires_at <= NOW()"
  );
}
