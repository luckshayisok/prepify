import { Link } from "react-router-dom";
import BadgeArt from "@/components/icons/BadgeArt";

// The locked badges closest to being earned, with progress toward each.
export default function BadgesInProgress({ badges, earnedCount }) {
  if (!badges.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">You've earned every badge. Impressive.</p>;
  }
  return (
    <div>
      <ul className="space-y-4">
        {badges.map((b) => (
          <li key={b.id} className="flex items-center gap-3">
            <BadgeArt id={b.id} size={38} earned={b.pct >= 50} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">{b.name}</span>
                <span className="tabular shrink-0 text-xs text-muted-foreground">
                  {b.current}/{b.target}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{b.description}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-700"
                  style={{ width: `${Math.max(3, b.pct)}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Link to="/settings" className="mt-4 block text-xs font-medium text-muted-foreground hover:text-foreground">
        {earnedCount} earned · see all badges
      </Link>
    </div>
  );
}
