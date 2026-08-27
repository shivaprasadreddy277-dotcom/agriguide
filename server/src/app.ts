import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { authenticateSession } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errors.js";

// Routes imports
import authRoutes from "./routes/auth.routes.js";
import farmRoutes from "./routes/farms.routes.ts";
import fieldRoutes from "./routes/fields.routes.ts";
import advisoryRoutes from "./routes/advisories.routes.ts";
import healthRoutes from "./routes/health.routes.js";

const app = express();

// Security Headers
app.use(helmet());

// CORS Settings
app.use(
  cors({
    origin: env.APP_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
  })
);

// Body Parsing - Limit set to 10MB to accommodate base64 crop leaf image uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie Parsing
app.use(cookieParser(env.SESSION_SECRET));

// Request Tracking
app.use(requestIdMiddleware);

// Session Authentication Resolver
app.use(authenticateSession);

// API Routes Mounting
app.use("/api/auth", authRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api", fieldRoutes); // fieldRoutes contains '/farms/:farmId/fields' and '/fields/:fieldId'
app.use("/api/advisories", advisoryRoutes);
app.use("/api", healthRoutes); // healthRoutes contains '/health'

// 404 Route Fallback
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Resource not found: ${req.method} ${req.path}`,
    },
    requestId: req.id,
  });
});

// Central Error Boundary Middleware
app.use(errorHandler);

export default app;
export { app };
