import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const StatCard = ({ label, value, sub, accent }) => (
  <div className="card p-5">
    <p className="text-xs font-semibold uppercase tracking-wide text-teal-500">{label}</p>
    <p className={`mt-2 font-display text-2xl font-bold ${accent || "text-ink"}`}>{value}</p>
    {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load dashboard data"));
  }, []);

  if (user?.role === "salesman") {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Welcome, {user.name}</h1>
        <p className="mt-2 text-sm text-slate-500">Head to your routes to start today's distribution.</p>
        <Link to="/my-routes" className="btn-primary mt-6 inline-flex">Go to My Routes</Link>
      </div>
    );
  }

  if (error) return <p className="text-shopred">{error}</p>;
  if (!data) return <p className="text-teal-500">Loading dashboard...</p>;

  const stock190 = data.stock.find((s) => s.bottleType === "190ml");
  const stock250 = data.stock.find((s) => s.bottleType === "250ml");

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Company-wide snapshot as of today.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="190ml in stock" value={stock190?.quantity ?? 0} sub="bottles in warehouse" />
        <StatCard label="250ml in stock" value={stock250?.quantity ?? 0} sub="bottles in warehouse" />
        <StatCard label="Total expense" value={`LKR ${data.totalExpense.toLocaleString()}`} sub="paid to bottle agent" />
        <StatCard label="Total revenue" value={`LKR ${data.totalRevenue.toLocaleString()}`} sub="billed to shops" />
        <StatCard
          label="Profit"
          value={`LKR ${data.profit.toLocaleString()}`}
          accent={data.profit >= 0 ? "text-shopgreen" : "text-shopred"}
        />
        <StatCard label="Shops visited today" value={data.todaysVisits} />
        <StatCard label="Active shops" value={data.totalShops} />
        <StatCard label="Active routes" value={data.totalRoutes} />
      </div>

      <div className="mt-6 card p-5">
        <h2 className="font-display text-lg font-bold text-ink">Bottles currently out with shops</h2>
        <p className="text-xs text-slate-500">Full + not-yet-returned-empty bottles across all shops.</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-teal-50 p-4">
            <p className="text-xs font-semibold uppercase text-teal-500">190ml outstanding</p>
            <p className="font-display text-xl font-bold text-ink">{data.outstandingBottles["190ml"]}</p>
          </div>
          <div className="rounded-lg bg-teal-50 p-4">
            <p className="text-xs font-semibold uppercase text-teal-500">250ml outstanding</p>
            <p className="font-display text-xl font-bold text-ink">{data.outstandingBottles["250ml"]}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
