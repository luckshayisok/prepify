import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Slim header for full-width focus screens (quiz, coding editor).
export default function FocusHeader({ backTo, backLabel = "Back", title, children }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <Link
        to={backTo}
        className="-ml-1.5 flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">{backLabel}</span>
      </Link>
      <span className="h-5 w-px bg-border" />
      <div className="min-w-0 flex-1 truncate text-sm font-medium">{title}</div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </header>
  );
}
