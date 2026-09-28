import express from "express";
import mongoose from "mongoose";
import InterviewSession from "../models/InterviewSession.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { notFound } from "../utils/httpError.js";
import { BADGES, dayKey } from "../services/gamification.js";
import { publicUser } from "./auth.js";

const router = express.Router();

const HEATMAP_DAYS = 7 * 26; // ~6 months

router.get("/badges", (_req, res) => res.json({ badges: BADGES }));

router.get("/dashboard", requireAuth, async (req, res) => {
  const userId = new mongoose.Types.ObjectId(String(req.userId));
  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");

  const since = new Date(Date.now() - HEATMAP_DAYS * 86_400_000);
  const completed = { user: userId, status: "completed" };

  const [totals, byMode, trend, activity, topics, recent] = await Promise.all([
    InterviewSession.aggregate([
      { $match: completed },
      { $group: { _id: null, count: { $sum: 1 }, avgScore: { $avg: "$score" }, best: { $max: "$score" }, seconds: { $sum: "$durationSec" } } },
    ]),
    InterviewSession.aggregate([
      { $match: completed },
      { $group: { _id: "$mode", count: { $sum: 1 }, avgScore: { $avg: "$score" } } },
    ]),
    InterviewSession.find(completed).sort({ completedAt: -1 }).limit(20).select("mode score completedAt title"),
    InterviewSession.aggregate([
      { $match: { ...completed, completedAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } }, count: { $sum: 1 } } },
    ]),
    InterviewSession.aggregate([
      { $match: { ...completed, mode: "mcq" } },
      { $unwind: "$answers" },
      {
        $group: {
          _id: "$answers.topic",
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } },
        },
      },
      { $match: { _id: { $ne: null } } },
    ]),
    InterviewSession.find(completed).sort({ completedAt: -1 }).limit(8).select("mode score completedAt title xpEarned config"),
  ]);

  const topicStats = topics
    .map((t) => ({ topic: t._id, total: t.total, correct: t.correct, accuracy: Math.round((t.correct / t.total) * 100) }))
    .filter((t) => t.total >= 2);
  const sortedTopics = [...topicStats].sort((a, b) => b.accuracy - a.accuracy || b.total - a.total);
  const t0 = totals[0] || { count: 0, avgScore: null, best: null, seconds: 0 };

  res.json({
    user: publicUser(user),
    totals: {
      sessions: t0.count,
      avgScore: t0.avgScore == null ? null : Math.round(t0.avgScore),
      bestScore: t0.best,
      minutesPracticed: Math.round((t0.seconds || 0) / 60),
      problemsSolved: user.solvedProblems.length,
    },
    byMode: Object.fromEntries(byMode.map((m) => [m._id, { count: m.count, avgScore: Math.round(m.avgScore ?? 0) }])),
    trend: trend.reverse().map((s) => ({ id: s._id, mode: s.mode, score: s.score, date: s.completedAt, title: s.title })),
    activity: { today: dayKey(), days: HEATMAP_DAYS, counts: Object.fromEntries(activity.map((a) => [a._id, a.count])) },
    // Split at 70% so a topic never shows up in both lists.
    strongestTopics: sortedTopics.filter((t) => t.accuracy >= 70).slice(0, 5),
    weakestTopics: sortedTopics.filter((t) => t.accuracy < 70).reverse().slice(0, 5),
    recent: recent.map((s) => ({
      id: s._id,
      mode: s.mode,
      title: s.title,
      score: s.score,
      xpEarned: s.xpEarned,
      level: s.config?.level,
      completedAt: s.completedAt,
    })),
  });
});

router.get("/leaderboard", requireAuth, async (req, res) => {
  const top = await User.find({ xp: { $gt: 0 } }).sort({ xp: -1, createdAt: 1 }).limit(25).select("name xp level streak badges");
  const me = await User.findById(req.userId).select("xp createdAt");
  const myRank = me ? (await User.countDocuments({ xp: { $gt: me.xp } })) + 1 : null;

  res.json({
    leaders: top.map((u, i) => ({
      rank: i + 1,
      id: u._id,
      // First name + initial only — the leaderboard is visible to every user.
      name: shortName(u.name),
      xp: u.xp,
      level: u.level,
      streak: u.streak?.longest ?? 0,
      badges: u.badges.length,
      isMe: String(u._id) === String(req.userId),
    })),
    me: { rank: myRank, xp: me?.xp ?? 0 },
  });
});

function shortName(name = "") {
  const [first, last] = name.trim().split(/\s+/);
  return last ? `${first} ${last[0]}.` : first;
}

export default router;
