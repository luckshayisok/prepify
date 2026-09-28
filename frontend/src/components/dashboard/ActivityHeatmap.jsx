import { cn } from "@/lib/utils";

// Sequential single-hue scale: more sessions → darker blue.
const STEPS = [
  "bg-muted",
  "bg-blue-200 dark:bg-blue-900",
  "bg-blue-400 dark:bg-blue-700",
  "bg-blue-600 dark:bg-blue-500",
  "bg-blue-800 dark:bg-blue-300",
];
const step = (n) => (n <= 0 ? 0 : n === 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 3 : 4);

const key = (d) => d.toISOString().slice(0, 10);

export default function ActivityHeatmap({ counts = {}, today, days = 182 }) {
  const end = new Date(`${today}T00:00:00Z`);
  // Start on a Sunday so columns are whole weeks.
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  const weeks = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() === 0) weeks.push([]);
    weeks.at(-1).push({ date: key(d), count: counts[key(d)] ?? 0 });
  }
  const activeDays = Object.keys(counts).length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="flex w-max gap-[3px]" role="img" aria-label={`${total} sessions on ${activeDays} days in the last 6 months`}>
          {weeks.map((week, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.count} session${day.count === 1 ? "" : "s"} · ${new Date(day.date).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}`}
                  className={cn("h-3 w-3 rounded-[3px]", STEPS[step(day.count)])}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {total} sessions · {activeDays} active days
        </span>
        <span className="flex items-center gap-1">
          Less {STEPS.map((c, i) => <span key={i} className={cn("h-3 w-3 rounded-[3px]", c)} />)} More
        </span>
      </div>
    </div>
  );
}
