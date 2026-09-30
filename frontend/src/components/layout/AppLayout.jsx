import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Brain,
  Code2,
  FileText,
  Flame,
  History,
  LayoutDashboard,
  Menu,
  Mic,
  Settings,
  Sparkles,
  Trophy,
  X,
} from "@/components/icons";
import { Logo, ProgressBar } from "@/components/common";
import { Tooltip } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import UserMenu from "./UserMenu";
import ThemeToggle from "./ThemeToggle";
import { usePalette } from "./CommandPalette";
import { isMac } from "@/lib/config";

const NAV = [
  {
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/practice", label: "Practice", icon: Sparkles, end: true },
    ],
  },
  {
    title: "Modes",
    items: [
      { to: "/setup", label: "MCQ quiz", icon: Brain },
      { to: "/voice", label: "Voice interview", icon: Mic },
      { to: "/coding", label: "Coding", icon: Code2 },
    ],
  },
  {
    title: "You",
    items: [
      { to: "/history", label: "History", icon: History },
      { to: "/resume", label: "Resume", icon: FileText },
      { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

// Pages that belong under a nav item, so it stays highlighted on them.
const SECTION_OF = [
  [/^\/interview\//, "/setup"],
  [/^\/sessions\//, "/history"],
];

function SearchButton({ className }) {
  const palette = usePalette();
  return (
    <button
      onClick={palette.open}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-sm text-muted-foreground shadow-xs transition hover:text-foreground",
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l4 4" />
      </svg>
      <span className="flex-1 text-left">Search</span>
      <kbd className="rounded border px-1 text-[10px]">{isMac ? "⌘K" : "Ctrl K"}</kbd>
    </button>
  );
}

function SidebarContent() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const inherited = SECTION_OF.find(([re]) => re.test(pathname))?.[1];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Logo to="/dashboard" />
      </div>

      <div className="space-y-2 px-3 pb-2">
        <Link
          to="/practice"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90"
        >
          <Sparkles className="h-4 w-4" /> Start practice
        </Link>
        <SearchButton />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3" aria-label="Main">
        {NAV.map((group, i) => (
          <div key={i}>
            {group.title && <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">{group.title}</p>}
            <ul className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                        isActive || inherited === to
                          ? "bg-background font-medium text-foreground shadow-xs ring-1 ring-border"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t p-3">
        <Link to="/settings" className="block rounded-lg border bg-background p-3 shadow-xs transition hover:border-foreground/20">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium">Level {user.level}</span>
            <Tooltip content={`${user.streak.current}-day streak`}>
              <span className={cn("tabular flex items-center gap-1 font-medium", user.streak.current > 0 ? "text-orange-500" : "text-muted-foreground")}>
                <Flame className="h-3.5 w-3.5" /> {user.streak.current}
              </span>
            </Tooltip>
          </div>
          <ProgressBar value={user.progress.pct} />
          <p className="tabular mt-1.5 text-[11px] text-muted-foreground">
            {user.progress.current} / {user.progress.needed} XP to level {user.level + 1}
          </p>
        </Link>
        <ThemeToggle />
        <UserMenu />
      </div>
    </div>
  );
}

// Phone navigation: the four most-used destinations plus "More" (the full drawer).
const TABS = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/practice", label: "Practice", icon: Sparkles, match: /^\/(practice|setup|voice|coding|interview)/ },
  { to: "/history", label: "History", icon: History, match: /^\/(history|sessions)/ },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
];

function BottomNav({ onMore }) {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {TABS.map(({ to, label, icon: Icon, match }) => {
        const active = match ? match.test(pathname) : pathname === to;
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? "page" : undefined}
            className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] transition", active ? "text-primary" : "text-muted-foreground")}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
            {label}
          </Link>
        );
      })}
      <button onClick={onMore} className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground">
        <Menu className="h-5 w-5" />
        More
      </button>
    </nav>
  );
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const palette = usePalette();
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-screen pb-20 lg:pb-0 lg:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur lg:hidden">
        <Logo to="/dashboard" />
        <div className="flex items-center gap-1">
          <button onClick={palette.open} className="rounded-lg p-2 text-muted-foreground hover:bg-accent" aria-label="Search">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4 4" />
            </svg>
          </button>
          <UserMenu compact side="bottom" align="end" />
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in-0" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r bg-sidebar shadow-2xl animate-in slide-in-from-left">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3.5 rounded-lg p-1.5 hover:bg-accent" aria-label="Close navigation">
              <X className="h-4 w-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <main>
        <Outlet />
      </main>

      <BottomNav onMore={() => setOpen(true)} />
    </div>
  );
}
