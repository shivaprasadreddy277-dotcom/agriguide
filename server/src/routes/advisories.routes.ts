import { Router } from "express";
import { AdvisoryRepository } from "../repositories/advisory.repository.js";
import { FarmRepository } from "../repositories/farm.repository.js";
import { FieldRepository } from "../repositories/field.repository.js";
import { generateAdvisoryReport, ImageInput } from "../ai/advisoryGenerator.ts";
import { advisoryRequestSchema, feedbackSchema, advisoryQuerySchema } from "shared";
import { requireAuth } from "../middleware/auth.js";
import { advisoryLimiter } from "../middleware/rateLimit.js";
import { executeInTransaction } from "../db/pool.js";
import { env } from "../config/env.js";
import { createHash } from "crypto";

const router = Router();

router.use(requireAuth);

/**
 * Validates base64 image magic bytes signature to prevent executable spoofing.
 */
function validateImage(base64Data: string, mimeType: string): Buffer {
  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("Image exceeds maximum 5MB size limit");
  }

  let isValid = false;
  if (mimeType === "image/jpeg") {
    isValid = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  } else if (mimeType === "image/png") {
    isValid =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;
  } else if (mimeType === "image/webp") {
    const isRiff =
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    isValid = isRiff && isWebp;
  }

  if (!isValid) {
    throw new Error(`Invalid file signature for MIME type: ${mimeType}`);
  }

  return buffer;
}

/**
 * Helper to orchestrate the AI generation and database updates.
 */
async function runAdvisoryGeneration(
  userId: string,
  requestId: string,
  data: any,
  images: ImageInput[]
) {
  try {
    // 1. Update status to generating & increment attempts
    await executeInTransaction(userId, async (client) => {
      await AdvisoryRepository.updateRequestStatus(requestId, "generating", undefined, client);
      await AdvisoryRepository.incrementAttempts(requestId, client);
    });

    // 2. Fetch context from Farm and Field if associated
    let locationOrUnknown = "Unknown";
    let farmContextOrUnknown = "Unknown";
    let soilContextOrUnknown = "Unknown";
    let waterContextOrUnknown = "Unknown";

    if (data.farmId) {
      await executeInTransaction(userId, async (client) => {
        const farm = await FarmRepository.findFarmById(userId, data.farmId, client);
        if (farm) {
          locationOrUnknown = `${farm.locality || "Unknown"}, ${farm.districtCounty || "Unknown"}, ${farm.stateProvince || "Unknown"}, ${farm.country}`;
          farmContextOrUnknown = `Farm: ${farm.name}, Area: ${farm.totalArea} ${farm.areaUnit}, Notes: ${farm.notes || "None"}`;
          soilContextOrUnknown = `Soil Type: ${farm.soilType || "Unknown"}`;
          waterContextOrUnknown = `Irrigation: ${farm.irrigationAvailability || "Unknown"}, Water Source: ${farm.waterSource || "Unknown"}`;
        }
      });
    }

    if (data.fieldId) {
      await executeInTransaction(userId, async (client) => {
        const field = await FieldRepository.findFieldById(userId, data.fieldId, client);
        if (field) {
          farmContextOrUnknown += ` | Field: ${field.name}, Area: ${field.area} ${field.areaUnit}, Current Crop: ${field.currentCrop || "None"}, Notes: ${field.notes || "None"}`;
          if (field.soilType) soilContextOrUnknown += ` | Field Soil Type: ${field.soilType}`;
          if (field.irrigationMethod || field.waterSource) {
            waterContextOrUnknown += ` | Field Irrigation Method: ${field.irrigationMethod || "Unknown"}, Water Source: ${field.waterSource || "Unknown"}`;
          }
        }
      });
    }

    // Mix in technical soil tests if supplied directly in request
    if (data.soil) {
      const s = data.soil;
      soilContextOrUnknown += ` | User Soil Info - Type: ${s.type || "N/A"}, pH: ${s.ph || "N/A"}, Nitrogen: ${s.nitrogen || "N/A"}, Phosphorus: ${s.phosphorus || "N/A"}, Potassium: ${s.potassium || "N/A"}, Organic Matter: ${s.organicMatter || "N/A"}`;
    }

    // Mix in water details if supplied directly
    if (data.water) {
      const w = data.water;
      waterContextOrUnknown += ` | User Water Info - Irrigation Availability: ${w.irrigationAvailability || "N/A"}, Source: ${w.source || "N/A"}, Recent Irrigation: ${w.recentIrrigation || "N/A"}, Recent Rainfall: ${w.recentRainfall || "N/A"}`;
    }

    const aiInput = {
      category: data.category,
      cropName: data.cropName,
      cropVarietyOrUnknown: data.cropVariety || "Unknown",
      growthStage: data.growthStage,
      locationOrUnknown,
      farmContextOrUnknown,
      soilContextOrUnknown,
      waterContextOrUnknown,
      weatherContextOrUnknown: data.weatherStress || "Unknown",
      symptomsOrUnknown: data.symptoms || "None reported",
      recentApplicationsOrUnknown: data.recentApplications || "None reported",
      question: data.question,
      priorityPreference: data.priorityPreference || "general",
      preferredLanguage: data.preferredLanguage || "en",
      unitSystem: data.unitSystem || "metric",
      detailLevel: data.detailLevel || "standard",
    };

    // 3. Call Gemini
    const reportJson = await generateAdvisoryReport(aiInput, images);

    // 4. Save report & complete request
    const promptVersion = env.GEMINI_PROMPT_VERSION || "v1";
    const modelName = env.GEMINI_MODEL || "gemini-2.5-flash";
    const inputHash = createHash("sha256").update(JSON.stringify(aiInput)).digest("hex");

    await executeInTransaction(userId, async (client) => {
      await AdvisoryRepository.createReport(
        requestId,
        userId,
        reportJson,
        modelName,
        promptVersion,
        inputHash,
        client
      );
    });

    console.log(`✅ Advisory report generated successfully for request ${requestId}`);
  } catch (err: any) {
    console.error(`❌ Advisory generation failed for request ${requestId}:`, err);
    
    // Log failure in database
    await executeInTransaction(userId, async (client) => {
      await AdvisoryRepository.updateRequestStatus(
        requestId,
        "failed",
        {
          code: "AI_GENERATION_FAILED",
          message: err.message || "An unexpected error occurred during AI analysis.",
        },
        client
      );
    });
  }
}

