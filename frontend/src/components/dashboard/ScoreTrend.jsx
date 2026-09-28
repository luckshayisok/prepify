import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MODES, formatDate } from "@/lib/format";

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{p.title}</p>
      <p className="text-muted-foreground">
        {MODES[p.mode]?.label} · {formatDate(p.date)}
      </p>
      <p className="mt-1 text-sm font-bold text-foreground">{p.score}%</p>
    </div>
  );
}

// Single series: score of each completed session, oldest → newest.
export default function ScoreTrend({ data }) {
  const points = data.map((d, i) => ({ ...d, n: i + 1 }));
  return (
    <div className="h-64 w-full" role="img" aria-label={`Score trend over your last ${points.length} sessions`}>
      <ResponsiveContainer>
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="n" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-muted-foreground" />
          <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-muted-foreground" />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#scoreFill)"
            dot={{ r: 4, strokeWidth: 2, fill: "#2563eb", stroke: "hsl(var(--card))" }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
