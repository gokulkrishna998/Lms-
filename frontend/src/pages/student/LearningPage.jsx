import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  AlertCircle,
  Menu,
  X,
  Sparkles,
  RefreshCw,
  Award,
} from "lucide-react";
import { learningApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { ProgressBar } from "../../components/common/ProgressBar";
import { formatDuration } from "../../utils/formatters";

export const LearningPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [curriculumData, setCurriculumData] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [loadingCurriculum, setLoadingCurriculum] = useState(true);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [lockedError, setLockedError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openModules, setOpenModules] = useState({});
  const [completing, setCompleting] = useState(false);

  const videoRef = useRef(null);
  const lastSavedPositionRef = useRef(0);
  const hasAutoCompletedRef = useRef(false);

  // 1. Fetch complete curriculum and initial lesson target
  const fetchCurriculum = async (targetLessonId = null) => {
    try {
      const res = await learningApi.getCurriculum(slug);
      const data = res.data;
      setCurriculumData(data);

      // Auto-open all modules with at least one unlocked lesson
      const initialOpen = {};
      data.modules?.forEach((m) => {
        initialOpen[m.id] = true;
      });
      setOpenModules(initialOpen);

      // Determine which lesson to load
      const urlLessonId = searchParams.get("lesson")
        ? parseInt(searchParams.get("lesson"))
        : null;
      const resolvedId = targetLessonId || urlLessonId || data.continue_lesson_id;

      if (resolvedId) {
        setActiveLessonId(resolvedId);
      }
    } catch (err) {
      console.error("Curriculum fetch failed:", err);
      if (err.response?.status === 403) {
        showToast("You must be enrolled to view this course curriculum.", "error");
        navigate(`/courses/${slug}`);
      }
    } finally {
      setLoadingCurriculum(false);
    }
  };

  useEffect(() => {
    fetchCurriculum();
  }, [slug]);

  // 2. Fetch specific lesson content and signed playback token
  useEffect(() => {
    if (!activeLessonId) return;

    const fetchLesson = async () => {
      setLoadingLesson(true);
      setLockedError(null);
      hasAutoCompletedRef.current = false;

      try {
        const res = await learningApi.getLesson(activeLessonId);
        setActiveLesson(res.data);
        // Sync URL query
        setSearchParams({ lesson: activeLessonId }, { replace: true });
      } catch (err) {
        console.error("Lesson fetch error:", err);
        if (err.response?.status === 403) {
          const errData = err.response.data;
          setLockedError(errData.message || "This lesson is locked by sequential curriculum policy.");
        } else {
          setLockedError("Failed to load lesson content.");
        }
      } finally {
        setLoadingLesson(false);
      }
    };

    fetchLesson();
  }, [activeLessonId]);

  // 3. Setup video player position seek on lesson load
  useEffect(() => {
    if (videoRef.current && activeLesson?.progress?.last_position_seconds) {
      const initialPos = activeLesson.progress.last_position_seconds;
      const handleLoaded = () => {
        if (videoRef.current && initialPos > 0 && initialPos < videoRef.current.duration - 5) {
          videoRef.current.currentTime = initialPos;
          lastSavedPositionRef.current = initialPos;
        }
      };
      videoRef.current.addEventListener("loadedmetadata", handleLoaded);
      return () => {
        videoRef.current?.removeEventListener("loadedmetadata", handleLoaded);
      };
    }
  }, [activeLesson]);

  // 4. Periodic progress heartbeat and 90% viewing threshold check
  const handleTimeUpdate = () => {
    if (!videoRef.current || !activeLesson || lockedError) return;

    const currentTime = Math.floor(videoRef.current.currentTime);
    const duration = Math.floor(videoRef.current.duration || activeLesson.lesson.duration_seconds || 0);

    // Heartbeat: save every 5 seconds of delta
    if (Math.abs(currentTime - lastSavedPositionRef.current) >= 5) {
      lastSavedPositionRef.current = currentTime;
      learningApi.saveProgress(activeLessonId, {
        position_seconds: currentTime,
        mark_complete: false,
      }).catch((e) => console.warn("Background progress save:", e));
    }

    // 90% Viewing Threshold Auto-completion check
    if (
      duration > 0 &&
      currentTime >= duration * 0.9 &&
      !activeLesson.is_completed &&
      !hasAutoCompletedRef.current
    ) {
      hasAutoCompletedRef.current = true;
      handleMarkComplete(true);
    }
  };

  // 5. Mark as Complete handler
  const handleMarkComplete = async (isAuto = false) => {
    if (!activeLessonId) return;
    setCompleting(true);

    try {
      const currentPos = videoRef.current ? Math.floor(videoRef.current.currentTime) : 0;
      const res = await learningApi.saveProgress(activeLessonId, {
        position_seconds: currentPos,
        mark_complete: true,
      });

      // Update active lesson state
      setActiveLesson((prev) => (prev ? { ...prev, is_completed: true } : prev));

      // Refresh curriculum in background to unlock next lesson immediately
      const curRes = await learningApi.getCurriculum(slug);
      setCurriculumData(curRes.data);

      showToast(
        isAuto
          ? "Viewing threshold reached! Lesson completed and next milestone unlocked."
          : "Lesson marked as complete! Next lesson unlocked.",
        "success"
      );
    } catch (err) {
      console.error("Complete error:", err);
      showToast(err.response?.data?.message || "Failed to update completion status.", "error");
    } finally {
      setCompleting(false);
    }
  };

  const handleLessonSelect = (lesson) => {
    if (lesson.status === "locked") {
      setLockedError(lesson.lock_reason || "Complete preceding lessons to unlock this lesson.");
      setActiveLessonId(lesson.id);
      return;
    }
    setActiveLessonId(lesson.id);
    setSidebarOpen(false); // Close mobile drawer
  };

  const toggleModuleAccordion = (modId) => {
    setOpenModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  if (loadingCurriculum) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Initializing secure learning environment...</p>
      </div>
    );
  }

  const course = curriculumData?.course;
  const modules = curriculumData?.modules || [];
  const progress = curriculumData?.progress;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Learning Bar */}
      <div className="h-14 border-b border-slate-800 bg-slate-900 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/student/dashboard"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Return to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="truncate">
            <h1 className="text-sm font-bold text-white truncate max-w-md">{course?.title}</h1>
            <span className="text-[11px] text-slate-400 hidden sm:block">
              {progress?.completed_lessons} of {progress?.total_required_lessons} Lessons Completed (
              {progress?.percentage}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress Pill */}
          <div className="hidden md:flex items-center gap-2.5 w-44">
            <ProgressBar percentage={progress?.percentage} size="sm" showLabel={false} />
            <span className="text-xs font-semibold text-slate-300 shrink-0">
              {progress?.percentage}%
            </span>
          </div>

          {/* Toggle Sidebar on mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Video Player & Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-slate-950">
          {/* Video Container */}
          <div className="w-full bg-black flex items-center justify-center aspect-video max-h-[70vh] relative">
            {loadingLesson ? (
              <div className="text-center p-8">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Verifying signed playback authorization...</p>
              </div>
            ) : lockedError ? (
              /* Locked Lesson Screen */
              <div className="max-w-md mx-auto text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20 shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Lesson is Locked</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {lockedError}
                  </p>
                </div>

                {curriculumData?.continue_lesson_id && (
                  <button
                    onClick={() => setActiveLessonId(curriculumData.continue_lesson_id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md transition-all"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Jump to Current Unlocked Lesson
                  </button>
                )}
              </div>
            ) : activeLesson?.playback?.stream_url ? (
              /* HTML5 Video Player */
              <video
                ref={videoRef}
                key={activeLesson.lesson.id}
                src={activeLesson.playback.stream_url}
                controls
                playsInline
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-contain"
              >
                Your browser does not support the HTML5 video tag.
              </video>
            ) : (
              <div className="text-center p-6">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No media stream available for this lesson.</p>
              </div>
            )}
          </div>

          {/* Lesson Details & Action Bar */}
          {!lockedError && activeLesson && (
            <div className="max-w-5xl mx-auto w-full p-6 sm:p-8 space-y-6">
              {/* Controls bar: Title, Mark Complete & Prev/Next */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-blue-400 block uppercase tracking-wider">
                    {activeLesson.module.title}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {activeLesson.lesson.title}
                  </h2>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Mark as Complete Button */}
                  <button
                    onClick={() => handleMarkComplete(false)}
                    disabled={completing || activeLesson.is_completed}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      activeLesson.is_completed
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {activeLesson.is_completed ? "Completed" : completing ? "Saving..." : "Mark as Complete"}
                  </button>

                  {/* Previous Lesson */}
                  <button
                    onClick={() => activeLesson.prev_lesson_id && setActiveLessonId(activeLesson.prev_lesson_id)}
                    disabled={!activeLesson.prev_lesson_id}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
                    title="Previous Lesson"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Next Lesson */}
                  <button
                    onClick={() => activeLesson.next_lesson_id && setActiveLessonId(activeLesson.next_lesson_id)}
                    disabled={!activeLesson.next_lesson_id}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
                  >
                    <span>Next Lesson</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lesson Description */}
              {activeLesson.lesson.description && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Lesson Overview
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {activeLesson.lesson.description}
                  </p>
                </div>
              )}

              {/* Downloadable Resources */}
              {activeLesson.lesson.has_resource && activeLesson.lesson.resource_name && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">Lesson Resource Guide</h4>
                      <p className="text-[11px] text-slate-400">{activeLesson.lesson.resource_name}</p>
                    </div>
                  </div>
                  <a
                    href={`/api/uploads/resources/${activeLesson.lesson.resource_name}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              )}

              {/* Completion criteria note */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Tip: Watch at least 90% of the video or click <strong>Mark as Complete</strong> to automatically unlock the next lesson in sequence.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Expandable Curriculum Sidebar */}
        <aside
          className={`fixed lg:static top-14 bottom-0 right-0 z-30 w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-bold text-sm text-white">Course Curriculum</h3>
              <p className="text-[11px] text-slate-400">Strict sequential roadmap</p>
            </div>
            <button
              onClick={() => fetchCurriculum()}
              title="Refresh Curriculum"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Modules & Lessons List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-800">
            {modules.map((mod, modIdx) => {
              const isOpen = !!openModules[mod.id];
              return (
                <div key={mod.id} className="bg-slate-900">
                  {/* Module Accordion Header */}
                  <button
                    onClick={() => toggleModuleAccordion(mod.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
                  >
                    <div className="pr-2">
                      <span className="text-[10px] font-bold text-blue-400 block uppercase tracking-wider">
                        Module {modIdx + 1}
                      </span>
                      <h4 className="font-semibold text-xs text-slate-200 mt-0.5 line-clamp-1">
                        {mod.title}
                      </h4>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>

                  {/* Lessons List in Module */}
                  {isOpen && (
                    <div className="divide-y divide-slate-850 bg-slate-950/60">
                      {mod.lessons?.map((les) => {
                        const isCurrent = les.id === activeLessonId;
                        const isCompleted = les.is_completed;
                        const isLocked = les.status === "locked";

                        return (
                          <button
                            key={les.id}
                            onClick={() => handleLessonSelect(les)}
                            className={`w-full p-3.5 flex items-start gap-3 text-left transition-all ${
                              isCurrent
                                ? "bg-blue-600/15 border-l-4 border-blue-500"
                                : "hover:bg-slate-850/60"
                            }`}
                          >
                            {/* Icon status */}
                            <div className="mt-0.5 shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : isLocked ? (
                                <Lock className="w-4 h-4 text-slate-500" />
                              ) : (
                                <PlayCircle className="w-4 h-4 text-blue-400" />
                              )}
                            </div>

                            {/* Lesson Title & Duration */}
                            <div className="flex-1 min-w-0">
                              <span
                                className={`text-xs block line-clamp-2 leading-snug ${
                                  isCurrent
                                    ? "font-bold text-white"
                                    : isLocked
                                    ? "text-slate-400"
                                    : "text-slate-300"
                                }`}
                              >
                                {les.title}
                              </span>

                              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                                {les.duration_seconds > 0 && (
                                  <span>{formatDuration(les.duration_seconds)}</span>
                                )}
                                {les.is_free_preview && (
                                  <span className="text-emerald-400 font-semibold">• Preview</span>
                                )}
                                {isLocked && (
                                  <span className="text-amber-400/80">• Locked</span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};
