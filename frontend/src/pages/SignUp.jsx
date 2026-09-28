import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field } from "@/components/common";
import AuthCard from "@/components/AuthCard";
import GoogleButton, { OrDivider } from "@/components/GoogleButton";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/lib/api";

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
    <AuthCard
      title="Create your account"
      subtitle="Start practicing interviews in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" state={location.state} className="font-medium text-foreground underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <GoogleButton text="signup_with" onError={setError} />
      <OrDivider />
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Name" htmlFor="name">
          <Input id="name" autoComplete="name" value={form.name} onChange={set("name")} minLength={2} maxLength={60} required />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} minLength={8} required />
        </Field>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy && <Loader2 className="animate-spin" />} Create account
        </Button>
      </form>
    </AuthCard>
  );
}
