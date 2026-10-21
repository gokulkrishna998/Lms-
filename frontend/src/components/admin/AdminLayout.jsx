import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  CreditCard,
  Settings,
  Shield,
  LogOut,
  ExternalLink,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Courses", path: "/admin/courses", icon: BookOpen },
    { label: "Students", path: "/admin/students", icon: Users },
    { label: "Orders & Payments", path: "/admin/orders", icon: CreditCard },
    { label: "Settings & Audit", path: "/admin/settings", icon: Settings },
  ];

  const isActive = (path) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <Link to="/admin" className="flex items-center gap-2.5 text-white">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight">MiniLMS Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              Public Website
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div className="truncate pr-2">
              <span className="text-xs font-semibold text-white block truncate">{user?.name}</span>
              <span className="text-[11px] text-slate-500 block truncate">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
};
