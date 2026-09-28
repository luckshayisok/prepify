import { Link } from "react-router-dom";

// Accuracy per topic as thin horizontal bars; the number is always shown as text.
export default function TopicBars({ topics, empty, tone = "bg-blue-600" }) {
  if (!topics.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-3">
      {topics.map((t) => (
        <li key={t.topic}>
          <div className="mb-1 flex justify-between gap-2 text-sm">
            <Link to={`/setup?domain=${encodeURIComponent(t.topic)}`} className="truncate hover:underline" title={`Practice ${t.topic}`}>
              {t.topic}
            </Link>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {t.accuracy}% · {t.correct}/{t.total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(t.accuracy, 2)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
