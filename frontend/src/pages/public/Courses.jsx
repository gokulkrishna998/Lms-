import React, { useEffect, useState } from "react";
import { Search, BookOpen, Filter, X } from "lucide-react";
import { coursesApi } from "../../api/endpoints";
import { CourseCard } from "../../components/common/CourseCard";

export const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await coursesApi.getCategories();
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedCategory) params.category = selectedCategory;
        if (searchTerm) params.search = searchTerm;
        const res = await coursesApi.getAll(params);
        setCourses(res.data.courses || []);
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchCourses();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full">
      {/* Header */}
      <div className="max-w-3xl mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Course Catalog
        </h1>
        <p className="mt-2 text-slate-600 text-base">
          Browse our recorded video courses. Each course features a structured curriculum, free preview lessons, and sequential mastery.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, topics, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === ""
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.slug
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse space-y-4">
              <div className="aspect-video bg-slate-200 rounded-xl" />
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-8 bg-slate-200 rounded w-1/3 pt-4" />
            </div>
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-xl mx-auto p-8">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No courses match your criteria</h3>
          <p className="text-slate-500 text-sm mt-1">
            Try adjusting your search query or select another category filter.
          </p>
          {(searchTerm || selectedCategory) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
