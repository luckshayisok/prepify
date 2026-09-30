import { useNavigate } from "react-router-dom";
import { ArrowRight } from "@/components/icons";
import { cn } from "@/lib/utils";

// Strength bands. Colour is backed up by the number and the legend, never used alone.
const BANDS = [
  { min: 80, label: "Strong", bar: "bg-emerald-500", dot: "bg-emerald-500" },
  { min: 60, label: "Good", bar: "bg-indigo-500", dot: "bg-indigo-500" },
  { min: 40, label: "Fair", bar: "bg-amber-500", dot: "bg-amber-500" },
  { min: 0, label: "Weak", bar: "bg-rose-500", dot: "bg-rose-500" },
];
const band = (accuracy) => BANDS.find((b) => accuracy >= b.min);

// Topics ranked best to worst; click one to practice it.
export default function SkillMap({ topics }) {
  const navigate = useNavigate();

  if (!topics.length) {
    return (
      <p className="flex h-52 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Answer a couple of MCQ questions per topic and your skills are ranked here.
      </p>
    );
  }

  const ranked = [...topics].sort((a, b) => b.accuracy - a.accuracy || b.total - a.total).slice(0, 6);

  return (
    <div>
      <ol className="space-y-1">
        {ranked.map((t, i) => {
          const b = band(t.accuracy);
          return (
            <li key={t.topic}>
              <button
                onClick={() => navigate(`/setup?domain=${encodeURIComponent(t.topic)}`)}
                className="group w-full rounded-lg px-2 py-2 text-left transition hover:bg-accent/60"
                title={`Practice ${t.topic}`}
              >
                <div className="mb-1.5 flex items-center gap-2 text-sm">
                  <span className="tabular w-4 shrink-0 text-xs text-muted-foreground">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{t.topic}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  <span className="tabular shrink-0 font-semibold">{t.accuracy}%</span>
                </div>
                <div className="ml-6 h-2 overflow-hidden rounded-full bg-muted/70">
                  <div
                    className={cn("h-full rounded-full transition-[width] duration-700 ease-out", b.bar)}
                    style={{ width: `${Math.max(3, t.accuracy)}%`, transitionDelay: `${i * 60}ms` }}
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 px-2 text-[11px] text-muted-foreground">
        {BANDS.map((b) => (
          <span key={b.label} className="flex items-center gap-1">
            <span className={cn("h-2 w-2 rounded-full", b.dot)} /> {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
