import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Mail, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/lib/api";
import { AuthLayout, Field } from "./SignUp";
import { GradientButton } from "@/components/common";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Login failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to keep your streak alive."
      footer={
        <>
          New to Prepify?{" "}
          <Link to="/signup" state={location.state} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          icon={Mail}
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Field
          icon={Lock}
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <GradientButton type="submit" disabled={busy} className="w-full">
          {busy && <Loader2 className="animate-spin" />} Log in
        </GradientButton>
      </form>
    </AuthLayout>
  );
}
