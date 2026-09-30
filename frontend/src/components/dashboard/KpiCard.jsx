import { useId } from "react";
import { Link } from "react-router-dom";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

// Tiny single-series sparkline; values can contain nulls (gaps are skipped).
export function Sparkline({ values, className, bars = false }) {
  const gid = useId();
  const W = 100;
  const H = 32;
  // No data yet: a faint dashed baseline instead of a misleading flat line at zero.
  if (values.every((v) => v == null || v === 0)) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn("h-8 w-full", className)} aria-hidden="true">
        <line x1="0" x2={W} y1={H - 2} y2={H - 2} className="stroke-border" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }
  const nums = values.map((v) => v ?? 0);
  const max = Math.max(1, ...nums);

  if (bars) {
    const bw = W / values.length;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn("h-8 w-full", className)} aria-hidden="true">
        {nums.map((v, i) => (
          <rect
            key={i}
            x={i * bw + bw * 0.18}
            width={bw * 0.64}
            y={H - Math.max(2, (v / max) * H)}
            height={Math.max(2, (v / max) * H)}
            rx="1.5"
            className={v ? "fill-primary" : "fill-muted"}
          />
        ))}
      </svg>
    );
  }

  const pts = nums.map((v, i) => [(i / Math.max(1, nums.length - 1)) * W, H - 2 - (v / max) * (H - 4)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn("h-8 w-full", className)} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function Delta({ value, suffix = "" }) {
  if (value == null || value === 0) return <span className="text-muted-foreground">No change</span>;
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
 * KPI with an animated number, a week-over-week delta and a 14-day sparkline.
 * `format` turns the (animated) number into the displayed string.
 */
export default function KpiCard({ icon: Icon, label, value, format = (v) => v, delta, deltaSuffix, deltaLabel = "vs last week", spark, bars, footer, to }) {
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
      <div className="mt-0.5 text-xs text-muted-foreground">
        {footer ?? (
          <>
            <Delta value={delta} suffix={deltaSuffix} /> {delta ? deltaLabel : ""}
          </>
        )}
      </div>
      {spark && <Sparkline values={spark} bars={bars} className="mt-3" />}
    </Wrapper>
  );
}
