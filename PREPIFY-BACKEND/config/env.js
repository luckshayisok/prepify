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
  // Which LLM backs the AI features: groq | gemini | ollama.
  aiProvider: (process.env.AI_PROVIDER || defaultProvider()).toLowerCase(),
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  ollamaUrl: (process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/$/, ""),
  ollamaModel: process.env.OLLAMA_MODEL || "llama3.1:8b",
  // Returns canned AI output instead of calling a model. For local dev and tests only.
  aiMock: process.env.AI_MOCK === "true",
};

// Without AI_PROVIDER, use whichever provider has a key (Groq first).
function defaultProvider() {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "groq";
}

// Whether the selected provider has what it needs to run.
export function aiConfigured() {
  if (env.aiMock) return true;
  if (env.aiProvider === "groq") return Boolean(env.groqApiKey);
  if (env.aiProvider === "gemini") return Boolean(env.geminiApiKey);
  return env.aiProvider === "ollama";
}

export function assertRequiredEnv() {
  const missing = ["MONGODB_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"].filter(
    (key) => !process.env[key]
  );
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  if (!["groq", "gemini", "ollama"].includes(env.aiProvider)) {
    throw new Error(`Unknown AI_PROVIDER "${env.aiProvider}". Use groq, gemini or ollama.`);
  }
  if (!aiConfigured()) {
    const key = env.aiProvider === "groq" ? "GROQ_API_KEY" : "GEMINI_API_KEY";
    console.warn(`Warning: ${key} is not set — AI features will return 503 until it is.`);
  }
  console.log(`AI provider: ${env.aiMock ? "mock" : env.aiProvider}`);
}
