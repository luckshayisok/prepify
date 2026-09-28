# Prepify

An AI interview coach with email or Google sign-in: timed MCQ rounds, a spoken voice interviewer, a coding round, and
resume-personalized questions — with a progress dashboard, XP, levels, streaks, badges and a leaderboard.

| Mode | What happens |
| --- | --- |
| **MCQ** | Gemini generates questions for any topic and difficulty. Answers are scored on the server, with explanations and a per-topic weak-area breakdown. |
| **Voice** | A Vapi voice agent interviews you (technical, behavioral or mixed). The transcript is graded by Gemini on communication, technical accuracy, STAR structure, confidence and filler words. |
| **Coding** | 11 DSA problems in a Monaco editor. JavaScript and Python (via Pyodide) run against hidden tests in a Web Worker in your browser, and Gemini can review the solution. |
| **Resume** | Upload a PDF (or paste text) plus an optional job description. Every mode can then ask about your real projects and skill gaps. |

## Project layout

```
PREPIFY-BACKEND/   Express 5 + Mongoose API
  routes/          auth, interviews (MCQ + history), voice, resume, coding, dashboard/leaderboard
  services/        ai.js (Gemini), gamification.js (XP/levels/streaks/badges), rewards.js
  data/            coding problem bank
  tests/           node:test suites (API tests use an in-memory MongoDB)
frontend/          React 19 + Vite + Tailwind
  src/pages/       one file per screen
  src/lib/         api client (token refresh), code runner worker, helpers
```

## Running locally

```bash
# Backend
cd PREPIFY-BACKEND
cp .env.example .env       # fill in MONGODB_URI, JWT secrets, GEMINI_API_KEY
npm install
npm run dev                # http://localhost:5000

# Frontend
cd frontend
cp .env.example .env       # VITE_API_URL, VITE_VAPI_PUBLIC_KEY
npm install
npm run dev                # http://localhost:5173
```

**No keys?** Run `npm run dev:mock` in `PREPIFY-BACKEND` instead. It starts the API on an in-memory
MongoDB with canned AI responses, so every flow except the live voice call works offline.

## Tests

```bash
cd PREPIFY-BACKEND && npm test     # gamification rules, problem bank, end-to-end API
cd frontend && npm run lint && npm run build
```

## Environment variables

**Backend** (`PREPIFY-BACKEND/.env`)

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string |
| `MONGODB_DB` | no | Overrides the database name in the URI |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | yes | Long random strings |
| `GOOGLE_CLIENT_ID` | for Google login | OAuth web client ID (see below) |
| `GEMINI_API_KEY` | for AI | AI routes return 503 without it |
| `GEMINI_MODEL` | no | Default `gemini-2.5-flash` |
| `CORS_ORIGINS` | no | Comma-separated. Default: `http://localhost:5173,https://prepify-chi.vercel.app` |
| `AI_MOCK` | no | `true` returns canned AI output (dev/tests only) |

**Frontend** (`frontend/.env`)

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | Backend URL. Defaults to localhost in dev and the Render deployment in production. |
| `VITE_VAPI_PUBLIC_KEY` | Needed for voice calls |
| `VITE_GOOGLE_CLIENT_ID` | Same client ID as the backend. The Google button is hidden when unset. |

## Setting up Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** of type **Web application**.
2. Under **Authorized JavaScript origins**, add `http://localhost:5173` and your production URL (e.g. `https://prepify-chi.vercel.app`). No redirect URIs are needed.
3. Set the client ID as `GOOGLE_CLIENT_ID` on the backend and `VITE_GOOGLE_CLIENT_ID` on the frontend, then redeploy both.

Signing in with Google links to an existing account with the same email. Google-only users can add a password in **Settings**.

## Notes

- **Code runs in the browser, not on the server**, so nobody can execute code on the backend. The trade-off is that
  coding results can be faked, so coding XP is capped and only awarded the first time a problem is fully solved.
- The voice interviewer uses an inline Vapi assistant (OpenAI `gpt-4o`, Deepgram `nova-3`, Vapi voice "Clara"),
  capped at 15 minutes per call. Voice usage is billed to your Vapi account.
- Streaks roll over at midnight UTC.
