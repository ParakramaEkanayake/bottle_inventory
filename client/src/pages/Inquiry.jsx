import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  name: "",
  description: "",
  price: "",
};

const Inquiry = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [inquiries, setInquiries] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchInquiries = async () => {
    try {
      const res = await api.get("/inquiries");
      setInquiries(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.post("/inquiries", {
        name: form.name,
        description: form.description,
        price: Number(form.price),
      });
      setForm(initialForm);
      setMessage("Inquiry submitted successfully.");
      fetchInquiries();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not submit inquiry.");
    } finally {
      setLoading(false);
    }
  };

  const isSalesman = user?.role === "salesman";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Inquiries</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isSalesman
            ? "Create an inquiry for the owner to review."
            : "Review inquiries submitted by salesmen."}
        </p>
      </div>

      {isSalesman && (
        <form onSubmit={handleSubmit} className="card p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input className="input-field" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Price</label>
              <input className="input-field" type="number" name="price" value={form.price} onChange={handleChange} required />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea className="input-field" rows="3" name="description" value={form.description} onChange={handleChange} required />
            </div>
          </div>

          {message && <p className="mt-3 text-sm text-teal-600">{message}</p>}

          <button type="submit" className="btn-primary mt-4" disabled={loading}>
            {loading ? "Saving..." : "Submit Inquiry"}
          </button>
        </form>
      )}

      <div className="card overflow-hidden p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">Inquiry List</h2>
        </div>

        {inquiries.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">No inquiries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr className="divide-x divide-slate-200">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Salesman</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map((item) => (
                  <tr key={item._id} className="divide-x divide-slate-100">
                    <td className="px-6 py-3 font-medium text-ink">{item.name}</td>
                    <td className="px-6 py-3">{item.salesman?.name || "Unknown"}</td>
                    <td className="px-6 py-3">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3">{item.description}</td>
                    <td className="px-6 py-3">{item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inquiry;
