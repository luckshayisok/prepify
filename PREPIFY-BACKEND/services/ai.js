import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import * as mock from "./aiMock.js";

let client;
function getClient() {
  if (!env.geminiApiKey) throw new HttpError(503, "AI is not configured on the server (GEMINI_API_KEY missing)");
  client ??= new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
}

const clip = (text = "", max = 6000) => (text.length > max ? `${text.slice(0, max)}\n…[truncated]` : text);

// Calls Gemini in JSON mode and validates the result, retrying once on bad output.
async function generateJSON(prompt, schema, { temperature = 0.7 } = {}) {
  const ai = getClient();
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: env.geminiModel,
        contents: prompt,
        config: { responseMimeType: "application/json", temperature },
      });
      const raw = (res.text || "").replace(/```json|```/g, "").trim();
      return schema.parse(JSON.parse(raw));
    } catch (err) {
      lastError = err;
      if (err?.status && err.status < 500 && err.status !== 429) break; // bad key etc.
    }
  }
  console.error("Gemini generation failed:", lastError);
  throw new HttpError(502, "The AI returned an unexpected response. Please try again.");
}

function resumeContext(resume) {
  if (!resume?.text) return "";
  return `
The candidate's resume is below. Tailor questions to their actual projects, skills and experience,
and probe anything that sounds impressive to check real understanding.
<resume>
${clip(resume.text, 5000)}
</resume>`;
}

function jdContext(jobDescription) {
  if (!jobDescription) return "";
  return `
The candidate is targeting this job. Prioritise skills it asks for, especially ones missing from the resume.
<job_description>
${clip(jobDescription, 3000)}
</job_description>`;
}

// ---------- MCQ ----------

const mcqSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string()).length(4),
        answer: z.string().min(1),
        explanation: z.string().optional().default(""),
        topic: z.string().optional().default("General"),
        difficulty: z.string().optional(),
      })
    )
    .min(1),
});

export async function generateMcqQuestions({ domain, level, numQuestions, resume, jobDescription }) {
  if (env.aiMock) return mock.mcq({ domain, level, numQuestions });

  const prompt = `You are an expert technical interviewer. Generate exactly ${numQuestions} ${level}-difficulty
multiple-choice interview questions about "${domain}".
${resumeContext(resume)}${jdContext(jobDescription)}

Rules:
- Each question has exactly 4 distinct options and exactly one correct answer.
- "answer" must be copied character-for-character from "options".
- "topic" is a specific sub-topic of ${domain} (e.g. "Closures", "Indexing"), used for weak-area analysis.
- "explanation" is 1-2 sentences on why the answer is correct.
- Vary the position of the correct option.

Return JSON: {"questions":[{"question":"...","options":["a","b","c","d"],"answer":"...","explanation":"...","topic":"...","difficulty":"${level}"}]}`;

  const { questions } = await generateJSON(prompt, mcqSchema);
  return questions
    .filter((q) => q.options.includes(q.answer))
    .slice(0, numQuestions)
    .map((q, i) => ({ id: i + 1, ...q, type: "MCQ", difficulty: level }));
}

// ---------- Voice interview ----------

const voicePlanSchema = z.object({
  questions: z.array(z.object({ question: z.string(), focus: z.string().optional().default("") })).min(1),
});

export async function generateVoicePlan({ role, level, style, numQuestions, resume, jobDescription }) {
  if (env.aiMock) return mock.voicePlan({ role, numQuestions });

  const styleText = {
    technical: "technical questions (concepts, trade-offs, debugging, design)",
    behavioral: "behavioral questions suited to the STAR method",
    mixed: "a mix of technical and behavioral questions",
  }[style];

  const prompt = `Plan a spoken ${level}-level interview for a "${role}" candidate with ${numQuestions} ${styleText}.
Questions will be read aloud by a voice AI, so keep each under 35 words, conversational, with no code or symbols.
${resumeContext(resume)}${jdContext(jobDescription)}
Return JSON: {"questions":[{"question":"...","focus":"what a strong answer covers"}]}`;

  const { questions } = await generateJSON(prompt, voicePlanSchema);
  return questions.slice(0, numQuestions).map((q, i) => ({ id: i + 1, ...q }));
}

