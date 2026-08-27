import { registerSchema, loginSchema, farmCreateSchema, fieldCreateSchema, advisoryRequestSchema, feedbackSchema, forgotPasswordSchema, resetPasswordSchema } from "shared";
import { z } from "zod";

export class ApiError extends Error {
  code: string;
  fields?: Record<string, string>;
  requestId?: string;

  constructor(message: string, code: string, fields?: Record<string, string>, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.fields = fields;
    this.requestId = requestId;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  let json: any;
  try {
    json = await response.json();
  } catch {
    throw new ApiError("Failed to parse response from server.", "PARSE_ERROR");
  }

  if (!response.ok) {
    const errorDetails = json.error || {};
    throw new ApiError(
      errorDetails.message || "An error occurred on the server.",
      errorDetails.code || "SERVER_ERROR",
      errorDetails.fields,
      json.requestId
    );
  }

  return json.data;
}

export const api = {
  auth: {
    register: (data: z.infer<typeof registerSchema>) =>
      request("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: z.infer<typeof loginSchema>) =>
      request("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
    forgotPassword: (data: z.infer<typeof forgotPasswordSchema>) =>
      request("/api/auth/forgot-password", { method: "POST", body: JSON.stringify(data) }),
    resetPassword: (data: z.infer<typeof resetPasswordSchema>) =>
      request("/api/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),
    logout: () => request("/api/auth/logout", { method: "POST" }),
    me: () => request("/api/auth/me"),
    updateProfile: (data: { fullName: string; preferredLanguage: "en" | "hi"; unitSystem: "metric" | "imperial" }) =>
      request("/api/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
    deleteAccount: () => request("/api/auth/me", { method: "DELETE" }),
  },
  farms: {
    list: () => request("/api/farms"),
    create: (data: z.infer<typeof farmCreateSchema>) =>
      request("/api/farms", { method: "POST", body: JSON.stringify(data) }),
    get: (farmId: string) => request(`/api/farms/${farmId}`),
    update: (farmId: string, data: Partial<z.infer<typeof farmCreateSchema>>) =>
      request(`/api/farms/${farmId}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (farmId: string) => request(`/api/farms/${farmId}`, { method: "DELETE" }),
    setDefault: (farmId: string) => request(`/api/farms/${farmId}/default`, { method: "POST" }),
  },
  fields: {
    list: (farmId: string) => request(`/api/farms/${farmId}/fields`),
    create: (farmId: string, data: z.infer<typeof fieldCreateSchema>) =>
      request(`/api/farms/${farmId}/fields`, { method: "POST", body: JSON.stringify(data) }),
    get: (fieldId: string) => request(`/api/fields/${fieldId}`),
    update: (fieldId: string, data: Partial<z.infer<typeof fieldCreateSchema>>) =>
      request(`/api/fields/${fieldId}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (fieldId: string) => request(`/api/fields/${fieldId}`, { method: "DELETE" }),
  },
  advisories: {
    list: (params: { page?: number; pageSize?: number; search?: string; category?: string; status?: string; sort?: string }) => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") q.append(k, String(v));
      });
      return request(`/api/advisories?${q.toString()}`);
    },
    create: (data: z.infer<typeof advisoryRequestSchema> & { images?: { data: string; mimeType: string }[]; idempotencyKey?: string }) =>
      request("/api/advisories", { method: "POST", body: JSON.stringify(data) }),
    get: (advisoryId: string) => request(`/api/advisories/${advisoryId}`),
    delete: (advisoryId: string) => request(`/api/advisories/${advisoryId}`, { method: "DELETE" }),
    retry: (advisoryId: string) => request(`/api/advisories/${advisoryId}/retry`, { method: "POST" }),
    submitFeedback: (reportId: string, data: z.infer<typeof feedbackSchema>) =>
      request(`/api/advisories/reports/${reportId}/feedback`, { method: "POST", body: JSON.stringify(data) }),
    getFeedback: (reportId: string) =>
      request(`/api/advisories/reports/${reportId}/feedback`),
  },
};
