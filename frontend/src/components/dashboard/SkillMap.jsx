import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { ProgressBar } from "@/components/common";

const shorten = (s, n = 11) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function RadarTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const t = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{t.topic}</p>
      <p className="tabular text-muted-foreground">
        {t.accuracy}% · {t.correct}/{t.total} correct
      </p>
    </div>
  );
}

// Topic accuracy as a radar when there are 3+ topics, otherwise ranked bars.
export default function SkillMap({ topics }) {
  if (!topics.length) {
    return (
      <p className="flex h-52 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Answer a couple of MCQ questions per topic and your skill map appears here.
      </p>
    );
  }

  if (topics.length < 3) {
    return (
      <ul className="space-y-4 py-2">
        {topics.map((t) => (
          <li key={t.topic}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="truncate">{t.topic}</span>
              <span className="tabular text-muted-foreground">{t.accuracy}%</span>
            </div>
            <ProgressBar value={Math.max(2, t.accuracy)} />
          </li>
        ))}
        <li className="pt-1 text-xs text-muted-foreground">Practice one more topic to unlock the radar view.</li>
      </ul>
    );
  }

  const data = topics.map((t) => ({ ...t, label: shorten(t.topic) }));
  return (
    <div className="h-56 w-full text-muted-foreground" role="img" aria-label={`Accuracy across ${topics.length} topics`}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="58%" margin={{ top: 8, right: 36, bottom: 8, left: 36 }}>
          <defs>
            <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0.25} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: "currentColor" }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip content={<RadarTip />} />
          <Radar dataKey="accuracy" stroke="#4f46e5" strokeWidth={2} fill="url(#radarFill)" dot={{ r: 3, fill: "#4f46e5" }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