const score = z.coerce.number().min(0).max(100);
const voiceFeedbackSchema = z.object({
  overallScore: score,
  summary: z.string(),
  scores: z.object({
    communication: score,
    technicalAccuracy: score,
    structure: score,
    confidence: score,
  }),
  fillerWords: z.object({ count: z.coerce.number(), examples: z.array(z.string()).default([]) }),
  perQuestion: z
    .array(z.object({ question: z.string(), answerSummary: z.string(), score, feedback: z.string() }))
    .default([]),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
});

export async function gradeVoiceInterview({ transcript, config, questions }) {
  if (env.aiMock) return mock.voiceFeedback({ questions });

  const text = transcript.map((t) => `${t.role === "assistant" ? "INTERVIEWER" : "CANDIDATE"}: ${t.text}`).join("\n");
  const prompt = `You are a senior hiring manager grading a ${config.level}-level "${config.role}" ${config.style} interview.
Planned questions:
${questions.map((q) => `- ${q.question}`).join("\n")}

Transcript:
<transcript>
${clip(text, 20000)}
</transcript>

Grade only what the CANDIDATE actually said. If they barely answered, scores must be low.
- communication: clarity, conciseness, vocabulary
- technicalAccuracy: correctness and depth (for behavioral questions: relevance and substance)
- structure: logical flow; for behavioral answers, use of Situation-Task-Action-Result
- confidence: decisiveness, hedging, ownership language
- fillerWords: count "um", "uh", "like", "you know", "basically", "actually" used as filler, with examples
- perQuestion: one entry per interviewer question that was actually asked
- strengths / improvements: 3 specific, actionable points each

Return JSON: {"overallScore":0-100,"summary":"2-3 sentences","scores":{"communication":0-100,"technicalAccuracy":0-100,"structure":0-100,"confidence":0-100},"fillerWords":{"count":0,"examples":[]},"perQuestion":[{"question":"","answerSummary":"","score":0-100,"feedback":""}],"strengths":[],"improvements":[]}`;

  return generateJSON(prompt, voiceFeedbackSchema, { temperature: 0.3 });
}

// ---------- Resume ----------

const resumeSchema = z.object({
  summary: z.string(),
  skills: z.array(z.string()).default([]),
  projects: z.array(z.string()).default([]),
  experienceLevel: z.enum(["entry", "junior", "mid", "senior"]).catch("junior"),
  suggestedRoles: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
});

export async function analyzeResume({ text, jobDescription }) {
  if (env.aiMock) return mock.resume();

  const prompt = `Analyse this resume for interview preparation.
<resume>
${clip(text, 8000)}
</resume>
${jdContext(jobDescription)}
- summary: 2 sentences on who the candidate is
- skills: up to 20 concrete technical skills
- projects: up to 6 one-line project descriptions
- experienceLevel: entry | junior | mid | senior
- suggestedRoles: up to 4 job titles that fit
- gaps: up to 5 skills ${jobDescription ? "the job description asks for that the resume lacks" : "commonly expected for the suggested roles that the resume lacks"}
Return JSON with exactly those keys.`;

  return generateJSON(prompt, resumeSchema, { temperature: 0.2 });
}

// ---------- Code review ----------

const codeReviewSchema = z.object({
  summary: z.string(),
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  quality: score,
  suggestions: z.array(z.string()).default([]),
});

export async function reviewCode({ problem, code, language, passed, total }) {
  if (env.aiMock) return mock.codeReview();

  const prompt = `Review this ${language} solution to "${problem.title}" like a friendly senior engineer in an interview.
Problem: ${problem.description}
It passed ${passed}/${total} tests.
<code>
${clip(code, 8000)}
</code>
Give the time and space complexity in Big-O, a quality score 0-100 (readability, naming, edge cases, efficiency),
and up to 4 concrete suggestions. Do not rewrite the whole solution.
Return JSON: {"summary":"","timeComplexity":"O(...)","spaceComplexity":"O(...)","quality":0-100,"suggestions":[]}`;

  return generateJSON(prompt, codeReviewSchema, { temperature: 0.3 });
}
