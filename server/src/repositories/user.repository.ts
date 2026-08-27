import pg from "pg";
import { pool } from "../db/pool.js";

export interface DBUser {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string | null;
  preferredLanguage: "en" | "hi";
  unitSystem: "metric" | "imperial";
  isActive: boolean;
  googleId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapRowToUser(row: any): DBUser {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    passwordHash: row.password_hash,
    preferredLanguage: row.preferred_language,
    unitSystem: row.unit_system,
    isActive: row.is_active,
    googleId: row.google_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UserRepository {
  static async createUser(
    fullName: string,
    email: string,
    passwordHash: string | null,
    preferredLanguage: "en" | "hi" = "en",
    unitSystem: "metric" | "imperial" = "metric",
    googleId: string | null = null,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBUser> {
    const res = await client.query(
      `INSERT INTO app_users (full_name, email, password_hash, preferred_language, unit_system, google_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [fullName, email, passwordHash, preferredLanguage, unitSystem, googleId]
    );
    return mapRowToUser(res.rows[0]);
  }

  static async findUserById(id: string, client: pg.PoolClient | pg.Pool = pool): Promise<DBUser | null> {
    const res = await client.query(
      `SELECT * FROM app_users WHERE id = $1 AND is_active = TRUE`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return mapRowToUser(res.rows[0]);
  }

  static async findUserByEmail(email: string, client: pg.PoolClient | pg.Pool = pool): Promise<DBUser | null> {
    const res = await client.query(
      `SELECT * FROM app_users WHERE LOWER(email) = LOWER($1) AND is_active = TRUE`,
      [email]
    );
    if (res.rows.length === 0) return null;
    return mapRowToUser(res.rows[0]);
  }

  static async findUserByGoogleId(googleId: string, client: pg.PoolClient | pg.Pool = pool): Promise<DBUser | null> {
    const res = await client.query(
      `SELECT * FROM app_users WHERE google_id = $1 AND is_active = TRUE`,
      [googleId]
    );
    if (res.rows.length === 0) return null;
    return mapRowToUser(res.rows[0]);
  }

  static async linkGoogleAccount(
    userId: string,
    googleId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBUser> {
    const res = await client.query(
      `UPDATE app_users
       SET google_id = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [googleId, userId]
    );
    return mapRowToUser(res.rows[0]);
  }

  static async updatePassword(
    userId: string,
    passwordHash: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<void> {
    await client.query(
      `UPDATE app_users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, userId]
    );
  }

  static async updateUser(
    id: string,
    data: { fullName: string; preferredLanguage: "en" | "hi"; unitSystem: "metric" | "imperial" },
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBUser> {
    const res = await client.query(
      `UPDATE app_users
       SET full_name = $1, preferred_language = $2, unit_system = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [data.fullName, data.preferredLanguage, data.unitSystem, id]
    );
    if (res.rows.length === 0) {
      throw new Error("User not found or inactive");
    }
    return mapRowToUser(res.rows[0]);
  }

  static async deleteUser(id: string, client: pg.PoolClient | pg.Pool = pool): Promise<void> {
    // Perform cascades at database level (foreign keys have ON DELETE CASCADE)
    await client.query("DELETE FROM app_users WHERE id = $1", [id]);
  }
}
