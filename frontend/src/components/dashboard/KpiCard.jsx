import { Link } from "react-router-dom";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];
const weekday = (day) => WEEKDAY[new Date(`${day}T00:00:00Z`).getUTCDay()];

/**
 * Last-7-days bars, like an activity strip: every day has a soft track, filled up to its value.
 * days: [{ day: "YYYY-MM-DD", value }], oldest first; the last entry is today.
 */
export function WeekBars({ days, format = (v) => v }) {
  const max = Math.max(1, ...days.map((d) => d.value));
  return (
    <div className="mt-4 grid grid-cols-7 gap-1.5" role="img" aria-label={days.map((d) => `${d.day}: ${format(d.value)}`).join(", ")}>
      {days.map((d, i) => {
        const today = i === days.length - 1;
        const pct = d.value ? Math.max(14, (d.value / max) * 100) : 0;
        return (
          <div key={d.day} className="flex flex-col items-center gap-1" title={`${d.day} · ${format(d.value)}`}>
            <div className="relative flex h-10 w-full items-end overflow-hidden rounded-md bg-muted/70">
              <div
                className={cn("w-full rounded-md transition-[height] duration-700 ease-out", today ? "bg-primary" : "bg-primary/60")}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className={cn("text-[10px] leading-none", today ? "font-semibold text-foreground" : "text-muted-foreground")}>{weekday(d.day)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** 0–100 meter with an optional marker for last week's value. */
export function ScoreMeter({ value, previous }) {
  return (
    <div className="mt-4">
      <div className="relative h-2.5 rounded-full bg-muted/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-[width] duration-700 ease-out"
          style={{ width: `${value ?? 0}%` }}
        />
        {previous != null && (
          <span
            className="absolute -top-1 h-[18px] w-0.5 rounded-full bg-foreground/70"
            style={{ left: `calc(${previous}% - 1px)` }}
            title={`Last week: ${previous}%`}
          />
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        {previous != null && <span>Last week {previous}%</span>}
        <span>100</span>
      </div>
    </div>
  );
}

/** One segment per item, filled for completed ones (e.g. solved problems). */
export function Segments({ done, total }) {
  return (
    <div className="mt-4 flex gap-1" role="img" aria-label={`${done} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn("h-2.5 flex-1 rounded-full transition-colors duration-500", i < done ? "bg-primary" : "bg-muted/70")}
          style={{ transitionDelay: `${i * 40}ms` }}
        />
      ))}
    </div>
  );
}

function Delta({ value, suffix = "" }) {
  if (value == null) return <span className="text-muted-foreground">No sessions last week</span>;
  if (value === 0) return <span className="text-muted-foreground">Same as last week</span>;
  const up = value > 0;
  return (
    <span className={cn("font-medium", up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
      {up ? "+" : "−"}
      {Math.abs(value)}
      {suffix}
    </span>
  );
}

/**
 * KPI with an animated number, a week-over-week delta and a small visual underneath.
 * `format` turns the (animated) number into the displayed string.
 */
export default function KpiCard({ icon: Icon, label, value, format = (v) => v, delta, deltaSuffix, deltaLabel = "vs last week", footer, visual, to }) {
  const shown = useCountUp(value);
  const Wrapper = to ? Link : "div";
  return (
    <Wrapper
      {...(to ? { to } : {})}
      className={cn("flex flex-col rounded-xl border bg-card p-4 shadow-xs sm:p-5", to && "transition hover:border-foreground/20 hover:shadow-md")}
    >
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        {label}
        {Icon && <Icon className="h-4 w-4" />}
      </div>
      <div className="tabular mt-2 text-2xl font-semibold">{value == null ? "—" : format(shown)}</div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground">
        {footer ?? (
          <>
            <Delta value={delta} suffix={deltaSuffix} /> {delta ? deltaLabel : ""}
          </>
        )}
      </div>
      <div className="mt-auto">{visual}</div>
    </Wrapper>
  );
}
