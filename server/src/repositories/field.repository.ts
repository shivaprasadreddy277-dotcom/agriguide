import pg from "pg";
import { pool } from "../db/pool.js";
import { z } from "zod";
import { fieldCreateSchema } from "shared";

export type FieldInput = z.infer<typeof fieldCreateSchema>;

export interface DBField {
  id: string;
  farmId: string;
  name: string;
  area: number | null;
  areaUnit: "hectare" | "acre" | "square_meter" | "square_feet";
  soilType: string | null;
  irrigationMethod: string | null;
  waterSource: string | null;
  currentCrop: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapRowToField(row: any): DBField {
  return {
    id: row.id,
    farmId: row.farm_id,
    name: row.name,
    area: row.area ? parseFloat(row.area) : null,
    areaUnit: row.area_unit,
    soilType: row.soil_type,
    irrigationMethod: row.irrigation_method,
    waterSource: row.water_source,
    currentCrop: row.current_crop,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class FieldRepository {
  static async verifyFarmOwnership(
    userId: string,
    farmId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<boolean> {
    const res = await client.query(
      "SELECT 1 FROM farms WHERE id = $1 AND user_id = $2",
      [farmId, userId]
    );
    return res.rows.length > 0;
  }

  static async verifyFieldOwnership(
    userId: string,
    fieldId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<boolean> {
    const res = await client.query(
      `SELECT 1 FROM fields f
       JOIN farms farm ON f.farm_id = farm.id
       WHERE f.id = $1 AND farm.user_id = $2`,
      [fieldId, userId]
    );
    return res.rows.length > 0;
  }

  static async createField(
    userId: string,
    farmId: string,
    data: FieldInput,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBField> {
    const isOwner = await this.verifyFarmOwnership(userId, farmId, client);
    if (!isOwner) {
      throw new Error("Unauthorized farm access");
    }

    const res = await client.query(
      `INSERT INTO fields (
        farm_id, name, area, area_unit, soil_type, irrigation_method,
        water_source, current_crop, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        farmId,
        data.name,
        data.area || null,
        data.areaUnit || "hectare",
        data.soilType || null,
        data.irrigationMethod || null,
        data.waterSource || null,
        data.currentCrop || null,
        data.notes || null,
      ]
    );

    return mapRowToField(res.rows[0]);
  }

  static async findFieldsByFarmId(
    userId: string,
    farmId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBField[]> {
    const isOwner = await this.verifyFarmOwnership(userId, farmId, client);
    if (!isOwner) {
      throw new Error("Unauthorized farm access");
    }

    const res = await client.query(
      "SELECT * FROM fields WHERE farm_id = $1 ORDER BY created_at DESC",
      [farmId]
    );
    return res.rows.map(mapRowToField);
  }

  static async findFieldById(
    userId: string,
    fieldId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBField | null> {
    const isOwner = await this.verifyFieldOwnership(userId, fieldId, client);
    if (!isOwner) return null;

    const res = await client.query("SELECT * FROM fields WHERE id = $1", [fieldId]);
    if (res.rows.length === 0) return null;
    return mapRowToField(res.rows[0]);
  }

  static async updateField(
    userId: string,
    fieldId: string,
    data: Partial<FieldInput>,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBField | null> {
    const isOwner = await this.verifyFieldOwnership(userId, fieldId, client);
    if (!isOwner) {
      throw new Error("Unauthorized field access");
    }

    const setFields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      name: "name",
      area: "area",
      areaUnit: "area_unit",
      soilType: "soil_type",
      irrigationMethod: "irrigation_method",
      waterSource: "water_source",
      currentCrop: "current_crop",
      notes: "notes",
    };

    for (const key of Object.keys(data)) {
      const dbCol = mapping[key];
      if (dbCol) {
        setFields.push(`${dbCol} = $${idx}`);
        values.push((data as any)[key] === undefined ? null : (data as any)[key]);
        idx++;
      }
    }

    if (setFields.length === 0) {
      return this.findFieldById(userId, fieldId, client);
    }

    values.push(fieldId);

    const query = `
      UPDATE fields
      SET ${setFields.join(", ")}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *
    `;

    const res = await client.query(query, values);
    if (res.rows.length === 0) return null;
    return mapRowToField(res.rows[0]);
  }

  static async deleteField(
    userId: string,
    fieldId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<boolean> {
    const isOwner = await this.verifyFieldOwnership(userId, fieldId, client);
    if (!isOwner) return false;

    const res = await client.query(
      "DELETE FROM fields WHERE id = $1 RETURNING id",
      [fieldId]
    );
    return res.rows.length > 0;
  }
}
