import os
import io
from flask import Blueprint, request, jsonify, g, send_file, current_app
from app.extensions import db
from app.models.course import Course, Lesson, Module
from app.models.enrollment import Enrollment
from app.services.course_service import CourseService
from app.services.video_service import VideoService
from app.utils.decorators import login_required, optional_auth

learning_bp = Blueprint("learning", __name__, url_prefix="/api/learning")

@learning_bp.route("/courses/<slug>/curriculum", methods=["GET"])
@login_required
def get_course_curriculum(slug: str):
    """
    Returns the complete curriculum for the enrolled student with sequential lock/unlock status
    for each lesson, overall progress %, and the next lesson to continue learning.
    """
    course = Course.query.filter_by(slug=slug).first()
    if not course:
        return jsonify({"error": "NOT_FOUND", "message": "Course not found."}), 404

    user = g.current_user
    status_map, is_enrolled = CourseService.get_user_curriculum_status(user, course)

    if not is_enrolled and not user.is_admin():
        return jsonify({
            "error": "NOT_ENROLLED",
            "message": "You are not enrolled in this course.",
            "course": course.to_dict(include_modules=False, public_view=True)
        }), 403

    modules_data = []
    first_unlocked_lesson_id = None
    last_accessed_lesson_id = None

    for mod in course.modules:
        if not mod.is_active:
            continue
        mod_dict = {
            "id": mod.id,
            "title": mod.title,
            "description": mod.description,
            "order_index": mod.order_index,
            "lessons": []
        }
        for les in mod.lessons:
            if not les.is_published:
                continue
            les_status = status_map.get(les.id, {
                "status": "locked",
                "is_completed": False,
                "can_play": False,
                "lock_reason": "Curriculum locked.",
                "progress": None
            })

            les_dict = les.to_dict(public_view=False, is_enrolled=is_enrolled, is_admin=user.is_admin())
            les_dict.update({
                "status": les_status["status"],
                "is_completed": les_status["is_completed"],
                "can_play": les_status["can_play"],
                "lock_reason": les_status["lock_reason"],
                "progress": les_status["progress"]
            })

            if les_status["can_play"] and not les_status["is_completed"] and not first_unlocked_lesson_id:
                first_unlocked_lesson_id = les.id

            if les_status["progress"] and les_status["progress"]["last_position_seconds"] > 0:
                last_accessed_lesson_id = les.id

            mod_dict["lessons"].append(les_dict)

        modules_data.append(mod_dict)

    progress_summary = CourseService.calculate_course_completion(user.id, course)

    # Determine recommended "Continue Learning" lesson
    continue_lesson_id = last_accessed_lesson_id or first_unlocked_lesson_id
    if not continue_lesson_id and modules_data and modules_data[0]["lessons"]:
        continue_lesson_id = modules_data[0]["lessons"][0]["id"]

    return jsonify({
        "course": course.to_dict(include_modules=False, public_view=False),
        "modules": modules_data,
        "progress": progress_summary,
        "continue_lesson_id": continue_lesson_id
    }), 200


@learning_bp.route("/lessons/<int:lesson_id>", methods=["GET"])
@optional_auth
def get_lesson_content(lesson_id: int):
    """
    Authorization check & secure playback token generator.
    Enforces sequential unlock: students CANNOT bypass restrictions by passing arbitrary lesson IDs.
    """
    lesson = db.session.get(Lesson, lesson_id)
    if not lesson or not lesson.is_published:
        return jsonify({"error": "NOT_FOUND", "message": "Lesson not found."}), 404

    course = lesson.module.course
    user = g.current_user

    # Backend sequential unlock check
    can_access, reason = CourseService.can_access_lesson(user, lesson)
    if not can_access:
        return jsonify({
            "error": "LESSON_LOCKED",
            "message": reason,
            "lesson_id": lesson.id,
            "title": lesson.title
        }), 403

    # Generate short-lived signed playback token
    token_data, token_err = VideoService.generate_signed_token(user, lesson)
    if token_err:
        return jsonify({"error": "TOKEN_ERROR", "message": token_err}), 400

    # Find previous and next lesson IDs in sequential order
    ordered_items = CourseService.get_ordered_course_lessons(course)
    ordered_lesson_ids = [les.id for mod, les in ordered_items]

    current_idx = -1
    try:
        current_idx = ordered_lesson_ids.index(lesson.id)
    except ValueError:
        pass

    prev_lesson_id = ordered_lesson_ids[current_idx - 1] if current_idx > 0 else None
    next_lesson_id = ordered_lesson_ids[current_idx + 1] if current_idx >= 0 and current_idx < len(ordered_lesson_ids) - 1 else None

    # Retrieve user's current progress on this lesson
    status_map, is_enrolled = CourseService.get_user_curriculum_status(user, course)
    cur_status = status_map.get(lesson.id, {})

    return jsonify({
        "lesson": lesson.to_dict(public_view=False, is_enrolled=is_enrolled, is_admin=bool(user and user.is_admin())),
        "course": {
            "id": course.id,
            "title": course.title,
            "slug": course.slug
        },
        "module": {
            "id": lesson.module.id,
            "title": lesson.module.title
        },
        "playback": token_data,
        "progress": cur_status.get("progress"),
        "is_completed": cur_status.get("is_completed", False),
        "prev_lesson_id": prev_lesson_id,
        "next_lesson_id": next_lesson_id
    }), 200


