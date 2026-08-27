# AgriGuide — AI-Powered Crop Advisory Platform

AgriGuide is a secure, production-ready, AI-backed agricultural crop advisory assistant built using React, Vite, Node.js, Express, and PostgreSQL. It leverages the official `@google/genai` SDK and Gemini models to provide farmers, students, and agronomists with structured, prioritized, and cautious crop management advice.

---

## Key Features

1.  **Guided Crop Advisory Wizard**: Multi-step structured questionnaire capturing growth stage, water schedules, soil tests, NPK values, weather anomalies, and crop symptoms.
2.  **Visual Crop Inspections**: Accept close-up photos of leaves and crops (JPEG, PNG, WebP) with strict binary header signature validations (magic bytes) to prevent executable spoofing.
3.  **Timeframe-prioritized Management Plans**: Recommendations are grouped by urgency (Urgent, High, Medium, Low) and timeline (Today, 3-7 Days, 2-4 Weeks, next growth stage).
4.  **Farm & Plot Profiles**: Users can map multiple farms and plots with custom soil profiles, irrigation availability, and coordinates.
5.  **Secure Hashing & Cookie Sessions**: User sessions are backed by SHA-256 session token hashes in the database and password hashing using scrypt.
6.  **Row Level Security (RLS) policies**: PostgreSQL tables isolate user data dynamically. Custom backend transaction context handles tenant checks.
7.  **Localization & Language selection**: Interactive interfaces and generated reports are translated between English and Hindi, with metrics/imperial unit toggles.

---

## Local Development Setup

### 1. Prerequisites
*   Node.js (v20+ recommended)
*   npm (v10+ recommended)
*   PostgreSQL running locally or on a remote instance (e.g., Supabase or Neon).

### 2. Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):
```env
NODE_ENV=development
PORT=5000
APP_ORIGIN=http://localhost:5173

DATABASE_URL=postgresql://username:password@localhost:5432/agriguide
GEMINI_API_KEY=your_gemini_api_key_from_google_studio
GEMINI_MODEL=gemini-2.5-flash

SESSION_SECRET=long_random_cookie_signature_string
SESSION_TTL_DAYS=30
```

### 3. Install & Link Workspace Packages
Install dependencies from the monorepo root:
```bash
npm install
```

### 4. Database Migrations
AgriGuide handles migrations automatically on server startup. You can also run them manually using:
```bash
npm run migrate --workspace=server
```

### 5. Launch Development Servers
Launch both the Express API server (on port 5000) and the Vite frontend (on port 5173) concurrently:
```bash
npm run dev
```

---

## Running Automated Tests

Run the Vitest integration suite verifying password hashes, token sessions, and validation schema constraints:
```bash
npm run test
```

---

## Production Deployment Notes

1.  **HTTPS Cookie Security**: In production (`NODE_ENV=production`), session cookies are automatically configured with `Secure; SameSite=Lax` parameters.
2.  **Row Level Security (RLS)**: Ensure RLS is enabled and forced on all tables. The database user must not be a superuser or bypass RLS policies.
3.  **Environment Secrets**: Never expose the `GEMINI_API_KEY` or `SESSION_SECRET` variables in frontend scripts. All AI operations are proxied through the secure backend.
4.  **GDPR Compliance & Account Deletion**: Deleting a profile triggers a cascading database delete erasing user farms, plots, history, feedback forms, and session logs completely.

---

## AI Safety Limitations
AgriGuide operates under strict agricultural guidelines:
*   Observations are indicative and are **not a replacement** for agronomists, soil laboratories, or plant pathologists.
*   Pesticide dosages and tank-mixing instructions are blocked.
*   Suggestions default to integrated pest management (cultural controls, sanitation, crop rotation).
