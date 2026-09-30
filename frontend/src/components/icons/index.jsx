// Prepify's own icon set. 24px grid, 1.75px rounded strokes, with a soft duotone fill on
// primary shapes. Names mirror the previous icon library so call sites stay readable.
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Spread onto a shape to give it the tinted duotone fill (the stroke still draws on top).
const duo = { fill: "currentColor", fillOpacity: 0.14 };
const solid = { fill: "currentColor", stroke: "none" };

function createIcon(name, children) {
  const Icon = forwardRef(({ className, strokeWidth = 1.75, title, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={cn("shrink-0", className)}
      {...props}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  ));
  Icon.displayName = name;
  return Icon;
}

// ---------- Navigation & modes ----------

export const LayoutDashboard = createIcon(
  "LayoutDashboard",
  <>
    <rect x="4" y="4" width="7" height="7.5" rx="1.75" {...duo} />
    <rect x="13" y="4" width="7" height="4.5" rx="1.75" />
    <rect x="13" y="10.5" width="7" height="9.5" rx="1.75" />
    <rect x="4" y="13.5" width="7" height="6.5" rx="1.75" />
  </>
);

// MCQ: a list of answer bubbles with the first one chosen.
export const Brain = createIcon(
  "Quiz",
  <>
    <circle cx="6.5" cy="6.5" r="2.25" {...duo} />
    <circle cx="6.5" cy="6.5" r="0.9" {...solid} />
    <circle cx="6.5" cy="12" r="2.25" />
    <circle cx="6.5" cy="17.5" r="2.25" />
    <path d="M11.5 6.5h8M11.5 12h6M11.5 17.5h7" />
  </>
);
export const Quiz = Brain;

export const Mic = createIcon(
  "Mic",
  <>
    <rect x="9" y="3" width="6" height="11" rx="3" {...duo} />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
  </>
);

export const MicOff = createIcon(
  "MicOff",
  <>
    <path d="M15 10V6a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 4.6 2.5" />
    <path d="M5.5 11a6.5 6.5 0 0 0 10.4 5.2M18.5 11a6.4 6.4 0 0 1-.5 2.5M12 17.5V21M9 21h6M4 4l16 16" />
  </>
);

// Coding: brackets inside a window.
export const Code2 = createIcon(
  "Code",
  <>
    <rect x="3" y="4" width="18" height="16" rx="3" {...duo} />
    <path d="M3 8.5h18M9.75 12l-2.25 2.25 2.25 2.25M14.25 12l2.25 2.25-2.25 2.25" />
  </>
);

// Resume: document with a profile block.
export const FileText = createIcon(
  "Resume",
  <>
    <path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8z" {...duo} />
    <path d="M14 3v3.5A1.5 1.5 0 0 0 15.5 8H19" />
    <circle cx="10" cy="12" r="1.75" />
    <path d="M7.75 17.25c.35-1.35 1.2-2.1 2.25-2.1s1.9.75 2.25 2.1M14.5 12.5h1.5M14.5 16h1.5" />
  </>
);

export const History = createIcon(
  "History",
  <>
    <path d="M3.75 12a8.25 8.25 0 1 0 2.4-5.8" />
    <path d="M3.75 4.5V8h3.5M12 7.75V12l3 1.75" />
  </>
);

export const Trophy = createIcon(
  "Trophy",
  <>
    <path d="M7.5 4h9v5.5a4.5 4.5 0 0 1-9 0z" {...duo} />
    <path d="M7.5 6H5.25a2 2 0 0 0 0 4H7.8M16.5 6h2.25a2 2 0 0 1 0 4H16.2M12 14v3.25M8.5 20.5h7M9.75 17.25h4.5v3.25h-4.5z" />
  </>
);

export const Flame = createIcon(
  "Flame",
  <>
    <path
      d="M12 21c-3.6 0-6.5-2.65-6.5-6.3 0-3.25 2.35-5.35 3.9-7.6.45 1.6 1.4 2.7 2.6 3.3.3-2.9 1.6-5.3 3.4-7.4.65 2.85 3.1 5.2 3.1 9.3C18.5 17.95 15.6 21 12 21z"
      {...duo}
    />
    <path d="M12 21c-1.45 0-2.6-1.1-2.6-2.6 0-1.55 1.35-2.6 2.6-4 1.25 1.4 2.6 2.45 2.6 4 0 1.5-1.15 2.6-2.6 2.6z" />
  </>
);

export const Settings = createIcon(
  "Settings",
  <>
    <path d="M4 7h9M18 7h2M4 17h2M11 17h9" />
    <circle cx="15.5" cy="7" r="2.25" {...duo} />
    <circle cx="8.5" cy="17" r="2.25" {...duo} />
  </>
);

export const User = createIcon(
  "User",
  <>
    <circle cx="12" cy="8" r="3.75" {...duo} />
    <path d="M4.75 20.25c.95-3.4 3.8-5.5 7.25-5.5s6.3 2.1 7.25 5.5" />
  </>
);

// The AI interviewer.
export const Bot = createIcon(
  "Interviewer",
  <>
    <rect x="4.5" y="8" width="15" height="11.5" rx="4" {...duo} />
    <path d="M12 8V5.25M2.75 12.5v2.5M21.25 12.5v2.5M9.5 16.25h5" />
    <circle cx="12" cy="4" r="1.25" />
    <circle cx="9.25" cy="12.75" r="1" {...solid} />
    <circle cx="14.75" cy="12.75" r="1" {...solid} />
  </>
);

// ---------- Actions ----------

export const Play = createIcon("Play", <path d="M7.5 5.6v12.8a1 1 0 0 0 1.5.86l10.6-6.4a1 1 0 0 0 0-1.72L9 4.74a1 1 0 0 0-1.5.86z" {...duo} />);

export const Send = createIcon(
  "Send",
  <>
    <path d="M20.5 3.5L3.75 10.1a.6.6 0 0 0 0 1.1l6.75 2.8 2.8 6.75a.6.6 0 0 0 1.1 0z" {...duo} />
    <path d="M10.5 13.5l10-10" />
  </>
);

export const RotateCcw = createIcon(
  "RotateCcw",
  <>
    <path d="M4.25 12a7.75 7.75 0 1 0 2.3-5.5" />
    <path d="M4.25 4v4.25H8.5" />
  </>
);

export const Trash2 = createIcon(
  "Trash",
  <>
    <path d="M6 7l.95 12.1A2 2 0 0 0 8.95 21h6.1a2 2 0 0 0 2-1.9L18 7" {...duo} />
    <path d="M4 7h16M9.5 7V4.75A.75.75 0 0 1 10.25 4h3.5a.75.75 0 0 1 .75.75V7M10 11v6M14 11v6" />
  </>
);

export const UploadCloud = createIcon(
  "Upload",
  <>
    <path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96 6 6 0 0 1 11.6.96 4.25 4.25 0 0 1-.5 8" {...duo} />
    <path d="M12 12.5V20.5M9 15.25l3-3 3 3" />
  </>
);

export const LogOut = createIcon(
  "LogOut",
  <>
    <path d="M14 4h3.25A2.75 2.75 0 0 1 20 6.75v10.5A2.75 2.75 0 0 1 17.25 20H14" />
    <path d="M10 16l-4-4 4-4M6 12h9" />
  </>
);

export const PhoneOff = createIcon(
  "EndCall",
  <path
    d="M3.9 14.3c4.9-3.9 11.3-3.9 16.2 0l-.7 2.55a1.2 1.2 0 0 1-1.55.82l-2.75-.95a1.2 1.2 0 0 1-.8-1.13v-1.5a10 10 0 0 0-4.6 0v1.5a1.2 1.2 0 0 1-.8 1.13l-2.75.95a1.2 1.2 0 0 1-1.55-.82z"
    {...duo}
  />
);

export const Menu = createIcon("Menu", <path d="M4 7h16M4 12h16M4 17h10" />);

// ---------- Status & feedback ----------

export const Loader2 = createIcon(
  "Loader",
  <>
    <circle cx="12" cy="12" r="8.5" strokeOpacity="0.2" />
    <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" />
  </>
);

export const Check = createIcon("Check", <path d="M5 12.75l4.25 4.25L19 7.25" />);
export const X = createIcon("X", <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />);

export const CheckCircle2 = createIcon(
  "CheckCircle",
  <>
    <circle cx="12" cy="12" r="9" {...duo} />
    <path d="M8.25 12.25l2.5 2.5 5-5.25" />
  </>
);

export const Circle = createIcon("Circle", <circle cx="12" cy="12" r="8.5" strokeDasharray="2.6 2.6" />);

export const AlertCircle = createIcon(
  "AlertCircle",
  <>
    <circle cx="12" cy="12" r="9" {...duo} />
    <path d="M12 7.75v4.75" />
    <circle cx="12" cy="16" r="1" {...solid} />
  </>
);

export const AlertTriangle = createIcon(
  "AlertTriangle",
  <>
    <path d="M10.3 4.9a2 2 0 0 1 3.4 0l7 12.1a2 2 0 0 1-1.7 3H5a2 2 0 0 1-1.7-3z" {...duo} />
    <path d="M12 9.75v4" />
    <circle cx="12" cy="16.75" r="1" {...solid} />
  </>
);

export const MessageSquareQuote = createIcon(
  "Summary",
  <>
    <path d="M4 6.75A2.75 2.75 0 0 1 6.75 4h10.5A2.75 2.75 0 0 1 20 6.75v7.5A2.75 2.75 0 0 1 17.25 17H11l-4.5 3.5V17h-.25A2.75 2.75 0 0 1 4 14.25z" {...duo} />
    <path d="M8.5 9h7M8.5 12.5h4.5" />
  </>
);

export const ThumbsUp = createIcon(
  "ThumbsUp",
  <>
    <rect x="3.5" y="10" width="4" height="10" rx="1.25" {...duo} />
    <path d="M7.5 11l3.6-6.3a1.6 1.6 0 0 1 2.9 1.2L13 10h5.2a2 2 0 0 1 1.95 2.45l-1.5 6A2 2 0 0 1 16.7 20H7.5" />
  </>
);

export const Sparkles = createIcon(
  "Sparkles",
  <>
    <path d="M10.5 3.5l1.75 4.75L17 10l-4.75 1.75L10.5 16.5l-1.75-4.75L4 10l4.75-1.75z" {...duo} />
    <path d="M18 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
  </>
);

export const Target = createIcon(
  "Target",
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" {...duo} />
    <circle cx="12" cy="12" r="1.25" {...solid} />
  </>
);

export const Award = createIcon(
  "Award",
  <>
    <circle cx="12" cy="9" r="5.5" {...duo} />
    <path d="M8.9 13.6L7.75 21 12 18.75 16.25 21l-1.15-7.4" />
  </>
);

export const Lock = createIcon(
  "Lock",
  <>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" {...duo} />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2" />
  </>
);

export const EyeOff = createIcon(
  "EyeOff",
  <>
    <path d="M9.9 5.75A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.3 3.1M6.6 6.9C4 8.6 2.5 12 2.5 12S6 18.5 12 18.5a9.3 9.3 0 0 0 4.5-1.2" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M4 4l16 16" />
  </>
);

export const Headphones = createIcon(
  "Headphones",
  <>
    <path d="M4 15.5v-3.5a8 8 0 0 1 16 0v3.5" />
    <path d="M4 14.5h2.25A1.25 1.25 0 0 1 7.5 15.75v3A1.25 1.25 0 0 1 6.25 20H5.5A1.5 1.5 0 0 1 4 18.5zM20 14.5h-2.25a1.25 1.25 0 0 0-1.25 1.25v3A1.25 1.25 0 0 0 17.75 20h.75A1.5 1.5 0 0 0 20 18.5z" {...duo} />
  </>
);

export const Terminal = createIcon(
  "Terminal",
  <>
    <rect x="3" y="4.5" width="18" height="15" rx="3" {...duo} />
    <path d="M7.5 9.5l3 2.5-3 2.5M12.75 15h4" />
  </>
);

export const FolderGit2 = createIcon(
  "Folder",
  <path d="M3.5 7.5a2 2 0 0 1 2-2h3.8c.5 0 .95.2 1.3.55L12 7.5h6.5a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" {...duo} />
);

export const CalendarDays = createIcon(
  "Calendar",
  <>
    <rect x="3.75" y="5" width="16.5" height="15.25" rx="2.75" {...duo} />
    <path d="M3.75 9.75h16.5M8.25 3v3.5M15.75 3v3.5" />
    <circle cx="8.5" cy="14" r="0.9" {...solid} />
    <circle cx="12" cy="14" r="0.9" {...solid} />
    <circle cx="15.5" cy="14" r="0.9" {...solid} />
    <circle cx="8.5" cy="17.25" r="0.9" {...solid} />
  </>
);

// Stacked sessions.
export const Layers = createIcon(
  "Layers",
  <>
    <path d="M12 3.75l8.25 4.25L12 12.25 3.75 8z" {...duo} />
    <path d="M3.75 12L12 16.25 20.25 12M3.75 16l8.25 4.25L20.25 16" />
  </>
);

// XP / energy.
export const Zap = createIcon("Zap", <path d="M13.25 3L5.5 13.25h5.75L10.5 21l8-10.25h-5.75z" {...duo} />);

export const Clock = createIcon(
  "Clock",
  <>
    <circle cx="12" cy="12" r="9" {...duo} />
    <path d="M12 7.25V12l3.25 2" />
  </>
);

export const LineChart = createIcon(
  "Chart",
  <>
    <path d="M4 4v14.5A1.5 1.5 0 0 0 5.5 20H20" />
    <path d="M7.5 15l3.5-4.25 3 2.5 4.75-5.75" />
  </>
);

export const TrendingUp = createIcon("TrendingUp", <path d="M3.5 17l6-6 4 4L21 7.5M15.5 7.5H21V13" />);
export const TrendingDown = createIcon("TrendingDown", <path d="M3.5 7l6 6 4-4L21 16.5M15.5 16.5H21V11" />);

// ---------- Theme ----------

export const Sun = createIcon(
  "Sun",
  <>
    <circle cx="12" cy="12" r="4" {...duo} />
    <path d="M12 2.75v1.75M12 19.5v1.75M4.4 4.4l1.25 1.25M18.35 18.35l1.25 1.25M2.75 12H4.5M19.5 12h1.75M4.4 19.6l1.25-1.25M18.35 5.65l1.25-1.25" />
  </>
);

export const Moon = createIcon("Moon", <path d="M19.75 14.6A8 8 0 1 1 9.4 4.25a6.5 6.5 0 0 0 10.35 10.35z" {...duo} />);

export const Monitor = createIcon(
  "Monitor",
  <>
    <rect x="3" y="4" width="18" height="12.5" rx="2.5" {...duo} />
    <path d="M8.5 20.25h7M12 16.5v3.75" />
  </>
);

// ---------- Arrows & chevrons ----------

export const ArrowRight = createIcon("ArrowRight", <path d="M4.5 12h15M13.5 6l6 6-6 6" />);
export const ArrowLeft = createIcon("ArrowLeft", <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />);
export const ArrowUpRight = createIcon("ArrowUpRight", <path d="M7 17L17 7M8.5 7H17v8.5" />);
export const ChevronRight = createIcon("ChevronRight", <path d="M9.5 6l6 6-6 6" />);
export const ChevronLeft = createIcon("ChevronLeft", <path d="M14.5 6l-6 6 6 6" />);
export const ChevronDown = createIcon("ChevronDown", <path d="M6 9.5l6 6 6-6" />);
export const ChevronUp = createIcon("ChevronUp", <path d="M6 14.5l6-6 6 6" />);
export const ChevronsUpDown = createIcon("ChevronsUpDown", <path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4" />);
