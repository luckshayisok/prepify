import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, Brain, CalendarDays, Clock, Code2, FileText, Flame, History, Mic, Target, TrendingDown, TrendingUp, Trophy } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { EmptyState, ErrorState, Page, PageSkeleton, Section, StatCard } from "@/components/common";
import DashboardHero from "@/components/dashboard/DashboardHero";
import SessionList from "@/components/SessionList";
import ScoreTrend from "@/components/dashboard/ScoreTrend";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import TopicBars from "@/components/dashboard/TopicBars";

const MODES = [
  { to: "/setup", icon: Brain, title: "MCQ quiz", text: "Timed questions on any topic" },
  { to: "/voice", icon: Mic, title: "Voice interview", text: "Talk it through, get graded" },
  { to: "/coding", icon: Code2, title: "Coding round", text: "DSA in JavaScript or Python" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard").then((r) => r.data),
  });

  if (isLoading) return <PageSkeleton />;
  if (error)
    return (
      <Page>
        <ErrorState message={errorMessage(error)} action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} />
      </Page>
    );

  const me = data.user ?? user;
  const { totals, trend, activity, strongestTopics, weakestTopics, recent } = data;
  const isNew = totals.sessions === 0;

  return (
    <Page>
      <DashboardHero user={me} isNew={isNew} />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {MODES.map(({ to, icon: Icon, title, text }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center gap-3.5 rounded-xl border bg-card p-4 shadow-xs transition hover:border-foreground/20 hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background text-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{title}</span>
              <span className="block truncate text-xs text-muted-foreground">{text}</span>
            </span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition group-hover:text-foreground" />
          </Link>
        ))}
      </div>

      {!me.hasResume && (
        <Link to="/resume" className="mb-8 flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-sm transition hover:bg-accent/50">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1">
            <span className="font-medium">Personalize your practice.</span>{" "}
            <span className="text-muted-foreground">Upload your resume to get questions about your real projects (+10% XP).</span>
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      {isNew ? (
        <EmptyState
          icon={Target}
          title="No sessions yet"
          description="Your score trend, weak topics and activity appear here after your first session."
          action={
            <Button asChild>
              <Link to="/setup">Start an MCQ quiz</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={History} label="Sessions" value={totals.sessions} />
            <StatCard icon={Target} label="Average score" value={`${totals.avgScore ?? 0}%`} hint={`Best ${totals.bestScore ?? 0}%`} />
            <StatCard icon={Flame} label="Streak" value={`${me.streak.current} day${me.streak.current === 1 ? "" : "s"}`} hint={`Longest ${me.streak.longest}`} />
            <StatCard icon={Clock} label="Time practiced" value={`${totals.minutesPracticed} min`} hint={`${totals.problemsSolved} problems solved`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Section title="Score trend" icon={TrendingUp} description={`Last ${trend.length} sessions`} className="lg:col-span-3">
              {trend.length > 1 ? (
                <ScoreTrend data={trend} />
              ) : (
                <p className="py-20 text-center text-sm text-muted-foreground">Complete one more session to see your trend.</p>
              )}
            </Section>
            <Section
              title="Recent sessions"
              icon={History}
              padded={false}
              className="lg:col-span-2"
              action={
                <Link to="/history" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  View all
                </Link>
              }
            >
              <SessionList sessions={recent.slice(0, 5)} />
            </Section>
          </div>

          <Section title="Activity" icon={CalendarDays} description="Last 6 months">
            <ActivityHeatmap counts={activity.counts} today={activity.today} days={activity.days} />
          </Section>

          <div className="grid gap-6 md:grid-cols-2">
            <Section title="Needs work" icon={TrendingDown} description="Topics under 70% accuracy">
              <TopicBars topics={weakestTopics} tone="bg-rose-500" empty="Answer 2+ MCQ questions on a topic to see it here." />
            </Section>
            <Section title="Strengths" icon={Trophy} description="Topics at 70% or above">
              <TopicBars topics={strongestTopics} tone="bg-emerald-500" empty="Your best topics will show up here." />
            </Section>
          </div>
        </div>
      )}
    </Page>
  );
}
