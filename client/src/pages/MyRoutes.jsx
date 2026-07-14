import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const MyRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [selected, setSelected] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/routes").then((res) => setRoutes(res.data));
  }, []);

  const goToRoute = (id) => {
    if (id) navigate(`/my-routes/${id}`);
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-bold text-ink">My Routes</h1>
      <p className="mt-1 text-sm text-slate-500">Pick today's delivery route to see its shops.</p>

      <div className="mt-6 card p-5">
        <label className="label">Select a route</label>
        <div className="flex gap-3">
          <select
            className="input-field"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Choose a route...</option>
            {routes.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
          <button className="btn-primary shrink-0" onClick={() => goToRoute(selected)}>
            Go
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3">
        {routes.map((r) => (
          <button
            key={r._id}
            onClick={() => goToRoute(r._id)}
            className="card flex items-center justify-between p-4 text-left transition hover:border-teal-400"
          >
            <div>
              <p className="font-display font-bold text-ink">{r.name}</p>
              {r.description && <p className="text-xs text-slate-500">{r.description}</p>}
            </div>
            <span className="text-teal-500">&rarr;</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MyRoutes;
