import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
  { id: { type: String, required: true }, earnedAt: { type: Date, default: Date.now } },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    fileName: String,
    text: String,
    summary: String,
    skills: [String],
    projects: [String],
    experienceLevel: String,
    suggestedRoles: [String],
    gaps: [String],
    uploadedAt: Date,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Absent for accounts created with Google until the user sets one.
    password: { type: String, select: false },
    hasPassword: { type: Boolean },
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String, default: "" },
    targetRole: { type: String, trim: true, maxlength: 80, default: "" },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDay: { type: String, default: null }, // YYYY-MM-DD (UTC)
    },
    badges: { type: [badgeSchema], default: [] },
    solvedProblems: { type: [String], default: [] },
    resume: { type: resumeSchema, default: null },
  },
  { timestamps: true }
);

userSchema.index({ xp: -1 });

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatarUrl: this.avatarUrl,
    googleLinked: Boolean(this.googleId),
    // Accounts from before Google login always had a password.
    hasPassword: this.hasPassword ?? !this.googleId,
    targetRole: this.targetRole,
    xp: this.xp,
    level: this.level,
    streak: {
      current: this.streak?.current ?? 0,
      longest: this.streak?.longest ?? 0,
      lastActiveDay: this.streak?.lastActiveDay ?? null,
    },
    badges: this.badges,
    solvedProblems: this.solvedProblems,
    hasResume: Boolean(this.resume?.text),
    createdAt: this.createdAt,
  };
};

export default mongoose.model("User", userSchema);
