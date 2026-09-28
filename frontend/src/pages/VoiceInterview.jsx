import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Briefcase, Headphones, Loader2, Mic, MicOff, PhoneOff, Sparkles, User, Volume2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { GradientButton, Page, PageHeader, PersonalizeToggle } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { api, errorMessage } from "@/lib/api";
import { LEVEL_STYLES, formatClock } from "@/lib/format";
import { useVapiInterview, VAPI_PUBLIC_KEY } from "@/hooks/useVapiInterview";
import { cn } from "@/lib/utils";

const STYLES = [
  { id: "technical", label: "Technical", text: "Concepts, trade-offs, debugging" },
  { id: "behavioral", label: "Behavioral", text: "STAR-style experience questions" },
  { id: "mixed", label: "Mixed", text: "A realistic blend of both" },
];

function Orb({ speaking, volume, live }) {
  const scale = 1 + (speaking ? Math.min(volume, 1) * 0.35 : 0);
  return (
    <div className="relative flex h-56 w-56 items-center justify-center">
      {live &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border-2 border-purple-500/40"
            animate={speaking ? { scale: [1, 1.5], opacity: [0.6, 0] } : { scale: 1, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
          />
        ))}
      <motion.div
        animate={{ scale }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-fuchsia-500 shadow-2xl",
          live ? "shadow-purple-500/40" : "opacity-70"
        )}
      >
        {speaking ? <Volume2 className="h-12 w-12 text-white" /> : <Bot className="h-12 w-12 text-white" />}
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
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6 rounded-3xl border bg-card p-6 shadow-lg sm:p-8">
      {!VAPI_PUBLIC_KEY && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          Voice calls need a Vapi public key (<code>VITE_VAPI_PUBLIC_KEY</code>). You can still prepare an interview, but the call won't connect
          until it's configured.
        </p>
      )}
      <div className="space-y-2">
        <Label>Target role</Label>
        <Input value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. Frontend Developer, Data Analyst" required maxLength={80} className="h-12" />
      </div>

      <div className="space-y-2">
        <Label>Interview style</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {STYLES.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => set("style", s.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                form.style === s.id ? "border-purple-500 bg-purple-50 ring-2 ring-purple-500/20 dark:bg-purple-950/30" : "hover:bg-accent"
              )}
            >
              <p className="font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.text}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Difficulty</Label>
          <div className="grid grid-cols-3 gap-2">
            {["easy", "medium", "hard"].map((l) => (
              <button
                type="button"
                key={l}
                onClick={() => set("level", l)}
                className={cn("h-11 rounded-xl border text-sm font-medium capitalize", form.level === l ? LEVEL_STYLES[l] + " border-current" : "hover:bg-accent")}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Questions ({form.numQuestions})</Label>
          <input
            type="range"
            min={2}
            max={8}
            value={form.numQuestions}
            onChange={(e) => set("numQuestions", e.target.value)}
            className="h-11 w-full accent-purple-600"
          />
        </div>
      </div>

      <PersonalizeToggle checked={form.personalized} onChange={(v) => set("personalized", v)} hasResume={user?.hasResume} />

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" /> Job description <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          value={form.jobDescription}
          onChange={(e) => set("jobDescription", e.target.value)}
          placeholder="Paste a job posting to focus the questions on it."
          maxLength={5000}
          className="min-h-24"
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      <GradientButton type="submit" disabled={busy || !form.role.trim()} className="h-12 w-full">
        {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} {busy ? "Preparing your interviewer…" : "Prepare interview"}
      </GradientButton>
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

  // Call timer
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
      <Page>
        <PageHeader
          eyebrow="Voice interview"
          title="Talk it through with an AI interviewer"
          description="A realistic spoken interview. When you hang up, you get scores for communication, accuracy, structure and confidence, plus a filler-word count."
        />
        <SetupForm onReady={setPrepared} />
      </Page>
    );
  }

  const live = call.status === "live";
  const idle = call.status === "idle" || call.status === "error";

  return (
    <Page className="max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="flex flex-col items-center rounded-3xl border bg-card p-6 text-center shadow-sm lg:col-span-2">
          <p className="text-sm text-muted-foreground">{prepared.session.title}</p>
          <p className="mb-2 font-mono text-2xl font-semibold tabular-nums">{formatClock(elapsed)}</p>
          <Orb speaking={call.assistantSpeaking} volume={call.volume} live={live} />
          <p className="mt-2 h-6 text-sm font-medium">
            {call.status === "connecting" && "Connecting…"}
            {live && (call.assistantSpeaking ? "Maya is speaking" : "Listening…")}
            {grading && "Grading your interview…"}
          </p>

          {idle && !grading && (
            <div className="mt-4 w-full space-y-3">
              <ul className="space-y-2 rounded-xl bg-muted p-4 text-left text-sm text-muted-foreground">
                <li className="flex gap-2"><Headphones className="h-4 w-4 shrink-0" /> Use headphones in a quiet room.</li>
                <li className="flex gap-2"><Mic className="h-4 w-4 shrink-0" /> Allow microphone access when asked.</li>
                <li className="flex gap-2"><Sparkles className="h-4 w-4 shrink-0" /> Think aloud — structure beats speed.</li>
              </ul>
              {call.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{call.error}</p>}
              <GradientButton className="h-12 w-full" onClick={() => call.start(prepared.assistant)}>
                <Mic /> {call.status === "error" ? "Try again" : "Start call"}
              </GradientButton>
              <Button variant="ghost" className="w-full" onClick={reset}>
                Change settings
              </Button>
            </div>
          )}

          {(live || call.status === "connecting") && (
            <div className="mt-6 flex gap-3">
              <Button variant="outline" size="lg" onClick={call.toggleMute} aria-label={call.muted ? "Unmute" : "Mute"}>
                {call.muted ? <MicOff /> : <Mic />} {call.muted ? "Unmute" : "Mute"}
              </Button>
              <Button variant="destructive" size="lg" onClick={call.stop}>
                <PhoneOff /> End interview
              </Button>
            </div>
          )}

          {grading && <Loader2 className="mt-6 h-8 w-8 animate-spin text-purple-600" />}
          {gradeError && (
            <div className="mt-4 space-y-3">
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{gradeError}</p>
              <GradientButton onClick={reset}>Start a new interview</GradientButton>
            </div>
          )}
        </section>

        <section className="flex min-h-[28rem] flex-col rounded-3xl border bg-card shadow-sm lg:col-span-3">
          <h2 className="border-b px-6 py-4 font-semibold">Live transcript</h2>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-6" style={{ maxHeight: "32rem" }}>
            {call.transcript.length === 0 && !call.partial && (
              <p className="py-20 text-center text-sm text-muted-foreground">The conversation will appear here once the call starts.</p>
            )}
            <AnimatePresence initial={false}>
              {[...call.transcript, ...(call.partial ? [{ ...call.partial, partial: true }] : [])].map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2", t.role === "user" && "flex-row-reverse")}
                >
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    {t.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </span>
                  <p
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      t.role === "user" ? "bg-blue-600 text-white" : "bg-muted",
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
