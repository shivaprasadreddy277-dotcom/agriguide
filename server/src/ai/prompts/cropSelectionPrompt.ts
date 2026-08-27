import { AdvisoryInput } from "./generalAdvisoryPrompt.js";

export function getCropSelectionPrompt(input: AdvisoryInput): string {
  return `Help the user compare suitable crop options using the supplied location, season, soil, water availability, farm size, priorities, and constraints.

User context:
- Advisory category: ${input.category}
- Crop context: ${input.cropName}
- Variety: ${input.cropVarietyOrUnknown}
- Growth stage: ${input.growthStage}
- Location: ${input.locationOrUnknown}
- Field and farm context: ${input.farmContextOrUnknown}
- Soil information: ${input.soilContextOrUnknown}
- Irrigation and water information: ${input.waterContextOrUnknown}
- Weather and recent conditions: ${input.weatherContextOrUnknown}
- Symptoms: ${input.symptomsOrUnknown}
- Recent applications: ${input.recentApplicationsOrUnknown}
- User question: ${input.question}
- Priority preference: ${input.priorityPreference}
- Output language: ${input.preferredLanguage}
- Unit system: ${input.unitSystem}
- Detail level: ${input.detailLevel}

Instructions:
- Do not claim a crop is guaranteed to succeed.
- Do not invent local climate data.
- If the season, location, or water context is missing, reduce confidence and identify the missing information.
- Prioritize crops that match the user's stated water, cost, risk, and market constraints.
- Clearly distinguish agronomic suitability from profitability.
- Do not provide financial guarantees.
- Return JSON matching the crop selection schema.`;
}
