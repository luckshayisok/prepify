import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimits.js";
import { badRequest, conflict, notFound, unauthorized } from "../utils/httpError.js";
import { levelProgress, liveStreak } from "../services/gamification.js";
import { verifyGoogleCredential } from "../services/google.js";

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

  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10), hasPassword: true });
  res.status(201).json({ ...issueTokens(user._id), user: publicUser(user) });
});

router.post("/login", authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (user && !user.password) {
    throw unauthorized("This account uses Google sign-in. Continue with Google, or set a password in Settings.");
  }
  // Same message for unknown email and wrong password, so emails can't be probed.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw unauthorized("Invalid email or password");
  }
  res.json({ ...issueTokens(user._id), user: publicUser(user) });
});

// Sign in or sign up with a Google Identity Services ID token. An existing account with the
// same (Google-verified) email is linked rather than duplicated.
router.post("/google", authLimiter, validate(z.object({ credential: z.string().min(1) })), async (req, res) => {
  const profile = await verifyGoogleCredential(req.body.credential);

  let user = await User.findOne({ googleId: profile.googleId });
  let created = false;
  if (!user) {
    user = await User.findOne({ email: profile.email });
    if (user) {
      user.googleId = profile.googleId;
      if (!user.avatarUrl) user.avatarUrl = profile.avatarUrl;
      await user.save();
    } else {
      user = await User.create({
        name: profile.name.slice(0, 60),
        email: profile.email,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl,
        hasPassword: false,
      });
      created = true;
    }
  }
  res.status(created ? 201 : 200).json({ ...issueTokens(user._id), user: publicUser(user), created });
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

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
});

// Sets a first password (Google-only accounts) or changes an existing one.
router.put("/me/password", requireAuth, validate(passwordSchema), async (req, res) => {
  const user = await User.findById(req.userId).select("+password");
  if (!user) throw notFound("User not found");
  if (user.password) {
    if (!req.body.currentPassword) throw badRequest("Enter your current password");
    if (!(await bcrypt.compare(req.body.currentPassword, user.password))) throw badRequest("Current password is incorrect");
  }
  user.password = await bcrypt.hash(req.body.newPassword, 10);
  user.hasPassword = true;
  await user.save();
  res.json({ user: publicUser(user) });
});

export default router;
