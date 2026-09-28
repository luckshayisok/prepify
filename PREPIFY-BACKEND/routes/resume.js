import express from "express";
import multer from "multer";
import { extractText, getDocumentProxy } from "unpdf";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimits.js";
import { badRequest, notFound } from "../utils/httpError.js";
import { analyzeResume } from "../services/ai.js";
import { refreshBadges } from "../services/rewards.js";

const router = express.Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(badRequest("Only PDF files are supported"));
  },
});

async function pdfToText(buffer) {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  } catch {
    throw badRequest("Couldn't read that PDF. Try exporting it again, or paste the text instead.");
  }
}

const serialize = (resume) =>
  resume && {
    fileName: resume.fileName,
    summary: resume.summary,
    skills: resume.skills,
    projects: resume.projects,
    experienceLevel: resume.experienceLevel,
    suggestedRoles: resume.suggestedRoles,
    gaps: resume.gaps,
    uploadedAt: resume.uploadedAt,
    characters: resume.text?.length ?? 0,
  };

router.get("/", async (req, res) => {
  const user = await User.findById(req.userId).select("resume");
  if (!user?.resume?.text) throw notFound("No resume uploaded yet");
  res.json({ resume: serialize(user.resume) });
});

// Accepts either a PDF upload ("resume" field) or pasted plain text ("text" field).
router.post("/", aiLimiter, upload.single("resume"), async (req, res) => {
  const pasted = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const jobDescription = typeof req.body?.jobDescription === "string" ? req.body.jobDescription.slice(0, 5000) : "";

  let text;
  let fileName;
  if (req.file) {
    text = await pdfToText(req.file.buffer);
    fileName = req.file.originalname;
  } else if (pasted) {
    text = pasted.slice(0, 20000);
    fileName = "Pasted resume";
  } else {
    throw badRequest("Upload a PDF or paste your resume text");
  }
  if (text.length < 200) {
    throw badRequest("That resume looks almost empty. If it's a scanned image, paste the text instead.");
  }

  const analysis = await analyzeResume({ text, jobDescription });
  const user = await User.findById(req.userId);
  user.resume = { fileName, text, ...analysis, uploadedAt: new Date() };
  await user.save();
  const newBadges = await refreshBadges(user);

  res.status(201).json({ resume: serialize(user.resume), newBadges });
});

router.delete("/", async (req, res) => {
  await User.updateOne({ _id: req.userId }, { $set: { resume: null } });
  res.status(204).end();
});

export default router;
