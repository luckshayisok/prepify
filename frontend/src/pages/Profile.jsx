import { useState } from "react";
import { Check, Flame, Loader2, Lock, Star, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Page, PageHeader, StatCard } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { useBadgeList } from "@/hooks/useBadgeCatalog";
import { api, errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function Profile() {
  const { user, setUser } = useAuth();
  const { data: badges = [] } = useBadgeList();
  const [form, setForm] = useState({ name: user.name, targetRole: user.targetRole ?? "" });
  const [state, setState] = useState({ busy: false, saved: false, error: "" });

  const earned = new Map(user.badges.map((b) => [b.id, b.earnedAt]));
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
    <Page className="max-w-4xl">
      <PageHeader title={user.name} description={`Member since ${formatDate(user.createdAt)}`} />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Star} label="Level" value={user.level} hint={`${user.progress.current}/${user.progress.needed} XP to next`} />
        <StatCard icon={Trophy} label="Total XP" value={user.xp} tone="text-purple-600 dark:text-purple-400" />
        <StatCard icon={Flame} label="Current streak" value={`${user.streak.current}d`} hint={`Best: ${user.streak.longest}d`} tone="text-orange-500" />
        <StatCard icon={Check} label="Badges" value={`${user.badges.length}/${badges.length || "—"}`} tone="text-amber-500" />
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Badges</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {badges.map((b) => {
            const at = earned.get(b.id);
            return (
              <div
                key={b.id}
                className={cn(
                  "relative rounded-2xl border p-4 text-center transition",
                  at ? "bg-gradient-to-b from-amber-50 to-card shadow-sm dark:from-amber-950/20" : "bg-card opacity-60 grayscale"
                )}
              >
                {!at && <Lock className="absolute right-3 top-3 h-3 w-3 text-muted-foreground" />}
                <div className="text-4xl">{b.icon}</div>
                <p className="mt-2 font-semibold">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.description}</p>
                {at && <p className="mt-2 text-xs text-amber-600">Earned {formatDate(at)}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-lg rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Settings</h2>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} minLength={2} maxLength={60} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Target role</Label>
            <Input
              id="role"
              value={form.targetRole}
              onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
              placeholder="e.g. Backend Engineer"
              maxLength={80}
            />
            <p className="text-xs text-muted-foreground">Pre-fills the voice interview setup.</p>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </div>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" disabled={!dirty || state.busy}>
            {state.busy ? <Loader2 className="animate-spin" /> : state.saved && !dirty ? <Check /> : null}
            {state.saved && !dirty ? "Saved" : "Save changes"}
          </Button>
        </form>
      </section>
    </Page>
  );
}
