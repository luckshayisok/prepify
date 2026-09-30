import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, Circle } from "@/components/icons";
import { ErrorState, LevelBadge, Page, PageHeader, PageSkeleton, ProgressBar, SegmentedControl } from "@/components/common";
import { api, errorMessage } from "@/lib/api";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export default function CodingList() {
  const [filter, setFilter] = useState("all");
  const { data, isLoading, error } = useQuery({
    queryKey: ["problems"],
    queryFn: () => api.get("/coding/problems").then((r) => r.data.problems),
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <Page><ErrorState message={errorMessage(error)} /></Page>;

  const solved = data.filter((p) => p.solved).length;
  const shown = filter === "all" ? data : data.filter((p) => p.difficulty === filter);

  return (
    <Page className="max-w-4xl">
      <PageHeader
        crumbs={[{ label: "Practice", to: "/practice" }, { label: "Coding round" }]}
        title="Coding round"
        description="Interview-style DSA problems in JavaScript or Python. Code runs against hidden tests in your browser; XP is awarded on your first full solve."
      />

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-xs">
          <div className="tabular mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {solved} / {data.length} solved
            </span>
          </div>
          <ProgressBar value={(solved / data.length) * 100} tone="bg-emerald-500" />
        </div>
        <SegmentedControl aria-label="Difficulty filter" value={filter} onChange={setFilter} options={FILTERS} className="w-full sm:w-80" />
      </div>

      <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
        {shown.map((p) => (
          <li key={p.slug}>
            <Link to={`/coding/${p.slug}`} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/50">
              {p.solved ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Solved" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" aria-label="Not solved" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{p.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.tags.join(" · ")}</p>
              </div>
              <LevelBadge level={p.difficulty} className="w-16" />
              <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}
