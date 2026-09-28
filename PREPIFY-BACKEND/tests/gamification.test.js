import { test } from "node:test";
import assert from "node:assert/strict";
import {
  xpForSession,
  xpThreshold,
  levelFromXp,
  levelProgress,
  nextStreak,
  liveStreak,
  evaluateBadges,
  CODING_XP_CAP,
} from "../services/gamification.js";

test("xp scales with score and difficulty", () => {
  assert.equal(xpForSession({ mode: "mcq", level: "easy", score: 0 }), 10); // completion bonus only
  assert.equal(xpForSession({ mode: "mcq", level: "easy", score: 50 }), 35);
  assert.equal(xpForSession({ mode: "mcq", level: "hard", score: 50 }), 60);
  assert.equal(xpForSession({ mode: "mcq", level: "easy", score: 100 }), 85); // 50 + 10 + 25 perfect
  assert.equal(xpForSession({ mode: "voice", level: "medium", score: 80 }), 106);
});

test("personalized sessions earn a 10% bonus", () => {
  assert.equal(xpForSession({ mode: "mcq", level: "easy", score: 100, personalized: true }), 94);
});

test("coding xp only on first full solve, and capped", () => {
  assert.equal(xpForSession({ mode: "coding", level: "hard", score: 100, firstSolve: false }), 0);
  assert.equal(xpForSession({ mode: "coding", level: "easy", score: 100, firstSolve: true }), 95);
  assert.equal(xpForSession({ mode: "coding", level: "hard", score: 100, firstSolve: true }), CODING_XP_CAP);
});

test("score is clamped to 0..100", () => {
  assert.equal(xpForSession({ mode: "mcq", score: 500 }), xpForSession({ mode: "mcq", score: 100 }));
  assert.equal(xpForSession({ mode: "mcq", score: -5 }), 10);
});

test("level thresholds", () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(xpThreshold), [0, 100, 300, 600, 1000]);
  assert.equal(levelFromXp(0), 1);
  assert.equal(levelFromXp(99), 1);
  assert.equal(levelFromXp(100), 2);
  assert.equal(levelFromXp(299), 2);
  assert.equal(levelFromXp(1000), 5);
  assert.deepEqual(levelProgress(150), { level: 2, current: 50, needed: 200, pct: 25 });
});

test("streaks continue on consecutive days and reset after a gap", () => {
  let s = nextStreak({}, "2026-01-01");
  assert.deepEqual(s, { current: 1, longest: 1, lastActiveDay: "2026-01-01" });
  s = nextStreak(s, "2026-01-01"); // same day: unchanged
  assert.equal(s.current, 1);
  s = nextStreak(s, "2026-01-02");
  s = nextStreak(s, "2026-01-03");
  assert.deepEqual(s, { current: 3, longest: 3, lastActiveDay: "2026-01-03" });
  s = nextStreak(s, "2026-01-06"); // gap
  assert.deepEqual(s, { current: 1, longest: 3, lastActiveDay: "2026-01-06" });
  // Month / year boundaries
  assert.equal(nextStreak({ current: 4, longest: 4, lastActiveDay: "2025-12-31" }, "2026-01-01").current, 5);
});

test("live streak is zero once a day is missed", () => {
  const streak = { current: 5, longest: 5, lastActiveDay: "2026-03-10" };
  assert.equal(liveStreak(streak, "2026-03-10"), 5);
  assert.equal(liveStreak(streak, "2026-03-11"), 5);
  assert.equal(liveStreak(streak, "2026-03-12"), 0);
  assert.equal(liveStreak({}, "2026-03-12"), 0);
});

test("badges are awarded once", () => {
  const user = { badges: [], streak: { current: 3 }, solvedProblems: ["a"], level: 1 };
  const stats = { completedSessions: 1, modes: { mcq: 1 } };
  const earned = evaluateBadges({ user, stats, session: { score: 100, config: { level: "hard" } } });
  assert.deepEqual(earned.sort(), ["code_warrior", "first_steps", "hard_mode", "on_fire", "perfectionist"].sort());

  const again = evaluateBadges({
    user: { ...user, badges: earned.map((id) => ({ id })) },
    stats,
    session: { score: 100, config: { level: "hard" } },
  });
  assert.deepEqual(again, []);
});

test("polymath needs all three modes", () => {
  const user = { badges: [], streak: {}, solvedProblems: [], level: 1 };
  const two = evaluateBadges({ user, stats: { completedSessions: 2, modes: { mcq: 1, voice: 1 } }, session: null });
  assert.ok(!two.includes("polymath"));
  const three = evaluateBadges({ user, stats: { completedSessions: 3, modes: { mcq: 1, voice: 1, coding: 1 } }, session: null });
  assert.ok(three.includes("polymath"));
});
