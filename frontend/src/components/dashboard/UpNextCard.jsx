import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, Code2, Loader2, Mic, Sparkles } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";

const ICONS = { mcq: Brain, voice: Mic, coding: Code2 };
const CTA = { mcq: "Start quiz", voice: "Set up interview", coding: "Open problem" };

// The recommended next session, with a one-click start for quizzes.
export default function UpNextCard({ recommendation: rec }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const Icon = ICONS[rec.type] ?? Brain;

  const start = async () => {
    setError("");
    if (rec.type === "voice") return navigate("/voice");
    if (rec.type === "coding") return navigate(`/coding/${rec.action.slug}`);
    setBusy(true);
    try {
      const { data } = await api.post("/interviews/mcq", rec.action);
      navigate(`/interview/${data.session.id}`, { state: data });
    } catch (err) {
      setError(errorMessage(err, "Couldn't start the quiz"));
      setBusy(false);
    }
  };

  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-xs">
      {/* Accent edge + soft glow so the card reads as the primary action */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-700 via-indigo-500 to-indigo-300" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />

      <p className="relative flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Up next for you
      </p>
      <div className="relative mt-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-snug">{rec.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{rec.reason}</p>
        </div>
      </div>

      <div className="relative mt-auto flex flex-wrap items-center gap-3 pt-5">
        <Button onClick={start} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : null}
          {busy ? "Generating…" : CTA[rec.type]} {!busy && <ArrowRight />}
        </Button>
        {rec.action?.numQuestions && (
          <span className="tabular text-xs text-muted-foreground">
            {rec.action.numQuestions} questions · {rec.action.timer} min · <span className="capitalize">{rec.action.level}</span>
          </span>
        )}
      </div>
      {error && <p className="relative mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}
