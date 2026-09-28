import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Code2, FileText, Flame, LineChart, Mic, Sparkles, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GradientButton } from "@/components/common";

const FEATURES = [
  {
    icon: Mic,
    title: "Voice AI interviewer",
    text: "Have a real spoken interview with an AI. Get scored on communication, accuracy, STAR structure, confidence and filler words.",
    accent: "from-purple-500 to-fuchsia-600",
  },
  {
    icon: Brain,
    title: "Adaptive MCQ rounds",
    text: "AI-generated questions on any topic and difficulty, with explanations and a topic-by-topic weak-area breakdown.",
    accent: "from-blue-500 to-indigo-600",
  },
  {
    icon: Code2,
    title: "Coding round",
    text: "Solve DSA problems in JavaScript or Python in a VS Code-grade editor, with hidden tests and AI code review.",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    icon: FileText,
    title: "Resume-aware questions",
    text: "Upload your resume and a job description. Interviews target your real projects and the gaps the role cares about.",
    accent: "from-amber-500 to-orange-600",
  },
  {
    icon: LineChart,
    title: "Progress dashboard",
    text: "Score trends, strongest and weakest topics, an activity heatmap and every past report in one place.",
    accent: "from-sky-500 to-blue-600",
  },
  {
    icon: Trophy,
    title: "XP, streaks & badges",
    text: "Level up, keep your daily streak alive, unlock badges and climb the leaderboard.",
    accent: "from-rose-500 to-pink-600",
  },
];

const STEPS = [
  ["Pick a mode", "MCQ, voice or coding — personalized from your resume if you like."],
  ["Practice for real", "Timed questions, a live AI interviewer, or a real code editor."],
  ["Get a sharp report", "Scores, explanations, weak topics and concrete next steps."],
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

export default function Home() {
  const { user } = useAuth();
  const cta = user ? "/dashboard" : "/signup";

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-purple-500 to-pink-600 opacity-20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-20 text-center sm:pt-28">
          <motion.span
            {...fadeUp()}
            className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur"
          >
            <Sparkles className="h-4 w-4 text-amber-500" /> Now with voice interviews & coding rounds
          </motion.span>
          <motion.h1 {...fadeUp(0.1)} className="text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            Practice interviews
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              like they're real
            </span>
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Prepify is your AI interview coach: talk to a voice interviewer, crush timed quizzes, solve coding problems, and see
            exactly what to fix next.
          </motion.p>
          <motion.div {...fadeUp(0.3)} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <GradientButton as={Link} to={cta} className="h-12 px-8 text-lg">
              {user ? "Go to dashboard" : "Start practicing free"} <ArrowRight />
            </GradientButton>
            {!user && (
              <Link to="/login" className="rounded-xl px-6 py-3 font-medium text-muted-foreground hover:text-foreground">
                I have an account
              </Link>
            )}
          </motion.div>

          {/* Mock preview */}
          <motion.div {...fadeUp(0.4)} className="mx-auto mt-16 grid max-w-3xl gap-4 text-left sm:grid-cols-3">
            {[
              { icon: Flame, label: "Streak", value: "7 days", tone: "text-orange-500" },
              { icon: Trophy, label: "Level", value: "Lv 5 · 1,040 XP", tone: "text-purple-500" },
              { icon: LineChart, label: "Voice score", value: "86% ↑12", tone: "text-emerald-500" },
            ].map(({ icon: Icon, label, value, tone }) => (
              <div key={label} className="rounded-2xl border bg-card/70 p-5 shadow-lg backdrop-blur">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className={`h-4 w-4 ${tone}`} /> {label}
                </p>
                <p className="mt-1 text-xl font-bold">{value}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fadeUp()} className="mb-12 text-center">
            <h2 className="text-4xl font-bold">Everything you need to get the offer</h2>
            <p className="mt-3 text-lg text-muted-foreground">Four ways to practice, one place to track it all.</p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text, accent }, i) => (
              <motion.div
                key={title}
                {...fadeUp(i * 0.05)}
                className="group rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white transition group-hover:scale-110`}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <motion.h2 {...fadeUp()} className="mb-12 text-center text-4xl font-bold">
            How it works
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map(([title, text], i) => (
              <motion.div key={title} {...fadeUp(i * 0.1)} className="rounded-2xl border bg-card p-6">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mb-1 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </motion.div>
            ))}
          </div>
          <motion.div {...fadeUp()} className="mt-14 text-center">
            <GradientButton as={Link} to={cta} className="h-12 px-8">
              {user ? "Continue practicing" : "Create your free account"} <ArrowRight />
            </GradientButton>
          </motion.div>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-xs text-white">P</span>
            Prepify
          </span>
          <span>© {new Date().getFullYear()} Prepify · Your AI interview coach</span>
        </div>
      </footer>
    </div>
  );
}
