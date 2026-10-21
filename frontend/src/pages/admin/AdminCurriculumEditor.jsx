import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  PlayCircle,
  Lock,
  Edit,
  Trash2,
  Upload,
  Video,
  FileText,
  CheckCircle2,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
} from "lucide-react";
import { adminApi } from "../../api/endpoints";
import { formatDuration } from "../../utils/formatters";
import { useToast } from "../../context/ToastContext";

export const AdminCurriculumEditor = () => {
  const { courseId } = useParams();
  const { showToast } = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // Module modal
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [modTitle, setModTitle] = useState("");
  const [modDesc, setModDesc] = useState("");

  // Lesson modal
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [targetModuleId, setTargetModuleId] = useState(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDesc, setLessonDesc] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("10");
  const [videoProvider, setVideoProvider] = useState("local_secure");
  const [videoAssetId, setVideoAssetId] = useState("sample_lesson.mp4");
  const [isRequired, setIsRequired] = useState(true);
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [resourceName, setResourceName] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCourseCurriculum = async () => {
    try {
      const res = await adminApi.getCourse(courseId);
      setCourse(res.data.course);
    } catch (err) {
      console.error("Failed to load course curriculum:", err);
      showToast("Failed to load course curriculum.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseCurriculum();
  }, [courseId]);

  // Module Handlers
  const openCreateModule = () => {
    setEditingModule(null);
    setModTitle("");
    setModDesc("");
    setModuleModalOpen(true);
  };

  const openEditModule = (mod) => {
    setEditingModule(mod);
    setModTitle(mod.title);
    setModDesc(mod.description || "");
    setModuleModalOpen(true);
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!modTitle.trim()) return;

    try {
      if (editingModule) {
        await adminApi.updateModule(editingModule.id, {
          title: modTitle.trim(),
          description: modDesc.trim(),
        });
        showToast("Module updated successfully.", "success");
      } else {
        await adminApi.createModule(courseId, {
          title: modTitle.trim(),
          description: modDesc.trim(),
        });
        showToast("Module created successfully.", "success");
      }
      setModuleModalOpen(false);
      fetchCourseCurriculum();
    } catch (err) {
      showToast(err.response?.data?.message || "Module operation failed.", "error");
    }
  };

  const handleDeleteModule = async (modId, title) => {
    if (!window.confirm(`Delete module "${title}" and all its lessons?`)) return;
    try {
      await adminApi.deleteModule(modId);
      showToast("Module deleted successfully.", "success");
      fetchCourseCurriculum();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete module.", "error");
    }
  };

  // Lesson Handlers
  const openCreateLesson = (modId) => {
    setTargetModuleId(modId);
    setEditingLesson(null);
    setLessonTitle("");
    setLessonDesc("");
    setDurationMinutes("10");
    setVideoProvider("local_secure");
    setVideoAssetId("sample_lesson.mp4");
    setIsRequired(true);
    setIsFreePreview(false);
    setIsPublished(true);
    setResourceName("");
    setLessonModalOpen(true);
  };

  const openEditLesson = (les) => {
    setTargetModuleId(les.module_id);
    setEditingLesson(les);
    setLessonTitle(les.title);
    setLessonDesc(les.description || "");
    setDurationMinutes(String(Math.round((les.duration_seconds || 0) / 60) || 5));
    setVideoProvider(les.video_provider || "local_secure");
    setVideoAssetId(les.video_asset_id || "");
    setIsRequired(les.is_required);
    setIsFreePreview(les.is_free_preview);
    setIsPublished(les.is_published);
    setResourceName(les.resource_name || "");
    setLessonModalOpen(true);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await adminApi.uploadVideo(formData);
      setVideoAssetId(res.data.video_asset_id);
      showToast("Video uploaded & registered securely!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Video upload failed.", "error");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleResourceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await adminApi.uploadResource(formData);
      setResourceName(res.data.filename);
      showToast("PDF Resource uploaded successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Resource upload failed.", "error");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;

    setSubmitting(true);
    const payload = {
      title: lessonTitle.trim(),
      description: lessonDesc.trim(),
      duration_minutes: parseFloat(durationMinutes || 0),
      video_provider: videoProvider,
      video_asset_id: videoAssetId.trim(),
      is_required: isRequired,
      is_free_preview: isFreePreview,
      is_published: isPublished,
      resource_name: resourceName.trim() || null,
    };

    try {
      if (editingLesson) {
        await adminApi.updateLesson(editingLesson.id, payload);
        showToast("Lesson updated successfully.", "success");
      } else {
        await adminApi.createLesson(targetModuleId, payload);
        showToast("Lesson added to curriculum successfully.", "success");
      }
      setLessonModalOpen(false);
      fetchCourseCurriculum();
    } catch (err) {
      console.error("Save lesson error:", err);
      showToast(err.response?.data?.message || "Failed to save lesson.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lesId, title) => {
    if (!window.confirm(`Delete lesson "${title}"?`)) return;
    try {
      await adminApi.deleteLesson(lesId);
      showToast("Lesson deleted successfully.", "success");
      fetchCourseCurriculum();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete lesson.", "error");
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading course curriculum editor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/courses"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{course?.title}</h1>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  course?.status === "published"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {course?.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Curriculum Manager • Modules, Lessons, Protected Video Assets & Sequential Rules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={openCreateModule}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Module
          </button>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        {course?.modules && course.modules.length > 0 ? (
          course.modules.map((mod, modIdx) => (
            <div
              key={mod.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
            >
              {/* Module Bar */}
              <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 block uppercase tracking-wider">
                    Module {modIdx + 1}
                  </span>
                  <h3 className="font-bold text-base text-slate-900">{mod.title}</h3>
                  {mod.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => openCreateLesson(mod.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-700 hover:bg-blue-600/20 text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Lesson
                  </button>
                  <button
                    onClick={() => openEditModule(mod)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                    title="Edit Module Name"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(mod.id, mod.title)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Delete Module"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lessons within Module */}
              <div className="divide-y divide-slate-100">
                {mod.lessons && mod.lessons.length > 0 ? (
                  mod.lessons.map((les, lesIdx) => (
                    <div
                      key={les.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {lesIdx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900 text-sm">{les.title}</span>
                            {les.is_free_preview && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Free Preview
                              </span>
                            )}
                            {les.is_required ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                                Required Unlocking
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                Optional
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                            <span>Duration: {formatDuration(les.duration_seconds)}</span>
                            <span>•</span>
                            <span className="font-mono text-[11px] text-slate-500">
                              Asset: {les.video_asset_id || "sample_lesson.mp4"}
                            </span>
                            {les.resource_name && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 font-medium">
                                  PDF: {les.resource_name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => openEditLesson(les)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(les.id, les.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Lesson"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No lessons yet in this module. Click "Add Lesson" above.
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-800 text-base">Curriculum is Empty</h3>
            <p className="text-xs text-slate-500 mt-1">
              Start by creating Module 1 for this recorded course.
            </p>
            <button
              onClick={openCreateModule}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Add First Module
            </button>
          </div>
        )}
      </div>

      {/* Module Modal */}
      {moduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingModule ? "Edit Module" : "Create New Module"}
              </h3>
              <button
                onClick={() => setModuleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Module Title *
                </label>
                <input
                  type="text"
                  required
                  value={modTitle}
                  onChange={(e) => setModTitle(e.target.value)}
                  placeholder="e.g. Module 1: Python Fundamentals"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows="3"
                  value={modDesc}
                  onChange={(e) => setModDesc(e.target.value)}
                  placeholder="Summary of what this module covers..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                >
                  Save Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {lessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingLesson ? "Edit Lesson Content" : "Add Recorded Lesson"}
              </h3>
              <button
                onClick={() => setLessonModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g. Lesson 1: Development Environment Setup"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Video Provider
                  </label>
                  <select
                    value={videoProvider}
                    onChange={(e) => setVideoProvider(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="local_secure">Local Protected Storage (HMAC Signed)</option>
                    <option value="external_secure">External Secure Stream (Cloudflare / HLS)</option>
                  </select>
                </div>
              </div>

              {/* Video Asset Configuration */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Video Asset Identifier / File
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoAssetId}
                    onChange={(e) => setVideoAssetId(e.target.value)}
                    placeholder="sample_lesson.mp4 or private video URL"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                  <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Video className="w-3.5 h-3.5" />
                    <span>{uploadingVideo ? "Uploading..." : "Upload MP4"}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* PDF Resource */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Downloadable PDF Guide / Resource
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resourceName}
                    onChange={(e) => setResourceName(e.target.value)}
                    placeholder="Cheatsheet.pdf"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                  <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer flex items-center gap-1.5 shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{uploadingPdf ? "Uploading..." : "Upload PDF"}</span>
                    <input
                      type="file"
                      accept=".pdf,.zip"
                      onChange={handleResourceUpload}
                      disabled={uploadingPdf}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lesson Description / Notes
                </label>
                <textarea
                  rows="3"
                  value={lessonDesc}
                  onChange={(e) => setLessonDesc(e.target.value)}
                  placeholder="Key concepts, commands, or references discussed in this lesson..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Toggles */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700">
                    Required Lesson (Must be completed to unlock subsequent lessons)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFreePreview}
                    onChange={(e) => setIsFreePreview(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-emerald-700">
                    Free Preview (Can be watched by prospective students without enrollment)
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLessonModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingLesson ? "Update Lesson" : "Add Lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
