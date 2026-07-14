import React, { useEffect, useState } from "react";
import api from "../api/axios";

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "salesman", phone: "" });
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
      setForm({ name: "", email: "", password: "", role: "salesman", phone: "" });
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
              <input
                type="password"
                className="input-field"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Role</label>
                <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="second_owner">Second Owner</option>
                  <option value="salesman">Salesman</option>
                </select>
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
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
