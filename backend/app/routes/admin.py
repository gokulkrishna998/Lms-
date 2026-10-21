import re
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import User
from app.models.course import Course, Module, Lesson, Category
from app.models.order import Order, Payment
from app.models.enrollment import Enrollment
from app.models.progress import LessonProgress
from app.models.audit import AuditLog
from app.models.settings import SiteSettings
from app.services.course_service import CourseService
from app.utils.decorators import admin_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")

# ----------------- Dashboard Analytics -----------------
@admin_bp.route("/dashboard", methods=["GET"])
@admin_required
def get_admin_dashboard():
    total_students = User.query.filter_by(role="student").count()
    total_courses = Course.query.count()
    published_courses = Course.query.filter_by(status="published").count()
    total_enrollments = Enrollment.query.filter_by(status="active").count()

    confirmed_orders = Order.query.filter_by(status="paid").all()
    confirmed_payments_count = len(confirmed_orders)
    total_revenue_paise = sum(o.amount_paise for o in confirmed_orders)

    pending_orders_count = Order.query.filter_by(status="pending").count()

    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()
    recent_students = User.query.filter_by(role="student").order_by(User.created_at.desc()).limit(5).all()

    return jsonify({
        "stats": {
            "total_students": total_students,
            "total_courses": total_courses,
            "published_courses": published_courses,
            "total_enrollments": total_enrollments,
            "confirmed_payments": confirmed_payments_count,
            "total_revenue_paise": total_revenue_paise,
            "total_revenue_inr": round(total_revenue_paise / 100, 2),
            "pending_payments": pending_orders_count
        },
        "recent_orders": [o.to_dict() for o in recent_orders],
        "recent_students": [s.to_dict() for s in recent_students]
    }), 200


# ----------------- Course Management -----------------
@admin_bp.route("/courses", methods=["GET"])
@admin_required
def list_admin_courses():
    courses = Course.query.order_by(Course.created_at.desc()).all()
    return jsonify({
        "courses": [c.to_dict(include_modules=True, public_view=False) for c in courses]
    }), 200


