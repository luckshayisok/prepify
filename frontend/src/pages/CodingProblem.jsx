import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import { Check, CheckCircle2, EyeOff, Loader2, Play, RotateCcw, Send, Terminal, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ErrorState, LevelBadge, Spinner } from "@/components/common";
import { Tooltip } from "@/components/ui/tooltip";
import FocusHeader from "@/components/layout/FocusHeader";
import RewardsDialog from "@/components/RewardsDialog";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { api, errorMessage } from "@/lib/api";
import { CodeRunner } from "@/lib/codeRunner";
import { cn } from "@/lib/utils";

const LANGS = { javascript: "JavaScript", python: "Python" };

const draftKey = (slug, lang) => `prepify.draft.${slug}.${lang}`;
const readDraft = (slug, lang) => {
  try {
    return localStorage.getItem(draftKey(slug, lang));
  } catch {
    return null;
  }
};

// Renders `backtick` spans in problem text as inline code.
function RichText({ text }) {
  return text.split("\n\n").map((para, i) => (
    <p key={i} className="mb-3 text-sm leading-relaxed">
      {para.split(/(`[^`]+`)/).map((part, j) =>
        part.startsWith("`") ? (
          <code key={j} className="rounded border bg-muted/60 px-1 py-px font-mono text-[0.85em]">
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        )
      )}
    </p>
  ));
}

function ResultsPanel({ run, problem }) {
  if (!run) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        <strong className="font-medium text-foreground">Run</strong> checks the example tests. <strong className="font-medium text-foreground">Submit</strong> checks all
        tests, including hidden ones.
      </p>
    );
  }
  if (run.compileError) {
    return <pre className="whitespace-pre-wrap p-4 font-mono text-[13px] text-destructive">{run.compileError}</pre>;
  }
  const passed = run.results.filter((r) => r.passed).length;
  const all = passed === run.results.length;
  return (
    <div className="space-y-3 p-4">
      <p className={cn("tabular text-sm font-semibold", all ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
        {all ? "All tests passed" : `${passed} / ${run.results.length} tests passed`}
        {run.timedOut && " · time limit exceeded"}
      </p>
      <ul className="space-y-2">
        {run.results.map((r, i) => {
          const test = run.tests[i];
          return (
            <li key={i} className="rounded-lg border text-sm">
              <div className="flex items-center gap-2 px-3 py-2">
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full",
                    r.passed ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  )}
                >
                  {r.passed ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                </span>
                <span className="tabular font-medium">Test {i + 1}</span>
                {test.hidden && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <EyeOff className="h-3 w-3" /> hidden
                  </span>
                )}
                {r.runtimeMs != null && r.passed && <span className="tabular ml-auto text-xs text-muted-foreground">{r.runtimeMs} ms</span>}
              </div>
              {!test.hidden && !r.passed && (
                <div className="space-y-1 border-t bg-muted/30 px-3 py-2 font-mono text-xs">
                  <p>
                    <span className="text-muted-foreground">input </span>
                    {problem.params.map((p, k) => `${p} = ${JSON.stringify(test.args[k])}`).join(", ")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">expected </span>
                    {JSON.stringify(test.expected)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">got </span>
                    {r.error ? <span className="text-destructive">{r.error}</span> : r.actual}
                  </p>
                </div>
              )}
              {test.hidden && !r.passed && r.error && <p className="border-t px-3 py-2 font-mono text-xs text-destructive">{r.error}</p>}
            </li>
          );
        })}
      </ul>
      {run.logs?.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Terminal className="h-3 w-3" /> Console
          </p>
          <pre className="max-h-40 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs">{run.logs.join("\n")}</pre>
        </div>
      )}
    </div>
  );
}

