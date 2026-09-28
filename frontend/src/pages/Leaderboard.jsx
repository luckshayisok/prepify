import { useQuery } from "@tanstack/react-query";
import { Award, Crown, Flame, Trophy } from "lucide-react";
import { ErrorState, Page, PageHeader, Spinner } from "@/components/common";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => api.get("/leaderboard").then((r) => r.data),
  });

  if (isLoading) return <Spinner label="Loading leaderboard…" />;
  if (error) return <Page><ErrorState message={errorMessage(error)} /></Page>;

  const { leaders, me } = data;
  const podium = leaders.slice(0, 3);
  const meInTop = leaders.some((l) => l.isMe);

  return (
    <Page className="max-w-3xl">
      <PageHeader eyebrow="Leaderboard" title="Top Prepify grinders" description="Ranked by total XP. Practice daily to climb." />

      {podium.length > 0 && (
        <div className="mb-8 grid grid-cols-3 items-end gap-3">
          {[podium[1], podium[0], podium[2]].map((p, i) =>
            p ? (
              <div
                key={p.id}
                className={cn(
                  "flex flex-col items-center rounded-2xl border bg-card p-4 text-center shadow-sm",
                  i === 1 && "border-amber-300 bg-gradient-to-b from-amber-50 to-card pb-8 pt-6 dark:border-amber-500/40 dark:from-amber-950/30",
                  p.isMe && "ring-2 ring-blue-500"
                )}
              >
                {i === 1 && <Crown className="mb-1 h-6 w-6 text-amber-500" />}
                <span className="text-3xl">{MEDALS[p.rank - 1]}</span>
                <p className="mt-2 truncate font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">Level {p.level}</p>
                <p className="mt-1 font-bold text-blue-600 dark:text-blue-400">{p.xp} XP</p>
              </div>
            ) : (
              <div key={i} />
            )
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 text-right">Level</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">Best streak</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">Badges</th>
              <th className="px-4 py-3 text-right">XP</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leaders.map((l) => (
              <tr key={l.id} className={cn(l.isMe && "bg-blue-50 font-semibold dark:bg-blue-950/30")}>
                <td className="px-4 py-3 tabular-nums">{MEDALS[l.rank - 1] ?? l.rank}</td>
                <td className="px-4 py-3">
                  {l.name} {l.isMe && <span className="text-xs text-blue-600">(you)</span>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{l.level}</td>
                <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">
                  <span className="inline-flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" /> {l.streak}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">
                  <span className="inline-flex items-center gap-1">
                    <Award className="h-3 w-3 text-amber-500" /> {l.badges}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{l.xp}</td>
              </tr>
            ))}
            {leaders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  <Trophy className="mx-auto mb-2 h-8 w-8" /> No one has earned XP yet. Be the first!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!meInTop && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          You're #{me.rank} with {me.xp} XP.
        </p>
      )}
    </Page>
  );
}
