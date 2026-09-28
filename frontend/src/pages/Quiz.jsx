import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, LevelBadge, Spinner } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { api, errorMessage } from "@/lib/api";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function Quiz() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  // Fresh sessions arrive via router state; on refresh, reload from the API.
  const initial = location.state?.session?.id === id ? location.state : null;
  const { data, isLoading, error } = useQuery({
    queryKey: ["quiz", id],
    queryFn: () => api.get(`/interviews/${id}`).then((r) => ({ session: r.data.session, questions: r.data.session.questions })),
    initialData: initial ?? undefined,
    enabled: !initial,
    staleTime: Infinity,
  });

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeSpent, setTimeSpent] = useState({});
  const [now, setNow] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const questionStart = useRef(Date.now());
  const submitted = useRef(false);
  const latest = useRef({ answers, timeSpent, index });
  latest.current = { answers, timeSpent, index };

  const questions = useMemo(() => data?.questions ?? [], [data]);
  const session = data?.session;
  const deadline = session ? new Date(session.startedAt).getTime() + (session.config?.timer ?? 10) * 60_000 : null;
  const remaining = deadline ? Math.max(0, (deadline - now) / 1000) : 0;

  const recordTime = useCallback(() => {
    const q = questions[latest.current.index];
    if (!q) return latest.current.timeSpent;
    const spent = (Date.now() - questionStart.current) / 1000;
    questionStart.current = Date.now();
    const next = { ...latest.current.timeSpent, [q.id]: (latest.current.timeSpent[q.id] ?? 0) + spent };
    setTimeSpent(next);
    return next;
  }, [questions]);

  const submit = useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    setSubmitError("");
    const spent = recordTime();
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        selectedOption: latest.current.answers[q.id] ?? null,
        timeSpentSec: Math.round(spent[q.id] ?? 0),
      }));
      const { data: result } = await api.post(`/interviews/${id}/submit`, { answers: payload });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      refreshUser().catch(() => {});
      navigate(`/sessions/${id}`, { replace: true, state: { rewards: result.rewards } });
    } catch (err) {
      submitted.current = false;
      setSubmitting(false);
      setSubmitError(errorMessage(err, "Failed to submit your answers"));
    }
  }, [id, questions, navigate, queryClient, recordTime, refreshUser]);

  // Clock + auto-submit when time runs out.
  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= deadline) submit();
    }, 1000);
    return () => clearInterval(t);
  }, [deadline, submit]);

  const go = useCallback(
    (i) => {
      recordTime();
      setIndex(Math.max(0, Math.min(questions.length - 1, i)));
    },
    [questions.length, recordTime]
  );

  const choose = useCallback((qid, option) => setAnswers((a) => ({ ...a, [qid]: option })), []);

  // Keyboard: 1-4 to answer, ←/→ to navigate.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.closest?.("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      const q = questions[latest.current.index];
      if (!q) return;
      if (/^[1-4]$/.test(e.key)) choose(q.id, q.options[Number(e.key) - 1]);
      if (e.key === "ArrowRight") go(latest.current.index + 1);
      if (e.key === "ArrowLeft") go(latest.current.index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [questions, choose, go]);

  if (isLoading) return <Spinner label="Loading your interview…" />;
  if (error) return <ErrorState message={errorMessage(error)} />;
  if (session?.status === "completed") return <Navigate to={`/sessions/${id}`} replace />;

  const q = questions[index];
  const answered = Object.keys(answers).length;
  const lowTime = remaining < 60;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{session.config?.domain}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <LevelBadge level={session.config?.level} /> {answered}/{questions.length} answered
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 font-mono text-lg font-semibold tabular-nums",
            lowTime ? "animate-pulse bg-red-500/15 text-red-600 dark:text-red-400" : "bg-muted"
          )}
          aria-live="polite"
        >
          <Clock className="h-4 w-4" /> {formatClock(remaining)}
        </div>
      </div>

      {/* Question navigator */}
      <div className="mb-6 flex flex-wrap gap-2">
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            onClick={() => go(i)}
            aria-label={`Question ${i + 1}`}
            className={cn(
              "h-9 w-9 rounded-lg border text-sm font-medium transition",
              i === index && "ring-2 ring-blue-500",
              answers[qq.id] ? "border-blue-500 bg-blue-500 text-white" : "hover:bg-accent"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl border bg-card p-6 shadow-sm"
        >
          <p className="mb-1 text-sm text-muted-foreground">
            Question {index + 1} of {questions.length}
            {q.topic && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{q.topic}</span>}
          </p>
          <h2 className="mb-6 text-lg font-medium leading-relaxed">{q.question}</h2>
          <ul className="space-y-3">
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === opt;
              return (
                <li key={opt}>
                  <button
                    onClick={() => choose(q.id, opt)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition",
                      selected ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40" : "hover:bg-accent"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold",
                        selected && "border-blue-500 bg-blue-500 text-white"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span>{opt}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => go(index - 1)} disabled={index === 0}>
          <ChevronLeft /> Previous
        </Button>
        <span className="hidden text-xs text-muted-foreground sm:block">Keys 1–4 answer · ← → navigate</span>
        {index < questions.length - 1 ? (
          <Button onClick={() => go(index + 1)}>
            Next <ChevronRight />
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            {submitting ? <Loader2 className="animate-spin" /> : <Send />} Submit
          </Button>
        )}
      </div>

      {answered === questions.length && index < questions.length - 1 && (
        <div className="mt-4 text-center">
          <Button variant="link" onClick={submit} disabled={submitting}>
            All answered — submit now
          </Button>
        </div>
      )}
      {submitError && <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{submitError}</p>}
    </div>
  );
}
