import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SegmentedControl } from "@/components/common";
import { MODES, formatDate } from "@/lib/format";

const FROM = "#4f46e5"; // indigo-600
const TO = "#818cf8"; // indigo-400

// Shown faded behind the empty state so the card never looks blank.
const EXAMPLE = [48, 55, 52, 61, 66, 64, 72, 78].map((score, i) => ({ n: i + 1, score }));

const FILTERS = [
  { value: "all", label: "All" },
  { value: "mcq", label: "MCQ" },
  { value: "voice", label: "Voice" },
  { value: "coding", label: "Coding" },
];

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="max-w-[200px] truncate font-medium text-foreground">{p.title}</p>
      <p className="text-muted-foreground">
        {MODES[p.mode]?.label} · {formatDate(p.date, { month: "short", day: "numeric" })}
      </p>
      <p className="tabular mt-1 text-sm font-semibold text-foreground">{p.score}%</p>
    </div>
  );
}

function Chart({ points, interactive = true }) {
  return (
    <ResponsiveContainer>
      <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FROM} stopOpacity={0.28} />
            <stop offset="60%" stopColor={TO} stopOpacity={0.06} />
            <stop offset="100%" stopColor={TO} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="scoreStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={FROM} />
            <stop offset="100%" stopColor={TO} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="n" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor" }} />
        <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor" }} />
        {interactive && <Tooltip content={<TrendTooltip />} cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }} />}
        <Area
          type="monotone"
          dataKey="score"
          stroke="url(#scoreStroke)"
          strokeWidth={2.5}
          fill="url(#scoreFill)"
          isAnimationActive={interactive}
          dot={interactive ? { r: 3.5, strokeWidth: 2, fill: FROM, stroke: "hsl(var(--card))" } : false}
          activeDot={{ r: 5, strokeWidth: 2, fill: TO, stroke: "hsl(var(--card))" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Score per completed session, oldest → newest, filterable by mode.
export default function ScoreTrend({ data }) {
  const [mode, setMode] = useState("all");
  const points = data.filter((d) => mode === "all" || d.mode === mode).map((d, i) => ({ ...d, n: i + 1 }));
  const best = points.length ? Math.max(...points.map((p) => p.score)) : null;
  const change = points.length > 1 ? points.at(-1).score - points[0].score : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="tabular flex gap-5 text-xs text-muted-foreground">
          <span>
            Best <span className="font-semibold text-foreground">{best ?? "—"}%</span>
          </span>
          {change != null && (
            <span>
              Change{" "}
              <span className={change >= 0 ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-rose-600 dark:text-rose-400"}>
                {change >= 0 ? "+" : "−"}
                {Math.abs(change)} pts
              </span>
            </span>
          )}
        </div>
        <SegmentedControl aria-label="Filter by mode" value={mode} onChange={setMode} options={FILTERS} className="w-full sm:w-72" />
      </div>

      <div className="relative h-56 w-full text-muted-foreground" role="img" aria-label={`Score trend over ${points.length} sessions`}>
        {points.length > 1 ? (
          <Chart points={points} />
        ) : (
          <>
            <div className="absolute inset-0 opacity-25 blur-[1px] grayscale-[30%]" aria-hidden="true">
              <Chart points={EXAMPLE} interactive={false} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="rounded-lg border bg-card/90 px-4 py-2.5 text-center text-sm shadow-sm backdrop-blur">
                {points.length === 1 ? "One more session" : "Two sessions"} {mode === "all" ? "" : `in ${MODES[mode].label} `}and your trend appears here.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
