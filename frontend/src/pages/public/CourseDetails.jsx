import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  PlayCircle,
  Lock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { coursesApi, paymentsApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatCurrency, formatDuration } from "../../utils/formatters";
import { PaymentModal } from "../../components/payment/PaymentModal";

export const CourseDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Accordion open/close state for curriculum modules
  const [openModules, setOpenModules] = useState({});

  // Checkout modal state
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [initiatingPurchase, setInitiatingPurchase] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await coursesApi.getBySlug(slug);
        const data = res.data.course;
        setCourse(data);

        // Open first module by default
        if (data.modules && data.modules.length > 0) {
          setOpenModules({ [data.modules[0].id]: true });
        }
      } catch (err) {
        console.error("Course fetch error:", err);
        setError(err.response?.data?.message || "Course not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [slug]);

  const toggleModule = (modId) => {
    setOpenModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handlePurchaseClick = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return state
      showToast("Please sign in or register to purchase this course.", "info");
      navigate(`/login?redirect=/courses/${slug}`);
      return;
    }

    setInitiatingPurchase(true);
    try {
      const res = await paymentsApi.createOrder(course.id);
      setCheckoutOrder(res.data.order);
      setIsCheckoutOpen(true);
    } catch (err) {
      console.error("Purchase order creation failed:", err);
      const msg = err.response?.data?.message || "Failed to initiate purchase.";
      showToast(msg, "error");
    } finally {
      setInitiatingPurchase(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-medium">Loading course syllabus...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Course Unavailable</h2>
        <p className="text-slate-600 text-sm mt-1">{error || "This course could not be located."}</p>
        <Link
          to="/courses"
          className="mt-6 inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Course Banner Section */}
      <div className="bg-slate-900 text-white py-12 lg:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
            {/* Left 2 Cols: Course Info */}
            <div className="lg:col-span-2 space-y-4">
              {course.category && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {course.category.name}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                {course.title}
              </h1>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                {course.subtitle || course.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs sm:text-sm text-slate-400">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>{course.modules_count || 0} Modules</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <PlayCircle className="w-4 h-4 text-emerald-400" />
                  <span>{course.lessons_count || 0} Recorded Lessons</span>
                </div>
                {course.total_duration_seconds > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>{formatDuration(course.total_duration_seconds)} Total Duration</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>{course.access_policy}</span>
                </div>
              </div>
            </div>

            {/* Right Col: Thumbnail Card */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-800">
              <img
                src={
                  course.thumbnail_url ||
                  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"
                }
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content: Outcomes & Syllabus */}
          <div className="lg:col-span-2 space-y-10">
            {/* Learning Outcomes */}
            {course.learning_outcomes && course.learning_outcomes.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  What You'll Learn in This Course
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.learning_outcomes.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Description */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-slate-900">About This Course</h3>
              <div className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {course.description}
              </div>
            </div>

            {/* Curriculum Accordion */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Course Syllabus</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Structured sequential roadmap. Free preview lessons are open to watch.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  {course.modules_count || 0} Modules • {course.lessons_count || 0} Lessons
                </span>
              </div>

              <div className="space-y-4">
                {course.modules?.map((mod, modIdx) => {
                  const isOpen = !!openModules[mod.id];
                  return (
                    <div
                      key={mod.id}
                      className="border border-slate-200 rounded-xl overflow-hidden transition-colors"
                    >
                      {/* Module Header Toggle */}
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50/80 hover:bg-slate-100/80 text-left transition-colors"
                      >
                        <div>
                          <span className="text-xs font-semibold text-blue-600 block uppercase tracking-wider mb-0.5">
                            Module {modIdx + 1}
                          </span>
                          <h4 className="font-bold text-slate-900 text-base">{mod.title}</h4>
                          {mod.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{mod.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 hidden sm:inline">
                            {mod.lessons?.length || 0} lessons
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Module Lessons List */}
                      {isOpen && (
                        <div className="divide-y divide-slate-100 bg-white">
                          {mod.lessons?.map((les, lesIdx) => (
                            <div
                              key={les.id}
                              className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-4">
                                {les.is_free_preview ? (
                                  <PlayCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Lock className="w-4 h-4 text-slate-300 shrink-0" />
                                )}
                                <div className="truncate">
                                  <span className="text-sm font-medium text-slate-800 block truncate">
                                    {les.title}
                                  </span>
                                  {les.duration_seconds > 0 && (
                                    <span className="text-xs text-slate-400">
                                      {formatDuration(les.duration_seconds)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {les.is_free_preview ? (
                                  <Link
                                    to={`/learning/${course.slug}?lesson=${les.id}`}
                                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 transition-colors"
                                  >
                                    <PlayCircle className="w-3.5 h-3.5" />
                                    Free Preview
                                  </Link>
                                ) : (
                                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                    <Lock className="w-3 h-3 text-slate-300" />
                                    Locked
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Purchase & Enrollment Action Box */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6">
              {/* Pricing Header */}
              <div>
                <span className="text-xs font-medium text-slate-500 block">Total Investment</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {course.price_paise === 0 ? "Free" : formatCurrency(course.price_paise)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">INR, inclusive of taxes</span>
                </div>
              </div>

              {/* Action Button */}
              {course.is_enrolled ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>You are actively enrolled in this course.</span>
                  </div>
                  <Link
                    to={`/learning/${course.slug}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Continue Learning
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handlePurchaseClick}
                  disabled={initiatingPurchase}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  {initiatingPurchase ? "Preparing Checkout..." : "Purchase Course"}
                </button>
              )}

              {/* Guarantee & Inclusion List */}
              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                <span className="font-semibold text-slate-900 block">This course includes:</span>
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-blue-600" />
                  <span>Full recorded video syllabus</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>{course.access_policy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Sequential milestone unlocks</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Downloadable PDF guides & cheat sheets</span>
                </div>
              </div>

              {/* Secure Payment Badge */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Razorpay INR Gateway</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <PaymentModal
          orderData={checkoutOrder}
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}
    </div>
  );
};
