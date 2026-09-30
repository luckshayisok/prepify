// End-to-end API test against an in-memory MongoDB with AI_MOCK=true.
import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.AI_MOCK = "true";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

let mongo;
let server;
let base;
let mongoose;

before(async () => {
  mongo = await MongoMemoryServer.create();
  const { connectDB } = await import("../config/db.js");
  const { createApp } = await import("../app.js");
  mongoose = (await import("mongoose")).default;
  await connectDB(mongo.getUri(), "prepify-test");
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server?.close();
  await mongoose?.disconnect();
  await mongo?.stop();
});

async function api(path, { method = "GET", body, token, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(base + path, { method, headers, body: form ?? (body ? JSON.stringify(body) : undefined) });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

let token;
let refreshToken;

test("health", async () => {
  const { status, data } = await api("/health");
  assert.equal(status, 200);
  assert.equal(data.ok, true);
});

test("signup validates input", async () => {
  const { status, data } = await api("/auth/signup", { method: "POST", body: { name: "A", email: "bad", password: "123" } });
  assert.equal(status, 400);
  assert.ok(data.details.length >= 1);
});

test("signup, duplicate, login, me, refresh", async () => {
  const signup = await api("/auth/signup", {
    method: "POST",
    body: { name: "Test User", email: "Test@Example.com", password: "password123" },
  });
  assert.equal(signup.status, 201);
  assert.equal(signup.data.user.email, "test@example.com");
  assert.equal(signup.data.user.password, undefined);

  const dup = await api("/auth/signup", { method: "POST", body: { name: "Test", email: "test@example.com", password: "password123" } });
  assert.equal(dup.status, 409);

  const wrong = await api("/auth/login", { method: "POST", body: { email: "test@example.com", password: "nope-nope" } });
  assert.equal(wrong.status, 401);

  const login = await api("/auth/login", { method: "POST", body: { email: "test@example.com", password: "password123" } });
  assert.equal(login.status, 200);
  token = login.data.accessToken;
  refreshToken = login.data.refreshToken;

  const me = await api("/auth/me", { token });
  assert.equal(me.data.user.name, "Test User");
  assert.equal(me.data.user.level, 1);

  const refreshed = await api("/auth/refresh", { method: "POST", body: { refreshToken } });
  assert.equal(refreshed.status, 200);
  assert.ok(refreshed.data.accessToken);

  const noAuth = await api("/auth/me");
  assert.equal(noAuth.status, 401);
});

test("mcq flow: answers hidden until submit, then scored server-side", async () => {
  const start = await api("/interviews/mcq", {
    method: "POST",
    token,
    body: { domain: "JavaScript", level: "hard", numQuestions: 4, timer: 5 },
  });
  assert.equal(start.status, 201);
  assert.equal(start.data.questions.length, 4);
  assert.equal(start.data.questions[0].answer, undefined, "answer must not leak");

  const id = start.data.session.id;
  const peek = await api(`/interviews/${id}`, { token });
  assert.equal(peek.data.session.questions[0].answer, undefined, "answer must not leak via GET");

  // Mock answer is always "Option A": get 3/4 right.
  const answers = start.data.questions.map((q, i) => ({ questionId: q.id, selectedOption: i < 3 ? "Option A" : "Option B" }));
  const submit = await api(`/interviews/${id}/submit`, { method: "POST", token, body: { answers } });
  assert.equal(submit.status, 200);
  assert.equal(submit.data.session.score, 75);
  assert.equal(submit.data.rewards.xpEarned, 85); // 50 * 2 * 0.75 + 10
  assert.ok(submit.data.rewards.newBadges.includes("first_steps"));
  assert.equal(submit.data.session.analysis.topics.length, 2);

  const again = await api(`/interviews/${id}/submit`, { method: "POST", token, body: { answers } });
  assert.equal(again.status, 409);
});

test("personalized requires a resume; pasted resume is analysed", async () => {
  const noResume = await api("/interviews/mcq", {
    method: "POST",
    token,
    body: { domain: "React", level: "easy", numQuestions: 2, timer: 5, personalized: true },
  });
  assert.equal(noResume.status, 400);

  const form = new FormData();
  form.append("text", "Experienced developer. ".repeat(20));
  const upload = await api("/resume", { method: "POST", token, form });
  assert.equal(upload.status, 201);
  assert.ok(upload.data.resume.skills.length > 0);
  assert.ok(upload.data.newBadges.includes("tailored"));

  const pdfOnly = new FormData();
  pdfOnly.append("resume", new Blob(["hello"], { type: "text/plain" }), "resume.txt");
  const bad = await api("/resume", { method: "POST", token, form: pdfOnly });
  assert.equal(bad.status, 400);

  const personalized = await api("/interviews/mcq", {
    method: "POST",
    token,
    body: { domain: "React", level: "easy", numQuestions: 2, timer: 5, personalized: true },
  });
  assert.equal(personalized.status, 201);
});

test("voice flow: too-short transcripts are rejected, real ones graded", async () => {
  const start = await api("/voice/start", {
    method: "POST",
    token,
    body: { role: "Frontend Developer", level: "medium", style: "mixed", numQuestions: 3 },
  });
  assert.equal(start.status, 201);
  assert.match(start.data.assistant.systemPrompt, /Frontend Developer/);
  assert.match(start.data.assistant.firstMessage, /Test/);

  const short = await api(`/voice/${start.data.session.id}/complete`, {
    method: "POST",
    token,
    body: { transcript: [{ role: "user", text: "um hi" }] },
  });
  assert.equal(short.status, 400);

  const start2 = await api("/voice/start", {
    method: "POST",
    token,
    body: { role: "Frontend Developer", level: "medium", style: "mixed", numQuestions: 3 },
  });
  const transcript = [
    { role: "assistant", text: "Tell me about React hooks." },
    { role: "user", text: "Hooks let function components use state and lifecycle features like useState and useEffect without classes." },
  ];
  const done = await api(`/voice/${start2.data.session.id}/complete`, { method: "POST", token, body: { transcript } });
  assert.equal(done.status, 200);
  assert.equal(done.data.session.score, 72);
  assert.ok(done.data.rewards.newBadges.includes("smooth_talker"));
});

test("coding: list, detail, submit, xp only on first full solve, review", async () => {
  const list = await api("/coding/problems", { token });
  assert.ok(list.data.problems.length >= 10);
  assert.equal(list.data.problems[0].tests, undefined);

  const detail = await api("/coding/problems/two-sum", { token });
  const n = detail.data.problem.tests.length;
  assert.match(detail.data.problem.starter.python, /def two_sum/);

  const partial = await api("/coding/submit", {
    method: "POST",
    token,
    body: { slug: "two-sum", language: "javascript", code: "x", results: Array.from({ length: n }, (_, i) => ({ passed: i > 0 })) },
  });
  assert.equal(partial.status, 201);
  assert.equal(partial.data.rewards.xpEarned, 0);

  const full = { slug: "two-sum", language: "javascript", code: "x", results: Array.from({ length: n }, () => ({ passed: true })) };
  const first = await api("/coding/submit", { method: "POST", token, body: full });
  assert.equal(first.data.firstSolve, true);
  assert.equal(first.data.rewards.xpEarned, 95);
  assert.ok(first.data.rewards.newBadges.includes("code_warrior"));
  assert.ok(partial.data.rewards.newBadges.includes("polymath")); // third mode completed

  const repeat = await api("/coding/submit", { method: "POST", token, body: full });
  assert.equal(repeat.data.rewards.xpEarned, 0);

  const mismatch = await api("/coding/submit", { method: "POST", token, body: { ...full, results: [{ passed: true }] } });
  assert.equal(mismatch.status, 400);

  const review = await api(`/coding/${first.data.session.id}/review`, { method: "POST", token });
  assert.equal(review.status, 200);
  assert.equal(review.data.review.timeComplexity, "O(n)");
});

test("dashboard, history, leaderboard, ownership", async () => {
  const dash = await api("/dashboard", { token });
  assert.equal(dash.status, 200);
  assert.equal(dash.data.totals.sessions, 5, JSON.stringify(dash.data.totals));
  assert.equal(dash.data.totals.problemsSolved, 1);
  assert.equal(dash.data.user.streak.current, 1);
  assert.ok(dash.data.trend.length > 0);
  assert.ok(Object.values(dash.data.activity.counts)[0] >= 1);
  assert.equal(dash.data.week.series.length, 14);
  assert.ok(dash.data.week.sessions.value >= 5);
  assert.equal(dash.data.today.done >= 1, true);
  assert.equal(dash.data.today.last7.length, 7);
  assert.ok(dash.data.badgeProgress.length > 0 && dash.data.badgeProgress.length <= 3);
  assert.ok(dash.data.recommendation.title);
  assert.equal(dash.data.rank.position, 1);
  assert.equal(dash.data.problemsTotal, 11);
  assert.ok(Array.isArray(dash.data.topics));

  const history = await api("/interviews?mode=mcq", { token });
  assert.ok(history.data.sessions.every((s) => s.mode === "mcq"));

  const board = await api("/leaderboard", { token });
  assert.equal(board.data.leaders[0].name, "Test U.");
  assert.equal(board.data.me.rank, 1);

  // A second user can't read the first user's sessions.
  const other = await api("/auth/signup", { method: "POST", body: { name: "Other", email: "o@example.com", password: "password123" } });
  const sid = history.data.sessions[0].id;
  const denied = await api(`/interviews/${sid}`, { token: other.data.accessToken });
  assert.equal(denied.status, 404);

  const badId = await api("/interviews/not-an-id", { token });
  assert.equal(badId.status, 404);
});

test("google sign-in: create, link existing account, password rules", async () => {
  const { setGoogleVerifier } = await import("../services/google.js");
  const profiles = {
    "new-user": { sub: "g-1", email: "Fresh@Gmail.com", email_verified: true, name: "Fresh Person", picture: "https://example.com/a.png" },
    existing: { sub: "g-2", email: "test@example.com", email_verified: true, name: "Test User" },
    unverified: { sub: "g-3", email: "x@example.com", email_verified: false },
  };
  setGoogleVerifier(async (credential) => {
    if (!profiles[credential]) throw Object.assign(new Error("bad"), { status: 401 });
    return profiles[credential];
  });

  try {
    const created = await api("/auth/google", { method: "POST", body: { credential: "new-user" } });
    assert.equal(created.status, 201);
    assert.equal(created.data.created, true);
    assert.equal(created.data.user.email, "fresh@gmail.com");
    assert.equal(created.data.user.googleLinked, true);
    assert.equal(created.data.user.hasPassword, false);
    assert.equal(created.data.user.avatarUrl, "https://example.com/a.png");

    const again = await api("/auth/google", { method: "POST", body: { credential: "new-user" } });
    assert.equal(again.status, 200);
    assert.equal(again.data.user.id, created.data.user.id);

    // Password login on a Google-only account explains what to do.
    const pw = await api("/auth/login", { method: "POST", body: { email: "fresh@gmail.com", password: "whatever1" } });
    assert.equal(pw.status, 401);
    assert.match(pw.data.message, /Google/);

    // Setting a first password needs no current password; then password login works.
    const set = await api("/auth/me/password", { method: "PUT", token: created.data.accessToken, body: { newPassword: "brand-new-pass" } });
    assert.equal(set.status, 200);
    assert.equal(set.data.user.hasPassword, true);
    const login = await api("/auth/login", { method: "POST", body: { email: "fresh@gmail.com", password: "brand-new-pass" } });
    assert.equal(login.status, 200);

    // Changing it requires the current password.
    const noCurrent = await api("/auth/me/password", { method: "PUT", token: created.data.accessToken, body: { newPassword: "another-pass" } });
    assert.equal(noCurrent.status, 400);
    const wrongCurrent = await api("/auth/me/password", {
      method: "PUT",
      token: created.data.accessToken,
      body: { currentPassword: "nope-nope", newPassword: "another-pass" },
    });
    assert.equal(wrongCurrent.status, 400);

    // Existing email/password account gets linked, not duplicated, and keeps its XP.
    const linked = await api("/auth/google", { method: "POST", body: { credential: "existing" } });
    assert.equal(linked.status, 200);
    assert.equal(linked.data.user.name, "Test User");
    assert.equal(linked.data.user.googleLinked, true);
    assert.equal(linked.data.user.hasPassword, true);
    assert.ok(linked.data.user.xp > 0);

    const unverified = await api("/auth/google", { method: "POST", body: { credential: "unverified" } });
    assert.equal(unverified.status, 401);
    const invalid = await api("/auth/google", { method: "POST", body: { credential: "forged" } });
    assert.equal(invalid.status, 401);
  } finally {
    setGoogleVerifier(null);
  }
});
