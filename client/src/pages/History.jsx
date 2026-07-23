import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const rangeOptions = [
  { value: "today", label: "Today" },
  { value: "3days", label: "3 Days" },
  { value: "15days", label: "15 Days" },
  { value: "30days", label: "30 Days" },
];

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDateRange = (value) => {
  const to = new Date();
  const from = new Date();

  switch (value) {
    case "today":
      from.setHours(0, 0, 0, 0);
      break;
    case "3days":
      from.setDate(to.getDate() - 3);
      break;
    case "7days":
      from.setDate(to.getDate() - 7);
      break;
    case "15days":
      from.setDate(to.getDate() - 15);
      break;
    case "30days":
    default:
      from.setDate(to.getDate() - 30);
      break;
  }

  return {
    from: formatDate(from),
    to: formatDate(to),
  };
};

const History = () => {
  const { user } = useAuth();
  const isOwner = user?.email?.toLowerCase() === "owner@bottlesupplier.lk";
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState("30days");

  const formatHistoryProfit = (record) => {
    if (typeof record.profit === "number") return record.profit;
    if (record.agentPrice && record.shopPrice) {
      return ["190ml", "250ml"].reduce((sum, type) => {
        const qty = Number(record.distributed?.[type] || 0);
        const agent = Number(record.agentPrice?.[type] || 0);
        const shop = Number(record.shopPrice?.[type] || 0);
        return sum + qty * (shop - agent);
      }, 0);
    }
    return (record.distributed?.["190ml"] || 0) * 15 + (record.distributed?.["250ml"] || 0) * 35;
  };

  const isUpdatedRecord = (record) => {
    return ["190ml", "250ml"].some((type) => {
      const qty = Number(record.distributed?.[type] || 0);
      const agent = Number(record.agentPrice?.[type] || 0);
      const shop = Number(record.shopPrice?.[type] || 0);
      return qty > 0 && agent > 0 && shop > 0;
    });
  };

  const toMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const groupByMonth = (records) => {
    const groups = records.reduce((acc, record) => {
      const month = record.visitDate.slice(0, 7);
      const profit = formatHistoryProfit(record);
      if (!acc[month]) {
        acc[month] = { month, rows: [], revenue: 0, profit: 0 };
      }
      acc[month].rows.push(record);
      acc[month].revenue += record.revenue || 0;
      acc[month].profit += profit;
      return acc;
    }, {});

    return Object.values(groups).sort((a, b) => b.month.localeCompare(a.month));
  };

  const monthGroups = groupByMonth(history);
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const { from, to } = getDateRange(range);

    api
      .get("/distributions/history", { params: { from, to } })
      .then((res) => setHistory(res.data))
      .catch((err) => {
        console.error("Could not load history", err);
        setHistory([]);
      });
  }, [range]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Distribution History</h1>
          <p className="mt-1 text-sm text-slate-500">Grouped by month, with revenue and profit totals for each period.</p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-lg border border-teal-100 bg-white px-3 py-2 shadow-sm">
          <label htmlFor="history-range" className="text-sm font-medium text-slate-600">
            Filter
          </label>
          <select
            id="history-range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none"
          >
            {rangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {monthGroups.length === 0 && (
          <div className="card p-5 text-center text-slate-500">No visits recorded yet.</div>
        )}

        {monthGroups.map((group) => (
          <div key={group.month} className="card p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">{toMonthLabel(group.month)}</h2>
                <p className="text-sm text-slate-500">
                  {group.month === currentMonthKey ? "Current month" : "Closed month"}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Revenue</p>
                  <p className="mt-1 text-xl font-semibold text-ink">LKR {group.revenue.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Profit</p>
                  <p className="mt-1 text-xl font-semibold text-shopgreen">LKR {group.profit.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-teal-500 divide-x divide-slate-200">
                    <th className="px-5 py-2">Date</th>
                    <th className="px-5 py-2">Route</th>
                    <th className="px-5 py-2">Shop</th>
                    <th className="px-5 py-2">Salesman</th>
                    {isOwner && <th className="px-5 py-2">Distributed</th>}
                    {isOwner && <th className="px-5 py-2">Empty collected</th>}
                    {isOwner && <th className="px-5 py-2">Missing</th>}
                    {isOwner && <th className="px-5 py-2">Agent price</th>}
                    {isOwner && <th className="px-5 py-2">Shop price</th>}
                    <th className="px-5 py-2">Revenue</th>
                    <th className="px-5 py-2">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.rows.map((h) => (
                    <tr key={h._id} className="divide-x divide-slate-100">
                      <td className="px-5 py-2 text-slate-500">{h.visitDate}</td>
                      <td className="px-5 py-2 text-slate-500">{h.route?.name}</td>
                      <td className="px-5 py-2 font-medium text-ink">{h.shop?.name}</td>
                      <td className="px-5 py-2 text-slate-500">{h.salesman?.name}</td>
                      {isOwner && (
                        <td className="px-5 py-2">
                          {h.distributed?.["190ml"]}×190 / {h.distributed?.["250ml"]}×250
                        </td>
                      )}
                      {isOwner && (
                        <td className="px-5 py-2">
                          {h.emptyCollected?.["190ml"]}×190 / {h.emptyCollected?.["250ml"]}×250
                        </td>
                      )}
                      {isOwner && (
                        <td className="px-5 py-2 text-shopred">
                          {h.missing?.["190ml"]}×190 / {h.missing?.["250ml"]}×250
                        </td>
                      )}
                      {isOwner && (
                        <td className="px-5 py-2">
                          190: LKR {h.agentPrice?.["190ml"] || 0} / 250: LKR {h.agentPrice?.["250ml"] || 0}
                        </td>
                      )}
                      {isOwner && (
                        <td className="px-5 py-2">
                          190: LKR {h.shopPrice?.["190ml"] || 0} / 250: LKR {h.shopPrice?.["250ml"] || 0}
                        </td>
                      )}
                      <td className="px-5 py-2 font-semibold text-ink">LKR {h.revenue.toLocaleString()}</td>
                      <td className={`px-5 py-2 font-semibold ${formatHistoryProfit(h) >= 0 ? "text-shopgreen" : "text-shopred"}`}>
                        LKR {formatHistoryProfit(h).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
