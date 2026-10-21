import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn, Mail, Lock, AlertCircle, Shield, GraduationCap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract redirect query parameter if user was sent here from checkout
  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = searchParams.get("redirect") || "/student/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await login(email, password);
      showToast("Signed in successfully!", "success");

      // If user is admin and no explicit redirect was provided, send to admin
      if (data.user?.role === "admin" && redirectTarget === "/student/dashboard") {
        navigate("/admin");
      } else {
        navigate(redirectTarget);
      }
    } catch (err) {
      console.error("Login failed:", err);
      const msg = err.response?.data?.message || "Invalid email or password.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-md">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">MiniLMS</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Sign in to your account</h2>
          <p className="mt-1 text-sm text-slate-500">
            Resume your learning journey with single-session security
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Single Device Policy Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-start gap-2 leading-relaxed">
            <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-700">Single-Device Active Session:</strong> Signing in on this device will automatically log out any other active device session on your account.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {/* Demo Credentials quick helper */}
        <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">Demo Accounts Available:</p>
          <div className="flex justify-between">
            <span>Student:</span>
            <span className="font-mono text-slate-800">student@example.com / Student@123456</span>
          </div>
          <div className="flex justify-between">
            <span>Admin:</span>
            <span className="font-mono text-slate-800">admin@minilms.com / Admin@123456</span>
          </div>
        </div>

        {/* Register Prompt */}
        <p className="text-center text-xs text-slate-500 pt-2">
          Don't have an account yet?{" "}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
