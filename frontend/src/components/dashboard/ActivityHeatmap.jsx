import { cn } from "@/lib/utils";

// Sequential single-hue scale on the accent: more sessions → stronger indigo.
const STEPS = ["bg-muted", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"];
const step = (n) => (n <= 0 ? 0 : n === 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 3 : 4);
const key = (d) => d.toISOString().slice(0, 10);
const MONTH = (d) => d.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" });

// Full-width contribution grid: columns are weeks and stretch to fill the card.
export default function ActivityHeatmap({ counts = {}, today, days = 182 }) {
  const end = new Date(`${today}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // start on a Sunday

  const weeks = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() === 0) weeks.push([]);
    weeks.at(-1).push({ date: key(d), count: counts[key(d)] ?? 0, month: d.getUTCDate() <= 7 && d.getUTCDay() === 0 ? MONTH(d) : null });
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const activeDays = Object.values(counts).filter(Boolean).length;
  const busiest = Math.max(0, ...Object.values(counts));

  return (
    <div>
      {/* One grid, filled column by column: a label column, then one column per week.
          Rows: month label + 7 weekdays; square cells set the row heights so labels line up. */}
      <div
        className="grid gap-[3px]"
        style={{
          gridTemplateColumns: `28px repeat(${weeks.length}, minmax(0, 1fr))`,
          gridTemplateRows: "14px repeat(7, auto)",
          gridAutoFlow: "column",
        }}
        role="img"
        aria-label={`${total} sessions on ${activeDays} days in the last 6 months`}
      >
        <span />
        {["", "Mon", "", "Wed", "", "Fri", ""].map((l, i) => (
          <span key={`label-${i}`} className="flex items-center text-[10px] leading-none text-muted-foreground">
            {l}
          </span>
        ))}
        {weeks.flatMap((week, wi) => [
          <span key={`m-${wi}`} className="overflow-visible whitespace-nowrap text-[10px] leading-[14px] text-muted-foreground">
            {week[0].month ?? ""}
          </span>,
          ...Array.from({ length: 7 }, (_, di) => {
            const day = week[di];
            if (!day) return <span key={`e-${wi}-${di}`} />;
            return (
              <div
                key={day.date}
                title={`${day.count} session${day.count === 1 ? "" : "s"} · ${new Date(day.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}`}
                className={cn(
                  "aspect-square w-full rounded-[3px] transition hover:ring-2 hover:ring-ring/40",
                  STEPS[step(day.count)],
                  day.date === today && "ring-1 ring-foreground/40"
                )}
              />
            );
          }),
        ])}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="tabular">
          {total} sessions · {activeDays} active days{busiest > 1 ? ` · busiest day ${busiest}` : ""}
        </span>
        <span className="flex items-center gap-1">
          Less
          {STEPS.map((c, i) => (
            <span key={i} className={cn("h-[11px] w-[11px] rounded-[3px]", c)} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
