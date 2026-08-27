import pg from "pg";
import { pool } from "../db/pool.js";
import { z } from "zod";
import { advisoryRequestSchema, feedbackSchema, advisoryQuerySchema } from "shared";

export type AdvisoryRequestInput = z.infer<typeof advisoryRequestSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type AdvisoryQueryInput = z.infer<typeof advisoryQuerySchema>;

export interface DBAdvisoryRequest {
  id: string;
  userId: string;
  farmId: string | null;
  fieldId: string | null;
  category: string;
  cropName: string;
  cropVariety: string | null;
  growthStage: string;
  question: string;
  inputSnapshot: any;
  imageCount: number;
  preferredLanguage: string;
  detailLevel: string;
  status: "queued" | "generating" | "completed" | "failed";
  errorCode: string | null;
  errorMessage: string | null;
  generationAttempts: number;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  reportId?: string | null;
}

export interface DBAdvisoryReport {
  id: string;
  requestId: string;
  userId: string;
  reportJson: any;
  modelName: string;
  promptVersion: string;
  inputHash: string;
  createdAt: Date;
}

export interface DBAdvisoryFeedback {
  id: string;
  reportId: string;
  userId: string;
  helpful: boolean;
  rating: number | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapRowToRequest(row: any): DBAdvisoryRequest {
  return {
    id: row.id,
    userId: row.user_id,
    farmId: row.farm_id,
    fieldId: row.field_id,
    category: row.category,
    cropName: row.crop_name,
    cropVariety: row.crop_variety,
    growthStage: row.growth_stage,
    question: row.question,
    inputSnapshot: row.input_snapshot,
    imageCount: row.image_count,
    preferredLanguage: row.preferred_language,
    detailLevel: row.detail_level,
    status: row.status,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    generationAttempts: row.generation_attempts,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    reportId: row.report_id || null,
  };
}

function mapRowToReport(row: any): DBAdvisoryReport {
  return {
    id: row.id,
    requestId: row.request_id,
    userId: row.user_id,
    reportJson: row.report_json,
    modelName: row.model_name,
    promptVersion: row.prompt_version,
    inputHash: row.input_hash,
    createdAt: row.created_at,
  };
}

export class AdvisoryRepository {
  static async createRequest(
    userId: string,
    data: AdvisoryRequestInput,
    imageCount: number,
    idempotencyKey?: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBAdvisoryRequest> {
    // If idempotencyKey is provided, check if a request already exists
    if (idempotencyKey) {
      const existing = await client.query(
        "SELECT * FROM advisory_requests WHERE user_id = $1 AND idempotency_key = $2",
        [userId, idempotencyKey]
      );
      if (existing.rows.length > 0) {
        return mapRowToRequest(existing.rows[0]);
      }
    }

    const snapshot = { ...data };

    const res = await client.query(
      `INSERT INTO advisory_requests (
        user_id, farm_id, field_id, category, crop_name, crop_variety,
        growth_stage, question, input_snapshot, image_count,
        preferred_language, detail_level, idempotency_key
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        userId,
        data.farmId || null,
        data.fieldId || null,
        data.category,
        data.cropName,
        data.cropVariety || null,
        data.growthStage,
        data.question,
        JSON.stringify(snapshot),
        imageCount,
        data.preferredLanguage || "en",
        data.detailLevel || "standard",
        idempotencyKey || null,
      ]
    );

    return mapRowToRequest(res.rows[0]);
  }

  static async findRequestById(
    userId: string,
    requestId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBAdvisoryRequest | null> {
    const res = await client.query(
      `SELECT r.*, rep.id as report_id 
       FROM advisory_requests r
       LEFT JOIN advisory_reports rep ON r.id = rep.request_id
       WHERE r.user_id = $1 AND r.id = $2`,
      [userId, requestId]
    );
    if (res.rows.length === 0) return null;
    return mapRowToRequest(res.rows[0]);
  }

  static async updateRequestStatus(
    requestId: string,
    status: "queued" | "generating" | "completed" | "failed",
    errorDetails?: { code: string; message: string },
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<void> {
    if (status === "failed" && errorDetails) {
      await client.query(
        `UPDATE advisory_requests 
         SET status = $1, error_code = $2, error_message = $3, updated_at = NOW()
         WHERE id = $4`,
        [status, errorDetails.code, errorDetails.message, requestId]
      );
    } else if (status === "completed") {
      await client.query(
        `UPDATE advisory_requests 
         SET status = $1, error_code = NULL, error_message = NULL, completed_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [status, requestId]
      );
    } else {
      await client.query(
        `UPDATE advisory_requests 
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [status, requestId]
      );
    }
  }

  static async incrementAttempts(
    requestId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<void> {
    await client.query(
      `UPDATE advisory_requests 
       SET generation_attempts = generation_attempts + 1, updated_at = NOW()
       WHERE id = $1`,
      [requestId]
    );
  }

  static async createReport(
    requestId: string,
    userId: string,
    reportJson: any,
    modelName: string,
    promptVersion: string,
    inputHash: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBAdvisoryReport> {
    // 1. Create Report
    const res = await client.query(
      `INSERT INTO advisory_reports (request_id, user_id, report_json, model_name, prompt_version, input_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [requestId, userId, JSON.stringify(reportJson), modelName, promptVersion, inputHash]
    );

    // 2. Mark Request as Completed
    await this.updateRequestStatus(requestId, "completed", undefined, client);

    return mapRowToReport(res.rows[0]);
  }

  static async findReportByRequestId(
    userId: string,
    requestId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBAdvisoryReport | null> {
    const res = await client.query(
      "SELECT * FROM advisory_reports WHERE user_id = $1 AND request_id = $2",
      [userId, requestId]
    );
    if (res.rows.length === 0) return null;
    return mapRowToReport(res.rows[0]);
  }

  static async findReportById(
    userId: string,
    reportId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBAdvisoryReport | null> {
    const res = await client.query(
      "SELECT * FROM advisory_reports WHERE user_id = $1 AND id = $2",
      [userId, reportId]
    );
    if (res.rows.length === 0) return null;
    return mapRowToReport(res.rows[0]);
  }

  static async queryAdvisories(
    userId: string,
    query: AdvisoryQueryInput,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<{ requests: DBAdvisoryRequest[]; total: number }> {
    const values: any[] = [userId];
    let queryIdx = 2;
    const filterClauses: string[] = ["r.user_id = $1"];

    if (query.category) {
      filterClauses.push(`r.category = $${queryIdx}`);
      values.push(query.category);
      queryIdx++;
    }

    if (query.status) {
      filterClauses.push(`r.status = $${queryIdx}`);
      values.push(query.status);
      queryIdx++;
    }

    if (query.search) {
      filterClauses.push(`(r.crop_name ILIKE $${queryIdx} OR r.question ILIKE $${queryIdx})`);
      values.push(`%${query.search}%`);
      queryIdx++;
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM advisory_requests r
      WHERE ${filterClauses.join(" AND ")}
    `;

    const countRes = await client.query(countQuery, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const sortOrder = query.sort === "oldest" ? "ASC" : "DESC";
    const offset = (query.page - 1) * query.pageSize;

    const dataQuery = `
      SELECT r.*, rep.id as report_id 
      FROM advisory_requests r
      LEFT JOIN advisory_reports rep ON r.id = rep.request_id
      WHERE ${filterClauses.join(" AND ")}
      ORDER BY r.created_at ${sortOrder}
      LIMIT $${queryIdx} OFFSET $${queryIdx + 1}
    `;

    values.push(query.pageSize, offset);

    const dataRes = await client.query(dataQuery, values);
    const requests = dataRes.rows.map(mapRowToRequest);

    return { requests, total };
  }

  static async deleteAdvisory(
    userId: string,
    advisoryId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<boolean> {
    const res = await client.query(
      "DELETE FROM advisory_requests WHERE id = $1 AND user_id = $2 RETURNING id",
      [advisoryId, userId]
    );
    return res.rows.length > 0;
  }

  static async upsertFeedback(
    userId: string,
    reportId: string,
    data: FeedbackInput,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBAdvisoryFeedback> {
    // Check if feedback already exists for this report
    const check = await client.query(
      "SELECT id FROM advisory_feedback WHERE report_id = $1 AND user_id = $2",
      [reportId, userId]
    );

    let res;
    if (check.rows.length > 0) {
      res = await client.query(
        `UPDATE advisory_feedback 
         SET helpful = $1, rating = $2, comment = $3, updated_at = NOW()
         WHERE report_id = $4 AND user_id = $5
         RETURNING *`,
        [data.helpful, data.rating === undefined ? null : data.rating, data.comment || null, reportId, userId]
      );
    } else {
      res = await client.query(
        `INSERT INTO advisory_feedback (report_id, user_id, helpful, rating, comment)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [reportId, userId, data.helpful, data.rating === undefined ? null : data.rating, data.comment || null]
      );
    }

    return {
      id: res.rows[0].id,
      reportId: res.rows[0].report_id,
      userId: res.rows[0].user_id,
      helpful: res.rows[0].helpful,
      rating: res.rows[0].rating,
      comment: res.rows[0].comment,
      createdAt: res.rows[0].created_at,
      updatedAt: res.rows[0].updated_at,
    };
  }

  static async findFeedbackByReportId(
    userId: string,
    reportId: string,
    client: pg.PoolClient | pg.Pool = pool
  ): Promise<DBAdvisoryFeedback | null> {
    const res = await client.query(
      "SELECT * FROM advisory_feedback WHERE report_id = $1 AND user_id = $2",
      [reportId, userId]
    );
    if (res.rows.length === 0) return null;
    return {
      id: res.rows[0].id,
      reportId: res.rows[0].report_id,
      userId: res.rows[0].user_id,
      helpful: res.rows[0].helpful,
      rating: res.rows[0].rating,
      comment: res.rows[0].comment,
      createdAt: res.rows[0].created_at,
      updatedAt: res.rows[0].updated_at,
    };
  }
}
