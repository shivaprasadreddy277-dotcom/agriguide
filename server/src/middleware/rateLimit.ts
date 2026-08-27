import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

/**
 * Rate limiter for authentication routes (login, register).
 */
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many login/registration attempts. Please try again later.",
    },
  },
});

/**
 * Rate limiter for AI advisory generation requests.
 */
export const advisoryLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_ADVISORY_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many advisory generation requests. Please try again later.",
    },
  },
});
