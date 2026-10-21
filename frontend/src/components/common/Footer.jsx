import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, ShieldCheck, HelpCircle } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="mt-auto bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">MiniLMS</span>
            </div>
            <p className="text-sm leading-relaxed">
              Modern recorded video learning platform with structured sequential unlocking, single-device session security, and Razorpay integration.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/courses" className="hover:text-white transition-colors">
                  Explore Courses
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Student Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Policies</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-white transition-colors">
                  Refund & Cancellation
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Support Note */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Security & Trust</h4>
            <p className="text-xs leading-relaxed mb-3">
              Protected video streaming with short-lived HMAC playback tokens. Single-device session protection ensures course integrity.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Razorpay Secured INR Payments</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 mt-1.5">
              <Mail className="w-4 h-4 text-blue-400" />
              <span>support@minilms.com</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 text-xs text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} MiniLMS Platform. All rights reserved.</p>
          <p className="text-slate-500">Designed for fast, structured, distraction-free learning.</p>
        </div>
      </div>
    </footer>
  );
};
