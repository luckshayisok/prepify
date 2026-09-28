import { Link } from "react-router-dom";
import { ArrowRight, History } from "@/components/icons";
import { greeting } from "@/lib/format";

// Colourful welcome banner: greeting and CTAs on the left, level / XP / streak on the right.
export default function DashboardHero({ user, isNew }) {
  const firstName = user.name.split(" ")[0];
  const { level, xp, progress, streak, badges } = user;
  const message = isNew
    ? "Pick a mode below to start your first session and earn your first XP."
    : streak.current > 0
      ? `You're on a ${streak.current}-day streak. One session today keeps it going.`
      : "Your streak reset — a session today starts a new one.";

  return (
    <section className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg shadow-indigo-500/20 dark:from-indigo-700 dark:via-violet-700 dark:to-fuchsia-700 dark:shadow-none sm:p-8">
      {/* Decorative glows and a faint dot grid */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-sky-400/30 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-white/70">{greeting()}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{firstName}</h1>
          <p className="mt-2 text-[15px] text-white/80">{message}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/setup"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-white/90"
            >
              Start practice <ArrowRight className="h-4 w-4" />
            </Link>
            {!isNew && (
              <Link
                to="/history"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20"
              >
                <History className="h-4 w-4" /> View history
              </Link>
            )}
          </div>
        </div>

        <div className="w-full rounded-xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-md lg:w-80">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold">Level {level}</span>
            <span className="tabular text-sm text-white/75">{xp.toLocaleString()} XP</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-white transition-[width] duration-700"
              style={{ width: `${Math.max(progress.pct, 3)}%` }}
            />
          </div>
          <p className="tabular mt-1.5 text-xs text-white/70">
            {progress.needed - progress.current} XP to level {level + 1}
          </p>
          <dl className="mt-4 grid grid-cols-2 divide-x divide-white/15 rounded-lg bg-white/10 text-center">
            <div className="px-3 py-2.5">
              <dt className="text-[11px] uppercase tracking-wide text-white/60">Streak</dt>
              <dd className="tabular mt-0.5 text-lg font-semibold">
                {streak.current} {streak.current === 1 ? "day" : "days"}
              </dd>
            </div>
            <div className="px-3 py-2.5">
              <dt className="text-[11px] uppercase tracking-wide text-white/60">Badges</dt>
              <dd className="tabular mt-0.5 text-lg font-semibold">{badges.length}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
