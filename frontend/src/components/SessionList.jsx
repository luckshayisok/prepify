import { Link } from "react-router-dom";
import { ChevronRight, Sparkles } from "@/components/icons";
import { LevelBadge, ModeBadge } from "./common";
import { scoreTone, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function SessionList({ sessions }) {
  return (
    <ul className="divide-y">
      {sessions.map((s) => (
        <li key={s.id}>
          <Link to={`/sessions/${s.id}`} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/50">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                <ModeBadge mode={s.mode} />
                <LevelBadge level={s.level ?? s.config?.level} />
                {s.personalized && (
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Personalized
                  </span>
                )}
                <span>{timeAgo(s.completedAt)}</span>
              </div>
            </div>
            <div className="text-right">
              <p className={cn("tabular text-sm font-semibold", scoreTone(s.score))}>{s.score ?? "—"}%</p>
              {s.xpEarned > 0 && <p className="tabular text-xs text-muted-foreground">+{s.xpEarned} XP</p>}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
