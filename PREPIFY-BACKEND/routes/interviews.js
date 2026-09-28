import express from "express";
import { z } from "zod";
import InterviewSession, { LEVELS } from "../models/InterviewSession.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { aiLimiter } from "../middleware/rateLimits.js";
import { badRequest, conflict, notFound } from "../utils/httpError.js";
import { generateMcqQuestions } from "../services/ai.js";
import { completeSession } from "../services/rewards.js";
import { breakdown } from "../services/analysis.js";

const router = express.Router();
router.use(requireAuth);

// Strip answers/explanations before questions reach the browser, so the key
// can't be read from devtools during the quiz.
const hideAnswers = (questions) =>
  questions.map(({ id, question, options, topic, difficulty, type }) => ({ id, question, options, topic, difficulty, type }));

export async function findOwnSession(id, userId) {
  const session = await InterviewSession.findOne({ _id: id, user: userId });
  if (!session) throw notFound("Session not found");
  return session;
}

const mcqStartSchema = z.object({
  domain: z.string().trim().min(1, "Choose a domain").max(80),
  level: z.enum(LEVELS),
  numQuestions: z.coerce.number().int().min(1).max(20),
  timer: z.coerce.number().int().min(1).max(120),
  personalized: z.boolean().optional().default(false),
  jobDescription: z.string().max(5000).optional().default(""),
});

router.post("/mcq", aiLimiter, validate(mcqStartSchema), async (req, res) => {
  const { domain, level, numQuestions, timer, personalized, jobDescription } = req.body;
  const user = await User.findById(req.userId).select("resume");
  if (personalized && !user?.resume?.text) throw badRequest("Upload your resume first to personalize questions");

  const questions = await generateMcqQuestions({
    domain,
    level,
    numQuestions,
    resume: personalized ? user.resume : null,
    jobDescription,
  });

  const session = await InterviewSession.create({
    user: req.userId,
    mode: "mcq",
    personalized,
    title: `${domain} · MCQ`,
    config: { domain, level, numQuestions: questions.length, timer, jobDescription },
    questions,
  });

  res.status(201).json({
    session: { id: session._id, config: session.config, title: session.title, startedAt: session.startedAt },
    questions: hideAnswers(questions),
  });
});

const mcqSubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.number(),
        selectedOption: z.string().nullable().optional(),
        timeSpentSec: z.number().min(0).optional(),
      })
    )
    .max(50),
});

router.post("/:id/submit", validate(mcqSubmitSchema), async (req, res) => {
  const session = await findOwnSession(req.params.id, req.userId);
  if (session.mode !== "mcq") throw badRequest("Not an MCQ session");
  if (session.status === "completed") throw conflict("This interview was already submitted");

  const byId = new Map(req.body.answers.map((a) => [a.questionId, a]));
  const answers = session.questions.map((q) => {
    const given = byId.get(q.id);
    const selected = given?.selectedOption ?? null;
    return {
      questionId: q.id,
      question: q.question,
      options: q.options,
      selectedOption: selected,
      correctAnswer: q.answer,
      explanation: q.explanation,
      isCorrect: selected === q.answer,
      topic: q.topic,
      difficulty: q.difficulty,
      timeSpentSec: given?.timeSpentSec,
    };
  });

  const correct = answers.filter((a) => a.isCorrect).length;
  session.answers = answers;
  session.score = answers.length ? Math.round((correct / answers.length) * 100) : 0;
  const rewards = await completeSession(session);

  res.json({ session: serializeSession(session), rewards });
});

// ---------- history ----------

export function serializeSession(s, { full = true } = {}) {
  const base = {
    id: s._id,
    mode: s.mode,
    status: s.status,
    title: s.title,
    personalized: s.personalized,
    config: s.config,
    score: s.score,
    xpEarned: s.xpEarned,
    badgesEarned: s.badgesEarned,
    startedAt: s.startedAt,
    completedAt: s.completedAt,
    durationSec: s.durationSec,
  };
  if (!full) return base;

  const completed = s.status === "completed";
  return {
    ...base,
    // Never leak answers for an in-progress MCQ.
    questions: s.mode === "mcq" && !completed ? hideAnswers(s.questions) : s.questions,
    answers: s.answers,
    transcript: s.transcript,
    feedback: s.feedback,
    coding: s.coding,
    analysis: s.mode === "mcq" && completed ? breakdown(s.answers) : null,
  };
}

const listSchema = z.object({
  mode: z.enum(["mcq", "voice", "coding"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

router.get("/", validate(listSchema, "query"), async (req, res) => {
  const { mode, limit, page } = req.validated.query;
  const filter = { user: req.userId, status: "completed", ...(mode ? { mode } : {}) };
  const [items, total] = await Promise.all([
    InterviewSession.find(filter)
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-questions -answers -transcript -coding.code"),
    InterviewSession.countDocuments(filter),
  ]);
  res.json({ sessions: items.map((s) => serializeSession(s, { full: false })), total, page, limit });
});

router.get("/:id", async (req, res) => {
  const session = await findOwnSession(req.params.id, req.userId);
  res.json({ session: serializeSession(session) });
});

router.delete("/:id", async (req, res) => {
  const session = await findOwnSession(req.params.id, req.userId);
  if (session.status === "completed") throw badRequest("Completed sessions are kept for your history");
  await session.deleteOne();
  res.status(204).end();
});

export default router;
