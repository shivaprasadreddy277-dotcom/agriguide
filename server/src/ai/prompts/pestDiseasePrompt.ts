import { AdvisoryInput } from "./generalAdvisoryPrompt.js";

export function getPestDiseasePrompt(input: AdvisoryInput): string {
  return `Triage the reported crop symptoms without claiming a confirmed diagnosis.

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
- Use the description and images only as indicative evidence.
- List up to three plausible causes.
- For each cause, explain the distinguishing signs the user should inspect.
- Prioritize non-chemical and integrated pest management steps.
- If chemical treatment may be relevant, instruct the user to consult the legally approved product label and a local agricultural professional. Do not invent product names, dosages, concentrations, tank mixes, or waiting periods.
- Identify when the user should collect a sample or contact a plant clinic, extension officer, or agronomist.
- Return JSON matching the pest and disease triage schema.`;
}
