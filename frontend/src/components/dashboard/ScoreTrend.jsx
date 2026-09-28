import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MODES, formatDate } from "@/lib/format";

const FROM = "#6366f1"; // indigo-500
const TO = "#d946ef"; // fuchsia-500

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

// Single series: score of each completed session, oldest → newest.
export default function ScoreTrend({ data }) {
  const points = data.map((d, i) => ({ ...d, n: i + 1 }));
  return (
    <div className="h-60 w-full text-muted-foreground" role="img" aria-label={`Score trend over your last ${points.length} sessions`}>
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
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="url(#scoreStroke)"
            strokeWidth={2.5}
            fill="url(#scoreFill)"
            dot={{ r: 3.5, strokeWidth: 2, fill: FROM, stroke: "hsl(var(--card))" }}
            activeDot={{ r: 5, strokeWidth: 2, fill: TO, stroke: "hsl(var(--card))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
