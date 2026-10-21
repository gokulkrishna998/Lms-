from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.course import Course, Category, Module, Lesson
from app.models.enrollment import Enrollment
from app.utils.decorators import optional_auth

courses_bp = Blueprint("courses", __name__, url_prefix="/api/courses")

@courses_bp.route("", methods=["GET"])
def get_courses():
    """Public catalog: returns only published courses."""
    category_slug = request.args.get("category")
    search = request.args.get("search", "").strip()

    query = Course.query.filter_by(status="published")

    if category_slug:
        cat = Category.query.filter_by(slug=category_slug).first()
        if cat:
            query = query.filter_by(category_id=cat.id)

    if search:
        query = query.filter(
            (Course.title.ilike(f"%{search}%")) |
            (Course.description.ilike(f"%{search}%")) |
            (Course.subtitle.ilike(f"%{search}%"))
        )

    courses = query.order_by(Course.created_at.desc()).all()
    return jsonify({
        "courses": [c.to_dict(include_modules=False, public_view=True) for c in courses],
        "count": len(courses)
    }), 200


@courses_bp.route("/featured", methods=["GET"])
def get_featured_courses():
    """Returns top featured published courses for landing page."""
    courses = Course.query.filter_by(status="published").order_by(Course.created_at.desc()).limit(6).all()
    return jsonify({
        "courses": [c.to_dict(include_modules=False, public_view=True) for c in courses]
    }), 200


@courses_bp.route("/<slug>", methods=["GET"])
@optional_auth
def get_course_detail(slug: str):
    """
    Public Course Details:
    Displays course title, description, learning outcomes, syllabus, price, access policy.
    Does NOT leak private video URLs.
    If authenticated, indicates whether current user is actively enrolled.
    """
    course = Course.query.filter_by(slug=slug).first()
    if not course:
        return jsonify({"error": "NOT_FOUND", "message": "Course not found."}), 404

    # If course is not published, only allow admin to preview
    if course.status != "published":
        if not g.current_user or not g.current_user.is_admin():
            return jsonify({"error": "UNAVAILABLE", "message": "This course is not currently published."}), 404

    is_enrolled = False
    if g.current_user:
        enrollment = Enrollment.query.filter_by(user_id=g.current_user.id, course_id=course.id).first()
        if enrollment and enrollment.is_valid():
            is_enrolled = True

    data = course.to_dict(include_modules=True, public_view=True)
    data["is_enrolled"] = is_enrolled

    return jsonify({"course": data}), 200


@courses_bp.route("/categories", methods=["GET"])
def get_categories():
    categories = Category.query.order_by(Category.name.asc()).all()
    return jsonify({
        "categories": [c.to_dict() for c in categories]
    }), 200