@admin_bp.route("/courses", methods=["POST"])
@admin_required
def create_course():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "VALIDATION_ERROR", "message": "Course title is required."}), 400

    base_slug = slugify(data.get("slug") or title)
    slug = base_slug
    idx = 1
    while Course.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{idx}"
        idx += 1

    price_inr = float(data.get("price_inr") or 0)
    price_paise = int(price_inr * 100)

    course = Course(
        title=title,
        slug=slug,
        subtitle=data.get("subtitle", "").strip(),
        description=data.get("description", "").strip(),
        learning_outcomes=data.get("learning_outcomes", []),
        category_id=data.get("category_id"),
        price_paise=price_paise,
        thumbnail_url=data.get("thumbnail_url"),
        access_duration_days=data.get("access_duration_days"),
        status=data.get("status", "draft")
    )
    db.session.add(course)
    db.session.commit()

    # Log audit
    audit = AuditLog(
        user_id=g.current_user.id,
        action="COURSE_CREATED",
        resource_type="Course",
        resource_id=str(course.id),
        details=f"Created course '{course.title}' (Status: {course.status})"
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": "Course created successfully.", "course": course.to_dict(include_modules=True, public_view=False)}), 201


@admin_bp.route("/courses/<int:course_id>", methods=["GET"])
@admin_required
def get_admin_course(course_id: int):
    course = db.session.get(Course, course_id)
    if not course:
        return jsonify({"error": "NOT_FOUND", "message": "Course not found."}), 404

    # Build module and lesson data with admin details
    modules_data = []
    for mod in course.modules:
        m_dict = {
            "id": mod.id,
            "title": mod.title,
            "description": mod.description,
            "order_index": mod.order_index,
            "is_active": mod.is_active,
            "lessons": [l.to_dict(public_view=False, is_admin=True) for l in mod.lessons]
        }
        modules_data.append(m_dict)

    data = course.to_dict(include_modules=False, public_view=False)
    data["modules"] = modules_data
    return jsonify({"course": data}), 200


@admin_bp.route("/courses/<int:course_id>", methods=["PUT"])
@admin_required
def update_course(course_id: int):
    course = db.session.get(Course, course_id)
    if not course:
        return jsonify({"error": "NOT_FOUND", "message": "Course not found."}), 404

    data = request.get_json() or {}
    if "title" in data:
        course.title = data["title"].strip()
    if "subtitle" in data:
        course.subtitle = data["subtitle"].strip()
    if "description" in data:
        course.description = data["description"].strip()
    if "learning_outcomes" in data:
        course.learning_outcomes = data["learning_outcomes"]
    if "category_id" in data:
        course.category_id = data["category_id"]
    if "price_inr" in data:
        course.price_paise = int(float(data["price_inr"]) * 100)
    if "thumbnail_url" in data:
        course.thumbnail_url = data["thumbnail_url"]
    if "access_duration_days" in data:
        course.access_duration_days = data["access_duration_days"]
    if "status" in data and data["status"] in ("draft", "published", "archived"):
        prev_status = course.status
        course.status = data["status"]
        if prev_status != course.status:
            audit = AuditLog(
                user_id=g.current_user.id,
                action=f"COURSE_STATUS_CHANGED_{course.status.upper()}",
                resource_type="Course",
                resource_id=str(course.id),
                details=f"Course '{course.title}' status changed from {prev_status} to {course.status}"
            )
            db.session.add(audit)

    course.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({"message": "Course updated successfully.", "course": course.to_dict(include_modules=True, public_view=False)}), 200


@admin_bp.route("/courses/<int:course_id>", methods=["DELETE"])
@admin_required
def delete_course(course_id: int):
    course = db.session.get(Course, course_id)
    if not course:
        return jsonify({"error": "NOT_FOUND", "message": "Course not found."}), 404

    # Check if there are active enrollments
    enrollment_count = Enrollment.query.filter_by(course_id=course.id, status="active").count()
    if enrollment_count > 0:
        return jsonify({
            "error": "CANNOT_DELETE",
            "message": f"Cannot delete course because it has {enrollment_count} active student enrollments. Set status to 'archived' instead."
        }), 400

    title = course.title
    db.session.delete(course)

    audit = AuditLog(
        user_id=g.current_user.id,
        action="COURSE_DELETED",
        resource_type="Course",
        resource_id=str(course_id),
        details=f"Deleted course '{title}'"
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": "Course deleted successfully."}), 200


# ----------------- Module Management -----------------
@admin_bp.route("/courses/<int:course_id>/modules", methods=["POST"])
@admin_required
def create_module(course_id: int):
    course = db.session.get(Course, course_id)
    if not course:
        return jsonify({"error": "NOT_FOUND", "message": "Course not found."}), 404

    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "VALIDATION_ERROR", "message": "Module title is required."}), 400

    max_order = db.session.query(db.func.max(Module.order_index)).filter_by(course_id=course.id).scalar() or 0

    mod = Module(
        course_id=course.id,
        title=title,
        description=data.get("description", "").strip(),
        order_index=max_order + 1,
        is_active=True
    )
    db.session.add(mod)
    db.session.commit()

    return jsonify({"message": "Module created successfully.", "module": mod.to_dict(public_view=False)}), 201


@admin_bp.route("/modules/<int:module_id>", methods=["PUT"])
@admin_required
def update_module(module_id: int):
    mod = db.session.get(Module, module_id)
    if not mod:
        return jsonify({"error": "NOT_FOUND", "message": "Module not found."}), 404

    data = request.get_json() or {}
    if "title" in data:
        mod.title = data["title"].strip()
    if "description" in data:
        mod.description = data["description"].strip()
    if "order_index" in data:
        mod.order_index = int(data["order_index"])
    if "is_active" in data:
        mod.is_active = bool(data["is_active"])

    db.session.commit()
    return jsonify({"message": "Module updated successfully.", "module": mod.to_dict(public_view=False)}), 200


@admin_bp.route("/modules/<int:module_id>", methods=["DELETE"])
@admin_required
def delete_module(module_id: int):
    mod = db.session.get(Module, module_id)
    if not mod:
        return jsonify({"error": "NOT_FOUND", "message": "Module not found."}), 404

    db.session.delete(mod)
    db.session.commit()
    return jsonify({"message": "Module deleted successfully."}), 200


