import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

if (!env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY environment variable is missing!");
  process.exit(1);
}

/**
 * Global Gemini Client instance using the official @google/genai SDK
 */
export const gemini = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});
