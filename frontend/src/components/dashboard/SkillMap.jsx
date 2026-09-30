import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProgressBar } from "@/components/common";
import { useElementSize } from "@/hooks/useElementSize";
import { polar } from "@/lib/chart";
import { cn } from "@/lib/utils";

const HEIGHT = 240;
const RINGS = [0.25, 0.5, 0.75, 1];
const shorten = (s, n = 13) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Hand-built radar: soft rings, a gradient shape that grows in, hover + click per topic. */
function Radar({ topics, onSelect }) {
  const gid = useId();
  const [ref, { width }] = useElementSize();
  const [hover, setHover] = useState(null);

  const W = Math.max(width, 1);
  const cx = W / 2;
  const cy = HEIGHT / 2;
  const R = Math.min(W / 2 - 58, HEIGHT / 2 - 26);
  const n = topics.length;
  const angle = (i) => (i / n) * Math.PI * 2;
  const ring = (f) => topics.map((_, i) => polar(cx, cy, R * f, angle(i)).join(",")).join(" ");
  const shape = topics.map((t, i) => polar(cx, cy, R * Math.max(0.04, t.accuracy / 100), angle(i)));

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height: HEIGHT }}>
      {width > 0 && R > 20 && (
        <svg width={W} height={HEIGHT} className="block overflow-visible" role="img" aria-label="Accuracy by topic">
          <defs>
            <radialGradient id={gid}>
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.45" />
            </radialGradient>
          </defs>

          {/* Rings (alternating tint) and spokes */}
          {[...RINGS].reverse().map((f, i) => (
            <polygon key={f} points={ring(f)} className={cn("stroke-border", i % 2 ? "fill-card" : "fill-muted/40")} strokeWidth="1" />
          ))}
          {topics.map((_, i) => {
            const [x2, y2] = polar(cx, cy, R, angle(i));
            return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} className="stroke-border" />;
          })}

          {/* Data shape, scaled in from the centre */}
          <g className="animate-in zoom-in-50 fade-in-0 duration-700" style={{ transformOrigin: `${cx}px ${cy}px` }}>
            <polygon points={shape.map((p) => p.join(",")).join(" ")} fill={`url(#${gid})`} stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" />
            {shape.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={hover === i ? 5.5 : 3.5} className="fill-primary stroke-card" strokeWidth="2" />
            ))}
          </g>

          {/* Labels double as hover/click targets */}
          {topics.map((t, i) => {
            const [lx, ly] = polar(cx, cy, R + 14, angle(i));
            const anchor = Math.abs(lx - cx) < 4 ? "middle" : lx > cx ? "start" : "end";
            return (
              <g key={t.topic} className="cursor-pointer" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => onSelect(t)}>
                {/* Wider invisible hit area along the spoke */}
                <line x1={cx} y1={cy} x2={lx} y2={ly} stroke="transparent" strokeWidth="18" />
                <text
                  x={lx}
                  y={ly}
                  dy={ly < cy - R * 0.5 ? "-0.2em" : ly > cy + R * 0.5 ? "0.9em" : "0.35em"}
                  textAnchor={anchor}
                  className={cn("text-[11px] transition-colors", hover === i ? "fill-foreground font-medium" : "fill-muted-foreground")}
                >
                  {shorten(t.topic)}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {hover != null && (
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border bg-popover px-3 py-1.5 text-xs shadow-lg">
          <span className="font-medium">{topics[hover].topic}</span>
          <span className="tabular ml-2 text-muted-foreground">
            {topics[hover].accuracy}% · {topics[hover].correct}/{topics[hover].total}
          </span>
          <span className="ml-2 text-primary">Click to practice</span>
        </div>
      )}
    </div>
  );
}

// Topic accuracy as a radar when there are 3+ topics, otherwise ranked bars. Clicking a topic starts practice.
export default function SkillMap({ topics }) {
  const navigate = useNavigate();
  const practice = (t) => navigate(`/setup?domain=${encodeURIComponent(t.topic)}`);

  if (!topics.length) {
    return (
      <p className="flex h-52 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Answer a couple of MCQ questions per topic and your skill map appears here.
      </p>
    );
  }

  if (topics.length < 3) {
    return (
      <ul className="space-y-3 py-2">
        {topics.map((t) => (
          <li key={t.topic}>
            <button onClick={() => practice(t)} className="w-full rounded-lg p-1.5 text-left transition hover:bg-accent/60">
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="truncate">{t.topic}</span>
                <span className="tabular text-muted-foreground">{t.accuracy}%</span>
              </div>
              <ProgressBar value={Math.max(2, t.accuracy)} />
            </button>
          </li>
        ))}
        <li className="px-1.5 pt-1 text-xs text-muted-foreground">Practice one more topic to unlock the radar view.</li>
      </ul>
    );
  }

  return (
    <>
      <Radar topics={topics} onSelect={practice} />
      <ul className="sr-only">
        {topics.map((t) => (
          <li key={t.topic}>
            {t.topic}: {t.accuracy}%
          </li>
        ))}
      </ul>
    </>
  );
}
