import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  PlayCircle,
  ArrowRight,
  Shield,
  CreditCard,
  Laptop,
} from "lucide-react";
import { studentApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { ProgressBar } from "../../components/common/ProgressBar";
import { formatCurrency, formatDate } from "../../utils/formatters";

export const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await studentApi.getDashboard();
        setDashboardData(res.data);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-medium">Loading your student dashboard...</p>
      </div>
    );
  }

  const { stats, continue_learning, enrolled_courses, recent_orders, active_session } = dashboardData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name || "Student"}!
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Keep up your sequential learning momentum. Each completed lesson brings you closer to mastery.
          </p>
        </div>

        {active_session && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 self-start md:self-auto">
            <Laptop className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Active on: <strong className="text-slate-800">{active_session.device_info || "Current Device"}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              Enrolled Courses
            </span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">
              {stats?.enrolled_courses_count || 0}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              Completed Lessons
            </span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">
              {stats?.completed_lessons_count || 0}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              Completed Courses
            </span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">
              {stats?.completed_courses_count || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action: Continue Learning Card */}
      {continue_learning ? (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="max-w-2xl space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-300 border border-blue-400/30">
              Continue Learning
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {continue_learning.lesson_title}
            </h2>
            <p className="text-sm text-slate-300">
              Course: <span className="font-semibold text-white">{continue_learning.course_title}</span> •{" "}
              {continue_learning.module_title}
            </p>

            <div className="pt-2">
              <Link
                to={`/learning/${continue_learning.course_slug}?lesson=${continue_learning.lesson_id}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 shadow-md transition-all"
              >
                <PlayCircle className="w-5 h-5" />
                Resume Lesson Now
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* My Courses Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">My Enrolled Courses</h2>
          <Link
            to="/student/courses"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {enrolled_courses && enrolled_courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrolled_courses.map((item) => (
              <div
                key={item.enrollment_id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-5"
              >
                <div className="flex gap-4 items-start">
                  <img
                    src={
                      item.course.thumbnail_url ||
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80"
                    }
                    alt={item.course.title}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                      {item.course.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {item.course.subtitle || item.course.description}
                    </p>
                    <span className="text-[11px] font-semibold text-slate-400 block mt-2">
                      {item.access_type === "lifetime" ? "Lifetime Access" : "Active Access"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <ProgressBar percentage={item.progress?.percentage || 0} />

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">
                      {item.progress?.completed_lessons || 0} of {item.progress?.total_required_lessons || 0} Lessons Completed
                    </span>
                    <Link
                      to={`/learning/${item.course.slug}`}
                      className="font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    >
                      Open Course <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-800 text-base">You haven't enrolled in any courses yet</h3>
            <p className="text-xs text-slate-500 mt-1">Explore our recorded course catalog to begin.</p>
            <Link
              to="/courses"
              className="mt-4 inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Browse Catalog
            </Link>
          </div>
        )}
      </div>

      {/* Recent Orders Section */}
      {recent_orders && recent_orders.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Recent Payment Orders</h3>
            <Link
              to="/student/orders"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View Full History
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Order Number</th>
                    <th className="px-5 py-3">Course</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent_orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-mono text-slate-900 font-medium">
                        {ord.order_number}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {ord.course_title}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {formatCurrency(ord.amount_paise)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
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
                      <td className="px-5 py-3.5 text-slate-500">{formatDate(ord.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
