// Pure gamification rules: XP, levels, streaks and badges.
// Kept free of DB access so it can be unit-tested directly.

export const MODE_BASE_XP = { mcq: 50, voice: 80, coding: 60 };
export const LEVEL_MULTIPLIER = { easy: 1, medium: 1.5, hard: 2 };
export const COMPLETION_BONUS = 10;
export const PERFECT_BONUS = 25;
// Coding results are computed in the browser and can be faked, so coding XP is
// capped and only awarded the first time a problem is fully solved.
export const CODING_XP_CAP = 100;

export function xpForSession({ mode, level = "easy", score = 0, personalized = false, firstSolve = false }) {
  if (mode === "coding" && !firstSolve) return 0;

  const base = MODE_BASE_XP[mode] ?? 50;
  const mult = LEVEL_MULTIPLIER[level] ?? 1;
  const clamped = Math.max(0, Math.min(100, score));

  let xp = base * mult * (clamped / 100) + COMPLETION_BONUS;
  if (clamped === 100) xp += PERFECT_BONUS;
  if (personalized) xp *= 1.1;

  if (mode === "coding") xp = Math.min(xp, CODING_XP_CAP);
  return Math.round(xp);
}

// Total XP needed to reach `level`: L1=0, L2=100, L3=300, L4=600, L5=1000 ...
export const xpThreshold = (level) => (100 * (level - 1) * level) / 2;

export function levelFromXp(xp) {
  let level = 1;
  while (xpThreshold(level + 1) <= xp) level++;
  return level;
}

export function levelProgress(xp) {
  const level = levelFromXp(xp);
  const floor = xpThreshold(level);
  const ceil = xpThreshold(level + 1);
  return { level, current: xp - floor, needed: ceil - floor, pct: Math.round(((xp - floor) / (ceil - floor)) * 100) };
}

export const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);

function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export function nextStreak(streak = {}, today = dayKey()) {
  const { current = 0, longest = 0, lastActiveDay = null } = streak;
  if (lastActiveDay === today) return { current, longest, lastActiveDay };

  const gap = lastActiveDay ? daysBetween(lastActiveDay, today) : null;
  const newCurrent = gap === 1 ? current + 1 : 1;
  return { current: newCurrent, longest: Math.max(longest, newCurrent), lastActiveDay: today };
}

// A streak is only "alive" if the user was active today or yesterday.
export function liveStreak(streak = {}, today = dayKey()) {
  if (!streak.lastActiveDay) return 0;
  return daysBetween(streak.lastActiveDay, today) <= 1 ? streak.current : 0;
}

export const BADGES = [
  { id: "first_steps", name: "First Steps", description: "Complete your first interview" },
  { id: "perfectionist", name: "Perfectionist", description: "Score 100% in any session" },
  { id: "on_fire", name: "On Fire", description: "Reach a 3-day streak" },
  { id: "unstoppable", name: "Unstoppable", description: "Reach a 7-day streak" },
  { id: "smooth_talker", name: "Smooth Talker", description: "Complete a voice interview" },
  { id: "code_warrior", name: "Code Warrior", description: "Solve your first coding problem" },
  { id: "algorithmist", name: "Algorithmist", description: "Solve 5 different coding problems" },
  { id: "tailored", name: "Tailored", description: "Upload your resume" },
  { id: "hard_mode", name: "Hard Mode", description: "Score 80%+ on a hard session" },
  { id: "marathon", name: "Marathon", description: "Complete 10 sessions" },
  { id: "polymath", name: "Polymath", description: "Complete MCQ, voice and coding sessions" },
  { id: "level_5", name: "Rising Star", description: "Reach level 5" },
];

// Returns ids of badges newly earned given the user's state *after* the event.
export function evaluateBadges({ user, stats, session }) {
  const owned = new Set((user.badges || []).map((b) => b.id));
  const earned = [];
  const check = (id, cond) => {
    if (cond && !owned.has(id)) earned.push(id);
  };

  check("first_steps", stats.completedSessions >= 1);
  check("perfectionist", session?.score === 100);
  check("on_fire", (user.streak?.current ?? 0) >= 3);
  check("unstoppable", (user.streak?.current ?? 0) >= 7);
  check("smooth_talker", (stats.modes?.voice ?? 0) >= 1);
  check("code_warrior", (user.solvedProblems?.length ?? 0) >= 1);
  check("algorithmist", (user.solvedProblems?.length ?? 0) >= 5);
  check("tailored", Boolean(user.resume?.text));
  check("hard_mode", session?.config?.level === "hard" && (session?.score ?? 0) >= 80);
  check("marathon", stats.completedSessions >= 10);
  check("polymath", ["mcq", "voice", "coding"].every((m) => (stats.modes?.[m] ?? 0) >= 1));
  check("level_5", (user.level ?? 1) >= 5);
  return earned;
}