export default function CodingProblem() {
  const { slug } = useParams();
  const { theme } = useTheme();
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const runner = useMemo(() => new CodeRunner(), []);
  useEffect(() => () => runner.dispose(), [runner]);

  const { data: problem, isLoading, error } = useQuery({
    queryKey: ["problem", slug],
    queryFn: () => api.get(`/coding/problems/${slug}`).then((r) => r.data.problem),
  });

  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem("prepify.lang") === "python" ? "python" : "javascript";
    } catch {
      return "javascript";
    }
  });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(null); // "run" | "submit"
  const [status, setStatus] = useState("");
  const [run, setRun] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const saveTimer = useRef(null);

  // Load the saved draft (or starter code) when the problem or language changes.
  useEffect(() => {
    if (!problem) return;
    setCode(readDraft(problem.slug, language) ?? problem.starter[language]);
    setRun(null);
  }, [problem, language]);

  const onChange = (value = "") => {
    setCode(value);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(slug, language), value);
      } catch {
        /* storage full or blocked — drafts are a convenience */
      }
    }, 400);
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    try {
      localStorage.setItem("prepify.lang", lang);
    } catch {
      /* ignore */
    }
  };

  const execute = async (mode) => {
    const tests = mode === "run" ? problem.tests.filter((t) => !t.hidden) : problem.tests;
    setBusy(mode);
    setStatus("Running tests…");
    setSubmission(null);
    const outcome = await runner.run(
      { language, code, fnName: problem.fn[language], tests, compare: problem.compare },
      { onStatus: setStatus }
    );
    const result = { ...outcome, tests };
    setRun(result);

    if (mode === "submit") {
      const results = outcome.compileError ? tests.map(() => ({ passed: false })) : outcome.results;
      try {
        const { data } = await api.post("/coding/submit", {
          slug,
          language,
          code,
          results: results.map(({ passed, runtimeMs }) => ({ passed, ...(runtimeMs != null ? { runtimeMs } : {}) })),
        });
        setSubmission(data);
        if (data.rewards.xpEarned > 0 || data.rewards.newBadges.length) setRewardsOpen(true);
        queryClient.invalidateQueries({ queryKey: ["problems"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        refreshUser().catch(() => {});
      } catch (err) {
        setSubmission({ error: errorMessage(err, "Couldn't save your submission") });
      }
    }
    setBusy(null);
    setStatus("");
  };

  const resetCode = () => {
    if (!window.confirm("Reset to the starter code? Your current code will be lost.")) return;
    onChange(problem.starter[language]);
  };

  if (isLoading) return <Spinner label="Loading problem…" />;
  if (error) return <div className="p-8"><ErrorState message={errorMessage(error)} /></div>;

  const allPassed = submission?.session && submission.session.coding.passed === submission.session.coding.total;

  return (
    <div className="flex h-screen flex-col">
      <RewardsDialog rewards={submission?.rewards} score={submission?.session?.score} open={rewardsOpen} onOpenChange={setRewardsOpen} />

      <FocusHeader backTo="/coding" backLabel="Problems" title={problem.title}>
        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          className="h-8 rounded-lg border bg-background px-2 text-sm shadow-xs"
          aria-label="Language"
        >
          {Object.entries(LANGS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <Tooltip content="Reset to starter code">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetCode} aria-label="Reset to starter code">
            <RotateCcw />
          </Button>
        </Tooltip>
        <Button variant="outline" size="sm" onClick={() => execute("run")} disabled={Boolean(busy)}>
          {busy === "run" ? <Loader2 className="animate-spin" /> : <Play />} Run
        </Button>
        <Button size="sm" onClick={() => execute("submit")} disabled={Boolean(busy)}>
          {busy === "submit" ? <Loader2 className="animate-spin" /> : <Send />} Submit
        </Button>
      </FocusHeader>

      <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:overflow-hidden">
        {/* Problem */}
        <section className="border-b p-6 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-xl font-semibold">{problem.title}</h1>
            {problem.solved && <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Solved" />}
          </div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <LevelBadge level={problem.difficulty} />
            {problem.tags.map((t) => (
              <span key={t} className="rounded-md border px-1.5 py-0.5 text-xs text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
          <RichText text={problem.description} />

          {problem.examples.map((ex, i) => (
            <div key={i} className="mb-4">
              <p className="mb-1.5 text-sm font-medium">Example {i + 1}</p>
              <div className="space-y-0.5 rounded-lg border bg-muted/40 px-3 py-2.5 font-mono text-[13px]">
                <p>
                  <span className="text-muted-foreground">Input: </span>
                  {ex.input}
                </p>
                <p>
                  <span className="text-muted-foreground">Output: </span>
                  {ex.output}
                </p>
                {ex.explanation && <p className="font-sans text-muted-foreground">{ex.explanation}</p>}
              </div>
            </div>
          ))}

          <p className="mb-1.5 mt-6 text-sm font-medium">Constraints</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {problem.constraints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>

        {/* Editor + results */}
        <section className="flex min-h-[36rem] flex-col lg:min-h-0">
          <div className="min-h-[18rem] flex-1">
            <Editor
              language={language}
              value={code}
              onChange={onChange}
              theme={theme === "dark" ? "vs-dark" : "light"}
              loading={<Spinner label="Loading editor…" />}
              options={{
                fontSize: 13.5,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                tabSize: language === "python" ? 4 : 2,
                automaticLayout: true,
                padding: { top: 14 },
                renderLineHighlight: "gutter",
                overviewRulerLanes: 0,
              }}
            />
          </div>

          <div className="max-h-[45%] min-h-[9rem] overflow-y-auto border-t bg-card">
            {status && (
              <p className="flex items-center gap-2 border-b px-4 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> {status}
              </p>
            )}
            {submission?.session && (
              <div className={cn("flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 text-sm", allPassed ? "bg-emerald-500/5" : "bg-amber-500/5")}>
                <span className="font-medium">
                  {allPassed
                    ? submission.firstSolve
                      ? `Accepted · +${submission.rewards.xpEarned} XP`
                      : "Accepted · already solved, no extra XP"
                    : "Saved. Pass every test to earn XP."}
                </span>
                <Link to={`/sessions/${submission.session.id}`} className="text-sm font-medium text-primary hover:underline">
                  Report & AI review →
                </Link>
              </div>
            )}
            {submission?.error && <p className="border-b px-4 py-2 text-sm text-destructive">{submission.error}</p>}
            <ResultsPanel run={run} problem={problem} />
          </div>
        </section>
      </div>
    </div>
  );
}
