import { Link } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import { LevelBadge, ModeBadge } from "./common";
import { scoreTone, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function SessionList({ sessions }) {
  return (
    <ul className="divide-y">
      {sessions.map((s) => (
        <li key={s.id}>
          <Link to={`/sessions/${s.id}`} className="group flex items-center gap-4 px-1 py-3 transition hover:bg-accent/40">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{s.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <ModeBadge mode={s.mode} />
                <LevelBadge level={s.level ?? s.config?.level} />
                {s.personalized && (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Sparkles className="h-3 w-3" /> Personalized
                  </span>
                )}
                <span>{timeAgo(s.completedAt)}</span>
              </div>
            </div>
            <div className="text-right">
              <p className={cn("text-lg font-bold tabular-nums", scoreTone(s.score))}>{s.score ?? "—"}%</p>
              {s.xpEarned > 0 && <p className="text-xs text-muted-foreground">+{s.xpEarned} XP</p>}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
