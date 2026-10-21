import React, { useState } from "react";
import { User, Lock, Shield, Laptop, AlertCircle, CheckCircle2 } from "lucide-react";
import { authApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export const Profile = () => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const payload = {};
    if (name.trim() !== user?.name) {
      payload.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        setErrorMsg("Please provide your current password to set a new password.");
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg("New password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg("New passwords do not match.");
        return;
      }
      payload.current_password = currentPassword;
      payload.new_password = newPassword;
    }

    if (Object.keys(payload).length === 0) {
      showToast("No changes detected.", "info");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.updateProfile(payload);
      setUser(res.data.user);
      localStorage.setItem("minilms_user", JSON.stringify(res.data.user));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Profile updated successfully!", "success");
    } catch (err) {
      console.error("Update failed:", err);
      setErrorMsg(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Account Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Manage your personal profile, security credentials, and active device sessions
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Account Details Form */}
      <form onSubmit={handleUpdate} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Profile Information
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ""}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Email addresses cannot be modified directly for security reasons.
            </span>
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900 border-t border-slate-100 pt-6 pb-2">
          Change Password
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password to change"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Password (min 6 chars)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Single Device Session Info Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-base">Active Device Enforcement Policy</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your account is protected by single-device active session enforcement. Whenever you log in on another device (such as your phone or tablet), this computer's active session is terminated automatically to prevent unauthorized access.
        </p>
      </div>
    </div>
  );
};
