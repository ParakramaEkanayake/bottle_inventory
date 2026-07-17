import React, { useEffect, useState } from "react";
import api from "../api/axios";

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "salesman",
    phone: "",
    visitAccess: { distributed: false, empty: false, missing: false },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = () => api.get("/users").then((res) => setUsers(res.data));

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/auth/register", form);
      setMessage(`Account created for ${form.name}`);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "salesman",
        phone: "",
        visitAccess: { distributed: false, empty: false, missing: false },
      });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create account");
    }
  };

  const toggleActive = async (u) => {
    await api.patch(`/users/${u._id}/status`, { active: !u.active });
    loadUsers();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Employees</h1>
      <p className="mt-1 text-sm text-slate-500">Manage second owner and salesman accounts.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Add employee</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="label">Full name</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field pr-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Role</label>
                <select
                  className="input-field"
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      role: e.target.value,
                      visitAccess:
                        e.target.value === "salesman"
                          ? prev.visitAccess
                          : { distributed: true, empty: true, missing: true },
                    }))
                  }
                >
                  <option value="second_owner">Second Owner</option>
                  <option value="salesman">Salesman</option>
                </select>
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            {form.role === "salesman" && (
              <div className="rounded-lg border border-teal-100 bg-teal-50 p-3">
                <p className="text-sm font-semibold text-ink">Allow this salesman to record</p>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  {[
                    { key: "distributed", label: "1. Distributed bottle amount" },
                    { key: "empty", label: "2. Empty bottle amount" },
                    { key: "missing", label: "3. Missing bottle amount" },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(form.visitAccess?.[item.key])}
                        onChange={() =>
                          setForm((prev) => ({
                            ...prev,
                            visitAccess: {
                              ...prev.visitAccess,
                              [item.key]: !prev.visitAccess?.[item.key],
                            },
                          }))
                        }
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {error && <p className="text-sm font-medium text-shopred">{error}</p>}
            {message && <p className="text-sm font-medium text-shopgreen">{message}</p>}
            <button className="btn-primary">Create account</button>
          </form>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">All employees</h2>
          <ul className="mt-4 divide-y divide-teal-100">
            {users.map((u) => (
              <li key={u._id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email} &middot; {u.role.replace("_", " ")}</p>
                </div>
                {u.role !== "owner" && (
                  <button
                    onClick={() => toggleActive(u)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      u.active ? "bg-shopgreen/10 text-shopgreen" : "bg-shopred/10 text-shopred"
                    }`}
                  >
                    {u.active ? "Active" : "Disabled"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;
