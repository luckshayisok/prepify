import { useId } from "react";
import { Brain, Code2, History, LayoutDashboard, Mic, PrepifyMark, Trophy } from "@/components/icons";
import { cn } from "@/lib/utils";

// Illustrative data for the static landing-page mockup.
const SCORES = [52, 58, 55, 64, 70, 68, 79, 86];
const SESSIONS = [
  { icon: Mic, title: "Frontend Developer · Voice", meta: "Mixed · 18 min", score: 86 },
  { icon: Code2, title: "Merge Intervals · Python", meta: "Coding · Medium", score: 100 },
  { icon: Brain, title: "System Design · MCQ", meta: "Hard · 10 questions", score: 70 },
];
const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Brain, label: "MCQ quiz" },
  { icon: Mic, label: "Voice" },
  { icon: Code2, label: "Coding" },
  { icon: History, label: "History" },
  { icon: Trophy, label: "Leaderboard" },
];

// Smooth line through the points (Catmull-Rom → cubic Bézier).
function smoothPath(points) {
  return points.reduce((d, [x, y], i, p) => {
    if (i === 0) return `M${x},${y}`;
    const [x0, y0] = p[i - 2] ?? p[i - 1];
    const [x1, y1] = p[i - 1];
    const [x3, y3] = p[i + 1] ?? [x, y];
    const c1 = [x1 + (x - x0) / 6, y1 + (y - y0) / 6];
    const c2 = [x - (x3 - x1) / 6, y - (y3 - y1) / 6];
    return `${d} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${x},${y}`;
  }, "");
}

function TrendChart() {
  const gid = useId();
  const W = 320;
  const H = 120;
  const pad = 8;
  const pts = SCORES.map((s, i) => [pad + (i * (W - pad * 2)) / (SCORES.length - 1), H - pad - ((s - 40) / 60) * (H - pad * 2)]);
  const line = smoothPath(pts);
  const last = pts.at(-1);

  return (
    <div className="relative h-32 w-full">
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="hsl(var(--border))" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={`${line} L${last[0]},${H} L${pts[0][0]},${H} Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
      {/* HTML dot so it stays round while the SVG stretches */}
      <span
        className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary"
        style={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%` }}
      />
    </div>
  );
}

function MiniRing({ score }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-11 w-11 shrink-0">
      <svg viewBox="0 0 44 44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} strokeWidth="4" className="fill-none stroke-muted" />
        <circle cx="22" cy="22" r={r} strokeWidth="4" strokeLinecap="round" className="fill-none stroke-primary" style={{ strokeDasharray: c, strokeDashoffset: c * (1 - score / 100) }} />
      </svg>
      <span className="tabular absolute inset-0 flex items-center justify-center text-[11px] font-semibold">{score}</span>
    </div>
  );
}

export default function ProductPreview() {
  return (
    <div className="relative">
      {/* Soft glow behind the window */}
      <div className="pointer-events-none absolute inset-x-10 -bottom-6 top-10 -z-10 rounded-[2rem] bg-primary/15 blur-3xl" />

      <div className="overflow-hidden rounded-xl border bg-card text-left shadow-2xl shadow-black/[0.08] ring-1 ring-black/[0.02]">
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto hidden rounded-md border bg-background px-3 py-0.5 text-[11px] text-muted-foreground sm:block">prepify.app/dashboard</div>
          <div className="w-10" />
        </div>

        <div className="flex">
          {/* Mini sidebar */}
          <aside className="hidden w-44 shrink-0 border-r bg-sidebar p-3 md:block">
            <div className="mb-4 flex items-center gap-2 px-1.5 text-[13px] font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <PrepifyMark className="h-4 w-4" strokeWidth={2} />
              </span>
              Prepify
            </div>
            <ul className="space-y-0.5">
              {NAV.map(({ icon: Icon, label, active }) => (
                <li
                  key={label}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                    active ? "bg-background font-medium shadow-xs ring-1 ring-border" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </li>
              ))}
            </ul>
          </aside>

          {/* Main */}
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <p className="text-sm font-semibold">Good evening, Aarav</p>
            <p className="mb-4 text-xs text-muted-foreground">You're on a 7-day streak. Keep it going.</p>

            <div className="mb-4 grid grid-cols-3 gap-2.5">
              {[
                ["Sessions", "48", "+6 this week"],
                ["Avg. score", "74%", "+12 vs last month"],
                ["Solved", "9 / 11", "coding problems"],
              ].map(([label, value, hint]) => (
                <div key={label} className="rounded-lg border p-2.5 sm:p-3">
                  <p className="text-[10px] text-muted-foreground sm:text-[11px]">{label}</p>
                  <p className="tabular mt-0.5 text-base font-semibold sm:text-lg">{value}</p>
                  <p className="hidden truncate text-[10px] text-muted-foreground sm:block">{hint}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-2.5 lg:grid-cols-5">
              <div className="rounded-lg border p-3 lg:col-span-3">
                <div className="mb-1 flex items-baseline justify-between">
                  <p className="text-[11px] font-medium">Score trend</p>
                  <p className="tabular text-[11px] font-medium text-emerald-600 dark:text-emerald-400">↑ 34 pts</p>
                </div>
                <TrendChart />
              </div>
              <div className="rounded-lg border lg:col-span-2">
                <p className="border-b px-3 py-2 text-[11px] font-medium">Recent sessions</p>
                <ul className="divide-y">
                  {SESSIONS.map(({ icon: Icon, title, meta, score }) => (
                    <li key={title} className="flex items-center gap-2.5 px-3 py-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium">{title}</span>
                        <span className="block truncate text-[10px] text-muted-foreground">{meta}</span>
                      </span>
                      <span className="tabular text-[11px] font-semibold">{score}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating result card */}
      <div className="absolute -bottom-8 -left-8 hidden w-56 rounded-xl border bg-card p-3.5 text-left shadow-xl lg:block">
        <div className="flex items-center gap-3">
          <MiniRing score={86} />
          <div className="min-w-0">
            <p className="text-xs font-semibold">Voice interview graded</p>
            <p className="text-[11px] text-muted-foreground">Clear structure · 3 filler words</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-md bg-primary/10 px-2.5 py-1.5 text-[11px] font-medium text-primary">
          <span>+118 XP earned</span>
          <span>Level 5 → 6</span>
        </div>
      </div>
    </div>
  );
}
