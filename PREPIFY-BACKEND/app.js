import express from "express";
import cors from "cors";
import helmet from "helmet";
import { aiConfigured, env } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import interviewRoutes from "./routes/interviews.js";
import voiceRoutes from "./routes/voice.js";
import resumeRoutes from "./routes/resume.js";
import codingRoutes from "./routes/coding.js";
import dashboardRoutes from "./routes/dashboard.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1); // Render / Vercel sit behind a proxy; needed for per-IP rate limits.
  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin / server-to-server requests (no Origin header).
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        cb(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_req, res) => res.send("Prepify backend is running"));
  app.get("/api/health", (_req, res) => res.json({ ok: true, ai: aiConfigured(), provider: env.aiMock ? "mock" : env.aiProvider }));

  app.use("/api/auth", authRoutes);
  app.use("/api/interviews", interviewRoutes);
  app.use("/api/voice", voiceRoutes);
  app.use("/api/resume", resumeRoutes);
  app.use("/api/coding", codingRoutes);
  app.use("/api", dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
