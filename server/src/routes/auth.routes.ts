import { Router } from "express";
import { randomBytes } from "crypto";
import { UserRepository } from "../repositories/user.repository.js";
import { createSession, revokeSession, hashToken } from "../security/sessions.js";
import { hashPassword, verifyPassword } from "../security/hashing.js";
import { registerSchema, loginSchema, profileUpdateSchema, forgotPasswordSchema, resetPasswordSchema } from "shared";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { executeInTransaction, pool } from "../db/pool.js";
import { env } from "../config/env.js";

const router = Router();

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await UserRepository.findUserByEmail(data.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: "EMAIL_IN_USE",
          message: "A user with this email address already exists.",
        },
      });
    }

    const passwordHash = await hashPassword(data.password);

    // Create user and session transactionally
    const result = await executeInTransaction(null, async (client) => {
      const user = await UserRepository.createUser(
        data.fullName,
        data.email,
        passwordHash,
        data.preferredLanguage,
        data.unitSystem,
        null,
        client
      );

      // Create session
      const token = await createSession(
        user.id,
        req.headers["user-agent"] || null,
        req.ip || null,
        client
      );

      return { user, token };
    });

    res.cookie("session_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(201).json({
      success: true,
      data: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        preferredLanguage: result.user.preferredLanguage,
        unitSystem: result.user.unitSystem,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await UserRepository.findUserByEmail(data.email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        },
      });
    }

    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        },
      });
    }

    const token = await createSession(
      user.id,
      req.headers["user-agent"] || null,
      req.ip || null
    );

    res.cookie("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        preferredLanguage: user.preferredLanguage,
        unitSystem: user.unitSystem,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.session_token;
    if (token) {
      await revokeSession(token);
    }
    res.clearCookie("session_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return res.json({ success: true, data: {} });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  return res.json({
    success: true,
    data: req.user,
  });
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const data = profileUpdateSchema.parse(req.body);
    const updatedUser = await UserRepository.updateUser(req.user!.id, {
      fullName: data.fullName,
      preferredLanguage: data.preferredLanguage,
      unitSystem: data.unitSystem,
    });

    return res.json({
      success: true,
      data: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        preferredLanguage: updatedUser.preferredLanguage,
        unitSystem: updatedUser.unitSystem,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/me", requireAuth, async (req, res, next) => {
  try {
    await executeInTransaction(req.user!.id, async (client) => {
      await UserRepository.deleteUser(req.user!.id, client);
    });

    res.clearCookie("session_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.json({ success: true, data: {} });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// Google OAuth2 Authentication Routes
// ==========================================

router.get("/google", (req, res) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    if (env.NODE_ENV === "development") {
      console.log("🛠️ Google credentials unconfigured. Redirecting to development Mock Google Account Chooser.");
      return res.redirect("/api/auth/google/mock-chooser");
    }
    return res.status(400).json({
      success: false,
      error: {
        code: "OAUTH_NOT_CONFIGURED",
        message: "Google Login is not configured on this server. Add client secrets to .env",
      },
    });
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID
    }&redirect_uri=${encodeURIComponent(
      env.GOOGLE_REDIRECT_URI
    )}&response_type=code&scope=openid%20email%20profile`;

  return res.redirect(authUrl);
});

router.get("/google/mock-chooser", (req, res) => {
  if (env.NODE_ENV !== "development") {
    return res.status(403).send("Forbidden");
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Sign in with Google - Mock Account Chooser</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Outfit', sans-serif;
          background-color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 16px;
          box-sizing: border-box;
        }
        .card {
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 32px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
          text-align: center;
        }
        .logo {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 24px;
          color: #0f172a;
          margin-bottom: 24px;
        }
        h2 {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px 0;
        }
        p {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 24px 0;
          line-height: 1.5;
        }
        .form-group {
          text-align: left;
          margin-bottom: 16px;
        }
        label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
        }
        input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
          font-family: inherit;
        }
        input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
        button {
          width: 100%;
          background-color: #10b981;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-top: 8px;
          font-family: inherit;
        }
        button:hover {
          background-color: #059669;
        }
        .divider {
          margin: 20px 0;
          display: flex;
          align-items: center;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e2e8f0;
        }
        .divider:not(:empty)::before { margin-right: .5em; }
        .divider:not(:empty)::after { margin-left: .5em; }
        .preset-btn {
          width: 100%;
          background-color: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
        }
        .preset-btn:hover {
          background-color: #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Google Accounts</span>
        </div>
        <h2>Choose an account</h2>
        <p>to continue to <strong>AgriGuide</strong> (Local Development Mock)</p>
        
        <form action="/api/auth/google/mock-callback" method="GET">
          <div class="form-group">
            <label for="email">Google Account Email</label>
            <input type="email" id="email" name="email" value="grower-one@example.com" required>
          </div>
          <div class="form-group">
            <label for="name">Google Account Name</label>
            <input type="text" id="name" name="name" value="Mock Grower One" required>
          </div>
          <button type="submit">Sign in with Google</button>
        </form>

        <div class="divider">Or choose a preset</div>
        <button type="button" class="preset-btn" onclick="setPreset('grower-two@example.com', 'Mock Grower Two')">
          Mock Grower Two (grower-two@example.com)
        </button>
        <button type="button" class="preset-btn" onclick="setPreset('agronomist-test@example.com', 'Agronomist Specialist')">
          Agronomist Specialist (agronomist-test@example.com)
        </button>
      </div>

      <script>
        function setPreset(email, name) {
          document.getElementById('email').value = email;
          document.getElementById('name').value = name;
        }
      </script>
    </body>
    </html>
  `);
});

router.get("/google/mock-callback", async (req, res) => {
  try {
    if (env.NODE_ENV !== "development") {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Mock Google login is only permitted in development mode." }
      });
    }

    const email = (req.query.email as string) || "mock-google-grower@example.com";
    const fullName = (req.query.name as string) || "Mock Google Grower";
    // Create stable googleId based on email to maintain persistent mock account
    const googleId = `mock-google-id-${Buffer.from(email).toString("hex").substring(0, 16)}`;

    let user = await UserRepository.findUserByGoogleId(googleId);

    if (!user) {
      // Look up by email to link accounts, or create a new user profile
      const existingUser = await UserRepository.findUserByEmail(email);
      if (existingUser) {
        user = await UserRepository.linkGoogleAccount(existingUser.id, googleId);
      } else {
        user = await UserRepository.createUser(
          fullName,
          email,
          null, // password hash is null
          "en",
          "metric",
          googleId
        );
      }
    }

    // Create session
    const token = await createSession(
      user.id,
      req.headers["user-agent"] || null,
      req.ip || null
    );

    res.cookie("session_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${env.APP_ORIGIN}/dashboard`);
  } catch (error) {
    console.error("Mock Google OAuth2 redirect failed:", error);
    return res.redirect(`${env.APP_ORIGIN}/login?error=MOCK_FAILED`);
  }
});

