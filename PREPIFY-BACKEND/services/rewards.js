import User from "../models/User.js";
import InterviewSession from "../models/InterviewSession.js";
import { evaluateBadges, levelFromXp, nextStreak, xpForSession } from "./gamification.js";

async function completedStats(userId) {
  const rows = await InterviewSession.aggregate([
    { $match: { user: userId, status: "completed" } },
    { $group: { _id: "$mode", count: { $sum: 1 } } },
  ]);
  const modes = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const completedSessions = rows.reduce((sum, r) => sum + r.count, 0);
  return { modes, completedSessions };
}

// Marks a session complete and applies XP / level / streak / badges to its user.
// `firstSolve` (first full pass of a coding problem) only matters for coding sessions.
export async function completeSession(session, { firstSolve = false, solvedSlug } = {}) {
  const user = await User.findById(session.user);
  const now = new Date();

  const xp = xpForSession({
    mode: session.mode,
    level: session.config?.level,
    score: session.score ?? 0,
    personalized: session.personalized,
    firstSolve,
  });

  session.status = "completed";
  session.completedAt = now;
  session.durationSec = Math.round((now - session.startedAt) / 1000);
  session.xpEarned = xp;
  await session.save();

  const prevLevel = user.level;
  user.xp += xp;
  user.level = levelFromXp(user.xp);
  user.streak = nextStreak(user.streak);
  if (solvedSlug && !user.solvedProblems.includes(solvedSlug)) user.solvedProblems.push(solvedSlug);

  const stats = await completedStats(user._id);
  const newBadges = evaluateBadges({ user, stats, session });
  newBadges.forEach((id) => user.badges.push({ id, earnedAt: now }));
  await user.save();

  if (newBadges.length) {
    session.badgesEarned = newBadges;
    await session.save();
  }

  return {
    xpEarned: xp,
    leveledUp: user.level > prevLevel,
    newBadges,
    user: user.toPublic(),
  };
}

// Badges can also be earned outside a session (e.g. uploading a resume).
export async function refreshBadges(user) {
  const stats = await completedStats(user._id);
  const newBadges = evaluateBadges({ user, stats, session: null });
  newBadges.forEach((id) => user.badges.push({ id, earnedAt: new Date() }));
  if (newBadges.length) await user.save();
  return newBadges;
}