// -------------------------------------------------------------
// Route Definitions
// -------------------------------------------------------------

router.get("/", async (req, res, next) => {
  try {
    const filters = advisoryQuerySchema.parse(req.query);
    const result = await executeInTransaction(req.user!.id, (client) =>
      AdvisoryRepository.queryAdvisories(req.user!.id, filters, client)
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
});

router.post("/", advisoryLimiter, async (req, res, next) => {
  try {
    // 1. Zod parse body
    const bodyData = req.body;
    const data = advisoryRequestSchema.parse(bodyData);

    // 2. Validate images if uploaded in json body
    const images: ImageInput[] = [];
    if (bodyData.images && Array.isArray(bodyData.images)) {
      if (bodyData.images.length > 3) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Maximum of 3 images can be uploaded.",
          },
        });
      }
      for (const img of bodyData.images) {
        if (!img.data || !img.mimeType) {
          return res.status(400).json({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Images must contain both 'data' (base64) and 'mimeType'.",
            },
          });
        }
        try {
          const buffer = validateImage(img.data, img.mimeType);
          images.push({ buffer, mimeType: img.mimeType });
        } catch (e: any) {
          return res.status(400).json({
            success: false,
            error: {
              code: "BAD_IMAGE",
              message: e.message || "Image validation failed.",
            },
          });
        }
      }
    }

    // 3. Verify farm & field ownership if passed
    if (data.farmId) {
      const farmExists = await executeInTransaction(req.user!.id, (client) =>
        FarmRepository.findFarmById(req.user!.id, data.farmId!, client)
      );
      if (!farmExists) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Unauthorized farm access.",
          },
        });
      }
    }

    if (data.fieldId) {
      const fieldOwner = await executeInTransaction(req.user!.id, (client) =>
        FieldRepository.verifyFieldOwnership(req.user!.id, data.fieldId!, client)
      );
      if (!fieldOwner) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Unauthorized field access.",
          },
        });
      }
    }

    // 4. Create request in database as queued
    const idempotencyKey = bodyData.idempotencyKey;
    const request = await executeInTransaction(req.user!.id, (client) =>
      AdvisoryRepository.createRequest(req.user!.id, data, images.length, idempotencyKey, client)
    );

    // If it's already completed or generating due to idempotency, return it
    if (request.status === "completed" || request.status === "generating") {
      return res.json({ success: true, data: request });
    }

    // 5. Fire off asynchronous generation (Express continues, user gets request details with status generating)
    // Run in background and catch any failures
    runAdvisoryGeneration(req.user!.id, request.id, { ...data, unitSystem: req.user!.unitSystem }, images);

    return res.status(202).json({
      success: true,
      data: {
        ...request,
        status: "generating", // indicate it has started processing immediately
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:advisoryId", async (req, res, next) => {
  try {
    const request = await executeInTransaction(req.user!.id, (client) =>
      AdvisoryRepository.findRequestById(req.user!.id, req.params.advisoryId, client)
    );
    if (!request) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Advisory request not found.",
        },
      });
    }

    let report = null;
    if (request.status === "completed") {
      report = await executeInTransaction(req.user!.id, (client) =>
        AdvisoryRepository.findReportByRequestId(req.user!.id, request.id, client)
      );
    }

    return res.json({
      success: true,
      data: {
        request,
        report: report ? report.reportJson : null,
        metadata: report
          ? {
              modelName: report.modelName,
              promptVersion: report.promptVersion,
              createdAt: report.createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:advisoryId", async (req, res, next) => {
  try {
    const success = await executeInTransaction(req.user!.id, (client) =>
      AdvisoryRepository.deleteAdvisory(req.user!.id, req.params.advisoryId, client)
    );
    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Advisory request not found.",
        },
      });
    }
    return res.json({ success: true, data: {} });
  } catch (error) {
    return next(error);
  }
});

