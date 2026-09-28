import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Flame, History, LogOut, Menu, Moon, Sun, Trophy, User, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/setup", label: "MCQ" },
  { to: "/voice", label: "Voice" },
  { to: "/coding", label: "Coding" },
  { to: "/resume", label: "Resume" },
  { to: "/leaderboard", label: "Leaderboard" },
];

const initials = (name = "") =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const item = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent";
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition hover:bg-accent"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
          {initials(user.name)}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-popover p-2 shadow-lg" onClick={() => setOpen(false)}>
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link to="/profile" className={item}>
            <User className="h-4 w-4" /> Profile & badges
          </Link>
          <Link to="/history" className={item}>
            <History className="h-4 w-4" /> History
          </Link>
          <Link to="/leaderboard" className={item}>
            <Trophy className="h-4 w-4" /> Leaderboard
          </Link>
          <div className="my-1 h-px bg-border" />
          <button onClick={onLogout} className={cn(item, "text-red-600 dark:text-red-400")}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition",
      isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
    );

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to={user ? "/dashboard" : "/"} className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 font-bold text-white transition group-hover:scale-110">
            P
          </span>
          <span className="text-xl font-bold">Prepify</span>
        </Link>

        {user && (
          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {user && (
            <>
              <span
                title={`${user.streak.current}-day streak`}
                className={cn(
                  "hidden items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold sm:flex",
                  user.streak.current > 0 ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" : "bg-muted text-muted-foreground"
                )}
              >
                <Flame className="h-4 w-4" /> {user.streak.current}
              </span>
              <Link
                to="/profile"
                title={`${user.progress.current}/${user.progress.needed} XP to level ${user.level + 1}`}
                className="hidden items-center gap-2 rounded-full bg-blue-500/10 px-2.5 py-1 text-sm font-semibold text-blue-700 dark:text-blue-300 sm:flex"
              >
                Lv {user.level}
                <span className="h-1.5 w-12 overflow-hidden rounded-full bg-blue-500/20">
                  <span className="block h-full bg-gradient-to-r from-blue-600 to-purple-600" style={{ width: `${user.progress.pct}%` }} />
                </span>
              </Link>
            </>
          )}

          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          {user ? (
            <>
              <UserMenu user={user} onLogout={handleLogout} />
              <button
                className="rounded-lg p-2 hover:bg-accent lg:hidden"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Open menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {user && mobileOpen && (
        <div className="grid gap-1 border-t px-4 py-3 lg:hidden">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
