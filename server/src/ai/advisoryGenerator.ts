import { gemini } from "./geminiClient.js";
import { env } from "../config/env.js";
import { systemPrompt } from "./prompts/systemPrompt.js";
import { getGeneralAdvisoryPrompt, AdvisoryInput } from "./prompts/generalAdvisoryPrompt.js";
import { getCropSelectionPrompt } from "./prompts/cropSelectionPrompt.js";
import { getPestDiseasePrompt } from "./prompts/pestDiseasePrompt.js";
import {
  advisoryResponseSchema,
  cropSelectionResponseSchema,
  pestDiseaseResponseSchema
} from "shared";

// Define the raw JSON schemas for Gemini response enforcement (complying with Section 15 & 16)
const advisoryJsonSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    summary: { type: "STRING" },
    confidence: { type: "STRING", enum: ["low", "medium", "high"] },
    understanding: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    immediate_actions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          priority: { type: "STRING", enum: ["urgent", "high", "medium", "low"] },
          action: { type: "STRING" },
          reason: { type: "STRING" },
          timeframe: { type: "STRING" }
        },
        required: ["priority", "action", "reason", "timeframe"]
      }
    },
    possible_causes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          likelihood: { type: "STRING", enum: ["possible", "plausible", "more_likely"] },
          reasoning: { type: "STRING" },
          how_to_check: { type: "STRING" }
        },
        required: ["name", "likelihood", "reasoning", "how_to_check"]
      }
    },
    management_plan: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          timeframe: { type: "STRING" },
          actions: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          expected_observation: { type: "STRING" }
        },
        required: ["timeframe", "actions", "expected_observation"]
      }
    },
    irrigation_guidance: {
      type: "OBJECT",
      properties: {
        recommendation: { type: "STRING" },
        cautions: {
          type: "ARRAY",
          items: { type: "STRING" }
        }
      },
      required: ["recommendation", "cautions"]
    },
    soil_nutrition_guidance: {
      type: "OBJECT",
      properties: {
        recommendation: { type: "STRING" },
        cautions: {
          type: "ARRAY",
          items: { type: "STRING" }
        }
      },
      required: ["recommendation", "cautions"]
    },
    pest_disease_guidance: {
      type: "OBJECT",
      properties: {
        observation: { type: "STRING" },
        integrated_management: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        chemical_safety: { type: "STRING" }
      },
      required: ["observation", "integrated_management", "chemical_safety"]
    },
    monitoring_checklist: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    missing_information: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    escalation_conditions: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    safety_notice: { type: "STRING" },
    disclaimer: { type: "STRING" }
  },
  required: [
    "title",
    "summary",
    "confidence",
    "understanding",
    "immediate_actions",
    "possible_causes",
    "management_plan",
    "irrigation_guidance",
    "soil_nutrition_guidance",
    "pest_disease_guidance",
    "monitoring_checklist",
    "missing_information",
    "escalation_conditions",
    "safety_notice",
    "disclaimer"
  ]
};

const cropSelectionJsonSchema = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    recommended_options: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          crop_name: { type: "STRING" },
          why_it_may_fit: { type: "STRING" },
          water_requirement: { type: "STRING" },
          soil_compatibility: { type: "STRING" },
          main_risks: { type: "STRING" },
          rotation_considerations: { type: "STRING" },
          information_required_before_deciding: { type: "STRING" }
        },
        required: [
          "crop_name",
          "why_it_may_fit",
          "water_requirement",
          "soil_compatibility",
          "main_risks",
          "rotation_considerations",
          "information_required_before_deciding"
        ]
      }
    },
    comparison_factors: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    constraints: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    next_steps: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    missing_information: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    confidence: { type: "STRING", enum: ["low", "medium", "high"] },
    disclaimer: { type: "STRING" }
  },
  required: [
    "summary",
    "recommended_options",
    "comparison_factors",
    "constraints",
    "next_steps",
    "missing_information",
    "confidence",
    "disclaimer"
  ]
};

const pestDiseaseJsonSchema = {
  type: "OBJECT",
  properties: {
    observed_signs: { type: "STRING" },
    possible_causes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          likelihood: { type: "STRING", enum: ["possible", "plausible", "more_likely"] },
          reasoning: { type: "STRING" },
          how_to_check: { type: "STRING" }
        },
        required: ["name", "likelihood", "reasoning", "how_to_check"]
      }
    },
    field_checks: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    immediate_nonchemical_actions: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    when_to_seek_help: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    chemical_safety: { type: "STRING" },
    confidence: { type: "STRING", enum: ["low", "medium", "high"] },
    disclaimer: { type: "STRING" }
  },
  required: [
    "observed_signs",
    "possible_causes",
    "field_checks",
    "immediate_nonchemical_actions",
    "when_to_seek_help",
    "chemical_safety",
    "confidence",
    "disclaimer"
  ]
};

export interface ImageInput {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Calls Gemini and returns validated JSON output
 */
export async function generateAdvisoryReport(
  input: AdvisoryInput,
  images: ImageInput[] = []
): Promise<any> {
  const category = input.category;
  
  // 1. Resolve prompt
  let promptText = "";
  let schemaToUse: any = advisoryJsonSchema;
  let validator: any = advisoryResponseSchema;

  if (category === "crop_selection") {
    promptText = getCropSelectionPrompt(input);
    schemaToUse = cropSelectionJsonSchema;
    validator = cropSelectionResponseSchema;
  } else if (category === "pest_disease") {
    promptText = getPestDiseasePrompt(input);
    schemaToUse = pestDiseaseJsonSchema;
    validator = pestDiseaseResponseSchema;
  } else {
    promptText = getGeneralAdvisoryPrompt(input);
    schemaToUse = advisoryJsonSchema;
    validator = advisoryResponseSchema;
  }

  // 2. Prepare content payload for Gemini SDK
  const contents: any[] = [promptText];

  // Map images into SDK-compatible parts
  for (const img of images) {
    contents.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.buffer.toString("base64")
      }
    });
  }

  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  let attempts = 0;
  const maxAttempts = env.GEMINI_MAX_RETRIES + 1;
  let lastError: any = null;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`🤖 AI Call attempt ${attempts}/${maxAttempts} using model ${model} for category ${category}`);
      
      const response = await gemini.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: schemaToUse as any
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini API");
      }

      // Parse JSON response
      const parsedJson = JSON.parse(responseText);

      // Validate with Zod schema
      const validatedData = validator.parse(parsedJson);
      
      return validatedData;

    } catch (error: any) {
      console.error(`⚠️ AI Generation failed on attempt ${attempts}:`, error);
      lastError = error;

      // Check if it is a transient error or schema mismatch
      // In case of syntax error / JSON parse error, it might be transient or schema mismatch
      if (error instanceof SyntaxError || error.name === "ZodError") {
        // Validation errors might not be resolved by simple retries, but we try once more with Gemini
        continue;
      }
      
      // If it's a network/timeout error, we retry
      continue;
    }
  }

  throw lastError || new Error("Failed to generate advisory after maximum attempts");
}
