import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const emptyCounts = () => ({ "190ml": "", "250ml": "" });

const ShopVisit = () => {
  const { routeId, shopId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [shop, setShop] = useState(null);
  const [existingVisit, setExistingVisit] = useState(null);
  const [distributed, setDistributed] = useState(emptyCounts());
  const [emptyCollected, setEmptyCollected] = useState(emptyCounts());
  const [missing, setMissing] = useState(emptyCounts());
  const [notes, setNotes] = useState("");
  const [requirements, setRequirements] = useState([]);
  const todayIso = new Date().toISOString().slice(0, 10);
  const [requirementForm, setRequirementForm] = useState({ bottleType: "190ml", requiredQuantity: "", plannedDate: todayIso });
  const [requirementMessage, setRequirementMessage] = useState("");
  const [submittingRequirement, setSubmittingRequirement] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get(`/distributions/shop/${shopId}`).then((res) => {
      setShop(res.data.shop);
      if (res.data.visit) {
        // Keep the visit around to show "already recorded today", but do NOT pre-fill the
        // input fields with it — each submission is a fresh delivery that gets added on top,
        // not a total to edit. Pre-filling here previously caused salesmen to accidentally
        // overwrite the day's total instead of adding a second delivery.
        setExistingVisit(res.data.visit);
      } else {
        setExistingVisit(null);
      }
    });

    api.get(`/stock-requirements/shop/${shopId}`).then((res) => setRequirements(res.data)).catch(() => setRequirements([]));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const setField = (setter, type, value) => setter((prev) => ({ ...prev, [type]: value }));

  const handleRequirementSubmit = async (e) => {
    e.preventDefault();
    setRequirementMessage("");
    setSubmittingRequirement(true);
    try {
      await api.post("/stock-requirements", {
        route: shop?.route?._id || routeId,
        shop: shopId,
        bottleType: requirementForm.bottleType,
        requiredQuantity: requirementForm.requiredQuantity,
        plannedDate: requirementForm.plannedDate,
      });
      setRequirementForm((prev) => ({ ...prev, requiredQuantity: "" }));
      setRequirementMessage("Requirement saved successfully.");
      api.get(`/stock-requirements/shop/${shopId}`).then((res) => setRequirements(res.data)).catch(() => setRequirements([]));
    } catch (err) {
      setRequirementMessage(err.response?.data?.message || "Could not save requirement");
    } finally {
      setSubmittingRequirement(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/distributions", {
        shopId,
        distributed,
        emptyCollected,
        missing,
        notes,
      });
      setSaved(res.data); // res.data is the day's updated running total for this shop
      setExistingVisit(res.data);
      // Clear the inputs — they represented THIS delivery, which has now been recorded and
      // added onto the day's total. Ready for another delivery if the salesman needs one.
      setDistributed(emptyCounts());
      setEmptyCollected(emptyCounts());
      setMissing(emptyCounts());
      api.get(`/stock-requirements/shop/${shopId}`).then((r) => setRequirements(r.data)).catch(() => {});
      api.get(`/stock-requirements/route/${routeId}`).then((r) => {
        // Route detail will refresh when the user navigates back; this keeps the current view aligned.
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("routeRequirementsUpdated", { detail: { routeId } }));
        }
      }).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.message || "Could not save this visit");
    } finally {
      setSubmitting(false);
    }
  };

  if (!shop) return <p className="text-teal-500">Loading shop...</p>;

  const outstandingBefore = shop.outstanding;
  const canViewSection = (section) => user?.role !== "salesman" || Boolean(user?.visitAccess?.[section]);
  const hasVisitAccess = user?.role !== "salesman" || ["distributed", "empty", "missing"].some(canViewSection);

  return (
    <div className="mx-auto max-w-lg">
      <Link to={`/my-routes/${routeId}`} className="text-sm font-semibold text-teal-500 hover:underline">
        &larr; Back to route
      </Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">{shop.name}</h1>
      <p className="text-sm text-slate-500">{shop.route?.name} &middot; {shop.address || "Kandy"}</p>

      <div className="mt-4 card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-500">Planned stock requirement</p>
        {requirements.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No planned stock requirement available for this shop.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {requirements.map((item) => (
              <div key={item._id} className="rounded-lg border border-teal-100 bg-teal-50 p-3">
                <p className="text-sm font-semibold text-ink">{item.bottleType} · still needs {item.remainingQuantity} of {item.requiredQuantity} bottles</p>
                <p className="text-xs text-slate-500">Planned for {item.plannedDate} · entered on {item.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleRequirementSubmit} className="mt-4 card p-4">
        <h2 className="font-display font-bold text-ink">Add planned stock requirement</h2>
        <p className="text-xs text-slate-500">Record what this shop is expected to need on a future visit.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Bottle type</label>
            <select
              className="input-field"
              value={requirementForm.bottleType}
              onChange={(e) => setRequirementForm((prev) => ({ ...prev, bottleType: e.target.value }))}
            >
              <option value="190ml">190ml</option>
              <option value="250ml">250ml</option>
            </select>
          </div>
          <div>
            <label className="label">Required quantity</label>
            <input
              type="number"
              min="0"
              className="input-field"
              value={requirementForm.requiredQuantity}
              onChange={(e) => setRequirementForm((prev) => ({ ...prev, requiredQuantity: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Planned date</label>
            <input
              type="date"
              className="input-field"
              min={todayIso}
              value={requirementForm.plannedDate}
              onChange={(e) => setRequirementForm((prev) => ({ ...prev, plannedDate: e.target.value }))}
            />
            <p className="mt-1 text-xs text-slate-400">Only today or a future date can be planned — not a past date.</p>
          </div>
        </div>
        {requirementMessage && <p className="mt-3 text-sm text-teal-600">{requirementMessage}</p>}
        <button type="submit" disabled={submittingRequirement} className="btn-primary mt-4">
          {submittingRequirement ? "Saving..." : "Save requirement"}
        </button>
      </form>

      <div className="mt-4 card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-500">Currently at shop (before this visit)</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-teal-50 p-3 text-center">
            <p className="text-xs text-slate-500">190ml</p>
            <p className="font-display text-lg font-bold text-ink">{outstandingBefore["190ml"]}</p>
          </div>
          <div className="rounded-lg bg-teal-50 p-3 text-center">
            <p className="text-xs text-slate-500">250ml</p>
            <p className="font-display text-lg font-bold text-ink">{outstandingBefore["250ml"]}</p>
          </div>
        </div>
      </div>

      {existingVisit && (
        <div className="mt-4 card border-teal-200 bg-teal-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-500">Already recorded today at this shop</p>
          <p className="mt-2 text-sm text-ink">
            Delivered <strong>{existingVisit.distributed["190ml"]}×190ml</strong>, <strong>{existingVisit.distributed["250ml"]}×250ml</strong>
          </p>
          <p className="text-sm text-ink">
            Empty collected <strong>{existingVisit.emptyCollected["190ml"]}×190ml</strong>, <strong>{existingVisit.emptyCollected["250ml"]}×250ml</strong>
          </p>
          <p className="text-sm text-ink">
            Missing <strong>{existingVisit.missing["190ml"]}×190ml</strong>, <strong>{existingVisit.missing["250ml"]}×250ml</strong>
          </p>
          <p className="mt-1 text-xs text-slate-500">The form below adds a NEW delivery on top of these totals — it doesn't replace them.</p>
        </div>
      )}

      {hasVisitAccess && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {canViewSection("distributed") && (
            <div className="card p-4">
              <h2 className="font-display font-bold text-ink">1. Distributed bottle amount</h2>
              <p className="text-xs text-slate-500">New full bottles given to the shop right now (this delivery only).</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {["190ml", "250ml"].map((type) => (
                  <div key={type}>
                    <label className="label">{type}</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={distributed[type]}
                      onChange={(e) => setField(setDistributed, type, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {canViewSection("empty") && (
            <div className="card p-4">
              <h2 className="font-display font-bold text-ink">2. Empty bottle amount</h2>
              <p className="text-xs text-slate-500">Empty bottles collected back from the shop right now (this visit only).</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {["190ml", "250ml"].map((type) => (
                  <div key={type}>
                    <label className="label">{type}</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={emptyCollected[type]}
                      onChange={(e) => setField(setEmptyCollected, type, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {canViewSection("missing") && (
            <div className="card p-4">
              <h2 className="font-display font-bold text-ink">3. Missing bottle amount</h2>
              <p className="text-xs text-slate-500">Bottles the shop reports as broken, lost, or unaccounted for, right now.</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {["190ml", "250ml"].map((type) => (
                  <div key={type}>
                    <label className="label">{type}</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={missing[type]}
                      onChange={(e) => setField(setMissing, type, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4">
            <label className="label">Notes (optional)</label>
            <textarea className="input-field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {error && <p className="text-sm font-medium text-shopred">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Saving..." : existingVisit ? "Add this delivery" : "Save visit"}
          </button>
        </form>
      )}

      {saved && (
        <div className="mt-4 card border-shopgreen/30 bg-shopgreen/5 p-4">
          <h2 className="font-display font-bold text-shopgreen">4. Remaining bottle amount in the shop</h2>
          <p className="text-xs text-slate-500">Auto-calculated: previous balance + distributed − empty collected − missing.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white p-3 text-center">
              <p className="text-xs text-slate-500">190ml</p>
              <p className="font-display text-lg font-bold text-ink">{saved.remainingAfter["190ml"]}</p>
            </div>
            <div className="rounded-lg bg-white p-3 text-center">
              <p className="text-xs text-slate-500">250ml</p>
              <p className="font-display text-lg font-bold text-ink">{saved.remainingAfter["250ml"]}</p>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold text-ink">Total revenue from this shop today: LKR {saved.revenue.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default ShopVisit;
