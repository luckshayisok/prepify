import { Link } from "react-router-dom";
import { ArrowRight, Brain, Code2, Mic } from "@/components/icons";
import { ProgressBar } from "@/components/common";

const ROWS = [
  { mode: "mcq", label: "MCQ quiz", icon: Brain, to: "/setup" },
  { mode: "voice", label: "Voice interview", icon: Mic, to: "/voice" },
  { mode: "coding", label: "Coding round", icon: Code2, to: "/coding" },
];

// Sessions and average score per mode; untried modes invite a first attempt.
export default function ModeBreakdown({ byMode }) {
  return (
    <ul className="space-y-1">
      {ROWS.map(({ mode, label, icon: Icon, to }) => {
        const m = byMode[mode];
        return (
          <li key={mode}>
            <Link to={to} className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-accent/60">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{label}</span>
                  {m ? (
                    <span className="tabular shrink-0 text-sm font-semibold">{m.avgScore}%</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-primary">
                      Try it <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                    </span>
                  )}
                </div>
                <ProgressBar value={m ? Math.max(3, m.avgScore) : 0} className="mt-2" tone="bg-gradient-to-r from-indigo-600 to-indigo-400" />
                <p className="tabular mt-1 text-xs text-muted-foreground">
                  {m ? `${m.count} session${m.count === 1 ? "" : "s"} · average score` : "Not tried yet"}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
