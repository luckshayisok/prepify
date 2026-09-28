import { Link, Outlet } from "react-router-dom";
import { Monitor, Moon, Sun } from "@/components/icons";
import { Logo } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const NEXT = { light: "dark", dark: "system", system: "light" };
const ICON = { light: Sun, dark: Moon, system: Monitor };

export function ThemeCycleButton() {
  const { preference, setPreference } = useTheme();
  const Icon = ICON[preference];
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setPreference(NEXT[preference])}
      aria-label={`Theme: ${preference}. Switch to ${NEXT[preference]}`}
      title={`Theme: ${preference}`}
    >
      <Icon />
    </Button>
  );
}

export default function PublicLayout() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-8">
          <Logo />
          <div className="flex items-center gap-1.5">
            <ThemeCycleButton />
            {user ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
