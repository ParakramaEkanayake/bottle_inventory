import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

const RouteDetail = () => {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [error, setError] = useState("");

  const load = () => {
    api
      .get(`/distributions/route/${routeId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load route"));

    api
      .get(`/stock-requirements/route/${routeId}`)
      .then((res) => setRequirements(res.data))
      .catch(() => setRequirements([]));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  if (error) return <p className="text-shopred">{error}</p>;
  if (!data) return <p className="text-teal-500">Loading route...</p>;

  const completedCount = data.shops.filter((s) => s.status === "completed").length;

  return (
    <div>
      <Link to="/my-routes" className="text-sm font-semibold text-teal-500 hover:underline">&larr; All routes</Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">{data.route.name}</h1>
        <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-600">
          {completedCount} / {data.shops.length} completed
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">Route for {data.date}. Green shops are done — red shops still need a visit.</p>

      <div className="mt-6 card p-4">
        <h2 className="font-display font-bold text-ink">Planned stock requirements</h2>
        <p className="text-xs text-slate-500">Requirements entered for this route.</p>
        {requirements.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No planned requirements yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-slate-500 divide-x divide-slate-200">
                  <th className="px-5 py-2">Shop</th>
                  <th className="px-5 py-2">Bottle</th>
                  <th className="px-5 py-2">Still needed</th>
                  <th className="px-5 py-2">Planned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requirements.map((item) => (
                  <tr key={item._id} className="divide-x divide-slate-100">
                    <td className="px-5 py-2 font-medium text-ink">{item.shop?.name}</td>
                    <td className="px-5 py-2">{item.bottleType}</td>
                    <td className="px-5 py-2">{item.remainingQuantity} of {item.requiredQuantity}</td>
                    <td className="px-5 py-2">{item.plannedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.shops.map(({ shop, status, visit }) => {
          const isDone = status === "completed";
          return (
            <button
              key={shop._id}
              onClick={() => navigate(`/my-routes/${routeId}/shop/${shop._id}`)}
              className={`flex items-center justify-between rounded-xl border p-4 text-left shadow-sm transition hover:shadow-md ${
                isDone ? "border-shopgreen/30 bg-shopgreen/5" : "border-shopred/30 bg-shopred/5"
              }`}
            >
              <div>
                <p className="font-display font-bold text-ink">{shop.name}</p>
                <p className="text-xs text-slate-500">{shop.address || "Kandy"}</p>
                {isDone && visit && (
                  <p className="mt-1 text-xs text-slate-500">
                    Delivered {visit.distributed["190ml"]}×190ml, {visit.distributed["250ml"]}×250ml
                  </p>
                )}
              </div>
              <span
                className={`h-3 w-3 shrink-0 rounded-full ${isDone ? "bg-shopgreen" : "bg-shopred"}`}
                title={isDone ? "Completed" : "Pending"}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RouteDetail;
