import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEVEL_STYLES, MODES, scoreTone } from "@/lib/format";

export function Page({ className, children }) {
  return <main className={cn("mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12", className)}>{children}</main>;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">{eyebrow}</p>}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Spinner({ label, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function ErrorState({ message, action }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
      <p className="font-medium text-red-700 dark:text-red-300">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed p-10 text-center">
      {Icon && <Icon className="mb-3 h-10 w-10 text-muted-foreground" />}
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function GradientButton({ className, as: Comp = "button", ...props }) {
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4",
        className
      )}
      {...props}
    />
  );
}

export function ModeBadge({ mode, className }) {
  const m = MODES[mode];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", m.bg, m.color, className)}>
      <Icon className="h-3 w-3" /> {m.label}
    </span>
  );
}

export function LevelBadge({ level }) {
  if (!level) return null;
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", LEVEL_STYLES[level])}>{level}</span>;
}

export function ScoreRing({ score, size = 120, stroke = 10, label = "Score" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score ?? 0));
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="fill-none transition-all duration-1000"
          style={{ stroke: "url(#ringGradient)", strokeDasharray: c, strokeDashoffset: c * (1 - pct / 100) }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold", size >= 120 ? "text-3xl" : "text-xl", scoreTone(score))}>{score ?? "—"}%</span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, tone = "text-blue-600 dark:text-blue-400" }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className={cn("h-4 w-4", tone)} />}
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function PersonalizeToggle({ checked, onChange, hasResume }) {
  if (!hasResume) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        <Link to="/resume" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Upload your resume
        </Link>{" "}
        to get questions about your own projects and skills (+10% XP).
      </div>
    );
  }
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition hover:bg-accent/50">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-blue-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium">Personalize from my resume</span>
        <span className="block text-xs text-muted-foreground">Questions target your projects and skills. +10% XP.</span>
      </span>
    </label>
  );
}
