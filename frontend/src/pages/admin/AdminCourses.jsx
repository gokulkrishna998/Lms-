import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  BookOpen,
  Edit,
  Trash2,
  ExternalLink,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Upload,
} from "lucide-react";
import { adminApi, coursesApi } from "../../api/endpoints";
import { formatCurrency, formatDuration } from "../../utils/formatters";
import { useToast } from "../../context/ToastContext";

export const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const { showToast } = useToast();

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceInr, setPriceInr] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [status, setStatus] = useState("draft");
  const [outcomesText, setOutcomesText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await adminApi.getCourses();
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error("Failed to load admin courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await coursesApi.getCategories();
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCourse(null);
    setTitle("");
    setSubtitle("");
    setDescription("");
    setCategoryId(categories[0]?.id || "");
    setPriceInr("1999");
    setThumbnailUrl("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80");
    setStatus("draft");
    setOutcomesText("");
    setModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setSubtitle(course.subtitle || "");
    setDescription(course.description || "");
    setCategoryId(course.category_id || "");
    setPriceInr(course.price_inr || "0");
    setThumbnailUrl(course.thumbnail_url || "");
    setStatus(course.status);
    setOutcomesText(Array.isArray(course.learning_outcomes) ? course.learning_outcomes.join("\n") : "");
    setModalOpen(true);
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumb(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await adminApi.uploadThumbnail(formData);
      setThumbnailUrl(res.data.url);
      showToast("Thumbnail uploaded successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Thumbnail upload failed.", "error");
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Course title is required.", "error");
      return;
    }

    setSubmitting(true);
    const outcomesList = outcomesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      category_id: categoryId ? parseInt(categoryId) : null,
      price_inr: parseFloat(priceInr || 0),
      thumbnail_url: thumbnailUrl.trim(),
      status: status,
      learning_outcomes: outcomesList,
    };

    try {
      if (editingCourse) {
        await adminApi.updateCourse(editingCourse.id, payload);
        showToast("Course details updated successfully!", "success");
      } else {
        await adminApi.createCourse(payload);
        showToast("New course created successfully! You can now configure modules.", "success");
      }
      setModalOpen(false);
      fetchCourses();
    } catch (err) {
      console.error("Save error:", err);
      showToast(err.response?.data?.message || "Failed to save course.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to delete course "${courseTitle}"?`)) return;

    try {
      await adminApi.deleteCourse(courseId);
      showToast("Course deleted successfully.", "success");
      fetchCourses();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete course.", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Course Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create recorded courses, edit metadata, manage publication status, and organize curriculum
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Course
        </button>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading courses...</p>
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Thumbnail */}
                <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                  <img
                    src={
                      course.thumbnail_url ||
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80"
                    }
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm ${
                        course.status === "published"
                          ? "bg-emerald-600 text-white"
                          : course.status === "draft"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                    >
                      {course.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-0.5 rounded">
                    {course.price_paise === 0 ? "Free" : formatCurrency(course.price_paise)}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {course.subtitle || course.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-medium">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      {course.modules_count || 0} Modules
                    </span>
                    <span>•</span>
                    <span>{course.lessons_count || 0} Lessons</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 space-y-2">
                <Link
                  to={`/admin/courses/${course.id}/curriculum`}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Edit Curriculum & Lessons
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(course)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit Details
                  </button>

                  <button
                    onClick={() => handleDeleteCourse(course.id, course.title)}
                    className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-semibold text-slate-800 text-base">No Courses Created Yet</h3>
          <p className="text-xs text-slate-500 mt-1">Click below to create your first recorded course.</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            Create Course
          </button>
        </div>
      )}

      {/* Course Modal (Create & Edit) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                {editingCourse ? "Edit Course Details" : "Create New Course"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Full Stack Python & Modern React"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Subtitle
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Brief 1-line promotional description"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price (INR ₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={priceInr}
                    onChange={(e) => setPriceInr(e.target.value)}
                    placeholder="1999"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="draft">Draft (Unpublished)</option>
                    <option value="published">Published (Purchasable)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thumbnail Image URL or File Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                  <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingThumb ? "Uploading..." : "Upload File"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      disabled={uploadingThumb}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Course Description
                </label>
                <textarea
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed course overview and syllabus context..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Learning Outcomes (One per line)
                </label>
                <textarea
                  rows="3"
                  value={outcomesText}
                  onChange={(e) => setOutcomesText(e.target.value)}
                  placeholder="Build modular Flask REST APIs&#10;Implement single-device session invalidation&#10;Deploy with Razorpay integration"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingCourse ? "Update Course" : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
