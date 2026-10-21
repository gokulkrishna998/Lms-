import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ShieldCheck, CheckCircle2 } from "lucide-react";

export const About = () => (
  <div className="max-w-4xl mx-auto px-4 py-14">
    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">About MiniLMS</h1>
    <p className="mt-4 text-base text-slate-600 leading-relaxed">
      MiniLMS was engineered to bring discipline, clarity, and true mastery to recorded video learning.
      Unlike chaotic online playlists where students skip foundational topics, our structured curriculum
      unlocks lessons sequentially as you demonstrate genuine comprehension.
    </p>

    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-2">Sequential Mastery</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Courses require completing each milestone before unlocking the next, ensuring complete retention.
        </p>
      </div>
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-2">Private Playback</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Short-lived HMAC tokens protect lessons against unauthorized URL leaks and unauthorized playback.
        </p>
      </div>
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-2">Single Device Focus</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          One active session per student guarantees focused learning and protects course ownership.
        </p>
      </div>
    </div>
  </div>
);

export const Contact = () => (
  <div className="max-w-3xl mx-auto px-4 py-14">
    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Contact Support</h1>
    <p className="mt-2 text-slate-600 text-sm">
      Have questions about our recorded courses, billing, or access? We're here to help.
    </p>

    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Email Support</h4>
          <p className="text-xs text-slate-500 mt-0.5">support@minilms.com</p>
          <span className="text-[11px] text-slate-400 block mt-2">Response within 24 hours</span>
        </div>
      </div>

      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Billing Inquiries</h4>
          <p className="text-xs text-slate-500 mt-0.5">billing@minilms.com</p>
          <span className="text-[11px] text-slate-400 block mt-2">Instant Razorpay receipts</span>
        </div>
      </div>
    </div>
  </div>
);

export const PrivacyPolicy = () => (
  <div className="max-w-4xl mx-auto px-4 py-14 space-y-6 text-slate-700 text-sm leading-relaxed">
    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
    <p className="text-xs text-slate-400">Last updated: October 2026</p>

    <h3 className="text-lg font-bold text-slate-900 pt-2">1. Information We Collect</h3>
    <p>
      We collect basic registration information including your name and email address. When you purchase a course,
      our payment gateway (Razorpay) securely processes your payment. We never store credit/debit card numbers or CVV.
    </p>

    <h3 className="text-lg font-bold text-slate-900 pt-2">2. Single-Device Session Information</h3>
    <p>
      To enforce account security and single-device access, we record user-agent summary headers and IP addresses
      associated with active sessions. When you log in on a new device, preceding sessions are invalidated.
    </p>

    <h3 className="text-lg font-bold text-slate-900 pt-2">3. Learning Progress Data</h3>
    <p>
      Playback position and lesson completion timestamps are recorded in the database to enable you to resume
      learning seamlessly across visits.
    </p>
  </div>
);

export const TermsAndConditions = () => (
  <div className="max-w-4xl mx-auto px-4 py-14 space-y-6 text-slate-700 text-sm leading-relaxed">
    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms & Conditions</h1>
    <p className="text-xs text-slate-400">Last updated: October 2026</p>

    <h3 className="text-lg font-bold text-slate-900 pt-2">1. Course Enrollment & License</h3>
    <p>
      Purchasing a course grants you an individual, non-transferable, personal license to stream the recorded video
      lessons according to the access policy specified on checkout (lifetime access by default).
    </p>

    <h3 className="text-lg font-bold text-slate-900 pt-2">2. Account Sharing Prohibition</h3>
    <p>
      Each student account is restricted to one simultaneous authenticated active session. Sharing accounts or attempting
      to download/redistribute protected media assets is strictly prohibited and subject to immediate access revocation.
    </p>

    <h3 className="text-lg font-bold text-slate-900 pt-2">3. Video Security</h3>
    <p>
      Private video URLs are generated with short-lived HMAC security tokens. Unauthorized scraping or proxying
      of streaming endpoints will lead to account suspension.
    </p>
  </div>
);

export const RefundPolicy = () => (
  <div className="max-w-4xl mx-auto px-4 py-14 space-y-6 text-slate-700 text-sm leading-relaxed">
    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Refund & Cancellation Policy</h1>
    <p className="text-xs text-slate-400">Last updated: October 2026</p>

    <h3 className="text-lg font-bold text-slate-900 pt-2">1. Refund Eligibility</h3>
    <p>
      Because we provide free preview lessons for all courses so you can evaluate the content quality before purchase,
      refund requests are evaluated on a case-by-case basis within 7 days of initial purchase, provided less than 20%
      of the course lessons have been marked complete.
    </p>

    <h3 className="text-lg font-bold text-slate-900 pt-2">2. Request Process</h3>
    <p>
      To submit a refund request, contact support@minilms.com with your order number and registered email address.
      Upon approved refund, course access is revoked and funds are credited back via Razorpay within 5-7 business days.
    </p>
  </div>
);
