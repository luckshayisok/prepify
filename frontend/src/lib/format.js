import { Brain, Code2, Mic } from "lucide-react";

export const MODES = {
  mcq: { label: "MCQ", icon: Brain, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  voice: { label: "Voice", icon: Mic, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10" },
  coding: { label: "Coding", icon: Code2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
};

export const LEVEL_STYLES = {
  easy: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  medium: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  hard: "text-red-600 dark:text-red-400 bg-red-500/10",
};

export function scoreTone(score) {
  if (score == null) return "text-muted-foreground";
  if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 65) return "text-blue-600 dark:text-blue-400";
  if (score >= 45) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function scoreVerdict(score) {
  if (score >= 90) return { title: "Outstanding!", message: "Interview-ready on this topic. Try a harder level next." };
  if (score >= 70) return { title: "Strong performance", message: "Solid fundamentals. Polish the weak spots below to reach excellence." };
  if (score >= 50) return { title: "Getting there", message: "You're on the right track — focus on the topics flagged below." };
  return { title: "Keep practicing", message: "Review the explanations below, then retry at the same level." };
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