router.get("/google/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.redirect(`${env.APP_ORIGIN}/login?error=NO_CODE`);
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Google token exchange failure:", errText);
      return res.redirect(`${env.APP_ORIGIN}/login?error=EXCHANGE_FAILED`);
    }

    const tokens: any = await tokenRes.json();
    const idToken = tokens.id_token;
    if (!idToken) {
      return res.redirect(`${env.APP_ORIGIN}/login?error=NO_ID_TOKEN`);
    }

    // Decode ID Token (JWT) without verification since we fetch from Google directly over SSL
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      return res.redirect(`${env.APP_ORIGIN}/login?error=INVALID_ID_TOKEN`);
    }
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));

    const googleId = payload.sub;
    const email = payload.email;
    const fullName = payload.name || "Google User";

    if (!googleId || !email) {
      return res.redirect(`${env.APP_ORIGIN}/login?error=INCOMPLETE_PROFILE`);
    }

    let user = await UserRepository.findUserByGoogleId(googleId);

    if (!user) {
      // Check if user exists by email and link, otherwise create
      const existingUser = await UserRepository.findUserByEmail(email);
      if (existingUser) {
        user = await UserRepository.linkGoogleAccount(existingUser.id, googleId);
      } else {
        user = await UserRepository.createUser(
          fullName,
          email,
          null, // password_hash is null for Google users
          "en",
          "metric",
          googleId
        );
      }
    }

    // Create session
    const token = await createSession(
      user.id,
      req.headers["user-agent"] || null,
      req.ip || null
    );

    res.cookie("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${env.APP_ORIGIN}/dashboard`);
  } catch (error) {
    console.error("Google Login Callback error:", error);
    return res.redirect(`${env.APP_ORIGIN}/login?error=UNKNOWN`);
  }
});

// ==========================================
// Forgot & Reset Password Routes
// ==========================================

router.post("/forgot-password", async (req, res, next) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);
    const user = await UserRepository.findUserByEmail(data.email);

    if (!user) {
      // Return positive generic success response to mitigate account enumeration scanning
      return res.json({
        success: true,
        message: "If a matching account exists, a password reset link has been dispatched.",
      });
    }

    // Generate crypto secure token
    const resetToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour token validity

    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const resetLink = `${env.APP_ORIGIN}/reset-password?token=${resetToken}`;

    // Log the link in server console
    console.log(`\n🔑 PASSWORD RESET LINK for ${user.email}:\n🔗 ${resetLink}\n`);

    // In development mode, return it in response body to facilitate direct clicking
    if (process.env.NODE_ENV === "development") {
      return res.json({
        success: true,
        message: "If a matching account exists, a password reset link has been dispatched.",
        data: {
          devResetLink: resetLink,
        },
      });
    }

    return res.json({
      success: true,
      message: "If a matching account exists, a password reset link has been dispatched.",
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const data = resetPasswordSchema.parse(req.body);
    const tokenHash = hashToken(data.token);

    const tokenRes = await pool.query(
      `SELECT * FROM password_resets
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_RESET_TOKEN",
          message: "The reset link is invalid, expired, or has already been used.",
        },
      });
    }

    const resetRow = tokenRes.rows[0];
    const passwordHash = await hashPassword(data.password);

    await executeInTransaction(resetRow.user_id, async (client) => {
      // Update password
      await UserRepository.updatePassword(resetRow.user_id, passwordHash, client);
      // Clean up reset token
      await client.query("DELETE FROM password_resets WHERE id = $1", [resetRow.id]);
    });

    return res.json({
      success: true,
      message: "Your password has been reset successfully. You may now log in.",
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
