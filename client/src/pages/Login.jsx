import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="input-field pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-600 hover:text-teal-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.1 0-8.5-4.5-8.5-7a3.5 3.5 0 011.4-2.4M6.6 6.6A10.05 10.05 0 0112 5c5.1 0 8.5 4.5 8.5 7 0 1.1-.4 2.1-1.1 3.1M15 12a3 3 0 11-6 0 3 3 0 016 0zm-6.2 6.2L18.2 5.8" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 12s3.5-7 9.75-7 9.75 7 9.75 7-3.5 7-9.75 7S2.25 12 2.25 12z" />
                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
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
