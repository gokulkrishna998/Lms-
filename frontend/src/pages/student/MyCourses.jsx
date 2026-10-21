import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, PlayCircle, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { studentApi } from "../../api/endpoints";
import { ProgressBar } from "../../components/common/ProgressBar";
import { formatDuration } from "../../utils/formatters";

export const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await studentApi.getMyCourses();
        setCourses(res.data.courses || []);
      } catch (err) {
        console.error("My courses error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-medium">Loading your enrolled courses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Courses</h1>
        <p className="mt-1 text-sm text-slate-500">
          Access all your purchased recorded courses and track your sequential progress
        </p>
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(({ enrollment, course, progress }) => (
            <div
              key={enrollment.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div>
                <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
                  <img
                    src={
                      course.thumbnail_url ||
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80"
                    }
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {progress.is_course_completed && (
                    <span className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {course.subtitle || course.description}
                  </p>

                  <div className="pt-2">
                    <ProgressBar percentage={progress.percentage} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span>
                      {progress.completed_lessons} of {progress.total_required_lessons} Lessons
                    </span>
                    <span className="font-semibold text-slate-600">{progress.percentage}%</span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to={`/learning/${course.slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all"
                >
                  <PlayCircle className="w-4 h-4" />
                  {progress.percentage === 0 ? "Start Learning" : "Continue Learning"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 max-w-lg mx-auto p-8">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Enrolled Courses Found</h3>
          <p className="text-slate-500 text-xs mt-1">
            Browse our recorded course catalog to purchase and begin learning.
          </p>
          <Link
            to="/courses"
            className="mt-5 inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
          >
            Explore Courses
          </Link>
        </div>
      )}
    </div>
  );
};
