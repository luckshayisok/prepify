import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SegmentedControl } from "@/components/common";
import { useElementSize } from "@/hooks/useElementSize";
import { clamp, monotonePath } from "@/lib/chart";
import { MODES, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const HEIGHT = 220;
const PAD = { top: 14, right: 14, bottom: 26, left: 34 };
const TICKS = [0, 25, 50, 75, 100];

// Faded behind the empty state so the card never looks blank.
const EXAMPLE = [48, 55, 52, 61, 66, 64, 72, 78].map((score, i) => ({ id: `ex-${i}`, score, date: null }));

const FILTERS = [
  { value: "all", label: "All" },
  { value: "mcq", label: "MCQ" },
  { value: "voice", label: "Voice" },
  { value: "coding", label: "Coding" },
];

/** Hand-built area chart: animated line, gridlines, crosshair tooltip, clickable points. */
function TrendChart({ points, interactive = true, onSelect }) {
  const gid = useId();
  const [ref, { width }] = useElementSize();
  const [hover, setHover] = useState(null);
  const lineRef = useRef(null);
  const [drawn, setDrawn] = useState(!interactive);

  const W = Math.max(width, 1);
  const innerW = W - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (score) => PAD.top + innerH - (score / 100) * innerH;
  const xy = points.map((p, i) => [x(i), y(p.score)]);
  const line = monotonePath(xy);
  const area = xy.length ? `${line} L${xy.at(-1)[0]},${PAD.top + innerH} L${xy[0][0]},${PAD.top + innerH} Z` : "";

  // Draw the line in: dash offset from full length to 0.
  const [length, setLength] = useState(0);
  useLayoutEffect(() => {
    if (lineRef.current && width) setLength(lineRef.current.getTotalLength());
  }, [line, width]);
  useEffect(() => {
    if (!interactive || !length) return;
    const t = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(t);
  }, [interactive, length]);

  const onMove = (e) => {
    if (!interactive || !points.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = points.length === 1 ? 0 : Math.round(clamp((px - PAD.left) / innerW, 0, 1) * (points.length - 1));
    setHover(i);
  };

  const labelIdx = points.length <= 1 ? [0] : [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  const h = hover != null ? points[hover] : null;

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg
          width={W}
          height={HEIGHT}
          className={cn("block overflow-visible", interactive && onSelect && h && "cursor-pointer")}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          onClick={() => h && onSelect?.(h)}
          role="img"
          aria-label={`Scores for ${points.length} sessions`}
        >
          <defs>
            <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${gid}-line`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Gridlines + y labels */}
          {TICKS.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="stroke-border" strokeDasharray={t === 0 ? undefined : "3 4"} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[10px] tabular">
                {t}
              </text>
            </g>
          ))}

          {/* Area + line */}
          <path d={area} fill={`url(#${gid}-fill)`} className={cn("transition-opacity duration-700", drawn ? "opacity-100" : "opacity-0")} />
          <path
            ref={lineRef}
            d={line}
            fill="none"
            stroke={`url(#${gid}-line)`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              interactive && length
                ? { strokeDasharray: length, strokeDashoffset: drawn ? 0 : length, transition: "stroke-dashoffset 900ms ease-out" }
                : undefined
            }
          />

          {/* Crosshair */}
          {h && (
            <line x1={xy[hover][0]} x2={xy[hover][0]} y1={PAD.top} y2={PAD.top + innerH} className="stroke-muted-foreground/50" strokeDasharray="3 3" />
          )}

          {/* Points */}
          {interactive &&
            xy.map(([px, py], i) => (
              <circle
                key={points[i].id}
                cx={px}
                cy={py}
                r={hover === i ? 6 : 3.5}
                className={cn("fill-primary stroke-card transition-[r] duration-150", drawn ? "opacity-100" : "opacity-0")}
                strokeWidth="2"
                style={{ transition: "r 150ms, opacity 400ms 700ms" }}
              />
            ))}

          {/* X labels */}
          {interactive &&
            labelIdx.map((i) => (
              <text
                key={i}
                x={xy[i][0]}
                y={HEIGHT - 6}
                textAnchor={points.length === 1 ? "middle" : i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
                className="fill-muted-foreground text-[10px]"
              >
                {points[i].date ? formatDate(points[i].date, { month: "short", day: "numeric" }) : ""}
              </text>
            ))}
        </svg>
      )}

      {/* Tooltip */}
      {h && (
        <div
          className="pointer-events-none absolute z-10 w-48 rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg"
          style={{
            left: clamp(xy[hover][0] - 96, 0, Math.max(0, W - 192)),
            top: Math.max(0, xy[hover][1] - 78),
          }}
        >
          <p className="truncate font-medium text-foreground">{h.title}</p>
          <p className="text-muted-foreground">
            {MODES[h.mode]?.label} · {formatDate(h.date, { month: "short", day: "numeric" })}
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="tabular text-base font-semibold text-foreground">{h.score}%</span>
            {onSelect && <span className="text-[11px] text-primary">Click to open</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// Score per completed session, oldest → newest, filterable by mode.
export default function ScoreTrend({ data }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("all");
  const points = data.filter((d) => mode === "all" || d.mode === mode);
  const best = points.length ? Math.max(...points.map((p) => p.score)) : null;
  const change = points.length > 1 ? points.at(-1).score - points[0].score : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
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

      {points.length > 1 ? (
        <TrendChart key={mode} points={points} onSelect={(p) => navigate(`/sessions/${p.id}`)} />
      ) : (
        <div className="relative">
          <div className="opacity-25 blur-[1px]" aria-hidden="true">
            <TrendChart points={EXAMPLE} interactive={false} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="rounded-lg border bg-card/90 px-4 py-2.5 text-center text-sm shadow-sm backdrop-blur">
              {points.length === 1 ? "One more session" : "Two sessions"} {mode === "all" ? "" : `in ${MODES[mode].label} `}and your trend appears here.
            </p>
          </div>
        </div>
      )}

      {/* Screen-reader table of the same data */}
      <table className="sr-only">
        <caption>Session scores</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>{p.score}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
