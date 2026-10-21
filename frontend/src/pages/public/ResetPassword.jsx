import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { authApi } from "../../api/endpoints";
import { useToast } from "../../context/ToastContext";

export const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg("Missing password reset token. Please request a new link.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await authApi.resetPassword({ token, new_password: newPassword });
      setSuccess(true);
      showToast("Password updated successfully!", "success");
    } catch (err) {
      console.error("Reset error:", err);
      setErrorMsg(err.response?.data?.message || "Failed to reset password. Link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Set New Password</h2>
          <p className="mt-1 text-xs text-slate-500">
            Enter your new secure password below
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4 py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs leading-relaxed">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              Your password has been reset successfully. You can now log in with your new credentials.
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md transition-all"
            >
              Sign In Now
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Password (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
