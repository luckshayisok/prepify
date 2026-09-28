import { useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { History as HistoryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, GradientButton, Page, PageHeader, Spinner } from "@/components/common";
import SessionList from "@/components/SessionList";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "", label: "All" },
  { id: "mcq", label: "MCQ" },
  { id: "voice", label: "Voice" },
  { id: "coding", label: "Coding" },
];
const LIMIT = 15;

export default function History() {
  const [mode, setMode] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["history", mode, page],
    queryFn: () => api.get("/interviews", { params: { mode: mode || undefined, page, limit: LIMIT } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <Page className="max-w-3xl">
      <PageHeader title="History" description="Every completed session, with its full report." />
      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setMode(f.id);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition",
              mode === f.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={errorMessage(error)} />
      ) : data.sessions.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="Nothing here yet"
          description="Completed sessions show up here."
          action={<GradientButton as={Link} to="/setup">Start practicing</GradientButton>}
        />
      ) : (
        <>
          <div className={cn("rounded-2xl border bg-card px-4 shadow-sm transition", isFetching && "opacity-60")}>
            <SessionList sessions={data.sessions} />
          </div>
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {page} of {pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </Page>
  );
}
