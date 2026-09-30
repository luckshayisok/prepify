import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Brain, CheckCircle2, Code2, FileText, Mic } from "@/components/icons";
import { Page, PageHeader, Skeleton } from "@/components/common";
import UpNextCard from "@/components/dashboard/UpNextCard";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const MODES = [
  {
    mode: "mcq",
    to: "/setup",
    icon: Brain,
    title: "MCQ quiz",
    text: "Timed multiple-choice questions on any topic, with explanations and a topic-by-topic breakdown.",
    points: ["Any topic, 3 difficulty levels", "5–20 questions, your time limit", "Instant scoring and explanations"],
    cta: "Set up a quiz",
  },
  {
    mode: "voice",
    to: "/voice",
    icon: Mic,
    title: "Voice interview",
    text: "A spoken interview with an AI interviewer, graded on how you communicate as well as what you say.",
    points: ["Technical, behavioral or mixed", "Live transcript", "Scores for clarity, structure, confidence"],
    cta: "Set up an interview",
  },
  {
    mode: "coding",
    to: "/coding",
    icon: Code2,
    title: "Coding round",
    text: "Interview-style DSA problems in a real editor, checked against hidden tests.",
    points: ["JavaScript or Python", "Hidden test cases", "AI code review with Big-O"],
    cta: "Browse problems",
  },
];

// One place to choose how to practice, with a personal recommendation on top.
export default function Practice() {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.get("/dashboard").then((r) => r.data) });

  return (
    <Page className="max-w-5xl">
      <PageHeader title="Practice" description="Pick a mode. Every session earns XP and shows up in your history." />

      <div className="mb-6">{data ? <UpNextCard recommendation={data.recommendation} /> : <Skeleton className="h-40" />}</div>

      <div className="grid gap-4 md:grid-cols-3">
        {MODES.map(({ mode, to, icon: Icon, title, text, points, cta }) => {
          const stats = data?.byMode?.[mode];
          return (
            <Link
              key={mode}
              to={to}
              className="group flex flex-col rounded-2xl border bg-card p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border bg-background">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="tabular text-xs text-muted-foreground">
                  {stats ? `${stats.count} done · avg ${stats.avgScore}%` : "Not tried yet"}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {points.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> {p}
                  </li>
                ))}
              </ul>
              <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-medium text-primary">
                {cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>

      <Link
        to="/resume"
        className="mt-6 flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-sm transition hover:border-primary/40 hover:bg-primary/5"
      >
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1">
          {user?.hasResume ? (
            <>
              <span className="font-medium">Resume on file.</span>{" "}
              <span className="text-muted-foreground">Tick "Personalize from my resume" in any mode for questions about your own projects.</span>
            </>
          ) : (
            <>
              <span className="font-medium">Make it personal.</span>{" "}
              <span className="text-muted-foreground">Upload your resume and every mode can ask about your real projects (+10% XP).</span>
            </>
          )}
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </Page>
  );
}
