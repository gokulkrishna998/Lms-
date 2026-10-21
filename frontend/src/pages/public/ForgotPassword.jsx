import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import { authApi } from "../../api/endpoints";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [devToken, setDevToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email });
      setResponseMsg(res.data.message);
      if (res.data.dev_reset_token) {
        setDevToken(res.data.dev_reset_token);
      }
      setSubmitted(true);
    } catch (err) {
      // Still show generic message to avoid disclosing account existence
      setResponseMsg(
        "If your email is registered in our system, you will receive password reset instructions shortly."
      );
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-md">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
          <p className="mt-1 text-xs text-slate-500">
            Enter your registered email address to receive password reset instructions
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4 text-center py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs leading-relaxed">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
              {responseMsg}
            </div>

            {devToken && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs font-mono break-all text-slate-700">
                <span className="font-semibold block text-slate-900 font-sans mb-1">
                  Local Dev Reset Link:
                </span>
                <Link
                  to={`/reset-password?token=${devToken}`}
                  className="text-blue-600 underline font-sans"
                >
                  Click here to set new password
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Instructions"}
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
