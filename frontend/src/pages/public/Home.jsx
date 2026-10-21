import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lock,
  PlayCircle,
  ShieldCheck,
  Zap,
  Award,
  Video,
} from "lucide-react";
import { coursesApi } from "../../api/endpoints";
import { CourseCard } from "../../components/common/CourseCard";

export const Home = () => {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await coursesApi.getFeatured();
        setFeaturedCourses(res.data.courses || []);
      } catch (err) {
        console.error("Failed to load featured courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 py-20 lg:py-28 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold mb-6 animate-fade-in">
            <Video className="w-3.5 h-3.5" />
            <span>Structured Recorded Video Learning Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight max-w-4xl mx-auto leading-tight">
            Master In-Demand Skills With{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Structured Video Courses
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Learn at your own pace through sequential module-by-module video lessons.
            Guaranteed curriculum mastery, instant Razorpay enrollment, and distraction-free playback.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/courses"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all"
            >
              Browse All Courses
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/about"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-base hover:bg-slate-50 shadow-sm transition-all"
            >
              Learn More
            </Link>
          </div>

          {/* Quick Features List */}
          <div className="mt-12 pt-8 border-t border-slate-200/60 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <PlayCircle className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-700">Sequential Lesson Unlocking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-700">Single-Device Active Security</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-700">Instant Razorpay Activation</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-700">Lifetime Access & Progress</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              Featured Recorded Courses
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Top-rated programs carefully structured with free preview lessons and practical modules.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View Entire Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse space-y-4">
                <div className="aspect-video bg-slate-200 rounded-xl" />
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-8 bg-slate-200 rounded w-1/3 pt-4" />
              </div>
            ))}
          </div>
        ) : featuredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">Courses Launching Soon</h3>
            <p className="text-slate-500 text-sm mt-1">Check back shortly or visit our catalog.</p>
          </div>
        )}
      </section>

      {/* Platform Learning Architecture Benefits */}
      <section className="bg-slate-900 text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Why Our Learning Methodology Works</h2>
            <p className="text-slate-400 mt-3 text-base">
              Traditional courses let students skip around and abandon lessons. Our structured platform enforces true conceptual mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="text-lg font-semibold text-white">Strict Sequential Unlocking</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Lessons unlock only after you complete the preceding required lesson or watch 90% of the content. Eliminates knowledge gaps.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="text-lg font-semibold text-white">Single-Device Focus & Integrity</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Server-side active session control guarantees distraction-free focus on one device at a time and prevents unauthorized account sharing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h3 className="text-lg font-semibold text-white">Protected Playback & Tokens</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Video streams utilize short-lived HMAC signed tokens and HTTP Range requests for seamless video scrub and playback resume.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Ready to upgrade your engineering skills?
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto text-base">
            Enroll today with instant test-mode Razorpay checkout and start learning immediately.
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
          >
            Explore All Courses
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
