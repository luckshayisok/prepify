import { Link } from "react-router-dom";
import { ProgressBar } from "@/components/common";

// Accuracy per topic as thin bars; the number is always shown as text.
export default function TopicBars({ topics, empty, tone }) {
  if (!topics.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-3.5">
      {topics.map((t) => (
        <li key={t.topic}>
          <div className="mb-1.5 flex justify-between gap-2 text-sm">
            <Link to={`/setup?domain=${encodeURIComponent(t.topic)}`} className="truncate hover:underline" title={`Practice ${t.topic}`}>
              {t.topic}
            </Link>
            <span className="tabular shrink-0 text-muted-foreground">
              {t.accuracy}% <span className="text-xs">({t.correct}/{t.total})</span>
            </span>
          </div>
          <ProgressBar value={Math.max(t.accuracy, 2)} tone={tone} />
        </li>
      ))}
    </ul>
  );
}
