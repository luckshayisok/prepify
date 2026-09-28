import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Brain, CalendarDays, Clock, Code2, FileText, Flame, History, Mic, Target, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Page, Spinner, ErrorState, StatCard, EmptyState, GradientButton } from "@/components/common";
import SessionList from "@/components/SessionList";
import ScoreTrend from "@/components/dashboard/ScoreTrend";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import TopicBars from "@/components/dashboard/TopicBars";

const MODES = [
  { to: "/setup", icon: Brain, title: "MCQ quiz", text: "Timed AI-generated questions in any domain", accent: "from-blue-500 to-blue-700" },
  { to: "/voice", icon: Mic, title: "Voice interview", text: "Talk to an AI interviewer, get graded", accent: "from-purple-500 to-fuchsia-600" },
  { to: "/coding", icon: Code2, title: "Coding round", text: "Solve DSA problems in JS or Python", accent: "from-emerald-500 to-teal-600" },
];

function Section({ title, icon: Icon, action, children, className }) {
  return (
    <section className={`rounded-2xl border bg-card p-5 shadow-sm ${className ?? ""}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />} {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard").then((r) => r.data),
  });

  if (isLoading) return <Spinner label="Loading your dashboard…" />;
  if (error)
    return (
      <Page>
        <ErrorState message={errorMessage(error)} action={<button onClick={() => refetch()} className="underline">Retry</button>} />
      </Page>
    );

  const me = data.user ?? user;
  const { totals, trend, activity, strongestTopics, weakestTopics, recent } = data;
  const firstName = me.name.split(" ")[0];
  const isNew = totals.sessions === 0;

  return (
    <Page>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 text-white shadow-xl sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-blue-100">{isNew ? "Welcome to Prepify" : "Welcome back"}</p>
            <h1 className="text-3xl font-bold sm:text-4xl">{firstName} 👋</h1>
            <p className="mt-2 max-w-md text-blue-100">
              {isNew
                ? "Start your first session to begin earning XP and building a streak."
                : me.streak.current > 0
                  ? `You're on a ${me.streak.current}-day streak. Keep it going today!`
                  : "Your streak reset — one session today starts a new one."}
            </p>
          </div>
          <div className="w-full max-w-xs rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">Level {me.level}</span>
              <span className="flex items-center gap-1 rounded-full bg-orange-400/20 px-2 py-0.5 text-sm font-semibold">
                <Flame className="h-4 w-4 text-orange-300" /> {me.streak.current}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
              <motion.div
                className="h-full rounded-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${me.progress.pct}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <p className="mt-2 text-xs text-blue-100">
              {me.xp} XP total · {me.progress.needed - me.progress.current} XP to level {me.level + 1}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick start */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {MODES.map(({ to, icon: Icon, title, text, accent }) => (
          <Link key={to} to={to} className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white`}>
              <Icon className="h-5 w-5" />
            </span>
            <p className="flex items-center gap-1 font-semibold">
              {title} <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </Link>
        ))}
      </div>

      {!me.hasResume && (
        <Link
          to="/resume"
          className="mb-8 flex items-center gap-4 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 transition hover:shadow-md dark:border-amber-500/30 dark:bg-amber-950/20"
        >
          <FileText className="h-8 w-8 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-semibold">Personalize your practice</p>
            <p className="text-sm text-muted-foreground">Upload your resume and every mode can ask about your real projects (+10% XP).</p>
          </div>
          <ArrowRight className="h-5 w-5 text-amber-600" />
        </Link>
      )}

      {isNew ? (
        <EmptyState
          icon={Target}
          title="No sessions yet"
          description="Your score trend, weak topics and activity heatmap appear here after your first session."
          action={
            <GradientButton as={Link} to="/setup">
              Start an MCQ quiz <ArrowRight />
            </GradientButton>
          }
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={History} label="Sessions" value={totals.sessions} />
            <StatCard icon={Target} label="Average score" value={`${totals.avgScore ?? 0}%`} hint={`Best: ${totals.bestScore ?? 0}%`} />
            <StatCard icon={Code2} label="Problems solved" value={totals.problemsSolved} tone="text-emerald-600 dark:text-emerald-400" />
            <StatCard icon={Clock} label="Minutes practiced" value={totals.minutesPracticed} tone="text-purple-600 dark:text-purple-400" />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <Section title="Score trend" icon={TrendingUp} className="lg:col-span-2">
              {trend.length > 1 ? (
                <ScoreTrend data={trend} />
              ) : (
                <p className="py-16 text-center text-sm text-muted-foreground">Complete one more session to see your trend.</p>
              )}
            </Section>
            <Section title="Recent sessions" icon={History} action={<Link to="/history" className="text-sm text-blue-600 hover:underline dark:text-blue-400">View all</Link>}>
              <SessionList sessions={recent.slice(0, 5)} />
            </Section>
          </div>

          <Section title="Activity" icon={CalendarDays} className="mb-6">
            <ActivityHeatmap counts={activity.counts} today={activity.today} days={activity.days} />
          </Section>

          <div className="grid gap-6 md:grid-cols-2">
            <Section title="Weakest topics" icon={TrendingDown}>
              <TopicBars
                topics={weakestTopics}
                tone="bg-red-500"
                empty="Answer at least 2 questions on a topic in MCQ mode to see it here."
              />
            </Section>
            <Section title="Strongest topics" icon={Trophy}>
              <TopicBars topics={strongestTopics} tone="bg-emerald-500" empty="Your best topics will show up here." />
            </Section>
          </div>
        </>
      )}
    </Page>
  );
}
