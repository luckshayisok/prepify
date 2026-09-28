import mongoose from "mongoose";

export const MODES = ["mcq", "voice", "coding"];
export const LEVELS = ["easy", "medium", "hard"];

const { Mixed } = mongoose.Schema.Types;

// One record type for every interview mode. Mode-specific data lives in the
// loosely-typed fields (questions / answers / transcript / feedback / coding).
const interviewSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mode: { type: String, enum: MODES, required: true },
    status: { type: String, enum: ["in_progress", "completed", "abandoned"], default: "in_progress" },
    personalized: { type: Boolean, default: false },
    config: {
      domain: String,
      level: { type: String, enum: LEVELS, default: "easy" },
      numQuestions: Number,
      timer: Number, // minutes
      role: String,
      style: String, // voice: technical | behavioral | mixed
      jobDescription: String,
    },
    title: String,
    questions: { type: [Mixed], default: [] },
    answers: { type: [Mixed], default: [] },
    transcript: { type: [Mixed], default: [] },
    feedback: { type: Mixed, default: null },
    coding: { type: Mixed, default: null },
    score: { type: Number, min: 0, max: 100, default: null },
    xpEarned: { type: Number, default: 0 },
    badgesEarned: { type: [String], default: [] },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    durationSec: Number,
  },
  { timestamps: true }
);

interviewSessionSchema.index({ user: 1, completedAt: -1 });

export default mongoose.model("InterviewSession", interviewSessionSchema);
