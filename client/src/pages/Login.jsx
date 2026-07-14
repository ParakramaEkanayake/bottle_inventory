import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate("/", { replace: true });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      const dest = location.state?.from || "/";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not log in. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 font-display text-xl font-bold text-white">
            K
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Kandy Bottle Distribution</h1>
          <p className="mt-1 text-sm text-teal-500">Inventory &amp; route management</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-shopred/10 px-3 py-2 text-sm font-medium text-shopred">{error}</div>
          )}
          <div className="mb-4">
            <label className="label">Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@bottlesupplier.lk"
              required
            />
          </div>
          <div className="mb-6">
            <label className="label">Password</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-teal-500">
          First time setup? Run <code>npm run seed</code> in the server to create the owner login.
        </p>
      </div>
    </div>
  );
};

export default Login;
