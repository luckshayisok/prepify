import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Brain, Code2, FileText, Flame, History, LayoutDashboard, Menu, Mic, Trophy, X } from "@/components/icons";
import { Logo, ProgressBar } from "@/components/common";
import { Tooltip } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import UserMenu from "./UserMenu";

const NAV = [
  { items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    title: "Practice",
    items: [
      { to: "/setup", label: "MCQ quiz", icon: Brain },
      { to: "/voice", label: "Voice interview", icon: Mic },
      { to: "/coding", label: "Coding", icon: Code2 },
    ],
  },
  {
    title: "You",
    items: [
      { to: "/resume", label: "Resume", icon: FileText },
      { to: "/history", label: "History", icon: History },
      { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
];

function SidebarContent() {
  const { user } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Logo to="/dashboard" />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2" aria-label="Main">
        {NAV.map((group, i) => (
          <div key={i}>
            {group.title && <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">{group.title}</p>}
            <ul className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                        isActive
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
        <div className="rounded-lg border bg-background p-3 shadow-xs">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium">Level {user.level}</span>
            <Tooltip content={`${user.streak.current}-day streak`}>
              <span
                className={cn(
                  "tabular flex items-center gap-1 font-medium",
                  user.streak.current > 0 ? "text-orange-500" : "text-muted-foreground"
                )}
              >
                <Flame className="h-3.5 w-3.5" /> {user.streak.current}
              </span>
            </Tooltip>
          </div>
          <ProgressBar value={user.progress.pct} />
          <p className="tabular mt-1.5 text-[11px] text-muted-foreground">
            {user.progress.current} / {user.progress.needed} XP to level {user.level + 1}
          </p>
        </div>
        <UserMenu />
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-screen lg:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} className="-ml-2 rounded-lg p-2 hover:bg-accent" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </button>
        <Logo to="/dashboard" />
        <UserMenu compact side="bottom" align="end" />
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
    </div>
  );
}
