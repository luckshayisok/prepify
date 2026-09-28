import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, ErrorState, LevelBadge, Spinner } from "@/components/common";
import FocusHeader from "@/components/layout/FocusHeader";
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

  if (isLoading) return <Spinner label="Loading your quiz…" />;
  if (error) return <div className="p-8"><ErrorState message={errorMessage(error)} /></div>;
  if (session?.status === "completed") return <Navigate to={`/sessions/${id}`} replace />;

  const q = questions[index];
  const answered = Object.keys(answers).length;
  const lowTime = remaining < 60;

  return (
    <div className="min-h-screen">
      <FocusHeader backTo="/setup" backLabel="Exit" title={session.config?.domain}>
        <span className="tabular hidden text-xs text-muted-foreground sm:inline">
          {answered}/{questions.length} answered
        </span>
        <span
          className={cn(
            "tabular flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium",
            lowTime && "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
          )}
          aria-live="polite"
        >
          <Clock className="h-3.5 w-3.5" /> {formatClock(remaining)}
        </span>
      </FocusHeader>
      <div className="h-0.5 bg-muted">
        <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${(answered / questions.length) * 100}%` }} />
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8 flex flex-wrap gap-1.5" aria-label="Questions">
          {questions.map((qq, i) => (
            <button
              key={qq.id}
              onClick={() => go(i)}
              aria-label={`Question ${i + 1}${answers[qq.id] ? ", answered" : ""}`}
              aria-current={i === index}
              className={cn(
                "tabular h-8 w-8 rounded-md border text-xs font-medium transition",
                answers[qq.id] ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent",
                i === index && "ring-2 ring-ring ring-offset-2 ring-offset-background"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={q.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="tabular">
                Question {index + 1} of {questions.length}
              </span>
              {q.topic && <span className="rounded-md border px-1.5 py-0.5">{q.topic}</span>}
              <LevelBadge level={session.config?.level} />
            </div>
            <h2 className="mb-6 text-lg font-medium leading-relaxed sm:text-xl">{q.question}</h2>
            <ul className="space-y-2.5">
              {q.options.map((opt, i) => {
                const selected = answers[q.id] === opt;
                return (
                  <li key={`${i}-${opt}`}>
                    <button
                      onClick={() => choose(q.id, opt)}
                      aria-pressed={selected}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border bg-card px-4 py-3.5 text-left text-sm transition",
                        selected ? "border-primary ring-1 ring-primary" : "hover:border-foreground/20 hover:bg-accent/40"
                      )}
                    >
                      <span
                        className={cn(
                          "tabular flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px] font-medium",
                          selected ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{opt}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => go(index - 1)} disabled={index === 0}>
            <ChevronLeft /> Previous
          </Button>
          <span className="hidden text-xs text-muted-foreground sm:block">
            <kbd className="rounded border px-1">1</kbd>–<kbd className="rounded border px-1">4</kbd> answer · <kbd className="rounded border px-1">←</kbd>{" "}
            <kbd className="rounded border px-1">→</kbd> move
          </span>
          {index < questions.length - 1 ? (
            <Button variant="outline" onClick={() => go(index + 1)}>
              Next <ChevronRight />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Send />} Submit
            </Button>
          )}
        </div>

        {answered === questions.length && index < questions.length - 1 && (
          <div className="mt-6 text-center">
            <Button onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Send />} All answered — submit
            </Button>
          </div>
        )}
        {submitError && <Alert className="mt-6">{submitError}</Alert>}
      </div>
    </div>
  );
}
