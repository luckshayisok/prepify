import { Brain, Code2, Mic } from "@/components/icons";

export const MODES = {
  mcq: { label: "MCQ", icon: Brain },
  voice: { label: "Voice", icon: Mic },
  coding: { label: "Coding", icon: Code2 },
};

// Difficulty is semantic, so it keeps a small colored dot.
export const LEVEL_DOTS = {
  easy: "bg-emerald-500",
  medium: "bg-amber-500",
  hard: "bg-rose-500",
};

export function scoreTone(score) {
  if (score == null) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-foreground";
  return "text-rose-600 dark:text-rose-400";
}

export function scoreVerdict(score) {
  if (score >= 90) return { title: "Outstanding", message: "Interview-ready on this topic. Try a harder level next." };
  if (score >= 70) return { title: "Strong performance", message: "Solid fundamentals. Polish the weak spots below." };
  if (score >= 50) return { title: "Getting there", message: "You're on the right track — focus on the flagged topics." };
  return { title: "Keep practicing", message: "Review the explanations below, then retry at the same level." };
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function formatDate(date, opts = { month: "short", day: "numeric", year: "numeric" }) {
  return date ? new Date(date).toLocaleDateString(undefined, opts) : "";
}

export function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(date);
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatDuration(seconds) {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
