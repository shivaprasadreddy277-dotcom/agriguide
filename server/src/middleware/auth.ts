import { Request, Response, NextFunction } from "express";
import { verifySession } from "../security/sessions.js";
import { pool } from "../db/pool.js";

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  preferredLanguage: "en" | "hi";
  unitSystem: "metric" | "imperial";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware that extracts session from secure cookie and resolves user object.
 */
export async function authenticateSession(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.session_token;
  if (!token) {
    return next();
  }

  try {
    const userId = await verifySession(token);
    if (!userId) {
      res.clearCookie("session_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      return next();
    }

    const userRes = await pool.query(
      `SELECT id, full_name, email, preferred_language, unit_system 
       FROM app_users 
       WHERE id = $1 AND is_active = TRUE`,
      [userId]
    );

    if (userRes.rows.length > 0) {
      const dbUser = userRes.rows[0];
      req.user = {
        id: dbUser.id,
        fullName: dbUser.full_name,
        email: dbUser.email,
        preferredLanguage: dbUser.preferred_language,
        unitSystem: dbUser.unit_system,
      };
    } else {
      res.clearCookie("session_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }
    next();
  } catch (error) {
    console.error("Session verification error:", error);
    next();
  }
}

/**
 * Guard middleware that rejects unauthenticated requests.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource.",
      },
    });
  }
  next();
}
