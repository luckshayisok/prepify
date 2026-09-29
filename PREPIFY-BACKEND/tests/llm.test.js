// The Groq provider path, with the network stubbed out.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

process.env.AI_PROVIDER = "groq";
process.env.GROQ_API_KEY = "test-groq-key";
process.env.GROQ_MODEL = "openai/gpt-oss-120b";
delete process.env.AI_MOCK;

const { generateMcqQuestions, extractJSON } = await import("../services/ai.js");

const realFetch = globalThis.fetch;
let calls;

function stubFetch(...responses) {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
    const next = responses.shift();
    if (next.status && next.status !== 200) {
      return new Response(JSON.stringify({ error: { message: "nope" } }), { status: next.status });
    }
    return new Response(JSON.stringify({ choices: [{ message: { content: next.content } }] }), { status: 200 });
  };
}

const goodQuestions = JSON.stringify({
  questions: [
    { question: "What does useState return?", options: ["A value", "A pair", "A promise", "Nothing"], answer: "A pair", topic: "Hooks" },
    { question: "Bad one", options: ["a", "b", "c", "d"], answer: "not an option", topic: "Hooks" },
  ],
});

beforeEach(() => {
  calls = [];
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

test("sends an OpenAI-style JSON request to Groq with the key and model", async () => {
  stubFetch({ content: goodQuestions });
  const questions = await generateMcqQuestions({ domain: "React", level: "easy", numQuestions: 2 });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.groq.com/openai/v1/chat/completions");
  assert.equal(calls[0].headers.Authorization, "Bearer test-groq-key");
  assert.equal(calls[0].body.model, "openai/gpt-oss-120b");
  assert.deepEqual(calls[0].body.response_format, { type: "json_object" });
  assert.equal(calls[0].body.reasoning_effort, "low");
  // The question whose answer isn't one of its options is dropped.
  assert.equal(questions.length, 1);
  assert.equal(questions[0].answer, "A pair");
});

test("retries once after a malformed reply", async () => {
  stubFetch({ content: "sorry, here you go: not json" }, { content: goodQuestions });
  const questions = await generateMcqQuestions({ domain: "React", level: "easy", numQuestions: 2 });
  assert.equal(calls.length, 2);
  assert.equal(questions.length, 1);
});

test("rate limits surface as a friendly 503", async () => {
  stubFetch({ status: 429 }, { status: 429 });
  await assert.rejects(() => generateMcqQuestions({ domain: "React", level: "easy", numQuestions: 2 }), (err) => {
    assert.equal(err.status, 503);
    assert.match(err.message, /busy/);
    return true;
  });
  assert.equal(calls.length, 2);
});

test("a bad key is not retried", async () => {
  stubFetch({ status: 401 }, { content: goodQuestions });
  await assert.rejects(() => generateMcqQuestions({ domain: "React", level: "easy", numQuestions: 2 }), (err) => err.status === 502);
  assert.equal(calls.length, 1);
});

test("extractJSON tolerates fences and surrounding text", () => {
  assert.deepEqual(extractJSON('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJSON('Here it is: {"a":{"b":2}} hope that helps'), { a: { b: 2 } });
  assert.throws(() => extractJSON("no json here"));
});
