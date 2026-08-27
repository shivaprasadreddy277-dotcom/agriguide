import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  fields?: Record<string, string>;
}

/**
 * Express error handler middleware that catches Zod errors and custom exceptions,
 * and formats them into a unified API response format.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = req.id || "unknown";
  
  // Log the complete error trace on the server
  console.error(`[API-ERROR] req_id=${requestId} path=${req.path} method=${req.method} error:`, err);

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    err.errors.forEach((e) => {
      const pathKey = e.path.join(".");
      fields[pathKey] = e.message;
    });

    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the highlighted fields.",
        fields,
      },
      requestId,
    });
  }

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || "INTERNAL_SERVER_ERROR";
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "An unexpected error occurred. Please try again later."
      : err.message || "An unexpected error occurred.";

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(err.fields ? { fields: err.fields } : {}),
    },
    requestId,
  });
}
