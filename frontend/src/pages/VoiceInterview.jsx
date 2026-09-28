import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Headphones, Loader2, Mic, MicOff, PhoneOff, Sparkles, User } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, Field, Page, PageHeader, PersonalizeToggle, SegmentedControl } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { api, errorMessage } from "@/lib/api";
import { formatClock } from "@/lib/format";
import { useVapiInterview, VAPI_PUBLIC_KEY } from "@/hooks/useVapiInterview";
import { cn } from "@/lib/utils";

const STYLES = [
  { value: "technical", label: "Technical", hint: "Concepts & trade-offs" },
  { value: "behavioral", label: "Behavioral", hint: "STAR stories" },
  { value: "mixed", label: "Mixed", hint: "A realistic blend" },
];
const LEVELS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

// Calm visual for the AI's voice: a ring that breathes with its volume.
function VoiceOrb({ speaking, volume, live }) {
  const scale = 1 + (speaking ? Math.min(volume, 1) * 0.25 : 0);
  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <motion.span
        className="absolute inset-0 rounded-full bg-primary/10"
        animate={{ scale: speaking ? [1, 1.12, 1] : 1, opacity: live ? 1 : 0.4 }}
        transition={{ duration: 1.6, repeat: speaking ? Infinity : 0 }}
      />
      <motion.div
        animate={{ scale }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "flex h-28 w-28 items-center justify-center rounded-full border bg-card shadow-lg",
          live && "border-primary/40"
        )}
      >
        <Bot className={cn("h-10 w-10", live ? "text-primary" : "text-muted-foreground")} />
      </motion.div>
    </div>
  );
}

function SetupForm({ onReady }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    role: user?.targetRole || "",
    level: "medium",
    style: "mixed",
    numQuestions: 5,
    personalized: false,
    jobDescription: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/voice/start", { ...form, numQuestions: Number(form.numQuestions) });
      onReady(data);
    } catch (err) {
      setError(errorMessage(err, "Couldn't prepare the interview"));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-7 rounded-xl border bg-card p-5 shadow-xs sm:p-7">
      {!VAPI_PUBLIC_KEY && (
        <Alert tone="warning">
          Voice calls need a Vapi public key (<code className="font-mono text-xs">VITE_VAPI_PUBLIC_KEY</code>). You can prepare an interview, but the call won't
          connect until it's configured.
        </Alert>
      )}
      <Field label="Target role" htmlFor="role">
        <Input id="role" value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. Frontend Developer" required maxLength={80} className="h-10" />
      </Field>
      <Field label="Interview style">
        <SegmentedControl aria-label="Interview style" value={form.style} onChange={(v) => set("style", v)} options={STYLES} />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Difficulty">
          <SegmentedControl aria-label="Difficulty" value={form.level} onChange={(v) => set("level", v)} options={LEVELS} />
        </Field>
        <Field label={`Questions · ${form.numQuestions}`} htmlFor="count">
          <input
            id="count"
            type="range"
            min={2}
            max={8}
            value={form.numQuestions}
            onChange={(e) => set("numQuestions", e.target.value)}
            className="h-10 w-full accent-[hsl(var(--primary))]"
          />
        </Field>
      </div>
      <PersonalizeToggle checked={form.personalized} onChange={(v) => set("personalized", v)} hasResume={user?.hasResume} />
      <Field label="Job description" htmlFor="jd" hint="Optional — focuses the questions on this role.">
        <Textarea id="jd" value={form.jobDescription} onChange={(e) => set("jobDescription", e.target.value)} placeholder="Paste a job posting…" maxLength={5000} className="min-h-24" />
      </Field>
      {error && <Alert>{error}</Alert>}
      <div className="flex justify-end border-t pt-5">
        <Button type="submit" size="lg" disabled={busy || !form.role.trim()}>
          {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} {busy ? "Preparing…" : "Prepare interview"}
        </Button>
      </div>
    </form>
  );
}

