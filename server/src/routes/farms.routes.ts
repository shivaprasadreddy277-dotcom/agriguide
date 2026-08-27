import { Router } from "express";
import { FarmRepository } from "../repositories/farm.repository.js";
import { farmCreateSchema, farmUpdateSchema } from "shared";
import { requireAuth } from "../middleware/auth.js";
import { executeInTransaction } from "../db/pool.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const farms = await executeInTransaction(req.user!.id, (client) =>
      FarmRepository.findFarmsByUserId(req.user!.id, client)
    );
    return res.json({ success: true, data: farms });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = farmCreateSchema.parse(req.body);
    const farm = await executeInTransaction(req.user!.id, (client) =>
      FarmRepository.createFarm(req.user!.id, data, client)
    );
    return res.status(201).json({ success: true, data: farm });
  } catch (error) {
    return next(error);
  }
});

router.get("/:farmId", async (req, res, next) => {
  try {
    const farm = await executeInTransaction(req.user!.id, (client) =>
      FarmRepository.findFarmById(req.user!.id, req.params.farmId, client)
    );
    if (!farm) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Farm not found.",
        },
      });
    }
    return res.json({ success: true, data: farm });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:farmId", async (req, res, next) => {
  try {
    const data = farmUpdateSchema.parse(req.body);
    const farm = await executeInTransaction(req.user!.id, (client) =>
      FarmRepository.updateFarm(req.user!.id, req.params.farmId, data, client)
    );
    if (!farm) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Farm not found.",
        },
      });
    }
    return res.json({ success: true, data: farm });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:farmId", async (req, res, next) => {
  try {
    const success = await executeInTransaction(req.user!.id, (client) =>
      FarmRepository.deleteFarm(req.user!.id, req.params.farmId, client)
    );
    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Farm not found.",
        },
      });
    }
    return res.json({ success: true, data: {} });
  } catch (error) {
    return next(error);
  }
});

router.post("/:farmId/default", async (req, res, next) => {
  try {
    const farm = await executeInTransaction(req.user!.id, (client) =>
      FarmRepository.setDefaultFarm(req.user!.id, req.params.farmId, client)
    );
    if (!farm) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Farm not found.",
        },
      });
    }
    return res.json({ success: true, data: farm });
  } catch (error) {
    return next(error);
  }
});

export default router;
