import { Router } from "express";
import { FieldRepository } from "../repositories/field.repository.js";
import { fieldCreateSchema, fieldUpdateSchema } from "shared";
import { requireAuth } from "../middleware/auth.js";
import { executeInTransaction } from "../db/pool.js";

const router = Router();

router.use(requireAuth);

router.get("/farms/:farmId/fields", async (req, res, next) => {
  try {
    const fields = await executeInTransaction(req.user!.id, (client) =>
      FieldRepository.findFieldsByFarmId(req.user!.id, req.params.farmId, client)
    );
    return res.json({ success: true, data: fields });
  } catch (error) {
    return next(error);
  }
});

router.post("/farms/:farmId/fields", async (req, res, next) => {
  try {
    const data = fieldCreateSchema.parse(req.body);
    const field = await executeInTransaction(req.user!.id, (client) =>
      FieldRepository.createField(req.user!.id, req.params.farmId, data, client)
    );
    return res.status(201).json({ success: true, data: field });
  } catch (error) {
    return next(error);
  }
});

router.get("/fields/:fieldId", async (req, res, next) => {
  try {
    const field = await executeInTransaction(req.user!.id, (client) =>
      FieldRepository.findFieldById(req.user!.id, req.params.fieldId, client)
    );
    if (!field) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Field not found.",
        },
      });
    }
    return res.json({ success: true, data: field });
  } catch (error) {
    return next(error);
  }
});

router.patch("/fields/:fieldId", async (req, res, next) => {
  try {
    const data = fieldUpdateSchema.parse(req.body);
    const field = await executeInTransaction(req.user!.id, (client) =>
      FieldRepository.updateField(req.user!.id, req.params.fieldId, data, client)
    );
    if (!field) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Field not found.",
        },
      });
    }
    return res.json({ success: true, data: field });
  } catch (error) {
    return next(error);
  }
});

router.delete("/fields/:fieldId", async (req, res, next) => {
  try {
    const success = await executeInTransaction(req.user!.id, (client) =>
      FieldRepository.deleteField(req.user!.id, req.params.fieldId, client)
    );
    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Field not found.",
        },
      });
    }
    return res.json({ success: true, data: {} });
  } catch (error) {
    return next(error);
  }
});

export default router;
