import { Link } from "react-router-dom";
import { ArrowRight, Brain, Check, Code2, FileText, LineChart, Mic, Trophy } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common";
import ProductPreview from "@/components/landing/ProductPreview";
import { useAuth } from "@/context/AuthContext";

const FEATURES = [
  { icon: Mic, title: "Voice interviews", text: "Talk to an AI interviewer. Get scored on communication, accuracy, structure, confidence and filler words." },
  { icon: Brain, title: "MCQ rounds", text: "Timed, AI-generated questions on any topic, with explanations and a per-topic breakdown." },
  { icon: Code2, title: "Coding round", text: "DSA problems in JavaScript or Python with hidden tests and AI code review." },
  { icon: FileText, title: "Resume-aware", text: "Upload your resume and a job description to get questions about your real projects." },
  { icon: LineChart, title: "Progress tracking", text: "Score trends, weak topics, an activity heatmap and every past report." },
  { icon: Trophy, title: "XP & streaks", text: "Level up, keep a daily streak, unlock badges and climb the leaderboard." },
];

export default function Home() {
  const { user } = useAuth();
  const cta = user ? "/dashboard" : "/signup";

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pb-28 pt-16 sm:px-8 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Voice interviews and coding rounds are live
          </p>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Practice interviews
            <br />
            <span className="text-muted-foreground">until they feel easy.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            An AI interview coach for voice, MCQ and coding rounds — with honest feedback and a clear view of what to fix next.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="xl">
              <Link to={cta}>
                {user ? "Open dashboard" : "Start practicing — it's free"} <ArrowRight />
              </Link>
            </Button>
            {!user && (
              <Button asChild size="xl" variant="ghost">
                <Link to="/login">Log in</Link>
              </Button>
            )}
          </div>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {["No credit card", "Sign in with Google", "Personalized from your resume"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto mt-16 max-w-5xl">
          <ProductPreview />
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
          <div className="mb-12 max-w-xl">
            <h2 className="text-3xl font-semibold">Everything you need to prepare</h2>
            <p className="mt-3 text-muted-foreground">Three ways to practice, one place to track progress.</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-card p-6">
                <Icon className="mb-4 h-5 w-5 text-primary" />
                <h3 className="font-medium">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-8">
          <h2 className="text-3xl font-semibold">Your next interview starts here.</h2>
          <p className="mt-3 text-muted-foreground">Set up in under a minute.</p>
          <Button asChild size="xl" className="mt-8">
            <Link to={cta}>
              {user ? "Continue practicing" : "Create free account"} <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:px-8">
          <Logo />
          <span>© {new Date().getFullYear()} Prepify</span>
        </div>
      </footer>
    </div>
  );
}
