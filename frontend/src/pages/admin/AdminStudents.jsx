import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldAlert,
  X,
  BookOpen,
  Calendar,
} from "lucide-react";
import { adminApi } from "../../api/endpoints";
import { formatDate, formatCurrency } from "../../utils/formatters";
import { useToast } from "../../context/ToastContext";

export const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);
  const { showToast } = useToast();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getStudents({ search });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error("Failed to load students:", err);
      showToast("Failed to load students list.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const viewStudent = async (student) => {
    setSelectedStudent(student);
    setDetailsLoading(true);
    try {
      const res = await adminApi.getStudentDetails(student.id);
      setDetailsData(res.data);
    } catch (err) {
      showToast("Failed to load student details.", "error");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleToggleStatus = async (student) => {
    const nextState = !student.is_active;
    if (
      !window.confirm(
        `Are you sure you want to ${nextState ? "activate" : "deactivate"} account for "${student.name}"?`
      )
    )
      return;

    try {
      await adminApi.toggleStudentStatus(student.id, nextState);
      showToast(`Student account marked as ${nextState ? "active" : "deactivated"}.`, "success");
      fetchStudents();
      if (selectedStudent?.id === student.id) {
        setSelectedStudent((prev) => ({ ...prev, is_active: nextState }));
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status.", "error");
    }
  };

  const handleRevokeEnrollment = async (enrollmentId, courseTitle) => {
    const reason = window.prompt(`Enter reason for revoking access to "${courseTitle}":`, "Administrative Policy / Refund");
    if (!reason) return;

    try {
      await adminApi.revokeEnrollment(enrollmentId, reason);
      showToast("Course access revoked successfully.", "success");
      if (selectedStudent) {
        viewStudent(selectedStudent);
      }
      fetchStudents();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to revoke access.", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search registered students, inspect course enrollments, track progress, and manage access
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Student Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Courses</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5">Joined Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                    Loading registered students...
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0">
                        {st.name?.charAt(0).toUpperCase()}
                      </div>
                      <span>{st.name}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{st.email}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {st.enrollments_count || 0} enrolled
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          st.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {st.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Deactivated
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{formatDate(st.created_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewStudent(st)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          onClick={() => handleToggleStatus(st)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            st.is_active
                              ? "text-rose-600 hover:bg-rose-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {st.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                    No students matched the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Inspection Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-base">
                  {selectedStudent.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Fetching student records...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Enrolled Courses */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    Enrolled Courses & Progress
                  </h4>

                  {detailsData?.enrollments && detailsData.enrollments.length > 0 ? (
                    <div className="space-y-3">
                      {detailsData.enrollments.map(({ enrollment, course, progress }) => (
                        <div
                          key={enrollment.id}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">
                              {course?.title}
                            </span>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                              <span>Status: <strong className="uppercase">{enrollment.status}</strong></span>
                              <span>•</span>
                              <span>Progress: <strong>{progress?.percentage || 0}%</strong> ({progress?.completed_lessons || 0} completed)</span>
                            </div>
                          </div>

                          {enrollment.status === "active" && (
                            <button
                              onClick={() => handleRevokeEnrollment(enrollment.id, course?.title)}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold shrink-0 self-end sm:self-auto"
                            >
                              Revoke Access
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No courses currently enrolled.</p>
                  )}
                </div>

                {/* Orders History */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Purchase History
                  </h4>

                  {detailsData?.orders && detailsData.orders.length > 0 ? (
                    <div className="space-y-2">
                      {detailsData.orders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-800">{ord.order_number}</span>
                            <span className="text-slate-400 block text-[11px] mt-0.5">{ord.course_title}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">{formatCurrency(ord.amount_paise)}</span>
                            <span
                              className={`text-[10px] font-semibold uppercase ${
                                ord.status === "paid" ? "text-emerald-600" : "text-amber-600"
                              }`}
                            >
                              {ord.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No purchase transactions found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
