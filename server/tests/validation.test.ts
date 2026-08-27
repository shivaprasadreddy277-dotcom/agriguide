import { describe, it, expect } from "vitest";
import { registerSchema, farmCreateSchema, advisoryRequestSchema } from "shared";

describe("Validation Schemas tests", () => {
  describe("Registration Schema", () => {
    it("should accept valid inputs", () => {
      const valid = {
        fullName: "Test User",
        email: "test@example.com",
        password: "Password123", // Has both letters & numbers, min 8 chars
        preferredLanguage: "en",
        unitSystem: "metric",
      };
      const res = registerSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("should reject password without numbers", () => {
      const invalid = {
        fullName: "Test User",
        email: "test@example.com",
        password: "NoNumbersPassword",
        preferredLanguage: "en",
        unitSystem: "metric",
      };
      const res = registerSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("should reject invalid email", () => {
      const invalid = {
        fullName: "Test User",
        email: "invalid-email",
        password: "Password123",
        preferredLanguage: "en",
        unitSystem: "metric",
      };
      const res = registerSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("Farm Creation Schema", () => {
    it("should accept valid inputs", () => {
      const valid = {
        name: "Valley Farm",
        country: "India",
        stateProvince: "Punjab",
        totalArea: 10.5,
        areaUnit: "hectare",
        soilType: "Alluvial",
        irrigationAvailability: "reliable",
      };
      const res = farmCreateSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("should reject negative total area", () => {
      const invalid = {
        name: "Valley Farm",
        country: "India",
        totalArea: -2,
        areaUnit: "hectare",
      };
      const res = farmCreateSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("Advisory Request Schema", () => {
    it("should accept valid requests", () => {
      const valid = {
        category: "pest_disease",
        cropName: "Tomato",
        growthStage: "flowering",
        question: "Why are my tomato leaves turning yellow with brown spots?",
        preferredLanguage: "en",
        detailLevel: "standard",
        priorityPreference: "general",
      };
      const res = advisoryRequestSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("should reject questions that are too short", () => {
      const invalid = {
        category: "pest_disease",
        cropName: "Tomato",
        growthStage: "flowering",
        question: "Short?", // min is 10
      };
      const res = advisoryRequestSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });
});
