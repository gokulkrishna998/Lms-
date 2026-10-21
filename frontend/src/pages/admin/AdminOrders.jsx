import React, { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { adminApi } from "../../api/endpoints";
import { formatCurrency, formatDate } from "../../utils/formatters";

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOrders({ status: statusFilter });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Failed to load admin orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Orders & Payments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time verified Razorpay transactions, gateway references, and order logs
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Orders</option>
            <option value="paid">Paid (Captured)</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed / Cancelled</option>
          </select>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Order Number</th>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Course</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Gateway Reference</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-400">
                    Loading order records...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      {ord.order_number}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800 block truncate max-w-[140px]">
                        {ord.user_name}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">
                        {ord.user_email}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {ord.course_title}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {formatCurrency(ord.amount_paise)}
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-500">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Order ID:</span>
                        <span>{ord.razorpay_order_id || "-"}</span>
                      </div>
                      {ord.razorpay_payment_id && (
                        <div className="mt-0.5">
                          <span className="text-slate-400 text-[10px] block">Payment ID:</span>
                          <span className="text-emerald-700 font-semibold">{ord.razorpay_payment_id}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          ord.status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : ord.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {ord.status === "paid" && <CheckCircle2 className="w-3 h-3" />}
                        {ord.status === "pending" && <Clock className="w-3 h-3" />}
                        {ord.status === "failed" && <AlertCircle className="w-3 h-3" />}
                        {ord.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(ord.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-400">
                    No orders match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
