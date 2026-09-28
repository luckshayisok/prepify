import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Code2 } from "lucide-react";
import { ErrorState, LevelBadge, Page, PageHeader, Spinner } from "@/components/common";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "easy", "medium", "hard"];

export default function CodingList() {
  const [filter, setFilter] = useState("all");
  const { data, isLoading, error } = useQuery({
    queryKey: ["problems"],
    queryFn: () => api.get("/coding/problems").then((r) => r.data.problems),
  });

  if (isLoading) return <Spinner label="Loading problems…" />;
  if (error) return <Page><ErrorState message={errorMessage(error)} /></Page>;

  const solved = data.filter((p) => p.solved).length;
  const shown = filter === "all" ? data : data.filter((p) => p.difficulty === filter);

  return (
    <Page className="max-w-4xl">
      <PageHeader
        eyebrow="Coding round"
        title="Solve interview-style DSA problems"
        description="Write JavaScript or Python in a real editor. Your code runs against hidden tests right in your browser, and an AI can review your solution."
      />

      <div className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">
            {solved} / {data.length} solved
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${(solved / data.length) * 100}%` }} />
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium capitalize transition",
              filter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
        {shown.map((p, i) => (
          <li key={p.slug}>
            <Link to={`/coding/${p.slug}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-accent/50">
              {p.solved ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-label="Solved" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-label="Not solved" />
              )}
              <span className="w-6 text-sm tabular-nums text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.tags.join(" · ")}</p>
              </div>
              <LevelBadge level={p.difficulty} />
              <Code2 className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center text-xs text-muted-foreground">XP is awarded the first time you pass all tests on a problem.</p>
    </Page>
  );
}
