import React, { useEffect, useState } from "react";
import api from "../api/axios";

const Expenses = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    api.get("/stock/transactions").then((res) => setTransactions(res.data));
  }, []);

  const total = transactions.reduce((sum, t) => sum + t.totalCost, 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Company Expenses</h1>
      <p className="mt-1 text-sm text-slate-500">
        Auto-generated whenever stock is purchased from the bottle company agent — this is not the money collected from shops.
      </p>

      <div className="mt-6 card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">Purchase history</h2>
          <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-600">
            Total: LKR {total.toLocaleString()}
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-teal-500 divide-x divide-slate-200">
                <th className="px-5 py-2">Date</th>
                <th className="px-5 py-2">Bottle type</th>
                <th className="px-5 py-2">Quantity</th>
                <th className="px-5 py-2">No of cases</th>
                <th className="px-5 py-2">Cost / unit</th>
                <th className="px-5 py-2">Total cost</th>
                <th className="px-5 py-2">Added by</th>
                <th className="px-5 py-2">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <tr key={t._id} className="divide-x divide-slate-100">
                  <td className="px-5 py-2 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-2 font-medium text-ink">{t.bottleType}</td>
                  <td className="px-5 py-2">{t.quantity}</td>
                  <td className="px-5 py-2">{t.noOfCases ?? "-"}</td>
                  <td className="px-5 py-2">LKR {t.costPricePerUnit}</td>
                  <td className="px-5 py-2 font-semibold text-ink">LKR {t.totalCost.toLocaleString()}</td>
                  <td className="px-5 py-2 text-slate-500">{t.addedBy?.name}</td>
                  <td className="px-5 py-2 text-slate-400">{t.note || "-"}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr className="divide-x divide-slate-100">
                  <td colSpan={8} className="px-5 py-4 text-center text-slate-400">No stock purchases recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