# ----------------- Lesson Management -----------------
@admin_bp.route("/modules/<int:module_id>/lessons", methods=["POST"])
@admin_required
def create_lesson(module_id: int):
    mod = db.session.get(Module, module_id)
    if not mod:
        return jsonify({"error": "NOT_FOUND", "message": "Module not found."}), 404

    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "VALIDATION_ERROR", "message": "Lesson title is required."}), 400

    max_order = db.session.query(db.func.max(Lesson.order_index)).filter_by(module_id=mod.id).scalar() or 0

    duration_minutes = float(data.get("duration_minutes") or 0)
    duration_seconds = int(duration_minutes * 60) if duration_minutes > 0 else int(data.get("duration_seconds") or 0)

    lesson = Lesson(
        module_id=mod.id,
        title=title,
        description=data.get("description", "").strip(),
        video_provider=data.get("video_provider", "local_secure"),
        video_asset_id=data.get("video_asset_id"),
        duration_seconds=duration_seconds,
        resource_url=data.get("resource_url"),
        resource_name=data.get("resource_name"),
        order_index=max_order + 1,
        is_required=bool(data.get("is_required", True)),
        is_free_preview=bool(data.get("is_free_preview", False)),
        is_published=bool(data.get("is_published", True))
    )
    db.session.add(lesson)
    db.session.commit()

    return jsonify({"message": "Lesson created successfully.", "lesson": lesson.to_dict(public_view=False, is_admin=True)}), 201


@admin_bp.route("/lessons/<int:lesson_id>", methods=["PUT"])
@admin_required
def update_lesson(lesson_id: int):
    lesson = db.session.get(Lesson, lesson_id)
    if not lesson:
        return jsonify({"error": "NOT_FOUND", "message": "Lesson not found."}), 404

    data = request.get_json() or {}
    if "title" in data:
        lesson.title = data["title"].strip()
    if "description" in data:
        lesson.description = data["description"].strip()
    if "video_provider" in data:
        lesson.video_provider = data["video_provider"]
    if "video_asset_id" in data:
        lesson.video_asset_id = data["video_asset_id"]
    if "duration_seconds" in data:
        lesson.duration_seconds = int(data["duration_seconds"])
    elif "duration_minutes" in data:
        lesson.duration_seconds = int(float(data["duration_minutes"]) * 60)
    if "resource_url" in data:
        lesson.resource_url = data["resource_url"]
    if "resource_name" in data:
        lesson.resource_name = data["resource_name"]
    if "order_index" in data:
        lesson.order_index = int(data["order_index"])
    if "is_required" in data:
        lesson.is_required = bool(data["is_required"])
    if "is_free_preview" in data:
        lesson.is_free_preview = bool(data["is_free_preview"])
    if "is_published" in data:
        lesson.is_published = bool(data["is_published"])

    db.session.commit()
    return jsonify({"message": "Lesson updated successfully.", "lesson": lesson.to_dict(public_view=False, is_admin=True)}), 200


@admin_bp.route("/lessons/<int:lesson_id>", methods=["DELETE"])
@admin_required
def delete_lesson(lesson_id: int):
    lesson = db.session.get(Lesson, lesson_id)
    if not lesson:
        return jsonify({"error": "NOT_FOUND", "message": "Lesson not found."}), 404

    db.session.delete(lesson)
    db.session.commit()
    return jsonify({"message": "Lesson deleted successfully."}), 200


@admin_bp.route("/reorder", methods=["POST"])
@admin_required
def reorder_curriculum():
    """Batch reorders modules or lessons."""
    data = request.get_json() or {}
    item_type = data.get("type") # "modules" or "lessons"
    items = data.get("items", []) # list of {"id": int, "order_index": int}

    if item_type == "modules":
        for item in items:
            m = db.session.get(Module, item["id"])
            if m:
                m.order_index = item["order_index"]
    elif item_type == "lessons":
        for item in items:
            l = db.session.get(Lesson, item["id"])
            if l:
                l.order_index = item["order_index"]
                if "module_id" in item:
                    l.module_id = item["module_id"]

    db.session.commit()
    return jsonify({"message": f"{item_type.capitalize()} reordered successfully."}), 200


# ----------------- Student Management -----------------
@admin_bp.route("/students", methods=["GET"])
@admin_required
def list_students():
    search = request.args.get("search", "").strip()
    query = User.query.filter_by(role="student")

    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )

    students = query.order_by(User.created_at.desc()).all()
    results = []
    for s in students:
        s_data = s.to_dict()
        enrollments = Enrollment.query.filter_by(user_id=s.id).all()
        s_data["enrollments_count"] = len(enrollments)
        s_data["orders_count"] = Order.query.filter_by(user_id=s.id, status="paid").count()
        results.append(s_data)

    return jsonify({"students": results}), 200


