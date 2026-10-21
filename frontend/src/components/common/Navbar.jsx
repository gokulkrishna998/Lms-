import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, BookOpen, User, LogOut, Menu, X, Shield, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              Mini<span className="text-blue-600">LMS</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Recorded Video Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${
              isActive("/") ? "text-blue-600 font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Home
          </Link>
          <Link
            to="/courses"
            className={`text-sm font-medium transition-colors ${
              isActive("/courses") ? "text-blue-600 font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Courses
          </Link>
          <Link
            to="/about"
            className={`text-sm font-medium transition-colors ${
              isActive("/about") ? "text-blue-600 font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            About
          </Link>
          <Link
            to="/contact"
            className={`text-sm font-medium transition-colors ${
              isActive("/contact") ? "text-blue-600 font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Contact
          </Link>
        </nav>

        {/* User / Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Panel
                </Link>
              ) : (
                <>
                  <Link
                    to="/student/dashboard"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    Dashboard
                  </Link>
                  <Link
                    to="/student/courses"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    My Courses
                  </Link>
                </>
              )}

              {/* Profile / Account Dropdown or Link */}
              <Link
                to="/student/profile"
                className="inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="truncate max-w-[120px]">{user?.name}</span>
              </Link>

              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Home
          </Link>
          <Link
            to="/courses"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Courses
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            About
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Contact
          </Link>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 text-xs font-semibold uppercase text-slate-400">
                  Signed in as {user?.email}
                </div>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-purple-700 bg-purple-50"
                  >
                    Admin Panel
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/student/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/student/courses"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                    >
                      My Courses
                    </Link>
                    <Link
                      to="/student/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Profile & Settings
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-rose-600 hover:bg-rose-50"
                >
                  Log Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
