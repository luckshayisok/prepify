// Pure helpers that turn raw stats into dashboard insights: weekly trends, badge progress,
// the "up next" recommendation and the today panel. No DB access, so they're easy to test.
import { BADGES, dayKey } from "./gamification.js";

export const DAILY_GOAL = 1;

const addDays = (key, n) => {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return dayKey(d);
};

/**
 * Per-day series for the last `days` days (oldest first) from rows keyed by YYYY-MM-DD.
 * rows: { [day]: { count, xp, scoreSum } }
 */
export function dailySeries(rows, today = dayKey(), days = 14) {
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - days + 1);
    const r = rows[day] ?? { count: 0, xp: 0, scoreSum: 0 };
    return { day, count: r.count, xp: r.xp, avgScore: r.count ? Math.round(r.scoreSum / r.count) : null };
  });
}

// This week (last 7 days) vs the 7 days before, from a 14-day series.
export function weekOverWeek(series) {
  const sum = (arr, k) => arr.reduce((s, d) => s + (d[k] ?? 0), 0);
  const avg = (arr) => {
    const scored = arr.filter((d) => d.count);
    const n = scored.reduce((s, d) => s + d.count, 0);
    return n ? Math.round(scored.reduce((s, d) => s + d.avgScore * d.count, 0) / n) : null;
  };
  const prev = series.slice(0, 7);
  const cur = series.slice(7);
  const curAvg = avg(cur);
  const prevAvg = avg(prev);
  return {
    sessions: { value: sum(cur, "count"), delta: sum(cur, "count") - sum(prev, "count") },
    xp: { value: sum(cur, "xp"), delta: sum(cur, "xp") - sum(prev, "xp") },
    avgScore: { value: curAvg, delta: curAvg != null && prevAvg != null ? curAvg - prevAvg : null },
  };
}

// Progress toward each badge the user hasn't earned yet, closest first.
export function badgeProgress({ user, stats }) {
  const owned = new Set((user.badges ?? []).map((b) => b.id));
  const streak = user.streak?.current ?? 0;
  const solved = user.solvedProblems?.length ?? 0;
  const modesUsed = ["mcq", "voice", "coding"].filter((m) => (stats.modes?.[m] ?? 0) > 0).length;

  const progress = {
    first_steps: [stats.completedSessions, 1],
    perfectionist: [stats.bestScore ?? 0, 100],
    on_fire: [streak, 3],
    unstoppable: [streak, 7],
    smooth_talker: [stats.modes?.voice ?? 0, 1],
    code_warrior: [solved, 1],
    algorithmist: [solved, 5],
    tailored: [user.resume?.text ? 1 : 0, 1],
    hard_mode: [stats.bestHardScore ?? 0, 80],
    marathon: [stats.completedSessions, 10],
    polymath: [modesUsed, 3],
    level_5: [user.level ?? 1, 5],
  };

  return BADGES.filter((b) => !owned.has(b.id) && progress[b.id])
    .map((b) => {
      const [current, target] = progress[b.id];
      const clamped = Math.min(current, target);
      return { id: b.id, name: b.name, description: b.description, current: clamped, target, pct: Math.round((clamped / target) * 100) };
    })
    .sort((a, b) => b.pct - a.pct || a.target - b.target);
}

/**
 * What to practice next, in priority order:
 * 1. the weakest MCQ topic (under 70%), 2. a mode never tried, 3. the next unsolved coding problem,
 * 4. a harder quiz on the strongest topic, 5. a first quiz.
 */
export function recommendNext({ weakestTopics = [], strongestTopics = [], modes = {}, solved = [], problems = [], hasSessions }) {
  const weak = weakestTopics[0];
  if (weak) {
    return {
      type: "mcq",
      title: `Strengthen ${weak.topic}`,
      reason: `Your weakest topic at ${weak.accuracy}% accuracy. A focused 5-question quiz takes about 5 minutes.`,
      action: { domain: weak.topic, level: "medium", numQuestions: 5, timer: 6 },
    };
  }
  if (hasSessions && !modes.voice) {
    return {
      type: "voice",
      title: "Try a voice interview",
      reason: "Practice answering out loud and get scored on clarity, structure and confidence.",
    };
  }
  const nextProblem = problems.find((p) => !solved.includes(p.slug));
  if (hasSessions && nextProblem && !modes.coding) {
    return {
      type: "coding",
      title: `Solve ${nextProblem.title}`,
      reason: `A ${nextProblem.difficulty} ${nextProblem.tags[0].toLowerCase()} problem to start your coding round.`,
      action: { slug: nextProblem.slug },
    };
  }
  const strong = strongestTopics[0];
  if (strong) {
    return {
      type: "mcq",
      title: `Level up ${strong.topic}`,
      reason: `You're at ${strong.accuracy}% here. Push it with a hard quiz.`,
      action: { domain: strong.topic, level: "hard", numQuestions: 5, timer: 6 },
    };
  }
  if (nextProblem && hasSessions) {
    return {
      type: "coding",
      title: `Solve ${nextProblem.title}`,
      reason: `Next up in the problem set: a ${nextProblem.difficulty} ${nextProblem.tags[0].toLowerCase()} problem.`,
      action: { slug: nextProblem.slug },
    };
  }
  return {
    type: "mcq",
    title: "Take your first quiz",
    reason: "Five JavaScript questions at medium difficulty — a quick way to find your level.",
    action: { domain: "JavaScript", level: "medium", numQuestions: 5, timer: 6 },
  };
}

// The today panel: daily goal progress, last 7 days, and time until the day rolls over (UTC).
export function todayPanel({ series, now = new Date() }) {
  const last7 = series.slice(-7).map((d) => ({ day: d.day, active: d.count > 0 }));
  const today = series.at(-1);
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return {
    goal: DAILY_GOAL,
    done: today?.count ?? 0,
    last7,
    msUntilReset: midnight - now.getTime(),
  };
}
