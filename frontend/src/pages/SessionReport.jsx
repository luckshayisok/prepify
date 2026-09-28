import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  MessageSquareQuote,
  RotateCcw,
  Sparkles,
  ThumbsUp,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, GradientButton, LevelBadge, ModeBadge, Page, ScoreRing, Spinner } from "@/components/common";
import RewardsDialog from "@/components/RewardsDialog";
import { api, errorMessage } from "@/lib/api";
import { formatDate, formatDuration, scoreTone, scoreVerdict } from "@/lib/format";
import { cn } from "@/lib/utils";

function Card({ title, icon: Icon, children, className }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-6 shadow-sm", className)}>
      {title && (
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />} {title}
        </h2>
      )}
      {children}
    </section>
  );
}

function Bar({ label, value, sub }) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-2 text-sm">
        <span className="truncate">{label}</span>
        <span className={cn("shrink-0 font-semibold tabular-nums", scoreTone(value))}>
          {value}%{sub && <span className="ml-1 font-normal text-muted-foreground">{sub}</span>}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600" style={{ width: `${Math.max(value, 2)}%` }} />
      </div>
    </div>
  );
}

// ---------- MCQ ----------

function McqReport({ session }) {
  const [onlyWrong, setOnlyWrong] = useState(false);
  const { analysis, answers } = session;
  const shown = onlyWrong ? answers.filter((a) => !a.isCorrect) : answers;
  const weakest = analysis.topics.filter((t) => t.accuracy < 70);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Accuracy by topic" icon={Brain}>
          <div className="space-y-3">
            {analysis.topics.map((t) => (
              <Bar key={t.name} label={t.name} value={t.accuracy} sub={`${t.correct}/${t.total}`} />
            ))}
          </div>
        </Card>
        <Card title="Focus areas" icon={AlertTriangle}>
          {weakest.length ? (
            <ul className="space-y-2">
              {weakest.map((t) => (
                <li key={t.name} className="flex items-center justify-between gap-2 rounded-xl bg-red-50 px-3 py-2 dark:bg-red-950/30">
                  <span className="text-sm font-medium">{t.name}</span>
                  <Link
                    to={`/setup?domain=${encodeURIComponent(t.name)}`}
                    className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Practice <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No weak topics this time — every topic was 70%+.</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-muted p-3">
              <p className="text-muted-foreground">Unanswered</p>
              <p className="text-xl font-bold">{analysis.unanswered}</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <p className="text-muted-foreground">Avg. time / question</p>
              <p className="text-xl font-bold">{analysis.avgTimeSec != null ? `${analysis.avgTimeSec}s` : "—"}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Question review</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-blue-600" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} />
            Only mistakes
          </label>
        </div>
        <ol className="space-y-4">
          {shown.map((a) => (
            <li key={a.questionId} className="rounded-xl border p-4">
              <div className="flex gap-3">
                {a.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="font-medium">
                    {a.questionId}. {a.question}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Your answer: </span>
                    <span className={a.isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                      {a.selectedOption ?? "Not answered"}
                    </span>
                  </p>
                  {!a.isCorrect && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Correct: </span>
                      <span className="font-semibold">{a.correctAnswer}</span>
                    </p>
                  )}
                  {a.explanation && (
                    <p className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-3 text-sm dark:bg-blue-950/30">{a.explanation}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}

// ---------- Voice ----------

function VoiceReport({ session }) {
  const f = session.feedback;
  const [showTranscript, setShowTranscript] = useState(false);
  if (!f) return <ErrorState message="This interview wasn't graded." />;

  return (
    <>
      <Card title="Summary" icon={MessageSquareQuote}>
        <p className="leading-relaxed">{f.summary}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Bar label="Communication" value={f.scores.communication} />
          <Bar label="Technical accuracy" value={f.scores.technicalAccuracy} />
          <Bar label="Structure (STAR)" value={f.scores.structure} />
          <Bar label="Confidence" value={f.scores.confidence} />
        </div>
        <div className="mt-6 rounded-xl bg-muted p-4 text-sm">
          <span className="font-semibold">{f.fillerWords.count} filler words</span>
          {f.fillerWords.examples?.length > 0 && (
            <span className="text-muted-foreground"> — e.g. {f.fillerWords.examples.map((w) => `“${w}”`).join(", ")}</span>
          )}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card title="Strengths" icon={ThumbsUp}>
          <ul className="space-y-2 text-sm">
            {f.strengths.map((s) => (
              <li key={s} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {s}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Improve next time" icon={Sparkles}>
          <ul className="space-y-2 text-sm">
            {f.improvements.map((s) => (
              <li key={s} className="flex gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> {s}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {f.perQuestion?.length > 0 && (
        <Card title="Question by question" className="mt-6">
          <ol className="space-y-4">
            {f.perQuestion.map((q, i) => (
              <li key={i} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium">{q.question}</p>
                  <span className={cn("shrink-0 text-lg font-bold", scoreTone(q.score))}>{q.score}%</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">You said: </span>
                  {q.answerSummary}
                </p>
                <p className="mt-2 rounded-lg border-l-4 border-purple-500 bg-purple-50 p-3 text-sm dark:bg-purple-950/30">{q.feedback}</p>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <Card className="mt-6">
        <button className="flex w-full items-center justify-between text-lg font-semibold" onClick={() => setShowTranscript((s) => !s)}>
          Full transcript <ChevronDown className={cn("h-5 w-5 transition", showTranscript && "rotate-180")} />
        </button>
        {showTranscript && (
          <div className="mt-4 space-y-3">
            {session.transcript.map((t, i) => (
              <div key={i} className={cn("flex gap-2", t.role === "user" && "flex-row-reverse")}>
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  {t.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </span>
                <p
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                    t.role === "user" ? "bg-blue-600 text-white" : "bg-muted"
                  )}
                >
                  {t.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

// ---------- Coding ----------

function CodingReport({ session }) {
  const queryClient = useQueryClient();
  const c = session.coding;
  const review = useMutation({
    mutationFn: () => api.post(`/coding/${session.id}/review`).then((r) => r.data.review),
    onSuccess: (r) =>
      queryClient.setQueryData(["session", session.id], (old) => ({ ...old, coding: { ...old.coding, review: r } })),
  });
  const r = c.review ?? review.data;

  return (
    <>
      <Card title={`${c.title} · ${c.language === "python" ? "Python" : "JavaScript"}`}>
        <p className="mb-4 text-sm">
          Passed <span className="font-semibold">{c.passed}</span> of {c.total} tests
          {c.firstSolve && <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600">First solve</span>}
        </p>
        <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100">
          <code>{c.code}</code>
        </pre>
        <div className="mt-4">
          <Link to={`/coding/${c.slug}`} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            Open problem again →
          </Link>
        </div>
      </Card>

      <Card title="AI code review" icon={Sparkles} className="mt-6">
        {r ? (
          <div className="space-y-4">
            <p>{r.summary}</p>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-xl bg-muted p-3">
                <p className="text-muted-foreground">Time</p>
                <p className="font-mono font-semibold">{r.timeComplexity}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-muted-foreground">Space</p>
                <p className="font-mono font-semibold">{r.spaceComplexity}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-muted-foreground">Quality</p>
                <p className={cn("font-semibold", scoreTone(r.quality))}>{r.quality}/100</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              {r.suggestions.map((s) => (
                <li key={s} className="flex gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> {s}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-sm text-muted-foreground">Get Big-O analysis and suggestions from an AI senior engineer.</p>
            <Button onClick={() => review.mutate()} disabled={review.isPending}>
              {review.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />} Review my code
            </Button>
            {review.error && <p className="mt-3 text-sm text-red-600">{errorMessage(review.error)}</p>}
          </div>
        )}
      </Card>
    </>
  );
}

// ---------- Page ----------

export default function SessionReport() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [rewards, setRewards] = useState(location.state?.rewards ?? null);

  const { data: session, isLoading, error } = useQuery({
    queryKey: ["session", id],
    queryFn: () => api.get(`/interviews/${id}`).then((r) => r.data.session),
  });

  if (isLoading) return <Spinner label="Loading report…" />;
  if (error) return <Page><ErrorState message={errorMessage(error)} /></Page>;
  if (session.status !== "completed") {
    return (
      <Page>
        <ErrorState
          message="This session hasn't been completed yet."
          action={session.mode === "mcq" && <Link to={`/interview/${id}`} className="underline">Resume it</Link>}
        />
      </Page>
    );
  }

  const verdict = scoreVerdict(session.score);
  const retry =
    session.mode === "mcq"
      ? `/setup?domain=${encodeURIComponent(session.config.domain)}`
      : session.mode === "voice"
        ? "/voice"
        : `/coding/${session.coding?.slug}`;

  const closeRewards = () => {
    setRewards(null);
    navigate(location.pathname, { replace: true, state: null });
  };

  return (
    <Page className="max-w-4xl">
      <RewardsDialog rewards={rewards} score={session.score} open={Boolean(rewards)} onOpenChange={(o) => !o && closeRewards()} />

      <section className="mb-6 flex flex-col items-center gap-6 rounded-3xl border bg-card p-6 shadow-sm sm:flex-row sm:p-8">
        <ScoreRing score={session.score} size={140} />
        <div className="flex-1 text-center sm:text-left">
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <ModeBadge mode={session.mode} />
            <LevelBadge level={session.config?.level} />
            {session.personalized && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                <Sparkles className="h-3 w-3" /> Personalized
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">{session.title}</h1>
          <p className="mt-1 font-medium">{verdict.title}</p>
          <p className="text-sm text-muted-foreground">{verdict.message}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground sm:justify-start">
            <span>{formatDate(session.completedAt)}</span>
            {session.mode !== "coding" && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatDuration(session.durationSec)}
              </span>
            )}
            {session.xpEarned > 0 && <span className="font-semibold text-blue-600 dark:text-blue-400">+{session.xpEarned} XP</span>}
          </div>
        </div>
      </section>

      {session.mode === "mcq" && <McqReport session={session} />}
      {session.mode === "voice" && <VoiceReport session={session} />}
      {session.mode === "coding" && <CodingReport session={session} />}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="outline" asChild>
          <Link to="/dashboard">Dashboard</Link>
        </Button>
        <GradientButton as={Link} to={retry}>
          <RotateCcw /> Try again
        </GradientButton>
      </div>
    </Page>
  );
}
