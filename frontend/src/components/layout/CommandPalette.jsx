import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowRight,
  Brain,
  Code2,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Mic,
  Monitor,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Trophy,
} from "@/components/icons";
import { LevelBadge } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { isMac } from "@/lib/config";

const PaletteContext = createContext({ open: () => {} });
// eslint-disable-next-line react-refresh/only-export-components
export const usePalette = () => useContext(PaletteContext);


// Case-insensitive match where every typed word must appear somewhere in the item.
function matches(item, query) {
  const hay = `${item.label} ${item.keywords ?? ""} ${item.group}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

function Palette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { setPreference } = useTheme();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  const { data: problems = [] } = useQuery({
    queryKey: ["problems"],
    queryFn: () => api.get("/coding/problems").then((r) => r.data.problems),
    enabled: open,
    staleTime: 60_000,
  });

  const go = useCallback((to) => () => navigate(to), [navigate]);

  const items = useMemo(
    () => [
      { group: "Go to", label: "Dashboard", icon: LayoutDashboard, run: go("/dashboard"), keywords: "home overview" },
      { group: "Go to", label: "Practice", icon: Sparkles, run: go("/practice"), keywords: "start new session" },
      { group: "Go to", label: "History", icon: History, run: go("/history"), keywords: "past sessions reports" },
      { group: "Go to", label: "Leaderboard", icon: Trophy, run: go("/leaderboard"), keywords: "rank xp" },
      { group: "Go to", label: "Resume", icon: FileText, run: go("/resume"), keywords: "cv upload personalize" },
      { group: "Go to", label: "Settings", icon: Settings, run: go("/settings"), keywords: "profile password badges account" },
      { group: "Practice", label: "Start an MCQ quiz", icon: Brain, run: go("/setup"), keywords: "multiple choice questions test" },
      { group: "Practice", label: "Start a voice interview", icon: Mic, run: go("/voice"), keywords: "speak talk mock" },
      { group: "Practice", label: "Browse coding problems", icon: Code2, run: go("/coding"), keywords: "dsa leetcode algorithms" },
      ...problems.map((p) => ({
        group: "Coding problems",
        label: p.title,
        icon: Code2,
        run: go(`/coding/${p.slug}`),
        keywords: `${p.difficulty} ${p.tags.join(" ")}`,
        meta: <LevelBadge level={p.difficulty} />,
        solved: p.solved,
      })),
      { group: "Theme", label: "Light theme", icon: Sun, run: () => setPreference("light"), keywords: "appearance mode" },
      { group: "Theme", label: "Dark theme", icon: Moon, run: () => setPreference("dark"), keywords: "appearance mode night" },
      { group: "Theme", label: "System theme", icon: Monitor, run: () => setPreference("system"), keywords: "appearance mode auto" },
      {
        group: "Account",
        label: "Sign out",
        icon: LogOut,
        run: () => {
          logout();
          navigate("/");
        },
        keywords: "log out logout",
      },
    ],
    [go, problems, setPreference, logout, navigate]
  );

  // With no query, hide the long problem list to keep things scannable.
  const visible = query.trim() ? items.filter((i) => matches(i, query)) : items.filter((i) => i.group !== "Coding problems");

  useEffect(() => setActive(0), [query, open]);
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (item) => {
    onOpenChange(false);
    item.run();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(visible.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && visible[active]) {
      e.preventDefault();
      choose(visible[active]);
    }
  };

  let lastGroup = null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0 data-[state=open]:slide-in-from-top-2 [&>button]:hidden">
        <DialogTitle className="sr-only">Search Prepify</DialogTitle>
        <DialogDescription className="sr-only">Jump to a page, start practice, open a coding problem or change the theme.</DialogDescription>
        <div className="flex items-center gap-2 border-b px-4">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, practice modes, problems…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={visible[active] ? `palette-item-${active}` : undefined}
          />
          <kbd className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">Esc</kbd>
        </div>

        <ul ref={listRef} id="palette-list" role="listbox" className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {visible.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted-foreground">No results for “{query}”.</li>}
          {visible.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <li key={`${item.group}-${item.label}`} role="presentation">
                {header && <p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground first:pt-1">{header}</p>}
                <div
                  id={`palette-item-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => choose(item)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm",
                    i === active ? "bg-accent text-foreground" : "text-foreground/90"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.solved && <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Solved</span>}
                  {item.meta}
                  {i === active && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground">
          <span>
            <kbd className="rounded border px-1">↑</kbd> <kbd className="rounded border px-1">↓</kbd> move
          </span>
          <span>
            <kbd className="rounded border px-1">Enter</kbd> open
          </span>
          <span className="ml-auto">
            <kbd className="rounded border px-1">{isMac ? "⌘" : "Ctrl"}</kbd> <kbd className="rounded border px-1">K</kbd> anywhere
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Provides the palette plus the global Ctrl/Cmd+K shortcut.
export function CommandPaletteProvider({ children }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ open: () => setOpen(true) }), []);
  return (
    <PaletteContext.Provider value={value}>
      {children}
      <Palette open={open} onOpenChange={setOpen} />
    </PaletteContext.Provider>
  );
}
