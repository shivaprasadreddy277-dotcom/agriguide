import { z } from "zod";

// Password policy: At least 8 characters, at least one letter, at least one number
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .refine((val) => /[a-zA-Z]/.test(val), "Password must contain at least one letter")
  .refine((val) => /[0-9]/.test(val), "Password must contain at least one number");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required").max(120),
    email: z.string().trim().toLowerCase().email("Invalid email address").max(320),
    password: passwordSchema,
    preferredLanguage: z.enum(["en", "hi"]).default("en"),
    unitSystem: z.enum(["metric", "imperial"]).default("metric"),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const profileUpdateSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name cannot be empty").max(120),
    preferredLanguage: z.enum(["en", "hi"]),
    unitSystem: z.enum(["metric", "imperial"]),
  })
  .strict();

export const farmCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Farm name is required").max(160),
    country: z.string().trim().min(1, "Country is required").max(100),
    stateProvince: z.string().trim().max(120).nullable().optional(),
    districtCounty: z.string().trim().max(120).nullable().optional(),
    locality: z.string().trim().max(160).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    totalArea: z.number().positive("Area must be greater than zero").nullable().optional(),
    areaUnit: z.enum(["hectare", "acre", "square_meter", "square_feet"]).default("hectare"),
    soilType: z.string().trim().max(100).nullable().optional(),
    irrigationAvailability: z.enum(["none", "rainfed", "partial", "reliable"]).nullable().optional(),
    waterSource: z.string().trim().max(100).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    isDefault: z.boolean().default(false),
  })
  .strict();

export const farmUpdateSchema = farmCreateSchema.partial();

export const fieldCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Field name is required").max(160),
    area: z.number().positive("Area must be greater than zero").nullable().optional(),
    areaUnit: z.enum(["hectare", "acre", "square_meter", "square_feet"]).default("hectare"),
    soilType: z.string().trim().max(100).nullable().optional(),
    irrigationMethod: z.string().trim().max(100).nullable().optional(),
    waterSource: z.string().trim().max(100).nullable().optional(),
    currentCrop: z.string().trim().max(160).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

export const fieldUpdateSchema = fieldCreateSchema.partial();

