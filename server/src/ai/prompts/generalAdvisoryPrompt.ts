export interface GeneralAdvisoryInput {
  category: string;
  cropName: string;
  cropVarietyOrUnknown: string;
  growthStage: string;
  locationOrUnknown: string;
  farmContextOrUnknown: string;
  soilContextOrUnknown: string;
  waterContextOrUnknown: string;
  weatherContextOrUnknown: string;
  symptomsOrUnknown: string;
  recentApplicationsOrUnknown: string;
  question: string;
  priorityPreference: string;
  preferredLanguage: string;
  unitSystem: string;
  detailLevel: string;
}

export function getGeneralAdvisoryPrompt(input: GeneralAdvisoryInput): string {
  return `Generate a structured crop advisory using the supplied agricultural context.

User context:
- Advisory category: ${input.category}
- Crop: ${input.cropName}
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
- Answer the user's question directly.
- Put the three most useful actions first.
- Use cautious, evidence-aware language.
- Do not invent missing facts.
- Do not fabricate sources or URLs.
- Do not provide unsafe chemical instructions.
- Include local confirmation guidance when appropriate.
- Return valid JSON matching the required schema exactly.`;
}
export type { GeneralAdvisoryInput as AdvisoryInput };
