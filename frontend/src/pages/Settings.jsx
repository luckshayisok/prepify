import { useState } from "react";
import { Check, Loader2, Lock, Monitor, Moon, Sun } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Avatar, Field, Page, PageHeader, ProgressBar, Section, SegmentedControl } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useBadgeList } from "@/hooks/useBadgeCatalog";
import { api, errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import BadgeArt from "@/components/icons/BadgeArt";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function ProfileForm() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, targetRole: user.targetRole ?? "" });
  const [state, setState] = useState({ busy: false, saved: false, error: "" });
  const dirty = form.name !== user.name || form.targetRole !== (user.targetRole ?? "");

  const save = async (e) => {
    e.preventDefault();
    setState({ busy: true, saved: false, error: "" });
    try {
      const { data } = await api.patch("/auth/me", { name: form.name.trim(), targetRole: form.targetRole.trim() });
      setUser(data.user);
      setState({ busy: false, saved: true, error: "" });
    } catch (err) {
      setState({ busy: false, saved: false, error: errorMessage(err) });
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar user={user} size={48} />
        <div className="min-w-0">
          <p className="truncate font-medium">{user.email}</p>
          <p className="text-xs text-muted-foreground">Member since {formatDate(user.createdAt)}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name">
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} minLength={2} maxLength={60} required />
        </Field>
        <Field label="Target role" htmlFor="role" hint="Pre-fills the voice interview setup.">
          <Input id="role" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} placeholder="e.g. Backend Engineer" maxLength={80} />
        </Field>
      </div>
      {state.error && <Alert>{state.error}</Alert>}
      <div className="flex justify-end">
        <Button type="submit" disabled={!dirty || state.busy}>
          {state.busy ? <Loader2 className="animate-spin" /> : state.saved && !dirty ? <Check /> : null}
          {state.saved && !dirty ? "Saved" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [state, setState] = useState({ busy: false, done: false, error: "" });

  const save = async (e) => {
    e.preventDefault();
    setState({ busy: true, done: false, error: "" });
    try {
      const { data } = await api.put("/auth/me/password", {
        ...(user.hasPassword ? { currentPassword: form.currentPassword } : {}),
        newPassword: form.newPassword,
      });
      setUser(data.user);
      setForm({ currentPassword: "", newPassword: "" });
      setState({ busy: false, done: true, error: "" });
    } catch (err) {
      setState({ busy: false, done: false, error: errorMessage(err) });
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      {!user.hasPassword && (
        <p className="text-sm text-muted-foreground">You sign in with Google. Add a password to also sign in with your email.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {user.hasPassword && (
          <Field label="Current password" htmlFor="current">
            <Input
              id="current"
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
            />
          </Field>
        )}
        <Field label={user.hasPassword ? "New password" : "Password"} htmlFor="new" hint="At least 8 characters.">
          <Input
            id="new"
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            minLength={8}
            required
          />
        </Field>
      </div>
      {state.error && <Alert>{state.error}</Alert>}
      {state.done && <Alert tone="info">Password {user.hasPassword ? "updated" : "set"}.</Alert>}
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={state.busy || form.newPassword.length < 8}>
          {state.busy && <Loader2 className="animate-spin" />}
          {user.hasPassword ? "Update password" : "Set password"}
        </Button>
      </div>
    </form>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { preference, setPreference } = useTheme();
  const { data: badges = [] } = useBadgeList();
  const earned = new Map(user.badges.map((b) => [b.id, b.earnedAt]));

  return (
    <Page className="max-w-3xl">
      <PageHeader title="Settings" description="Your profile, sign-in methods, appearance and achievements." />

      <div className="space-y-6">
        <Section title="Profile">
          <ProfileForm />
        </Section>

        <Section title="Sign-in methods" padded={false}>
          <ul className="divide-y">
            <li className="flex items-center gap-3 px-5 py-4">
              <GoogleMark />
              <div className="flex-1">
                <p className="text-sm font-medium">Google</p>
                <p className="text-xs text-muted-foreground">
                  {user.googleLinked ? "Connected — you can sign in with Google." : "Use “Continue with Google” on the login page with this email to connect."}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs font-medium",
                  user.googleLinked ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                )}
              >
                {user.googleLinked ? "Connected" : "Not connected"}
              </span>
            </li>
            <li className="px-5 py-4">
              <div className="mb-4 flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground">{user.hasPassword ? "Sign in with your email and password." : "Not set."}</p>
                </div>
              </div>
              <PasswordForm />
            </li>
          </ul>
        </Section>

        <Section title="Appearance">
          <Field label="Theme">
            <SegmentedControl
              aria-label="Theme"
              value={preference}
              onChange={setPreference}
              className="w-full sm:w-96"
              options={[
                { value: "light", label: <span className="flex items-center justify-center gap-1.5"><Sun className="h-3.5 w-3.5" /> Light</span> },
                { value: "dark", label: <span className="flex items-center justify-center gap-1.5"><Moon className="h-3.5 w-3.5" /> Dark</span> },
                { value: "system", label: <span className="flex items-center justify-center gap-1.5"><Monitor className="h-3.5 w-3.5" /> System</span> },
              ]}
            />
          </Field>
        </Section>

        <Section
          title="Achievements"
          description={`${user.badges.length} of ${badges.length || "—"} badges`}
          action={
            <span className="tabular text-xs text-muted-foreground">
              Level {user.level} · {user.xp} XP
            </span>
          }
        >
          <div className="mb-6">
            <div className="tabular mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>Level {user.level}</span>
              <span>
                {user.progress.current} / {user.progress.needed} XP to level {user.level + 1}
              </span>
            </div>
            <ProgressBar value={user.progress.pct} />
          </div>
          <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 md:grid-cols-3">
            {badges.map((b) => {
              const at = earned.get(b.id);
              return (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <BadgeArt id={b.id} earned={Boolean(at)} size={40} />
                  <div className="min-w-0">
                    <p className={cn("text-sm font-medium", !at && "text-muted-foreground")}>{b.name}</p>
                    <p className="text-xs text-muted-foreground">{at ? `Earned ${formatDate(at, { month: "short", day: "numeric" })}` : b.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </Page>
  );
}
