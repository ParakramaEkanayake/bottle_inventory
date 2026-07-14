import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const RoutesShops = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [routeName, setRouteName] = useState("");
  const [shopForm, setShopForm] = useState({ name: "", route: "", address: "", contactNumber: "", ownerName: "" });
  const [editShopId, setEditShopId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", route: "", address: "", contactNumber: "", ownerName: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRoutes = () => api.get("/routes").then((res) => setRoutes(res.data));
  const loadShops = (routeId) =>
    api.get("/shops", { params: routeId ? { route: routeId } : {} }).then((res) => setShops(res.data));

  useEffect(() => {
    loadRoutes();
    loadShops();
  }, []);

  useEffect(() => {
    loadShops(selectedRoute || undefined);
  }, [selectedRoute]);

  const startEditShop = (shop) => {
    setEditShopId(shop._id);
    setEditForm({
      name: shop.name || "",
      route: shop.route?._id || "",
      address: shop.address || "",
      contactNumber: shop.contactNumber || "",
      ownerName: shop.ownerName || "",
    });
  };

  const cancelEdit = () => {
    setEditShopId(null);
    setEditForm({ name: "", route: "", address: "", contactNumber: "", ownerName: "" });
    setError("");
    setMessage("");
  };

  const handleUpdateShop = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.patch(`/shops/${editShopId}`, editForm);
      setMessage("Shop updated");
      cancelEdit();
      loadShops(selectedRoute || undefined);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update shop");
    }
  };

  const handleDeleteShop = async (shopId) => {
    if (!window.confirm("Delete this shop? This cannot be undone.")) return;
    try {
      await api.delete(`/shops/${shopId}`);
      setMessage("Shop deleted");
      loadShops(selectedRoute || undefined);
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete shop");
    }
  };

  const handleAddRoute = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!routeName.trim()) return;
    try {
      await api.post("/routes", { name: routeName.trim() });
      setRouteName("");
      setMessage("Route added");
      loadRoutes();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add route");
    }
  };

  const handleAddShop = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!shopForm.name.trim() || !shopForm.route) {
      setError("Shop name and route are required");
      return;
    }
    try {
      await api.post("/shops", shopForm);
      setShopForm({ name: "", route: shopForm.route, address: "", contactNumber: "", ownerName: "" });
      setMessage("Shop added");
      loadShops(selectedRoute || undefined);
    } catch (err) {
      setError(err.response?.data?.message || "Could not add shop");
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Routes &amp; Shops</h1>
      <p className="mt-1 text-sm text-slate-500">Set up delivery routes around Kandy and the shops on each one.</p>

      {error && <p className="mt-4 text-sm font-medium text-shopred">{error}</p>}
      {message && <p className="mt-4 text-sm font-medium text-shopgreen">{message}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Add a route</h2>
          <form onSubmit={handleAddRoute} className="mt-4 flex gap-3">
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Katugastota Route"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
            />
            <button className="btn-primary shrink-0">Add route</button>
          </form>
          <ul className="mt-5 divide-y divide-teal-100">
            {routes.map((r) => (
              <li key={r._id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-ink">{r.name}</span>
                <button className="text-xs font-semibold text-teal-500 hover:underline" onClick={() => setSelectedRoute(r._id)}>
                  View shops
                </button>
              </li>
            ))}
            {routes.length === 0 && <p className="py-2 text-sm text-slate-400">No routes yet.</p>}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Add a shop</h2>
          <form onSubmit={handleAddShop} className="mt-4 space-y-3">
            <div>
              <label className="label">Route</label>
              <select
                className="input-field"
                value={shopForm.route}
                onChange={(e) => setShopForm({ ...shopForm, route: e.target.value })}
              >
                <option value="">Select a route</option>
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Shop name</label>
              <input
                className="input-field"
                value={shopForm.name}
                onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Owner name</label>
                <input
                  className="input-field"
                  value={shopForm.ownerName}
                  onChange={(e) => setShopForm({ ...shopForm, ownerName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Contact number</label>
                <input
                  className="input-field"
                  value={shopForm.contactNumber}
                  onChange={(e) => setShopForm({ ...shopForm, contactNumber: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Address</label>
              <input
                className="input-field"
                value={shopForm.address}
                onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
              />
            </div>
            <button className="btn-primary">Add shop</button>
          </form>
        </div>
      </div>

      <div className="mt-6 card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">Shops</h2>
          <select className="input-field !w-56" value={selectedRoute} onChange={(e) => setSelectedRoute(e.target.value)}>
            <option value="">All routes</option>
            {routes.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>

        {user?.role === "owner" && editShopId && (
          <form onSubmit={handleUpdateShop} className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">Edit shop</h3>
                <p className="text-sm text-slate-500">Save changes or cancel to return to the shop list.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-outline" onClick={cancelEdit}>Cancel</button>
                <button type="submit" className="btn-primary">Save changes</button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div>
                <label className="label">Shop name</label>
                <input
                  className="input-field"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Route</label>
                <select
                  className="input-field"
                  value={editForm.route}
                  onChange={(e) => setEditForm({ ...editForm, route: e.target.value })}
                >
                  <option value="">Select a route</option>
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Owner name</label>
                <input
                  className="input-field"
                  value={editForm.ownerName}
                  onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Contact number</label>
                <input
                  className="input-field"
                  value={editForm.contactNumber}
                  onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                />
              </div>
              <div className="lg:col-span-2">
                <label className="label">Address</label>
                <input
                  className="input-field"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
            </div>
          </form>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-teal-500 divide-x divide-slate-200">
                <th className="px-5 py-2">Shop</th>
                <th className="px-5 py-2">Route</th>
                <th className="px-5 py-2">Owner</th>
                <th className="px-5 py-2">Contact</th>
                <th className="px-5 py-2">190ml out</th>
                <th className="px-5 py-2">250ml out</th>
                {user?.role === "owner" && <th className="px-5 py-2">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                  {shops.map((s) => (
                <tr key={s._id} className="divide-x divide-slate-100">
                  <td className="px-5 py-2 font-medium text-ink">{s.name}</td>
                  <td className="px-5 py-2 text-slate-500">{s.route?.name}</td>
                  <td className="px-5 py-2 text-slate-500">{s.ownerName || "-"}</td>
                  <td className="px-5 py-2 text-slate-500">{s.contactNumber || "-"}</td>
                  <td className="px-5 py-2">{s.outstanding?.["190ml"] ?? 0}</td>
                  <td className="px-5 py-2">{s.outstanding?.["250ml"] ?? 0}</td>
                  {user?.role === "owner" && (
                    <td className="px-5 py-2 text-right">
                      <button
                        className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                        onClick={() => startEditShop(s)}
                        title="Edit shop"
                      >
                        ✎
                      </button>
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                        onClick={() => handleDeleteShop(s._id)}
                        title="Delete shop"
                      >
                        🗑
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {shops.length === 0 && (
                <tr className="divide-x divide-slate-100">
                  <td colSpan={user?.role === "owner" ? 7 : 6} className="px-5 py-4 text-center text-slate-400">No shops found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoutesShops;
