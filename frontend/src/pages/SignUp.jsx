import { useId, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/lib/api";
import { GradientButton } from "@/components/common";

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-3xl border bg-card/90 p-8 shadow-2xl backdrop-blur"
      >
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-xl font-bold text-white">
            P
          </span>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </motion.div>
    </div>
  );
}

export function Field({ icon: Icon, label, hint, ...props }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
        <input
          id={id}
          className="h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          {...props}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Sign up failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Track progress, earn XP and unlock voice & coding rounds."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" state={location.state} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field icon={User} label="Name" autoComplete="name" value={form.name} onChange={set("name")} minLength={2} required />
        <Field icon={Mail} label="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} required />
        <Field
          icon={Lock}
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
          minLength={8}
          hint="At least 8 characters"
          required
        />
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <GradientButton type="submit" disabled={busy} className="w-full">
          {busy && <Loader2 className="animate-spin" />} Create account
        </GradientButton>
      </form>
    </AuthLayout>
  );
}