export default function VoiceInterview() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const [prepared, setPrepared] = useState(null); // { session, assistant }
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const call = useVapiInterview();
  const scrollRef = useRef(null);
  const graded = useRef(false);

  useEffect(() => {
    if (call.status !== "live") return;
    const started = Date.now();
    const t = setInterval(() => setElapsed((Date.now() - started) / 1000), 1000);
    return () => clearInterval(t);
  }, [call.status]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [call.transcript, call.partial]);

  // When the call ends, send the transcript for grading.
  useEffect(() => {
    if (call.status !== "ended" || !prepared || graded.current) return;
    graded.current = true;
    setGrading(true);
    api
      .post(`/voice/${prepared.session.id}/complete`, { transcript: call.transcriptRef.current })
      .then(({ data }) => {
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        refreshUser().catch(() => {});
        navigate(`/sessions/${prepared.session.id}`, { state: { rewards: data.rewards } });
      })
      .catch((err) => {
        setGrading(false);
        setGradeError(errorMessage(err, "Grading failed"));
      });
  }, [call.status, call.transcriptRef, prepared, navigate, queryClient, refreshUser]);

  const reset = () => {
    call.reset();
    graded.current = false;
    setPrepared(null);
    setGradeError("");
    setElapsed(0);
  };

  if (!prepared) {
    return (
      <Page className="max-w-2xl">
        <PageHeader
          title="Voice interview"
          description="A realistic spoken interview with an AI. When you hang up you get scores for communication, accuracy, structure and confidence."
        />
        <SetupForm onReady={setPrepared} />
      </Page>
    );
  }

  const live = call.status === "live";
  const idle = call.status === "idle" || call.status === "error";
  const turns = [...call.transcript, ...(call.partial ? [{ ...call.partial, partial: true }] : [])];

  return (
    <Page className="max-w-5xl">
      <PageHeader title={prepared.session.title} description="Your interviewer is Maya. Answer out loud, as you would in a real interview." />
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="flex flex-col items-center rounded-xl border bg-card p-6 text-center shadow-xs lg:col-span-2">
          <p className="tabular text-sm font-medium text-muted-foreground">{formatClock(elapsed)}</p>
          <VoiceOrb speaking={call.assistantSpeaking} volume={call.volume} live={live} />
          <p className="h-5 text-sm text-muted-foreground" aria-live="polite">
            {call.status === "connecting" && "Connecting…"}
            {live && (call.assistantSpeaking ? "Maya is speaking" : "Listening…")}
            {grading && "Grading your interview…"}
          </p>

          {idle && !grading && (
            <div className="mt-6 w-full space-y-3 text-left">
              <ul className="space-y-2 rounded-lg border px-4 py-3 text-sm text-muted-foreground">
                <li className="flex gap-2.5"><Headphones className="mt-0.5 h-4 w-4 shrink-0" /> Use headphones in a quiet room.</li>
                <li className="flex gap-2.5"><Mic className="mt-0.5 h-4 w-4 shrink-0" /> Allow microphone access when asked.</li>
                <li className="flex gap-2.5"><Sparkles className="mt-0.5 h-4 w-4 shrink-0" /> Think aloud — structure beats speed.</li>
              </ul>
              {call.error && <Alert>{call.error}</Alert>}
              <Button size="lg" className="w-full" onClick={() => call.start(prepared.assistant)}>
                <Mic /> {call.status === "error" ? "Try again" : "Start call"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={reset}>
                Change settings
              </Button>
            </div>
          )}

          {(live || call.status === "connecting") && (
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={call.toggleMute} aria-pressed={call.muted}>
                {call.muted ? <MicOff /> : <Mic />} {call.muted ? "Unmute" : "Mute"}
              </Button>
              <Button variant="destructive" onClick={call.stop}>
                <PhoneOff /> End interview
              </Button>
            </div>
          )}

          {grading && <Loader2 className="mt-6 h-5 w-5 animate-spin text-muted-foreground" />}
          {gradeError && (
            <div className="mt-6 w-full space-y-3">
              <Alert>{gradeError}</Alert>
              <Button onClick={reset} className="w-full">
                Start a new interview
              </Button>
            </div>
          )}
        </section>

        <section className="flex min-h-[26rem] flex-col rounded-xl border bg-card shadow-xs lg:col-span-3">
          <h2 className="border-b px-5 py-3.5 text-sm font-semibold">Live transcript</h2>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5" style={{ maxHeight: "30rem" }}>
            {turns.length === 0 && <p className="py-20 text-center text-sm text-muted-foreground">The conversation will appear here once the call starts.</p>}
            <AnimatePresence initial={false}>
              {turns.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-2", t.role === "user" && "flex-row-reverse")}>
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background">
                    {t.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </span>
                  <p
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      t.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                      t.partial && "opacity-60"
                    )}
                  >
                    {t.text}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </Page>
  );
}
