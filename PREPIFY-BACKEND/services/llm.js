// Thin clients for the supported LLM providers. Each returns the model's raw text reply
// to a single prompt, asking for JSON output. Validation and retries live in ai.js.
import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const TIMEOUT_MS = 60_000;
const SYSTEM = "You are a JSON API for an interview-practice app. Reply with one valid JSON object and nothing else.";

// Errors that retrying won't fix (bad key, bad request) vs. transient ones.
export class ProviderError extends Error {
  constructor(message, { status, retryable }) {
    super(message);
    this.status = status;
    this.retryable = retryable;
  }
}

// ---------- Groq / Ollama (OpenAI-compatible chat completions) ----------

async function chatCompletion({ baseUrl, apiKey, model, prompt, temperature, extra = {} }) {
  let res;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
      body: JSON.stringify({
        model,
        temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
        ...extra,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new ProviderError(`Could not reach the AI provider: ${err.message}`, { status: 503, retryable: true });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProviderError(`AI provider returned ${res.status}: ${body.slice(0, 300)}`, {
      status: res.status,
      retryable: res.status === 429 || res.status >= 500,
    });
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function groq(prompt, { temperature }) {
  if (!env.groqApiKey) throw new HttpError(503, "AI is not configured on the server (GROQ_API_KEY missing)");
  const isReasoningModel = env.groqModel.startsWith("openai/gpt-oss");
  return chatCompletion({
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: env.groqApiKey,
    model: env.groqModel,
    prompt,
    temperature,
    // gpt-oss models "think" first; low effort keeps responses fast and cheap on tokens.
    extra: isReasoningModel ? { reasoning_effort: "low" } : {},
  });
}

function ollama(prompt, { temperature }) {
  return chatCompletion({ baseUrl: `${env.ollamaUrl}/v1`, model: env.ollamaModel, prompt, temperature });
}

// ---------- Gemini ----------

let geminiClient;
async function gemini(prompt, { temperature }) {
  if (!env.geminiApiKey) throw new HttpError(503, "AI is not configured on the server (GEMINI_API_KEY missing)");
  geminiClient ??= new GoogleGenAI({ apiKey: env.geminiApiKey });
  try {
    const res = await geminiClient.models.generateContent({
      model: env.geminiModel,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature },
    });
    return res.text || "";
  } catch (err) {
    const status = err?.status ?? 500;
    throw new ProviderError(err.message, { status, retryable: status === 429 || status >= 500 });
  }
}

const PROVIDERS = { groq, gemini, ollama };

export function complete(prompt, options) {
  const provider = PROVIDERS[env.aiProvider];
  if (!provider) throw new HttpError(503, `Unknown AI provider "${env.aiProvider}"`);
  return provider(prompt, options);
}

export const providerLabel = () => (env.aiProvider === "groq" ? `groq:${env.groqModel}` : env.aiProvider === "ollama" ? `ollama:${env.ollamaModel}` : `gemini:${env.geminiModel}`);
