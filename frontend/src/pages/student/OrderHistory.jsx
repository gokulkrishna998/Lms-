import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, ArrowLeft, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { paymentsApi } from "../../api/endpoints";
import { formatCurrency, formatDate } from "../../utils/formatters";

export const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await paymentsApi.getMyOrders();
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error("Order history error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/student/dashboard"
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order & Payment History</h1>
          <p className="text-xs text-slate-500">Inspect verified payment receipts and course orders</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading purchase records...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-5 py-3.5">Course</th>
                  <th className="px-5 py-3.5">Amount Paid</th>
                  <th className="px-5 py-3.5">Payment ID</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      {ord.order_number}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      <Link
                        to={`/courses/${ord.course_slug}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {ord.course_title}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {formatCurrency(ord.amount_paise)}
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-500">
                      {ord.razorpay_payment_id || "-"}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-semibold text-slate-800 text-base">No Orders Yet</h3>
          <p className="text-xs text-slate-500 mt-1">When you purchase a course, the receipt will appear here.</p>
        </div>
      )}
    </div>
  );
};
