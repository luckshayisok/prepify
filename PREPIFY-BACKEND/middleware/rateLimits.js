import { rateLimit, ipKeyGenerator } from "express-rate-limit";

const base = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests, please slow down." },
  // Per user when logged in, otherwise per IP.
  keyGenerator: (req) => req.userId || ipKeyGenerator(req.ip),
  skip: () => process.env.NODE_ENV === "test",
};

export const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 30 });
export const aiLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 40 });
