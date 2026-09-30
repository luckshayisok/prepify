import { test } from "node:test";
import assert from "node:assert/strict";
import { badgeProgress, dailySeries, recommendNext, todayPanel, weekOverWeek } from "../services/insights.js";
import { PROBLEMS } from "../data/codingProblems.js";

test("dailySeries fills missing days and computes averages", () => {
  const series = dailySeries({ "2026-03-10": { count: 2, xp: 120, scoreSum: 150 } }, "2026-03-10", 3);
  assert.deepEqual(series, [
    { day: "2026-03-08", count: 0, xp: 0, avgScore: null },
    { day: "2026-03-09", count: 0, xp: 0, avgScore: null },
    { day: "2026-03-10", count: 2, xp: 120, avgScore: 75 },
  ]);
});

test("weekOverWeek compares the last 7 days with the 7 before", () => {
  const day = (count, xp, avgScore) => ({ count, xp, avgScore });
  const series = [
    ...Array.from({ length: 6 }, () => day(0, 0, null)),
    day(2, 100, 50), // previous week: 2 sessions, avg 50
    ...Array.from({ length: 5 }, () => day(0, 0, null)),
    day(1, 80, 90),
    day(2, 60, 60), // this week: 3 sessions, weighted avg 70
  ];
  const w = weekOverWeek(series);
  assert.deepEqual(w.sessions, { value: 3, delta: 1 });
  assert.deepEqual(w.xp, { value: 140, delta: 40 });
  assert.deepEqual(w.avgScore, { value: 70, delta: 20 });
  assert.equal(weekOverWeek(Array.from({ length: 14 }, () => day(0, 0, null))).avgScore.delta, null);
});

test("badgeProgress skips earned badges and sorts closest first", () => {
  const user = { badges: [{ id: "first_steps" }, { id: "code_warrior" }], streak: { current: 2 }, solvedProblems: ["a", "b", "c", "d"], level: 2 };
  const stats = { completedSessions: 3, modes: { mcq: 3 }, bestScore: 80, bestHardScore: 60 };
  const list = badgeProgress({ user, stats });
  assert.ok(!list.some((b) => b.id === "first_steps"));
  assert.equal(list[0].id, "algorithmist"); // 4/5 = 80%
  assert.deepEqual(list.find((b) => b.id === "on_fire"), {
    id: "on_fire", name: "On Fire", description: "Reach a 3-day streak", current: 2, target: 3, pct: 67,
  });
  assert.ok(list.every((b, i) => i === 0 || list[i - 1].pct >= b.pct));
});

test("recommendNext prefers the weakest topic, then untried modes", () => {
  const weak = recommendNext({ weakestTopics: [{ topic: "SQL", accuracy: 40 }], hasSessions: true, problems: PROBLEMS });
  assert.equal(weak.type, "mcq");
  assert.equal(weak.action.domain, "SQL");

  const voice = recommendNext({ modes: { mcq: 2 }, hasSessions: true, problems: PROBLEMS });
  assert.equal(voice.type, "voice");

  const coding = recommendNext({ modes: { mcq: 2, voice: 1 }, solved: ["two-sum"], hasSessions: true, problems: PROBLEMS });
  assert.equal(coding.type, "coding");
  assert.equal(coding.action.slug, PROBLEMS[1].slug);

  const first = recommendNext({ hasSessions: false, problems: PROBLEMS });
  assert.equal(first.title, "Take your first quiz");
});

test("todayPanel reports goal progress and time to UTC midnight", () => {
  const series = Array.from({ length: 14 }, (_, i) => ({ day: `d${i}`, count: i === 13 ? 1 : i % 2 }));
  const t = todayPanel({ series, now: new Date("2026-03-10T22:00:00Z") });
  assert.equal(t.done, 1);
  assert.equal(t.goal, 1);
  assert.equal(t.last7.length, 7);
  assert.equal(t.msUntilReset, 2 * 3600 * 1000);
});
