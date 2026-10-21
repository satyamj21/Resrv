import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const notice = location.state?.message;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(form);
      const user = data.user;
      // Redirect admins to admin dashboard, users to intended destination
      if (user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(location.state?.from || "/", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell flex min-h-[calc(100vh-140px)] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="text-center sm:text-left">
          <p className="eyebrow">Resrv account</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] text-ink sm:text-5xl">
            Welcome back<span className="text-sage">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            Sign in to access your held seats, bookings, and event management.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-8 rounded-xl border border-line bg-white p-7 shadow-soft sm:p-9"
        >
          {notice && (
            <div className="mb-5 rounded-md border border-sage-border bg-sage-light p-3.5 text-sm font-medium text-sage-dark">
              {notice}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Email Address
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field mt-1.5 font-normal"
                autoComplete="email"
              />
            </label>

            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Password
              <input
                required
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field mt-1.5 font-normal"
                autoComplete="current-password"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button-primary mt-6 w-full !py-3 text-sm font-semibold"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <p className="mt-6 text-center text-sm text-muted">
            New to Resrv?{" "}
            <Link
              className="font-semibold text-ink hover:text-sage transition underline"
              to="/register"
            >
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
