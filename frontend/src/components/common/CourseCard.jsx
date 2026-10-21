import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Clock, CheckCircle } from "lucide-react";
import { formatCurrency, formatDuration } from "../../utils/formatters";

export const CourseCard = ({ course, isEnrolled = false }) => {
  const fallbackThumbnail =
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden group">
      {/* Thumbnail */}
      <Link to={`/courses/${course.slug}`} className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={course.thumbnail_url || fallbackThumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = fallbackThumbnail;
          }}
        />
        {course.category && (
          <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm">
            {course.category.name}
          </span>
        )}
        {isEnrolled && (
          <span className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Enrolled
          </span>
        )}
      </Link>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-5">
        <Link to={`/courses/${course.slug}`}>
          <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
            {course.title}
          </h3>
        </Link>
        <p className="mt-2 text-slate-500 text-sm line-clamp-2 leading-relaxed">
          {course.subtitle || course.description}
        </p>

        {/* Course Meta (Duration & Lessons) */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>{course.lessons_count || 0} Lessons</span>
          </div>
          {course.total_duration_seconds > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDuration(course.total_duration_seconds)}</span>
            </div>
          )}
        </div>

        {/* Price and CTA */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Course Fee</span>
            <span className="text-lg font-bold text-slate-900">
              {course.price_paise === 0 ? "Free" : formatCurrency(course.price_paise)}
            </span>
          </div>

          <Link
            to={isEnrolled ? `/learning/${course.slug}` : `/courses/${course.slug}`}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isEnrolled
                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/10"
            }`}
          >
            {isEnrolled ? "Continue Learning" : "View Course"}
          </Link>
        </div>
      </div>
    </div>
  );
};
