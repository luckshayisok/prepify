import { useId } from "react";
import { cn } from "@/lib/utils";

// Glyphs drawn on a 24px grid, rendered white inside the emblem.
const GLYPHS = {
  // Rocket
  first_steps: (
    <>
      <path d="M12 3.5c3 1.9 4.5 5 4.5 8.5l-1.75 3.5h-5.5L7.5 12c0-3.5 1.5-6.6 4.5-8.5z" />
      <circle cx="12" cy="9.75" r="1.6" />
      <path d="M7.5 12l-2.25 2.75 3 .75M16.5 12l2.25 2.75-3 .75M10.25 18.5L12 20.5l1.75-2" />
    </>
  ),
  // "100"
  perfectionist: (
    <>
      <path d="M5 8.5l1.75-1.25V17" />
      <rect x="9.25" y="7.25" width="4.25" height="9.75" rx="2.125" />
      <rect x="15.25" y="7.25" width="4.25" height="9.75" rx="2.125" />
    </>
  ),
  // Flame
  on_fire: (
    <path d="M12 20.5c-3.3 0-5.75-2.4-5.75-5.6 0-3 2.1-4.8 3.45-6.8.4 1.4 1.25 2.4 2.3 2.9.25-2.6 1.4-4.7 3-6.55.6 2.5 2.75 4.6 2.75 8.2 0 4.35-2.5 7.85-5.75 7.85z" />
  ),
  // Lightning bolt
  unstoppable: <path d="M13.25 3.5L6.5 13.25h5l-.75 7.25 6.75-9.75h-5z" />,
  // Microphone
  smooth_talker: (
    <>
      <rect x="9.25" y="3.5" width="5.5" height="10" rx="2.75" />
      <path d="M6.25 11a5.75 5.75 0 0 0 11.5 0M12 16.75V20.5" />
    </>
  ),
  // Code brackets
  code_warrior: <path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.25 5.5l-2.5 13" />,
  // Connected graph nodes
  algorithmist: (
    <>
      <circle cx="6.5" cy="7" r="2" />
      <circle cx="17.5" cy="7" r="2" />
      <circle cx="12" cy="17.5" r="2" />
      <path d="M8.5 7h7M7.5 8.75l3.5 7M16.5 8.75l-3.5 7" />
    </>
  ),
  // Document with check
  tailored: (
    <>
      <path d="M14 3.75H8a2 2 0 0 0-2 2v12.5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.75z" />
      <path d="M9.25 13.25l1.9 1.9 3.6-3.9" />
    </>
  ),
  // Mountain with flag
  hard_mode: (
    <>
      <path d="M3.5 19.5l6-10 3.25 5 2.25-3 5.5 8z" />
      <path d="M9.5 9.5V4.25l3.5 1.5-3.5 1.5" />
    </>
  ),
  // Stopwatch / endurance
  marathon: (
    <>
      <circle cx="12" cy="13.25" r="6.75" />
      <path d="M12 9.5v3.75l2.5 1.5M10 3.75h4M12 3.75v2.75" />
    </>
  ),
  // Graduation cap
  polymath: (
    <>
      <path d="M2.75 9.5L12 5l9.25 4.5L12 14z" />
      <path d="M6.5 11.5v4c1.4 1.5 3.35 2.25 5.5 2.25s4.1-.75 5.5-2.25v-4M21.25 9.5v5" />
    </>
  ),
  // Star
  level_5: <path d="M12 3.75l2.5 5.25 5.75.75-4.2 3.95 1.05 5.7L12 16.6l-5.1 2.8 1.05-5.7-4.2-3.95L9.5 9z" />,
};

// Two-stop gradient per badge (light → deep).
const COLORS = {
  first_steps: ["#818cf8", "#4f46e5"],
  perfectionist: ["#34d399", "#059669"],
  on_fire: ["#fb923c", "#ea580c"],
  unstoppable: ["#fbbf24", "#d97706"],
  smooth_talker: ["#c084fc", "#7c3aed"],
  code_warrior: ["#38bdf8", "#0284c7"],
  algorithmist: ["#2dd4bf", "#0d9488"],
  tailored: ["#fb7185", "#e11d48"],
  hard_mode: ["#94a3b8", "#475569"],
  marathon: ["#22d3ee", "#0891b2"],
  polymath: ["#e879f9", "#c026d3"],
  level_5: ["#facc15", "#ca8a04"],
};

/**
 * A badge emblem: a rounded hexagon with a gradient and a white glyph.
 * Locked badges render as a flat grey outline so earned ones stand out.
 */
export default function BadgeArt({ id, earned = true, size = 40, className, title }) {
  const gid = useId();
  const [from, to] = COLORS[id] ?? ["#a1a1aa", "#52525b"];
  const glyph = GLYPHS[id] ?? GLYPHS.level_5;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={cn("shrink-0", className)}
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path
        d="M21 3.7a6 6 0 0 1 6 0l13.1 7.55a6 6 0 0 1 3 5.2v15.1a6 6 0 0 1-3 5.2L27 44.3a6 6 0 0 1-6 0L7.9 36.75a6 6 0 0 1-3-5.2v-15.1a6 6 0 0 1 3-5.2z"
        fill={earned ? `url(#${gid})` : "hsl(var(--muted))"}
        stroke={earned ? "none" : "hsl(var(--border))"}
        strokeWidth="1.5"
      />
      {earned && (
        <path
          d="M21.9 7.6a4.2 4.2 0 0 1 4.2 0l11.05 6.4a4.2 4.2 0 0 1 2.1 3.6v12.8a4.2 4.2 0 0 1-2.1 3.6L26.1 40.4a4.2 4.2 0 0 1-4.2 0L10.85 34a4.2 4.2 0 0 1-2.1-3.6V17.6a4.2 4.2 0 0 1 2.1-3.6z"
          fill="none"
          stroke="white"
          strokeOpacity="0.25"
          strokeWidth="1"
        />
      )}
      <g
        transform="translate(12 12)"
        fill="none"
        stroke={earned ? "white" : "hsl(var(--muted-foreground))"}
        strokeOpacity={earned ? 1 : 0.6}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {glyph}
      </g>
    </svg>
  );
}
