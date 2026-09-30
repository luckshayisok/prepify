import { useEffect, useState } from "react";
import { Check } from "@/components/icons";
import { cn } from "@/lib/utils";

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

function GoalRing({ done, goal }) {
  const size = 104;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, done / goal);
  const complete = done >= goal;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="goalRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          stroke="url(#goalRing)"
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
          style={{ strokeDasharray: c, strokeDashoffset: c * (1 - pct) }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {complete ? (
          <Check className="h-7 w-7 text-primary" strokeWidth={2.5} />
        ) : (
          <span className="tabular text-2xl font-semibold">
            {done}/{goal}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground">{complete ? "Goal met" : "today"}</span>
      </div>
    </div>
  );
}

function useCountdown(ms) {
  const [left, setLeft] = useState(ms);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setLeft(Math.max(0, ms - (Date.now() - start))), 60_000);
    return () => clearInterval(t);
  }, [ms]);
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  return h ? `${h}h ${m}m` : `${m}m`;
}

// Daily goal ring, last-7-days strip and time until the streak day rolls over.
export default function TodayCard({ today, streak }) {
  const countdown = useCountdown(today.msUntilReset);
  const complete = today.done >= today.goal;

  return (
    <section className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Today</h2>
        <span className="tabular text-xs text-muted-foreground">{complete ? "Streak safe" : `Resets in ${countdown}`}</span>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <GoalRing done={today.done} goal={today.goal} />
        <div className="min-w-0">
          <p className="tabular text-3xl font-semibold leading-none">
            {streak.current}
            <span className="ml-1 text-base font-medium text-muted-foreground">day{streak.current === 1 ? "" : "s"}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Current streak · best {streak.longest}</p>
          <p className="mt-3 text-sm">
            {complete ? "Nice — today counts. Come back tomorrow." : "One session today keeps your streak alive."}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Last 7 days</p>
        <ol className="grid grid-cols-7 gap-1.5">
          {today.last7.map((d, i) => {
            const isToday = i === today.last7.length - 1;
            const weekday = WEEKDAY[new Date(`${d.day}T00:00:00Z`).getUTCDay()];
            return (
              <li key={d.day} className="flex flex-col items-center gap-1">
                <span
                  title={`${d.day}${d.active ? " · practised" : ""}`}
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-md border text-[11px] transition",
                    d.active ? "border-transparent bg-gradient-to-br from-indigo-600 to-indigo-400 text-white" : "bg-muted/50 text-muted-foreground",
                    isToday && !d.active && "border-dashed border-primary/50"
                  )}
                >
                  {d.active ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : ""}
                </span>
                <span className={cn("text-[10px]", isToday ? "font-semibold text-foreground" : "text-muted-foreground")}>{weekday}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
