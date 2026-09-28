import express from "express";
import { z } from "zod";
import InterviewSession, { LEVELS } from "../models/InterviewSession.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { aiLimiter } from "../middleware/rateLimits.js";
import { badRequest, conflict } from "../utils/httpError.js";
import { generateVoicePlan, gradeVoiceInterview } from "../services/ai.js";
import { completeSession } from "../services/rewards.js";
import { findOwnSession, serializeSession } from "./interviews.js";

const router = express.Router();
router.use(requireAuth);

const MIN_CANDIDATE_WORDS = 15;

function buildAssistant({ name, role, level, style, questions }) {
  const list = questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n");
  const systemPrompt = `You are Maya, a warm but rigorous interviewer at a top tech company, running a ${level}-level ${style} interview for a ${role} position. The candidate's name is ${name}.

Ask these questions in order, one at a time:
${list}

Rules:
- This is a voice conversation: keep every turn short (1-3 sentences), natural, no lists, no code, no markdown.
- After each answer, you may ask ONE brief follow-up if the answer was vague or shallow, then move on.
- Never give away answers or grade the candidate during the interview. Stay encouraging and neutral.
- If the candidate asks to repeat or clarify, do so briefly.
- Never say "goodbye" until the interview is over — it ends the call.
- After the last question, tell them their feedback report is being prepared, then end with exactly: "Thanks for your time, goodbye!"`;

  const firstMessage = `Hi ${name}! I'm Maya, and I'll be your interviewer today for the ${role} role. We'll go through ${questions.length} questions. Ready? Let's start: ${questions[0].question}`;
  return { systemPrompt, firstMessage };
}

const startSchema = z.object({
  role: z.string().trim().min(2, "Enter a role").max(80),
  level: z.enum(LEVELS),
  style: z.enum(["technical", "behavioral", "mixed"]),
  numQuestions: z.coerce.number().int().min(2).max(8).default(5),
  personalized: z.boolean().optional().default(false),
  jobDescription: z.string().max(5000).optional().default(""),
});

router.post("/start", aiLimiter, validate(startSchema), async (req, res) => {
  const { role, level, style, numQuestions, personalized, jobDescription } = req.body;
  const user = await User.findById(req.userId).select("name resume");
  if (personalized && !user?.resume?.text) throw badRequest("Upload your resume first to personalize questions");

  const questions = await generateVoicePlan({
    role,
    level,
    style,
    numQuestions,
    resume: personalized ? user.resume : null,
    jobDescription,
  });

  const session = await InterviewSession.create({
    user: req.userId,
    mode: "voice",
    personalized,
    title: `${role} · ${style} voice`,
    config: { role, level, style, numQuestions: questions.length, jobDescription },
    questions,
  });

  res.status(201).json({
    session: serializeSession(session),
    assistant: buildAssistant({ name: user.name.split(" ")[0], role, level, style, questions }),
  });
});

const completeSchema = z.object({
  transcript: z
    .array(
      z.object({
        role: z.enum(["assistant", "user"]),
        text: z.string().max(5000),
        at: z.string().optional(),
      })
    )
    .max(500),
});

router.post("/:id/complete", aiLimiter, validate(completeSchema), async (req, res) => {
  const session = await findOwnSession(req.params.id, req.userId);
  if (session.mode !== "voice") throw badRequest("Not a voice session");
  if (session.status === "completed") throw conflict("This interview was already graded");

  const transcript = req.body.transcript.filter((t) => t.text.trim());
  const candidateWords = transcript
    .filter((t) => t.role === "user")
    .reduce((n, t) => n + t.text.trim().split(/\s+/).length, 0);

  session.transcript = transcript;
  if (candidateWords < MIN_CANDIDATE_WORDS) {
    session.status = "abandoned";
    await session.save();
    throw badRequest("We didn't hear enough of your answers to grade this interview. Try again and answer a few questions.");
  }

  const feedback = await gradeVoiceInterview({ transcript, config: session.config, questions: session.questions });
  session.feedback = feedback;
  session.score = Math.round(feedback.overallScore);
  const rewards = await completeSession(session);

  res.json({ session: serializeSession(session), rewards });
});

export default router;