@learning_bp.route("/lessons/<int:lesson_id>/progress", methods=["POST"])
@login_required
def save_lesson_progress(lesson_id: int):
    """
    Records playback position and completes lesson if 90% threshold or explicit mark complete.
    Prevents unauthorized or locked lesson progress updates.
    """
    lesson = db.session.get(Lesson, lesson_id)
    if not lesson or not lesson.is_published:
        return jsonify({"error": "NOT_FOUND", "message": "Lesson not found."}), 404

    data = request.get_json() or {}
    position_seconds = int(data.get("position_seconds", 0))
    mark_complete = bool(data.get("mark_complete", False))

    user = g.current_user
    success, msg, progress = CourseService.update_progress(user, lesson, position_seconds, mark_complete)
    if not success:
        return jsonify({"error": "PROGRESS_REJECTED", "message": msg}), 403

    course = lesson.module.course
    updated_progress_summary = CourseService.calculate_course_completion(user.id, course)

    return jsonify({
        "message": msg,
        "progress": progress.to_dict() if progress else None,
        "course_progress": updated_progress_summary
    }), 200


@learning_bp.route("/lessons/<int:lesson_id>/stream", methods=["GET"])
def stream_lesson_video(lesson_id: int):
    """
    Protected video stream delivery.
    Requires valid, unexpired HMAC signed playback token.
    Supports HTTP Range requests (206 Partial Content) for seeking.
    """
    token = request.args.get("token")
    is_valid, payload, err_msg = VideoService.verify_token(token, lesson_id)
    if not is_valid:
        return jsonify({"error": "UNAUTHORIZED_STREAM", "message": err_msg}), 403

    lesson = db.session.get(Lesson, lesson_id)
    if not lesson:
        return jsonify({"error": "NOT_FOUND", "message": "Lesson not found."}), 404

    # Check if a physical local video asset exists
    video_path = lesson.video_asset_id
    if video_path and not os.path.isabs(video_path):
        video_path = os.path.join(current_app.config["UPLOAD_FOLDER"], "videos", video_path)

    if video_path and os.path.exists(video_path):
        range_header = request.headers.get("Range")
        return VideoService.get_range_response(video_path, range_header)

    # If external secure URL is specified
    if lesson.video_provider == "external_secure" and lesson.video_asset_id and lesson.video_asset_id.startswith(("http://", "https://")):
        return jsonify({"stream_url": lesson.video_asset_id}), 200

    # Demo / sample fallback: Generate or serve a demo MP4 or clear placeholder stream
    # so testing and demonstration work seamlessly out of the box
    demo_video_path = os.path.join(current_app.config["UPLOAD_FOLDER"], "videos", "sample_lesson.mp4")
    if os.path.exists(demo_video_path):
        range_header = request.headers.get("Range")
        return VideoService.get_range_response(demo_video_path, range_header)

    # Fallback to minimal valid video container or informative JSON
    return jsonify({
        "message": "Protected video authorization verified. Media asset is queued or hosted privately.",
        "lesson_id": lesson.id,
        "title": lesson.title,
        "duration_seconds": lesson.duration_seconds
    }), 200
