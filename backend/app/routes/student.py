from flask import Blueprint, jsonify, g
from app.models.course import Course, Lesson, Module
from app.models.enrollment import Enrollment
from app.models.progress import LessonProgress
from app.models.order import Order
from app.services.course_service import CourseService
from app.utils.decorators import login_required

student_bp = Blueprint("student", __name__, url_prefix="/api/student")

@student_bp.route("/dashboard", methods=["GET"])
@login_required
def get_dashboard():
    """
    Personalized student dashboard containing:
    - Welcome message & summary stats
    - Primary 'Continue Learning' action card
    - Enrolled courses with real-time progress bars
    - Recent order history
    """
    user = g.current_user
    enrollments = Enrollment.query.filter_by(user_id=user.id).order_by(Enrollment.created_at.desc()).all()

    enrolled_courses_data = []
    total_completed_courses = 0
    total_completed_lessons = 0
    continue_learning_candidate = None

    for enr in enrollments:
        if not enr.is_valid():
            continue

        course = enr.course
        if not course:
            continue

        progress_summary = CourseService.calculate_course_completion(user.id, course)
        if progress_summary["is_course_completed"]:
            total_completed_courses += 1
        total_completed_lessons += progress_summary["completed_lessons"]

        # Find continue learning lesson for this course
        status_map, _ = CourseService.get_user_curriculum_status(user, course)
        next_playable_lesson = None
        recently_watched_lesson = None

        ordered_items = CourseService.get_ordered_course_lessons(course)
        for mod, les in ordered_items:
            les_status = status_map.get(les.id, {})
            prog = les_status.get("progress")
            if prog and prog.get("last_position_seconds", 0) > 0 and not les_status.get("is_completed"):
                recently_watched_lesson = {
                    "lesson_id": les.id,
                    "lesson_title": les.title,
                    "module_title": mod.title,
                    "course_title": course.title,
                    "course_slug": course.slug,
                    "thumbnail_url": course.thumbnail_url,
                    "last_position": prog.get("last_position_seconds"),
                    "duration": les.duration_seconds
                }
                break
            if les_status.get("can_play") and not les_status.get("is_completed") and not next_playable_lesson:
                next_playable_lesson = {
                    "lesson_id": les.id,
                    "lesson_title": les.title,
                    "module_title": mod.title,
                    "course_title": course.title,
                    "course_slug": course.slug,
                    "thumbnail_url": course.thumbnail_url,
                    "last_position": 0,
                    "duration": les.duration_seconds
                }

        course_item = {
            "enrollment_id": enr.id,
            "course": course.to_dict(include_modules=False, public_view=False),
            "access_type": enr.access_type,
            "expires_at": enr.expires_at.isoformat() if enr.expires_at else None,
            "progress": progress_summary,
            "next_lesson": recently_watched_lesson or next_playable_lesson
        }
        enrolled_courses_data.append(course_item)

        if not continue_learning_candidate and (recently_watched_lesson or next_playable_lesson):
            continue_learning_candidate = recently_watched_lesson or next_playable_lesson

    # Recent orders
    recent_orders = Order.query.filter_by(user_id=user.id).order_by(Order.created_at.desc()).limit(5).all()

    return jsonify({
        "welcome_message": f"Welcome back, {user.name}!",
        "stats": {
            "enrolled_courses_count": len(enrolled_courses_data),
            "completed_courses_count": total_completed_courses,
            "completed_lessons_count": total_completed_lessons
        },
        "continue_learning": continue_learning_candidate,
        "enrolled_courses": enrolled_courses_data,
        "recent_orders": [o.to_dict() for o in recent_orders],
        "active_session": g.current_session.to_dict()
    }), 200


@student_bp.route("/courses", methods=["GET"])
@login_required
def get_my_courses():
    """Returns student's purchased courses."""
    user = g.current_user
    enrollments = Enrollment.query.filter_by(user_id=user.id).order_by(Enrollment.created_at.desc()).all()

    result = []
    for enr in enrollments:
        if not enr.is_valid():
            continue
        course = enr.course
        if not course:
            continue
        progress_summary = CourseService.calculate_course_completion(user.id, course)
        result.append({
            "enrollment": enr.to_dict(),
            "course": course.to_dict(include_modules=False, public_view=False),
            "progress": progress_summary
        })

    return jsonify({"courses": result}), 200
