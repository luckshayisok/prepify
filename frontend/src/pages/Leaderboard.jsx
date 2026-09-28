import { useQuery } from "@tanstack/react-query";
import { Award, Flame, Trophy } from "lucide-react";
import { Avatar, EmptyState, ErrorState, Page, PageHeader, PageSkeleton } from "@/components/common";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const RANK_STYLES = [
  "bg-amber-400/15 text-amber-600 dark:text-amber-400",
  "bg-zinc-400/15 text-zinc-600 dark:text-zinc-300",
  "bg-orange-400/15 text-orange-700 dark:text-orange-400",
];

export default function Leaderboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => api.get("/leaderboard").then((r) => r.data),
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <Page><ErrorState message={errorMessage(error)} /></Page>;

  const { leaders, me } = data;
  const meInTop = leaders.some((l) => l.isMe);

  return (
    <Page className="max-w-3xl">
      <PageHeader
        title="Leaderboard"
        description="Ranked by total XP. Practice daily to climb."
        actions={
          <div className="tabular rounded-lg border bg-card px-3 py-1.5 text-sm shadow-xs">
            Your rank <span className="font-semibold">#{me.rank}</span> · {me.xp} XP
          </div>
        }
      />

      {leaders.length === 0 ? (
        <EmptyState icon={Trophy} title="No one has earned XP yet" description="Complete a session to take the top spot." />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <ol className="divide-y">
            {leaders.map((l) => (
              <li key={l.id} className={cn("flex items-center gap-4 px-5 py-3", l.isMe && "bg-primary/5")}>
                <span
                  className={cn(
                    "tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                    RANK_STYLES[l.rank - 1] ?? "text-muted-foreground"
                  )}
                >
                  {l.rank}
                </span>
                <Avatar user={{ name: l.name }} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {l.name} {l.isMe && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
                  </p>
                  <p className="tabular flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Level {l.level}</span>
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3" /> {l.streak}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="h-3 w-3" /> {l.badges}
                    </span>
                  </p>
                </div>
                <span className="tabular text-sm font-semibold">{l.xp.toLocaleString()} XP</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {!meInTop && leaders.length > 0 && (
        <p className="tabular mt-4 text-center text-sm text-muted-foreground">
          You're #{me.rank} with {me.xp} XP — keep going.
        </p>
      )}
    </Page>
  );
}
