import { Link } from "react-router-dom";
import { AlertCircle, Loader2 } from "@/components/icons";
import Wordmark from "@/components/icons/Wordmark";
import { cn } from "@/lib/utils";
import { LEVEL_DOTS, MODES } from "@/lib/format";

export function Logo({ className, to = "/", size = "h-6" }) {
  return (
    <Link to={to} aria-label="Prepify home" className={cn("inline-flex items-center rounded-md text-foreground", className)}>
      <Wordmark className={size} />
    </Link>
  );
}

export function Page({ className, children }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:py-10", className)}>{children}</div>;
}

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-[15px]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

// bodyClassName styles the content area (e.g. to center content in a stretched card).
export function Section({ title, description, icon: Icon, action, className, bodyClassName, children, padded = true }) {
  return (
    <section className={cn("flex flex-col rounded-xl border bg-card shadow-xs", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
              {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("flex-1", padded && "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Spinner({ label, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-24 text-sm text-muted-foreground", className)}>
      <Loader2 className="h-5 w-5 animate-spin" />
      {label && <p>{label}</p>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

export function PageSkeleton() {
  return (
    <Page>
      <Skeleton className="mb-3 h-7 w-56" />
      <Skeleton className="mb-8 h-4 w-80" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </Page>
  );
}

export function ErrorState({ message, action }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border bg-card p-8 text-center shadow-xs">
      <AlertCircle className="mb-3 h-6 w-6 text-destructive" />
      <p className="text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center", className)}>
      {Icon && (
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border bg-card shadow-xs">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </span>
      )}
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Alert({ tone = "error", children, className }) {
  const tones = {
    error: "border-destructive/30 bg-destructive/5 text-destructive",
    warning: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
    info: "border-primary/30 bg-primary/5 text-foreground",
  };
  return <div className={cn("rounded-lg border px-3.5 py-2.5 text-sm", tones[tone], className)}>{children}</div>;
}

export function ModeBadge({ mode, className }) {
  const m = MODES[mode];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border bg-background px-1.5 py-0.5 text-xs font-medium text-muted-foreground", className)}>
      <Icon className="h-3 w-3" /> {m.label}
    </span>
  );
}

export function LevelBadge({ level, className }) {
  if (!level) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium capitalize text-muted-foreground", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", LEVEL_DOTS[level])} />
      {level}
    </span>
  );
}

export function ScoreRing({ score, size = 112, stroke = 8, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score ?? 0));
  return (
    <div className="relative inline-flex shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Score ${score ?? 0}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="fill-none stroke-primary transition-[stroke-dashoffset] duration-1000 ease-out"
          style={{ strokeDasharray: c, strokeDashoffset: c * (1 - pct / 100) }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("tabular font-semibold", size >= 100 ? "text-2xl" : "text-lg")}>{score ?? "—"}%</span>
        {label && <span className="text-[11px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        {label}
        {Icon && <Icon className="h-4 w-4" />}
      </div>
      <div className="tabular mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function ProgressBar({ value, className, tone = "bg-primary" }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-700", tone)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

// Pill-style single choice: [{ value, label, hint? }]
export function SegmentedControl({ value, onChange, options, className, "aria-label": ariaLabel }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("grid gap-1 rounded-lg border bg-muted/60 p-1", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              active ? "bg-background text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
            {o.hint && <span className="block text-[11px] font-normal text-muted-foreground">{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, hint, htmlFor, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PersonalizeToggle({ checked, onChange, hasResume }) {
  if (!hasResume) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        <Link to="/resume" className="font-medium text-foreground underline-offset-4 hover:underline">
          Upload your resume
        </Link>{" "}
        to get questions about your own projects (+10% XP).
      </p>
    );
  }
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition hover:bg-accent/50">
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-sm font-medium">Personalize from my resume</span>
        <span className="block text-xs text-muted-foreground">Questions target your projects and skills · +10% XP</span>
      </span>
    </label>
  );
}

export function Avatar({ user, size = 32, className }) {
  const initials = (user?.name ?? "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

