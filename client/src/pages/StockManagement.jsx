import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const StockManagement = () => {
  const { user } = useAuth();
  const [stock, setStock] = useState([]);
  const [bottleType, setBottleType] = useState("190ml");
  const [quantity, setQuantity] = useState("");
  const [noOfCases, setNoOfCases] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const loadStock = () => api.get("/stock").then((res) => setStock(res.data));

  const loadTransactions = () => api.get("/stock/transactions").then((res) => setTransactions(res.data));

  useEffect(() => {
    loadStock();
    // load recent purchase/expense transactions for owners
    loadTransactions();
  }, []);

  const handleQuantityChange = (value) => {
    setQuantity(value);
    if (value === "") {
      setNoOfCases("");
      return;
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setNoOfCases((parsed / 30).toString());
    } else {
      setNoOfCases("");
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!quantity || Number(quantity) <= 0) {
      setError("Enter a valid quantity");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/stock/add", {
        bottleType,
        quantity: Number(quantity),
        noOfCases: noOfCases === "" ? undefined : Number(noOfCases),
        note,
      });
      setMessage(
        `Added ${quantity} x ${bottleType}. Expense logged: LKR ${res.data.transaction.totalCost.toLocaleString()}`
      );
      setQuantity("");
      setNoOfCases("");
      setNote("");
      loadStock();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add stock");
    } finally {
      setSubmitting(false);
    }
  };

  const updatePrice = async (type, field, value) => {
    try {
      await api.patch(`/stock/${type}/price`, { [field]: Number(value) });
      loadStock();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update price");
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Stock Management</h1>
      <p className="mt-1 text-sm text-slate-500">Warehouse stock received from the bottle company agent.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {stock.map((s) => (
          <div key={s._id} className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">{s.bottleType}</h2>
              <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-600">
                {s.quantity} in stock
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="label">Cost price (from agent)</label>
                {user.role === "owner" ? (
                  <input
                    type="number"
                    defaultValue={s.costPrice}
                    className="input-field"
                    onBlur={(e) => updatePrice(s.bottleType, "costPrice", e.target.value)}
                  />
                ) : (
                  <p className="font-semibold text-ink">LKR {s.costPrice}</p>
                )}
              </div>
              <div>
                <label className="label">Sell price (to shops)</label>
                {user.role === "owner" ? (
                  <input
                    type="number"
                    defaultValue={s.sellPrice}
                    className="input-field"
                    onBlur={(e) => updatePrice(s.bottleType, "sellPrice", e.target.value)}
                  />
                ) : (
                  <p className="font-semibold text-ink">LKR {s.sellPrice}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 card p-5">
        <h2 className="font-display text-lg font-bold text-ink">Add stock from agent</h2>
        <p className="text-xs text-slate-500">
          The company expense is calculated and logged automatically — quantity × cost price.
        </p>
        <form onSubmit={handleAddStock} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="label">Bottle type</label>
            <select className="input-field" value={bottleType} onChange={(e) => setBottleType(e.target.value)}>
              <option value="190ml">190ml</option>
              <option value="250ml">250ml</option>
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input
              type="number"
              className="input-field"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="e.g. 500"
            />
          </div>
          <div>
            <label className="label">No of cases</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              value={noOfCases}
              onChange={(e) => setNoOfCases(e.target.value)}
              placeholder="e.g. 3"
            />
          </div>
          <div className="md:col-span-1">
            <label className="label">Note (optional)</label>
            <input
              type="text"
              className="input-field"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. delivery invoice #123"
            />
          </div>
          <div className="md:col-span-4">
            {error && <p className="mb-2 text-sm font-medium text-shopred">{error}</p>}
            {message && <p className="mb-2 text-sm font-medium text-shopgreen">{message}</p>}
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Adding..." : "Add stock"}
            </button>
          </div>
        </form>
      </div>

      {user.role === "owner" && (
        <div className="mt-6 card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Stock purchase history</h2>
          <p className="text-xs text-slate-500">Recent purchases received from the bottle company agent.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-slate-600 divide-x divide-slate-200">
                  <th className="px-5 py-2 bg-slate-50">Date</th>
                  <th className="px-5 py-2 bg-slate-50">Bottle</th>
                  <th className="px-5 py-2 bg-slate-50">Quantity</th>
                  <th className="px-5 py-2 bg-slate-50">No of cases</th>
                  <th className="px-5 py-2 bg-slate-50">Cost / unit</th>
                  <th className="px-5 py-2 bg-slate-50">Total cost</th>
                  <th className="px-5 py-2 bg-slate-50">Added by</th>
                  <th className="px-5 py-2 bg-slate-50">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-4 text-slate-500">No purchase history found.</td>
                  </tr>
                )}
                {transactions.map((t) => (
                  <tr key={t._id} className="divide-x divide-slate-100">
                    <td className="px-5 py-3">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-3">{t.bottleType}</td>
                    <td className="px-5 py-3">{t.quantity}</td>
                    <td className="px-5 py-3">{t.noOfCases ?? "-"}</td>
                    <td className="px-5 py-3">LKR {t.costPricePerUnit?.toLocaleString()}</td>
                    <td className="px-5 py-3">LKR {t.totalCost?.toLocaleString()}</td>
                    <td className="px-5 py-3">{t.addedBy?.name || "-"}</td>
                    <td className="px-5 py-3">{t.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;
