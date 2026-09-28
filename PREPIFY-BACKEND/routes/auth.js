import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimits.js";
import { conflict, notFound, unauthorized } from "../utils/httpError.js";
import { levelProgress, liveStreak } from "../services/gamification.js";

const router = express.Router();

const issueTokens = (userId) => ({
  accessToken: jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: "15m" }),
  refreshToken: jwt.sign({ id: userId }, env.jwtRefreshSecret, { expiresIn: "7d" }),
});

export const publicUser = (user) => {
  const pub = user.toPublic();
  return {
    ...pub,
    streak: { ...pub.streak, current: liveStreak(pub.streak) },
    progress: levelProgress(pub.xp),
  };
};

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

const loginSchema = z.object({
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

router.post("/signup", authLimiter, validate(signupSchema), async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw conflict("An account with this email already exists");

  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ ...issueTokens(user._id), user: publicUser(user) });
});

router.post("/login", authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  // Same message for unknown email and wrong password, so emails can't be probed.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw unauthorized("Invalid email or password");
  }
  res.json({ ...issueTokens(user._id), user: publicUser(user) });
});

router.post("/refresh", validate(z.object({ refreshToken: z.string().min(1) })), async (req, res) => {
  let payload;
  try {
    payload = jwt.verify(req.body.refreshToken, env.jwtRefreshSecret);
  } catch {
    throw unauthorized("Session expired, please log in again");
  }
  if (!(await User.exists({ _id: payload.id }))) throw unauthorized("Account no longer exists");
  res.json(issueTokens(payload.id));
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw notFound("User not found");
  res.json({ user: publicUser(user) });
});

const updateSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  targetRole: z.string().trim().max(80).optional(),
});

router.patch("/me", requireAuth, validate(updateSchema), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.userId, req.body, { new: true, runValidators: true });
  if (!user) throw notFound("User not found");
  res.json({ user: publicUser(user) });
});

export default router;
