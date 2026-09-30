import { Link } from "react-router-dom";
import { ArrowRight, History } from "@/components/icons";
import { greeting } from "@/lib/format";
import { useCountUp } from "@/hooks/useCountUp";

// Colourful welcome banner: greeting and CTAs on the left, level / XP / streak on the right.
export default function DashboardHero({ user, isNew }) {
  const firstName = user.name.split(" ")[0];
  const { level, xp, progress, streak, badges } = user;
  const shownXp = useCountUp(xp, 900);
  const message = isNew
    ? "Pick a mode below to start your first session and earn your first XP."
    : streak.current > 0
      ? `You're on a ${streak.current}-day streak. One session today keeps it going.`
      : "Your streak reset — a session today starts a new one.";

  return (
    <section className="hero-midnight relative flex h-full flex-col justify-center overflow-hidden rounded-2xl p-6 text-white shadow-lg shadow-indigo-950/30 ring-1 ring-white/10 dark:shadow-none sm:p-8">
      {/* Decorative glows and a faint dot grid */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-600/25 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-white/70">{greeting()}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{firstName}</h1>
          <p className="mt-2 text-[15px] text-white/80">{message}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/setup"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-indigo-950 shadow-sm transition hover:bg-white/90"
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

        <div className="w-full rounded-xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-md xl:w-72">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold">Level {level}</span>
            <span className="tabular text-sm text-white/75">{shownXp.toLocaleString()} XP</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-200 transition-[width] duration-700"
              style={{ width: `${Math.max(progress.pct, 3)}%` }}
            />
          </div>
          <p className="tabular mt-1.5 text-xs text-white/70">
            {progress.needed - progress.current} XP to level {level + 1}
          </p>
          <p className="mt-3 flex justify-between border-t border-white/15 pt-3 text-xs text-white/75">
            <span>
              <span className="tabular font-semibold text-white">{badges.length}</span> badges earned
            </span>
            <span>
              Best streak <span className="tabular font-semibold text-white">{streak.longest}</span>
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
