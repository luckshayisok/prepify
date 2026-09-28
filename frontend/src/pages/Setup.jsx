import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, Field, Page, PageHeader, PersonalizeToggle, SegmentedControl } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const POPULAR = [
  "JavaScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "Data Structures",
  "Algorithms",
  "System Design",
  "SQL & Databases",
  "Operating Systems",
  "Computer Networks",
  "Machine Learning",
];

const LEVELS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export default function Setup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [domain, setDomain] = useState(params.get("domain") ?? "");
  const [numQuestions, setNumQuestions] = useState(10);
  const [level, setLevel] = useState("medium");
  const [timer, setTimer] = useState(10);
  const [personalized, setPersonalized] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [showJd, setShowJd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!domain.trim()) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/interviews/mcq", {
        domain: domain.trim(),
        level,
        numQuestions: Number(numQuestions),
        timer: Number(timer),
        personalized,
        jobDescription: jobDescription.trim(),
      });
      navigate(`/interview/${data.session.id}`, { state: data });
    } catch (err) {
      setError(errorMessage(err, "Couldn't generate questions"));
      setBusy(false);
    }
  };

  return (
    <Page className="max-w-2xl">
      <PageHeader title="MCQ quiz" description="AI-generated, timed, and scored with a topic-by-topic breakdown." />

      <form onSubmit={handleSubmit} className="space-y-7 rounded-xl border bg-card p-5 shadow-xs sm:p-7">
        <Field label="Topic" htmlFor="domain" hint="Anything works — e.g. “Kubernetes networking” or “Redux Toolkit”.">
          <Input
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="What do you want to be quizzed on?"
            maxLength={80}
            className="h-10"
            required
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {POPULAR.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setDomain(d)}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs transition",
                  domain === d ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Difficulty">
          <SegmentedControl aria-label="Difficulty" value={level} onChange={setLevel} options={LEVELS} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Questions" htmlFor="count">
            <Input id="count" type="number" min="1" max="20" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} className="h-10" />
          </Field>
          <Field label="Time limit (min)" htmlFor="timer">
            <Input id="timer" type="number" min="1" max="120" value={timer} onChange={(e) => setTimer(e.target.value)} className="h-10" />
          </Field>
        </div>

        <PersonalizeToggle checked={personalized} onChange={setPersonalized} hasResume={user?.hasResume} />

        <div>
          <button
            type="button"
            onClick={() => setShowJd((s) => !s)}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {showJd ? "− Remove job description" : "+ Add a job description (optional)"}
          </button>
          {showJd && (
            <Textarea
              className="mt-3 min-h-28"
              placeholder="Paste the job posting — questions will focus on what it asks for."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              maxLength={5000}
            />
          )}
        </div>

        {error && <Alert>{error}</Alert>}

        <div className="flex items-center justify-between gap-4 border-t pt-5">
          <p className="tabular text-xs text-muted-foreground">
            {numQuestions} questions · {timer} min · <span className="capitalize">{level}</span>
          </p>
          <Button type="submit" size="lg" disabled={!domain.trim() || busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Play />}
            {busy ? "Generating…" : "Start quiz"}
          </Button>
        </div>
      </form>
    </Page>
  );
}