router.post("/:advisoryId/retry", advisoryLimiter, async (req, res, next) => {
  try {
    const request = await executeInTransaction(req.user!.id, (client) =>
      AdvisoryRepository.findRequestById(req.user!.id, req.params.advisoryId, client)
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Advisory request not found.",
        },
      });
    }

    if (request.status !== "failed") {
      return res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Only failed requests can be retried.",
        },
      });
    }

    if (request.generationAttempts >= 3) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MAX_RETRIES_EXCEEDED",
          message: "This request has reached the maximum retry limit of 3 attempts.",
        },
      });
    }

    // Re-run generation in background
    runAdvisoryGeneration(
      req.user!.id,
      request.id,
      { ...request.inputSnapshot, unitSystem: req.user!.unitSystem },
      [] // Note: temporary image bytes are deleted after original process, so retry runs text-only or starts fresh.
    );

    return res.json({
      success: true,
      data: {
        ...request,
        status: "generating",
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/reports/:reportId/feedback", async (req, res, next) => {
  try {
    const data = feedbackSchema.parse(req.body);
    const report = await executeInTransaction(req.user!.id, (client) =>
      AdvisoryRepository.findReportById(req.user!.id, req.params.reportId, client)
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Report not found.",
        },
      });
    }

    const feedback = await executeInTransaction(req.user!.id, (client) =>
      AdvisoryRepository.upsertFeedback(req.user!.id, req.params.reportId, data, client)
    );

    return res.json({ success: true, data: feedback });
  } catch (error) {
    return next(error);
  }
});

router.get("/reports/:reportId/feedback", async (req, res, next) => {
  try {
    const report = await executeInTransaction(req.user!.id, (client) =>
      AdvisoryRepository.findReportById(req.user!.id, req.params.reportId, client)
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Report not found.",
        },
      });
    }

    const feedback = await executeInTransaction(req.user!.id, (client) =>
      AdvisoryRepository.findFeedbackByReportId(req.user!.id, req.params.reportId, client)
    );

    return res.json({ success: true, data: feedback });
  } catch (error) {
    return next(error);
  }
});

export default router;
