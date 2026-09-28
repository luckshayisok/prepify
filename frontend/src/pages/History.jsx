import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { History as HistoryIcon, Sparkles } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LevelBadge, ModeBadge, Page, PageHeader, SegmentedControl, Skeleton } from "@/components/common";
import SessionList from "@/components/SessionList";
import { api, errorMessage } from "@/lib/api";
import { formatDate, formatDuration, scoreTone } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "", label: "All" },
  { value: "mcq", label: "MCQ" },
  { value: "voice", label: "Voice" },
  { value: "coding", label: "Coding" },
];
const LIMIT = 15;

export default function History() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["history", mode, page],
    queryFn: () => api.get("/interviews", { params: { mode: mode || undefined, page, limit: LIMIT } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <Page className="max-w-5xl">
      <PageHeader
        title="History"
        description="Every completed session, with its full report."
        actions={
          <SegmentedControl
            aria-label="Filter by mode"
            value={mode}
            onChange={(v) => {
              setMode(v);
              setPage(1);
            }}
            options={FILTERS}
            className="w-72"
          />
        }
      />

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} />
      ) : data.sessions.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="Nothing here yet"
          description="Completed sessions show up here."
          action={
            <Button asChild>
              <Link to="/setup">Start practicing</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className={cn("overflow-hidden rounded-xl border bg-card shadow-xs transition-opacity", isFetching && "opacity-60")}>
            {/* Table on desktop, list on mobile */}
            <table className="hidden w-full text-sm md:table">
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Session</th>
                  <th className="px-3 py-2.5 font-medium">Mode</th>
                  <th className="px-3 py-2.5 font-medium">Level</th>
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">Duration</th>
                  <th className="px-3 py-2.5 text-right font-medium">XP</th>
                  <th className="px-5 py-2.5 text-right font-medium">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.sessions.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/sessions/${s.id}`)}
                    className="cursor-pointer transition-colors hover:bg-accent/50"
                  >
                    <td className="max-w-xs px-5 py-3">
                      <Link to={`/sessions/${s.id}`} className="flex items-center gap-1.5 truncate font-medium" onClick={(e) => e.stopPropagation()}>
                        <span className="truncate">{s.title}</span>
                        {s.personalized && <Sparkles className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Personalized" />}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <ModeBadge mode={s.mode} />
                    </td>
                    <td className="px-3 py-3">
                      <LevelBadge level={s.config?.level} />
                    </td>
                    <td className="tabular px-3 py-3 text-muted-foreground">{formatDate(s.completedAt)}</td>
                    <td className="tabular px-3 py-3 text-muted-foreground">{s.mode === "coding" ? "—" : formatDuration(s.durationSec)}</td>
                    <td className="tabular px-3 py-3 text-right text-muted-foreground">{s.xpEarned > 0 ? `+${s.xpEarned}` : "—"}</td>
                    <td className={cn("tabular px-5 py-3 text-right font-semibold", scoreTone(s.score))}>{s.score ?? "—"}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="md:hidden">
              <SessionList sessions={data.sessions} />
            </div>
          </div>

          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="tabular text-muted-foreground">
                Page {page} of {pages} · {data.total} sessions
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Page>
  );
}
