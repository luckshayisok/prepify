import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { unauthorized } from "../utils/httpError.js";

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return next(unauthorized("No token provided"));

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.userId = decoded.id;
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
}