@admin_bp.route("/students/<int:student_id>", methods=["GET"])
@admin_required
def get_student_details(student_id: int):
    student = db.session.get(User, student_id)
    if not student or student.role != "student":
        return jsonify({"error": "NOT_FOUND", "message": "Student not found."}), 404

    enrollments = Enrollment.query.filter_by(user_id=student.id).all()
    orders = Order.query.filter_by(user_id=student.id).order_by(Order.created_at.desc()).all()

    enrolled_courses = []
    for e in enrollments:
        c = e.course
        comp = CourseService.calculate_course_completion(student.id, c) if c else None
        enrolled_courses.append({
            "enrollment": e.to_dict(),
            "course": c.to_dict(include_modules=False, public_view=False) if c else None,
            "progress": comp
        })

    return jsonify({
        "student": student.to_dict(),
        "enrollments": enrolled_courses,
        "orders": [o.to_dict() for o in orders]
    }), 200


@admin_bp.route("/students/<int:student_id>/status", methods=["PUT"])
@admin_required
def toggle_student_status(student_id: int):
    student = db.session.get(User, student_id)
    if not student:
        return jsonify({"error": "NOT_FOUND", "message": "Student not found."}), 404

    data = request.get_json() or {}
    is_active = bool(data.get("is_active", True))
    student.is_active = is_active

    # If deactivating, invalidate their active sessions immediately
    if not is_active:
        from app.models.session import ActiveSession
        ActiveSession.query.filter_by(user_id=student.id).update({"is_active": False})

    audit = AuditLog(
        user_id=g.current_user.id,
        action="STUDENT_STATUS_CHANGED",
        resource_type="User",
        resource_id=str(student.id),
        details=f"Student '{student.email}' status changed to {'Active' if is_active else 'Deactivated'}"
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": f"Student status updated to {'Active' if is_active else 'Deactivated'}.", "student": student.to_dict()}), 200


@admin_bp.route("/enrollments/<int:enrollment_id>/revoke", methods=["POST"])
@admin_required
def revoke_enrollment(enrollment_id: int):
    enrollment = db.session.get(Enrollment, enrollment_id)
    if not enrollment:
        return jsonify({"error": "NOT_FOUND", "message": "Enrollment not found."}), 404

    data = request.get_json() or {}
    reason = data.get("reason", "Revoked by administrator")

    enrollment.status = "revoked"
    enrollment.updated_at = datetime.now(timezone.utc)

    audit = AuditLog(
        user_id=g.current_user.id,
        action="ENROLLMENT_REVOKED",
        resource_type="Enrollment",
        resource_id=str(enrollment.id),
        details=f"Revoked enrollment for Student ID {enrollment.user_id} on Course ID {enrollment.course_id}. Reason: {reason}"
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": "Course access revoked successfully.", "enrollment": enrollment.to_dict()}), 200


# ----------------- Orders & Payments -----------------
@admin_bp.route("/orders", methods=["GET"])
@admin_required
def list_admin_orders():
    status = request.args.get("status")
    query = Order.query

    if status and status != "all":
        query = query.filter_by(status=status)

    orders = query.order_by(Order.created_at.desc()).all()
    return jsonify({"orders": [o.to_dict() for o in orders]}), 200


# ----------------- Settings & Audit Logs -----------------
@admin_bp.route("/settings", methods=["GET"])
@admin_required
def get_settings():
    settings = SiteSettings.query.all()
    defaults = {
        "site_name": "Mini LMS",
        "support_email": "support@minilms.com",
        "currency_symbol": "₹",
        "currency_code": "INR",
        "hero_heading": "Master Practical Skills with High-Quality Recorded Courses",
        "hero_subheading": "Structured, step-by-step video courses designed to take you from foundational basics to industry mastery.",
    }
    settings_dict = {**defaults}
    for s in settings:
        settings_dict[s.key] = s.value

    return jsonify({"settings": settings_dict}), 200


@admin_bp.route("/settings", methods=["POST"])
@admin_required
def update_settings():
    data = request.get_json() or {}
    for k, v in data.items():
        SiteSettings.set_setting(k, str(v))

    audit = AuditLog(
        user_id=g.current_user.id,
        action="SITE_SETTINGS_UPDATED",
        resource_type="SiteSettings",
        details="Updated website configurations and general settings."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": "Settings updated successfully."}), 200


@admin_bp.route("/audit-logs", methods=["GET"])
@admin_required
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(50).all()
    return jsonify({"logs": [l.to_dict() for l in logs]}), 200
