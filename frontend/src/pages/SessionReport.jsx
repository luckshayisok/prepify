import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  MessageSquareQuote,
  RotateCcw,
  Sparkles,
  Target,
  ThumbsUp,
  User,
  X,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Breadcrumbs, ErrorState, LevelBadge, ModeBadge, Page, PageSkeleton, ProgressBar, ScoreRing, Section, SegmentedControl } from "@/components/common";
import RewardsDialog from "@/components/RewardsDialog";
import { api, errorMessage } from "@/lib/api";
import { formatDate, formatDuration, scoreTone, scoreVerdict } from "@/lib/format";
import { cn } from "@/lib/utils";

function ScoreRow({ label, value, sub }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-2 text-sm">
        <span className="truncate">{label}</span>
        <span className="tabular shrink-0 font-medium">
          {value}%{sub && <span className="ml-1 text-xs font-normal text-muted-foreground">({sub})</span>}
        </span>
      </div>
      <ProgressBar value={Math.max(value, 2)} />
    </div>
  );
}

function BulletList({ items, icon: Icon, tone }) {
  return (
    <ul className="space-y-2.5 text-sm">
      {items.map((s) => (
        <li key={s} className="flex gap-2.5">
          <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} />
          <span className="leading-relaxed">{s}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------- MCQ ----------

function McqReport({ session }) {
  const [filter, setFilter] = useState("all");
  const { analysis, answers } = session;
  const shown = filter === "wrong" ? answers.filter((a) => !a.isCorrect) : answers;
  const weak = analysis.topics.filter((t) => t.accuracy < 70);
  const wrongCount = answers.filter((a) => !a.isCorrect).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Accuracy by topic" icon={Brain}>
          <div className="space-y-3.5">
            {analysis.topics.map((t) => (
              <ScoreRow key={t.name} label={t.name} value={t.accuracy} sub={`${t.correct}/${t.total}`} />
            ))}
          </div>
        </Section>
        <Section title="Focus areas" icon={Target}>
          {weak.length ? (
            <ul className="divide-y rounded-lg border">
              {weak.map((t) => (
                <li key={t.name} className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
                  <span className="truncate">{t.name}</span>
                  <Link
                    to={`/setup?domain=${encodeURIComponent(t.name)}`}
                    className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Practice <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No weak topics — every topic was 70% or higher.</p>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">Unanswered</dt>
              <dd className="tabular mt-0.5 font-semibold">{analysis.unanswered}</dd>
            </div>
            <div className="rounded-lg border px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">Avg. time / question</dt>
              <dd className="tabular mt-0.5 font-semibold">{analysis.avgTimeSec != null ? `${analysis.avgTimeSec}s` : "—"}</dd>
            </div>
          </dl>
        </Section>
      </div>

      <Section
        title="Question review"
        padded={false}
        action={
          <SegmentedControl
            aria-label="Filter questions"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: `All ${answers.length}` },
              { value: "wrong", label: `Mistakes ${wrongCount}` },
            ]}
            className="w-56"
          />
        }
      >
        <ol className="divide-y">
          {shown.map((a) => (
            <li key={a.questionId} className="flex gap-3 px-5 py-4">
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  a.isCorrect ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                )}
              >
                {a.isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </span>
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                <p className="font-medium leading-relaxed">
                  <span className="tabular text-muted-foreground">{a.questionId}.</span> {a.question}
                </p>
                <p>
                  <span className="text-muted-foreground">Your answer: </span>
                  <span className={a.isCorrect ? "" : "text-rose-600 line-through decoration-rose-600/40 dark:text-rose-400"}>
                    {a.selectedOption ?? "Not answered"}
                  </span>
                </p>
                {!a.isCorrect && (
                  <p>
                    <span className="text-muted-foreground">Correct: </span>
                    <span className="font-medium">{a.correctAnswer}</span>
                  </p>
                )}
                {a.explanation && <p className="rounded-md bg-muted/60 px-3 py-2 text-muted-foreground">{a.explanation}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

// ---------- Voice ----------

function VoiceReport({ session }) {
  const f = session.feedback;
  const [showTranscript, setShowTranscript] = useState(false);
  if (!f) return <ErrorState message="This interview wasn't graded." />;

  return (
    <div className="space-y-6">
      <Section title="Summary" icon={MessageSquareQuote}>
        <p className="leading-relaxed">{f.summary}</p>
        <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <ScoreRow label="Communication" value={f.scores.communication} />
          <ScoreRow label="Technical accuracy" value={f.scores.technicalAccuracy} />
          <ScoreRow label="Structure (STAR)" value={f.scores.structure} />
          <ScoreRow label="Confidence" value={f.scores.confidence} />
        </div>
        <p className="mt-6 rounded-lg border px-3 py-2.5 text-sm">
          <span className="tabular font-medium">{f.fillerWords.count} filler words</span>
          {f.fillerWords.examples?.length > 0 && (
            <span className="text-muted-foreground"> — e.g. {f.fillerWords.examples.map((w) => `“${w}”`).join(", ")}</span>
          )}
        </p>
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Strengths" icon={ThumbsUp}>
          <BulletList items={f.strengths} icon={Check} tone="text-emerald-500" />
        </Section>
        <Section title="Improve next time" icon={Sparkles}>
          <BulletList items={f.improvements} icon={ArrowRight} tone="text-primary" />
        </Section>
      </div>

      {f.perQuestion?.length > 0 && (
        <Section title="Question by question" padded={false}>
          <ol className="divide-y">
            {f.perQuestion.map((q, i) => (
              <li key={i} className="space-y-2 px-5 py-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium leading-relaxed">{q.question}</p>
                  <span className={cn("tabular shrink-0 font-semibold", scoreTone(q.score))}>{q.score}%</span>
                </div>
                <p className="text-muted-foreground">{q.answerSummary}</p>
                <p className="rounded-md bg-muted/60 px-3 py-2">{q.feedback}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <Section padded={false}>
        <button className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-semibold" onClick={() => setShowTranscript((s) => !s)} aria-expanded={showTranscript}>
          Full transcript <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition", showTranscript && "rotate-180")} />
        </button>
        {showTranscript && (
          <div className="space-y-3 border-t p-5">
            {session.transcript.map((t, i) => (
              <div key={i} className={cn("flex gap-2", t.role === "user" && "flex-row-reverse")}>
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background">
                  {t.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </span>
                <p className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm", t.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>{t.text}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ---------- Coding ----------

function CodingReport({ session }) {
  const queryClient = useQueryClient();
  const c = session.coding;
  const review = useMutation({
    mutationFn: () => api.post(`/coding/${session.id}/review`).then((r) => r.data.review),
    onSuccess: (r) => queryClient.setQueryData(["session", session.id], (old) => ({ ...old, coding: { ...old.coding, review: r } })),
  });
  const r = c.review ?? review.data;

  return (
    <div className="space-y-6">
      <Section
        title={`${c.title} · ${c.language === "python" ? "Python" : "JavaScript"}`}
        padded={false}
        action={
          <Link to={`/coding/${c.slug}`} className="text-xs font-medium text-muted-foreground hover:text-foreground">
            Open problem
          </Link>
        }
      >
        <p className="tabular px-5 pt-4 text-sm">
          Passed <span className="font-semibold">{c.passed}</span> of {c.total} tests
          {c.firstSolve && <span className="ml-2 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-600">First solve</span>}
        </p>
        <pre className="m-5 max-h-96 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-[13px] leading-relaxed">
          <code>{c.code}</code>
        </pre>
      </Section>

      <Section title="AI code review" icon={Sparkles}>
        {r ? (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed">{r.summary}</p>
            <dl className="grid grid-cols-3 gap-3 text-sm">
              {[
                ["Time", r.timeComplexity, "font-mono"],
                ["Space", r.spaceComplexity, "font-mono"],
                ["Quality", `${r.quality}/100`, "tabular"],
              ].map(([k, v, cls]) => (
                <div key={k} className="rounded-lg border px-3 py-2.5">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className={cn("mt-0.5 font-semibold", cls)}>{v}</dd>
                </div>
              ))}
            </dl>
            <BulletList items={r.suggestions} icon={ArrowRight} tone="text-primary" />
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <p className="mb-4 text-sm text-muted-foreground">Get Big-O analysis and suggestions from an AI reviewer.</p>
            <Button variant="outline" onClick={() => review.mutate()} disabled={review.isPending}>
              {review.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />} Review my code
            </Button>
            {review.error && <p className="mt-3 text-sm text-destructive">{errorMessage(review.error)}</p>}
          </div>
        )}
      </Section>
    </div>
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

  if (isLoading) return <PageSkeleton />;
  if (error) return <Page><ErrorState message={errorMessage(error)} /></Page>;
  if (session.status !== "completed") {
    return (
      <Page>
        <ErrorState
          message="This session hasn't been completed yet."
          action={session.mode === "mcq" && <Button asChild variant="outline"><Link to={`/interview/${id}`}>Resume it</Link></Button>}
        />
      </Page>
    );
  }

  const verdict = scoreVerdict(session.score);
  const retry =
    session.mode === "mcq" ? `/setup?domain=${encodeURIComponent(session.config.domain)}` : session.mode === "voice" ? "/voice" : `/coding/${session.coding?.slug}`;

  const closeRewards = () => {
    setRewards(null);
    navigate(location.pathname, { replace: true, state: null });
  };

  return (
    <Page className="max-w-4xl">
      <RewardsDialog rewards={rewards} score={session.score} open={Boolean(rewards)} onOpenChange={(o) => !o && closeRewards()} />

      <div className="mb-4">
        <Breadcrumbs crumbs={[{ label: "History", to: "/history" }, { label: session.title }]} />
      </div>

      <section className="mb-6 flex flex-col items-center gap-6 rounded-xl border bg-card p-6 shadow-xs sm:flex-row sm:p-7">
        <ScoreRing score={session.score} />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
            <ModeBadge mode={session.mode} />
            <LevelBadge level={session.config?.level} />
            {session.personalized && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" /> Personalized
              </span>
            )}
          </div>
          <h1 className="text-xl font-semibold sm:text-2xl">{session.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{verdict.title}.</span> {verdict.message}
          </p>
          <div className="tabular mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:justify-start">
            <span>{formatDate(session.completedAt)}</span>
            {session.mode !== "coding" && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatDuration(session.durationSec)}
              </span>
            )}
            {session.xpEarned > 0 && <span className="font-medium text-primary">+{session.xpEarned} XP</span>}
          </div>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link to={retry}>
            <RotateCcw /> Try again
          </Link>
        </Button>
      </section>

      {session.mode === "mcq" && <McqReport session={session} />}
      {session.mode === "voice" && <VoiceReport session={session} />}
      {session.mode === "coding" && <CodingReport session={session} />}
    </Page>
  );
}
