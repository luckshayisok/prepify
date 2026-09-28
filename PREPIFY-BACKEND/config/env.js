import dotenv from "dotenv";

dotenv.config();

const DEFAULT_ORIGINS = ["http://localhost:5173", "https://prepify-chi.vercel.app"];

const list = (value, fallback) =>
  value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : fallback;

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  mongoDb: process.env.MONGODB_DB || undefined,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  corsOrigins: list(process.env.CORS_ORIGINS, DEFAULT_ORIGINS),
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  // Returns canned AI output instead of calling Gemini. For local dev and tests only.
  aiMock: process.env.AI_MOCK === "true",
};

export function assertRequiredEnv() {
  const missing = ["MONGODB_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"].filter(
    (key) => !process.env[key]
  );
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  if (!env.geminiApiKey && !env.aiMock) {
    console.warn("Warning: GEMINI_API_KEY is not set — AI features will return 503 until it is.");
  }
}
