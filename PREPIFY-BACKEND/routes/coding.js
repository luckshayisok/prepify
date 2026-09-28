import express from "express";
import { z } from "zod";
import InterviewSession from "../models/InterviewSession.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { aiLimiter } from "../middleware/rateLimits.js";
import { badRequest, notFound } from "../utils/httpError.js";
import { PROBLEMS, findProblem, starterCode } from "../data/codingProblems.js";
import { completeSession } from "../services/rewards.js";
import { reviewCode } from "../services/ai.js";
import { findOwnSession, serializeSession } from "./interviews.js";

const router = express.Router();
router.use(requireAuth);

const LANGUAGES = ["javascript", "python"];

function getProblem(slug) {
  const problem = findProblem(slug);
  if (!problem) throw notFound("Problem not found");
  return problem;
}

router.get("/problems", async (req, res) => {
  const user = await User.findById(req.userId).select("solvedProblems");
  const solved = new Set(user?.solvedProblems ?? []);
  res.json({
    problems: PROBLEMS.map(({ slug, title, difficulty, tags }) => ({
      slug,
      title,
      difficulty,
      tags,
      solved: solved.has(slug),
    })),
  });
});

router.get("/problems/:slug", async (req, res) => {
  const p = getProblem(req.params.slug);
  const user = await User.findById(req.userId).select("solvedProblems");
  res.json({
    problem: {
      ...p,
      // Hidden test inputs are sent because the browser runs them; the UI never displays them.
      starter: Object.fromEntries(LANGUAGES.map((l) => [l, starterCode(p, l)])),
      solved: user?.solvedProblems?.includes(p.slug) ?? false,
    },
  });
});

const submitSchema = z.object({
  slug: z.string(),
  language: z.enum(LANGUAGES),
  code: z.string().min(1).max(20000),
  results: z.array(z.object({ passed: z.boolean(), runtimeMs: z.number().optional() })).min(1),
});

router.post("/submit", validate(submitSchema), async (req, res) => {
  const { slug, language, code, results } = req.body;
  const problem = getProblem(slug);
  if (results.length !== problem.tests.length) throw badRequest("Results don't match this problem's tests");

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;

  const user = await User.findById(req.userId).select("solvedProblems");
  const firstSolve = allPassed && !user.solvedProblems.includes(slug);

  const session = new InterviewSession({
    user: req.userId,
    mode: "coding",
    title: `${problem.title} · ${language === "python" ? "Python" : "JavaScript"}`,
    config: { domain: problem.title, level: problem.difficulty },
    coding: { slug, title: problem.title, language, code, passed, total, results, firstSolve },
    score: Math.round((passed / total) * 100),
  });
  const rewards = await completeSession(session, { firstSolve, solvedSlug: allPassed ? slug : undefined });

  res.status(201).json({ session: serializeSession(session), rewards, firstSolve });
});

// AI code review for a submitted solution; stored on the session.
router.post("/:sessionId/review", aiLimiter, async (req, res) => {
  const session = await findOwnSession(req.params.sessionId, req.userId);
  if (session.mode !== "coding") throw badRequest("Not a coding session");
  if (session.coding?.review) return res.json({ review: session.coding.review });

  const problem = getProblem(session.coding.slug);
  const review = await reviewCode({
    problem,
    code: session.coding.code,
    language: session.coding.language,
    passed: session.coding.passed,
    total: session.coding.total,
  });
  session.coding = { ...session.coding, review };
  session.markModified("coding");
  await session.save();
  res.json({ review });
});

export default router;
