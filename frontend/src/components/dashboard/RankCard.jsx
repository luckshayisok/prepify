import { Link } from "react-router-dom";
import { ArrowUpRight, Trophy } from "@/components/icons";
import { useCountUp } from "@/hooks/useCountUp";

export default function RankCard({ rank }) {
  const position = useCountUp(rank.position ?? 0);
  const ranked = rank.position != null;
  const top = ranked && rank.total ? Math.max(1, Math.round((rank.position / rank.total) * 100)) : null;

  return (
    <Link to="/leaderboard" className="group flex flex-col rounded-2xl border bg-card p-5 shadow-xs transition hover:border-foreground/20">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4" /> Leaderboard
        </span>
        <ArrowUpRight className="h-4 w-4 transition group-hover:text-foreground" />
      </div>
      {ranked ? (
        <>
          <p className="tabular mt-3 text-4xl font-semibold tracking-tight">
            <span className="text-primary">#{position}</span>
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">of {rank.total}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {rank.position === 1 ? "You're at the top. Stay there." : `${rank.xpToNext} XP to pass the next person${top ? ` · top ${top}%` : ""}`}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Earn XP in any session to join the leaderboard.</p>
      )}
    </Link>
  );
}
