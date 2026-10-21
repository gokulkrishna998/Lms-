import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { adminApi } from "../../api/endpoints";
import { formatCurrency, formatDate } from "../../utils/formatters";

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await adminApi.getDashboard();
        setData(res.data);
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading platform analytics...</p>
      </div>
    );
  }

  const { stats, recent_orders, recent_students } = data || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Platform Overview
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor course enrollments, verified revenue, and student activity
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Students
            </span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">
              {stats?.total_students || 0}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Confirmed Revenue
            </span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">
              {formatCurrency(stats?.total_revenue_paise || 0)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Published Courses
            </span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">
              {stats?.published_courses || 0} / {stats?.total_courses || 0}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Enrollments
            </span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">
              {stats?.total_enrollments || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Orders and Recent Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Recent Payment Orders</h3>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent_orders && recent_orders.length > 0 ? (
                  recent_orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                        {ord.order_number}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800 block truncate max-w-[140px]">
                          {ord.user_name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">
                          {ord.user_email}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {formatCurrency(ord.amount_paise)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            ord.status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {ord.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{formatDate(ord.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-slate-400">
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Students (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">New Students</h3>
            <Link
              to="/admin/students"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Manage
            </Link>
          </div>

          <div className="p-5 divide-y divide-slate-100 flex-1">
            {recent_students && recent_students.length > 0 ? (
              recent_students.map((st) => (
                <div key={st.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0">
                    {st.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {st.name}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">{st.email}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatDate(st.created_at).split(",")[0]}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No students registered yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