export const advisoryRequestSchema = z
  .object({
    farmId: z.string().uuid().nullable().optional(),
    fieldId: z.string().uuid().nullable().optional(),
    category: z.enum([
      "crop_selection",
      "land_preparation",
      "seed_selection",
      "sowing_planting",
      "irrigation",
      "soil_nutrition",
      "pest_disease",
      "weed_management",
      "weather_stress",
      "growth_stage",
      "harvest",
      "post_harvest",
      "general",
    ]),
    cropName: z.string().trim().min(2, "Crop name must be at least 2 characters").max(160),
    cropVariety: z.string().trim().max(160).nullable().optional(),
    growthStage: z.enum([
      "pre_sowing",
      "seedling",
      "vegetative",
      "flowering",
      "fruiting_grain_filling",
      "maturity",
      "harvest",
      "post_harvest",
      "unknown",
    ]),
    question: z.string().trim().min(10, "Question must be at least 10 characters").max(2000),
    preferredLanguage: z.enum(["en", "hi"]).default("en"),
    detailLevel: z.enum(["quick", "standard", "detailed"]).default("standard"),
    priorityPreference: z
      .enum([
        "reduce_cost",
        "reduce_water",
        "maximize_yield",
        "organic_compatible",
        "reduce_crop_loss",
        "general",
      ])
      .default("general"),
    soil: z
      .object({
        type: z.string().trim().max(100).nullable().optional(),
        ph: z.number().min(0).max(14).nullable().optional(),
        nitrogen: z.number().nonnegative().nullable().optional(),
        phosphorus: z.number().nonnegative().nullable().optional(),
        potassium: z.number().nonnegative().nullable().optional(),
        organicMatter: z.number().nonnegative().nullable().optional(),
      })
      .strict()
      .optional(),
    water: z
      .object({
        irrigationAvailability: z.enum(["none", "rainfed", "partial", "reliable"]).nullable().optional(),
        source: z.string().trim().max(100).nullable().optional(),
        recentIrrigation: z.string().trim().max(500).nullable().optional(),
        recentRainfall: z.string().trim().max(500).nullable().optional(),
      })
      .strict()
      .optional(),
    symptoms: z.string().trim().max(2000).nullable().optional(),
    affectedPercentage: z.number().min(0).max(100).nullable().optional(),
    symptomStartDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
      .nullable()
      .optional(),
    recentApplications: z.string().trim().max(1000).nullable().optional(),
    weatherStress: z.string().trim().max(1000).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

export const advisoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["queued", "generating", "completed", "failed"]).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

export const feedbackSchema = z
  .object({
    helpful: z.boolean(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    comment: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

// ==========================================
// Structured Gemini Output Schemas
// ==========================================

export const advisoryResponseSchema = z
  .object({
    title: z.string().min(5).max(180),
    summary: z.string().min(20).max(1200),
    confidence: z.enum(["low", "medium", "high"]),
    understanding: z.array(z.string().min(5).max(400)).min(1).max(8),
    immediate_actions: z
      .array(
        z.object({
          priority: z.enum(["urgent", "high", "medium", "low"]),
          action: z.string().min(10).max(500),
          reason: z.string().min(10).max(500),
          timeframe: z.string().min(3).max(100),
        }).strict()
      )
      .min(1)
      .max(3),
    possible_causes: z
      .array(
        z.object({
          name: z.string().min(3).max(180),
          likelihood: z.enum(["possible", "plausible", "more_likely"]),
          reasoning: z.string().min(10).max(700),
          how_to_check: z.string().min(10).max(700),
        }).strict()
      )
      .max(6),
    management_plan: z
      .array(
        z.object({
          timeframe: z.string().min(3).max(100),
          actions: z.array(z.string().min(10).max(500)).min(1).max(6),
          expected_observation: z.string().min(10).max(500),
        }).strict()
      )
      .max(12),
    irrigation_guidance: z
      .object({
        recommendation: z.string().max(1200),
        cautions: z.array(z.string().max(400)).max(5),
      })
      .strict(),
    soil_nutrition_guidance: z
      .object({
        recommendation: z.string().max(1200),
        cautions: z.array(z.string().max(400)).max(5),
      })
      .strict(),
    pest_disease_guidance: z
      .object({
        observation: z.string().max(1200),
        integrated_management: z.array(z.string().max(500)).max(8),
        chemical_safety: z.string().max(1200),
      })
      .strict(),
    monitoring_checklist: z.array(z.string().min(5).max(400)).min(1).max(10),
    missing_information: z.array(z.string().max(300)).max(10),
    escalation_conditions: z.array(z.string().min(10).max(500)).min(1).max(8),
    safety_notice: z.string().min(20).max(1200),
    disclaimer: z.string().min(20).max(800),
  })
  .strict();

export const cropSelectionResponseSchema = z
  .object({
    summary: z.string().min(20).max(1200),
    recommended_options: z
      .array(
        z.object({
          crop_name: z.string().min(2).max(100),
          why_it_may_fit: z.string().min(10).max(800),
          water_requirement: z.string().min(5).max(400),
          soil_compatibility: z.string().min(5).max(400),
          main_risks: z.string().min(5).max(600),
          rotation_considerations: z.string().min(5).max(600),
          information_required_before_deciding: z.string().min(5).max(600),
        }).strict()
      )
      .min(1)
      .max(6),
    comparison_factors: z.array(z.string().max(500)).max(8),
    constraints: z.array(z.string().max(500)).max(8),
    next_steps: z.array(z.string().max(500)).max(8),
    missing_information: z.array(z.string().max(300)).max(10),
    confidence: z.enum(["low", "medium", "high"]),
    disclaimer: z.string().min(20).max(800),
  })
  .strict();

export const pestDiseaseResponseSchema = z
  .object({
    observed_signs: z.string().max(1200),
    possible_causes: z
      .array(
        z.object({
          name: z.string().min(3).max(180),
          likelihood: z.enum(["possible", "plausible", "more_likely"]),
          reasoning: z.string().min(10).max(700),
          how_to_check: z.string().min(10).max(700),
        }).strict()
      )
      .min(1)
      .max(4),
    field_checks: z.array(z.string().max(500)).max(8),
    immediate_nonchemical_actions: z.array(z.string().max(500)).max(8),
    when_to_seek_help: z.array(z.string().max(500)).max(8),
    chemical_safety: z.string().max(1200),
    confidence: z.enum(["low", "medium", "high"]),
    disclaimer: z.string().min(20).max(800),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Invalid email address").max(320),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
  })
  .strict();
