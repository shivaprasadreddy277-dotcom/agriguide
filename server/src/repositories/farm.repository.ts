import pg from "pg";
import { pool } from "../db/pool.js";
import { z } from "zod";
import { farmCreateSchema } from "shared";

export type FarmInput = z.infer<typeof farmCreateSchema>;

export interface DBFarm {
  id: string;
  userId: string;
  name: string;
  country: string;
  stateProvince: string | null;
  districtCounty: string | null;
  locality: string | null;
  latitude: number | null;
  longitude: number | null;
  totalArea: number | null;
  areaUnit: "hectare" | "acre" | "square_meter" | "square_feet";
  soilType: string | null;
  irrigationAvailability: "none" | "rainfed" | "partial" | "reliable" | null;
  waterSource: string | null;
  notes: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function mapRowToFarm(row: any): DBFarm {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    country: row.country,
    stateProvince: row.state_province,
    districtCounty: row.district_county,
    locality: row.locality,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    totalArea: row.total_area ? parseFloat(row.total_area) : null,
    areaUnit: row.area_unit,
    soilType: row.soil_type,
    irrigationAvailability: row.irrigation_availability,
    waterSource: row.water_source,
    notes: row.notes,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class FarmRepository {
  static async createFarm(
    userId: string,
    data: FarmInput,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBFarm> {
    // If setting default, unset existing defaults first
    if (data.isDefault) {
      await client.query(
        "UPDATE farms SET is_default = FALSE WHERE user_id = $1",
        [userId]
      );
    }

    // Check if user has any existing farms. If not, make this default automatically!
    const countRes = await client.query(
      "SELECT count(*) FROM farms WHERE user_id = $1",
      [userId]
    );
    const hasFarms = parseInt(countRes.rows[0].count, 10) > 0;
    const shouldBeDefault = data.isDefault || !hasFarms;

    const res = await client.query(
      `INSERT INTO farms (
        user_id, name, country, state_province, district_county, locality,
        latitude, longitude, total_area, area_unit, soil_type,
        irrigation_availability, water_source, notes, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        userId,
        data.name,
        data.country,
        data.stateProvince || null,
        data.districtCounty || null,
        data.locality || null,
        data.latitude || null,
        data.longitude || null,
        data.totalArea || null,
        data.areaUnit || "hectare",
        data.soilType || null,
        data.irrigationAvailability || null,
        data.waterSource || null,
        data.notes || null,
        shouldBeDefault,
      ]
    );

    return mapRowToFarm(res.rows[0]);
  }

  static async findFarmsByUserId(
    userId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBFarm[]> {
    const res = await client.query(
      "SELECT * FROM farms WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return res.rows.map(mapRowToFarm);
  }

  static async findFarmById(
    userId: string,
    farmId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBFarm | null> {
    const res = await client.query(
      "SELECT * FROM farms WHERE user_id = $1 AND id = $2",
      [userId, farmId]
    );
    if (res.rows.length === 0) return null;
    return mapRowToFarm(res.rows[0]);
  }

  static async updateFarm(
    userId: string,
    farmId: string,
    data: Partial<FarmInput>,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBFarm | null> {
    // If setting default, unset existing defaults first
    if (data.isDefault) {
      await client.query(
        "UPDATE farms SET is_default = FALSE WHERE user_id = $1",
        [userId]
      );
    }

    // Build dynamic query
    const setFields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      name: "name",
      country: "country",
      stateProvince: "state_province",
      districtCounty: "district_county",
      locality: "locality",
      latitude: "latitude",
      longitude: "longitude",
      totalArea: "total_area",
      areaUnit: "area_unit",
      soilType: "soil_type",
      irrigationAvailability: "irrigation_availability",
      waterSource: "water_source",
      notes: "notes",
      isDefault: "is_default",
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
      return this.findFarmById(userId, farmId, client);
    }

    values.push(farmId);
    values.push(userId);

    const query = `
      UPDATE farms
      SET ${setFields.join(", ")}, updated_at = NOW()
      WHERE id = $${idx} AND user_id = $${idx + 1}
      RETURNING *
    `;

    const res = await client.query(query, values);
    if (res.rows.length === 0) return null;
    return mapRowToFarm(res.rows[0]);
  }

  static async deleteFarm(
    userId: string,
    farmId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<boolean> {
    const res = await client.query(
      "DELETE FROM farms WHERE id = $1 AND user_id = $2 RETURNING id",
      [farmId, userId]
    );
    return res.rows.length > 0;
  }

  static async setDefaultFarm(
    userId: string,
    farmId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBFarm | null> {
    await client.query(
      "UPDATE farms SET is_default = FALSE WHERE user_id = $1",
      [userId]
    );
    const res = await client.query(
      "UPDATE farms SET is_default = TRUE WHERE id = $1 AND user_id = $2 RETURNING *",
      [farmId, userId]
    );
    if (res.rows.length === 0) return null;
    return mapRowToFarm(res.rows[0]);
  }
}
