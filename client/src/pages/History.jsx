import React, { useEffect, useState } from "react";
import api from "../api/axios";

const rangeOptions = [
  { value: "today", label: "Today" },
  { value: "3days", label: "3 Days" },
  { value: "7days", label: "7 Days" },
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
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState("30days");

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
          <p className="mt-1 text-sm text-slate-500">Every recorded shop visit, most recent first.</p>
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

      <div className="mt-6 card overflow-x-auto p-5">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-teal-500 divide-x divide-slate-200">
              <th className="px-5 py-2">Date</th>
              <th className="px-5 py-2">Route</th>
              <th className="px-5 py-2">Shop</th>
              <th className="px-5 py-2">Salesman</th>
              <th className="px-5 py-2">Distributed</th>
              <th className="px-5 py-2">Empty collected</th>
              <th className="px-5 py-2">Missing</th>
              <th className="px-5 py-2">Revenue</th>
              <th className="px-5 py-2">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map((h) => (
              <tr key={h._id} className="divide-x divide-slate-100">
                <td className="px-5 py-2 text-slate-500">{h.visitDate}</td>
                <td className="px-5 py-2 text-slate-500">{h.route?.name}</td>
                <td className="px-5 py-2 font-medium text-ink">{h.shop?.name}</td>
                <td className="px-5 py-2 text-slate-500">{h.salesman?.name}</td>
                <td className="px-5 py-2">{h.distributed["190ml"]}×190 / {h.distributed["250ml"]}×250</td>
                <td className="px-5 py-2">{h.emptyCollected["190ml"]}×190 / {h.emptyCollected["250ml"]}×250</td>
                <td className="px-5 py-2 text-shopred">{h.missing["190ml"]}×190 / {h.missing["250ml"]}×250</td>
                <td className="px-5 py-2 font-semibold text-ink">LKR {h.revenue.toLocaleString()}</td>
                <td className="px-5 py-2 font-semibold text-shopgreen">
                  LKR {((h.distributed?.["190ml"] || 0) * 15 + (h.distributed?.["250ml"] || 0) * 35).toLocaleString()}
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr className="divide-x divide-slate-100">
                <td colSpan={9} className="px-5 py-4 text-center text-slate-400">No visits recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
