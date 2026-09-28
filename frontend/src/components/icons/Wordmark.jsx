import { cn } from "@/lib/utils";

// The Prepify wordmark: hand-drawn lowercase monoline letters, with the "i" dotted by a
// check mark in the accent colour. Letters use currentColor so it follows the theme.
export default function Wordmark({ className, title = "Prepify" }) {
  return (
    <svg
      viewBox="0 0 99 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
      className={cn("h-6 w-auto shrink-0", className)}
    >
      {/* p */}
      <path d="M2 29V10" />
      <circle cx="8" cy="16" r="6" />
      {/* r */}
      <path d="M19.5 22V16a6 6 0 0 1 6-6" />
      {/* e */}
      <path d="M31 16H43A6 6 0 1 0 41.24 20.24" />
      {/* p */}
      <path d="M48.5 29V10" />
      <circle cx="54.5" cy="16" r="6" />
      {/* i, dotted with a check */}
      <path d="M66 22V11" />
      <path d="M62.8 5.2l2.2 2.2 4.2-4.8" className="stroke-primary" />
      {/* f */}
      <path d="M74.5 22V8a5 5 0 0 1 5-5M71 10.5H79" />
      {/* y */}
      <path d="M84 10v6a5.5 5.5 0 0 0 11 0v-6M95 16v7a6 6 0 0 1-6 6h-2" />
    </svg>
  );
}
