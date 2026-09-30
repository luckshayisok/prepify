import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Award, CalendarDays, Code2, FileText, History, Layers, Target, TrendingUp, Zap } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ErrorState, Page, PageSkeleton, Section } from "@/components/common";
import SessionList from "@/components/SessionList";
import DashboardHero from "@/components/dashboard/DashboardHero";
import TodayCard from "@/components/dashboard/TodayCard";
import KpiCard from "@/components/dashboard/KpiCard";
import UpNextCard from "@/components/dashboard/UpNextCard";
import ScoreTrend from "@/components/dashboard/ScoreTrend";
import SkillMap from "@/components/dashboard/SkillMap";
import ModeBreakdown from "@/components/dashboard/ModeBreakdown";
import BadgesInProgress from "@/components/dashboard/BadgesInProgress";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import RankCard from "@/components/dashboard/RankCard";

// Cards fade up one after another on load.
const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };

function Cell({ className, children }) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}

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
  const { totals, trend, activity, recent, week, today, badgeProgress, recommendation, rank, topics, byMode, problemsTotal } = data;
  const isNew = totals.sessions === 0;
  const series = week.series;

  return (
    <Page className="max-w-7xl">
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Cell className="lg:col-span-8">
          <DashboardHero user={me} isNew={isNew} />
        </Cell>
        <Cell className="lg:col-span-4">
          <TodayCard today={today} streak={me.streak} />
        </Cell>

        <Cell className="lg:col-span-12">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              icon={Layers}
              label="Sessions this week"
              value={week.sessions.value}
              delta={week.sessions.delta}
              spark={series.map((d) => d.count)}
              bars
            />
            <KpiCard
              icon={Target}
              label="Avg score this week"
              value={week.avgScore.value}
              format={(v) => `${v}%`}
              delta={week.avgScore.delta}
              deltaSuffix=" pts"
              spark={series.map((d) => d.avgScore)}
            />
            <KpiCard icon={Zap} label="XP this week" value={week.xp.value} delta={week.xp.delta} spark={series.map((d) => d.xp)} bars />
            <KpiCard
              icon={Code2}
              label="Problems solved"
              value={totals.problemsSolved}
              format={(v) => `${v} / ${problemsTotal}`}
              footer={`${totals.sessions} sessions all time · ${totals.minutesPracticed} min practiced`}
            />
          </div>
        </Cell>

        {!me.hasResume && (
          <Cell className="lg:col-span-12">
            <Link
              to="/resume"
              className="flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-sm transition hover:border-primary/40 hover:bg-primary/5"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">
                <span className="font-medium">Personalize your practice.</span>{" "}
                <span className="text-muted-foreground">Upload your resume to get questions about your real projects (+10% XP).</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Cell>
        )}

        <Cell className="lg:col-span-5">
          <UpNextCard recommendation={recommendation} />
        </Cell>
        <Cell className="lg:col-span-7">
          <Section title="Score trend" icon={TrendingUp} className="h-full">
            <ScoreTrend data={trend} />
          </Section>
        </Cell>

        <Cell className="lg:col-span-4">
          <Section title="Skill map" icon={Target} description="Accuracy by topic" className="h-full">
            <SkillMap topics={topics} />
          </Section>
        </Cell>
        <Cell className="lg:col-span-4">
          <Section title="By mode" icon={Layers} description="Sessions and average score" className="h-full">
            <ModeBreakdown byMode={byMode} />
          </Section>
        </Cell>
        <Cell className="lg:col-span-4">
          <Section title="Badges in progress" icon={Award} description="Closest to unlocking" className="h-full">
            <BadgesInProgress badges={badgeProgress} earnedCount={me.badges.length} />
          </Section>
        </Cell>

        <Cell className="lg:col-span-8">
          <Section title="Activity" icon={CalendarDays} description="Last 6 months" className="h-full" bodyClassName="flex flex-col justify-center">
            <ActivityHeatmap counts={activity.counts} today={activity.today} days={activity.days} />
          </Section>
        </Cell>
        <Cell className="flex flex-col gap-5 lg:col-span-4">
          <RankCard rank={rank} />
          <Section
            title="Recent sessions"
            icon={History}
            padded={false}
            className="flex-1"
            action={
              !isNew && (
                <Link to="/history" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  View all
                </Link>
              )
            }
          >
            {recent.length ? (
              <SessionList sessions={recent.slice(0, 3)} />
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">Your completed sessions will show up here.</p>
            )}
          </Section>
        </Cell>
      </motion.div>
    </Page>
  );
}
