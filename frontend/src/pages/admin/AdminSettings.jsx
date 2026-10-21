import React, { useEffect, useState } from "react";
import { Settings, Shield, Save, Clock, History } from "lucide-react";
import { adminApi } from "../../api/endpoints";
import { formatDate } from "../../utils/formatters";
import { useToast } from "../../context/ToastContext";

export const AdminSettings = () => {
  const [settings, setSettings] = useState({
    site_name: "",
    support_email: "",
    currency_symbol: "₹",
    currency_code: "INR",
    hero_heading: "",
    hero_subheading: "",
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchSettingsAndLogs = async () => {
    try {
      const [sRes, aRes] = await Promise.all([
        adminApi.getSettings(),
        adminApi.getAuditLogs(),
      ]);
      setSettings(sRes.data.settings || {});
      setAuditLogs(aRes.data.logs || []);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndLogs();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      showToast("Platform configurations saved successfully!", "success");
      fetchSettingsAndLogs();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading platform settings & security audit logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Platform Settings & Audit Logs
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure site defaults and review sensitive administrative operations
        </p>
      </div>

      {/* Settings Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6"
      >
        <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-base">General Platform Configuration</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Platform Brand Name
            </label>
            <input
              type="text"
              required
              value={settings.site_name || ""}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Support Email Address
            </label>
            <input
              type="email"
              required
              value={settings.support_email || ""}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Currency Symbol
            </label>
            <input
              type="text"
              required
              value={settings.currency_symbol || "₹"}
              onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ISO Currency Code
            </label>
            <input
              type="text"
              required
              value={settings.currency_code || "INR"}
              onChange={(e) => setSettings({ ...settings, currency_code: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hero Heading
            </label>
            <input
              type="text"
              value={settings.hero_heading || ""}
              onChange={(e) => setSettings({ ...settings, hero_heading: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hero Subheading
            </label>
            <textarea
              rows="2"
              value={settings.hero_subheading || ""}
              onChange={(e) => setSettings({ ...settings, hero_subheading: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
          <History className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-base">Administrative Audit Logs</h3>
            <p className="text-xs text-slate-400">
              Immutable record of sensitive operations, course publications, and enrollment actions
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Performed By</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">{log.user_name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={log.details}>
                      {log.details || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-slate-400">
                    No administrative audit records logged yet.
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
