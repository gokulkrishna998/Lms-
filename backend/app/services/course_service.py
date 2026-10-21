from datetime import datetime, timezone
from app.extensions import db
from app.models.course import Course, Module, Lesson
from app.models.enrollment import Enrollment
from app.models.progress import LessonProgress
from app.models.user import User

class CourseService:
    @staticmethod
    def get_ordered_course_lessons(course: Course):
        """
        Returns a flat list of (module, lesson) tuples in strict curriculum order:
        Module 1 -> Lesson 1, Lesson 2... Module 2 -> Lesson 1...
        Only includes active modules and published lessons.
        """
        ordered = []
        modules = Module.query.filter_by(course_id=course.id, is_active=True).order_by(Module.order_index.asc()).all()
        for mod in modules:
            lessons = Lesson.query.filter_by(module_id=mod.id, is_published=True).order_by(Lesson.order_index.asc()).all()
            for les in lessons:
                ordered.append((mod, les))
        return ordered

    @staticmethod
    def get_user_curriculum_status(user: User, course: Course):
        """
        Calculates strict sequential unlocking status for all lessons in a course for a given user.
        Returns a dictionary mapping lesson_id to:
        {
            "status": "completed" | "unlocked" | "locked",
            "is_completed": bool,
            "can_play": bool,
            "lock_reason": str or None,
            "progress": dict or None
        }
        """
        is_admin = user and user.is_admin()
        enrollment = None
        if user and not is_admin:
            enrollment = Enrollment.query.filter_by(user_id=user.id, course_id=course.id).first()
        
        is_enrolled = (enrollment is not None and enrollment.is_valid()) or is_admin

        # Fetch all progress records for this user & course
        progress_records = {}
        if user:
            records = LessonProgress.query.filter_by(user_id=user.id, course_id=course.id).all()
            for r in records:
                progress_records[r.lesson_id] = r

        ordered_items = CourseService.get_ordered_course_lessons(course)
        status_map = {}

        if is_admin:
            # Admins have full preview access to all lessons
            for mod, les in ordered_items:
                prog = progress_records.get(les.id)
                status_map[les.id] = {
                    "status": "completed" if (prog and prog.is_completed) else "unlocked",
                    "is_completed": bool(prog and prog.is_completed),
                    "can_play": True,
                    "lock_reason": None,
                    "progress": prog.to_dict() if prog else None
                }
            return status_map, is_enrolled

        if not is_enrolled:
            # Non-enrolled students can only watch free preview lessons
            for mod, les in ordered_items:
                if les.is_free_preview:
                    prog = progress_records.get(les.id)
                    status_map[les.id] = {
                        "status": "unlocked",
                        "is_completed": bool(prog and prog.is_completed),
                        "can_play": True,
                        "lock_reason": None,
                        "progress": prog.to_dict() if prog else None
                    }
                else:
                    status_map[les.id] = {
                        "status": "locked",
                        "is_completed": False,
                        "can_play": False,
                        "lock_reason": "Enroll in the course to unlock this lesson.",
                        "progress": None
                    }
            return status_map, is_enrolled

        # Enrolled student: enforce strict sequential unlocking
        # Rule 1: First required lesson is unlocked.
        # Rule 2: Each required lesson must be completed before the next lesson unlocks.
        # Rule 3: Completed lessons remain completed and replayable.
        has_found_current_incomplete = False
        blocking_lesson_title = None

        for mod, les in ordered_items:
            prog = progress_records.get(les.id)
            is_comp = bool(prog and prog.is_completed)

            if is_comp:
                # Previously completed lesson - always playable
                status_map[les.id] = {
                    "status": "completed",
                    "is_completed": True,
                    "can_play": True,
                    "lock_reason": None,
                    "progress": prog.to_dict() if prog else None
                }
            else:
                if not has_found_current_incomplete:
                    # This is the current active lesson that is unlocked for learning
                    status_map[les.id] = {
                        "status": "unlocked",
                        "is_completed": False,
                        "can_play": True,
                        "lock_reason": None,
                        "progress": prog.to_dict() if prog else None
                    }
                    if les.is_required:
                        has_found_current_incomplete = True
                        blocking_lesson_title = les.title
                else:
                    # Subsequent lessons are locked until the preceding required lesson is finished
                    lock_msg = f"Complete '{blocking_lesson_title}' to unlock this lesson."
                    status_map[les.id] = {
                        "status": "locked",
                        "is_completed": False,
                        "can_play": False,
                        "lock_reason": lock_msg,
                        "progress": prog.to_dict() if prog else None
                    }

        return status_map, is_enrolled

    @staticmethod
    def can_access_lesson(user: User, lesson: Lesson) -> tuple[bool, str]:
        """
        Backend authorization check for lesson content and video playback.
        Returns (can_access: bool, reason: str)
        """
        if not lesson or not lesson.is_published:
            return False, "Lesson not found or not published."

        course = lesson.module.course if lesson.module else None
        if not course:
            return False, "Associated course not found."

        if user and user.is_admin():
            return True, "Admin access granted."

        # If it's a free preview lesson, allow playback even without enrollment
        if lesson.is_free_preview:
            return True, "Free preview access."

        if not user:
            return False, "Authentication required to access this lesson."

        # Verify active enrollment
        enrollment = Enrollment.query.filter_by(user_id=user.id, course_id=course.id).first()
        if not enrollment or not enrollment.is_valid():
            return False, "Active course enrollment required."

        # Verify sequential unlock position
        status_map, _ = CourseService.get_user_curriculum_status(user, course)
        lesson_status = status_map.get(lesson.id)
        if not lesson_status or not lesson_status.get("can_play"):
            reason = lesson_status.get("lock_reason") if lesson_status else "Lesson is locked by sequential curriculum policy."
            return False, reason

        return True, "Access permitted."

    @staticmethod
    def update_progress(user: User, lesson: Lesson, position_seconds: int, mark_complete: bool = False):
        """
        Record playback position and mark as complete if threshold is reached or button clicked.
        Backend validates that the lesson is not locked before allowing progress.
        """
        can_access, reason = CourseService.can_access_lesson(user, lesson)
        if not can_access:
            return False, reason, None

        course_id = lesson.module.course_id
        progress = LessonProgress.query.filter_by(user_id=user.id, lesson_id=lesson.id).first()

        now_utc = datetime.now(timezone.utc)
        if not progress:
            progress = LessonProgress(
                user_id=user.id,
                lesson_id=lesson.id,
                course_id=course_id,
                last_position_seconds=position_seconds,
                max_position_seconds=position_seconds,
                total_duration_seconds=lesson.duration_seconds or 0,
                is_completed=False,
                created_at=now_utc,
                updated_at=now_utc
            )
            db.session.add(progress)
        else:
            progress.last_position_seconds = position_seconds
            progress.max_position_seconds = max(progress.max_position_seconds, position_seconds)
            progress.total_duration_seconds = lesson.duration_seconds or progress.total_duration_seconds
            progress.updated_at = now_utc

        # Check completion criteria:
        # 1. Explicitly clicked Mark as Complete
        # 2. Reached >= 90% threshold of video duration
        threshold_reached = False
        if lesson.duration_seconds > 0 and progress.max_position_seconds >= int(lesson.duration_seconds * 0.90):
            threshold_reached = True

        if mark_complete or threshold_reached:
            if not progress.is_completed:
                progress.is_completed = True
                progress.completed_at = now_utc

        db.session.commit()
        return True, "Progress recorded successfully.", progress

    @staticmethod
    def calculate_course_completion(user_id: int, course: Course):
        """Calculates percentage and counts of completed lessons for a course."""
        total_required_lessons = 0
        total_lessons = 0
        for mod in course.modules:
            if mod.is_active:
                for les in mod.lessons:
                    if les.is_published:
                        total_lessons += 1
                        if les.is_required:
                            total_required_lessons += 1

        if total_required_lessons == 0:
            return {"percentage": 100, "completed": 0, "total": 0}

        completed_count = LessonProgress.query.join(Lesson).filter(
            LessonProgress.user_id == user_id,
            LessonProgress.course_id == course.id,
            LessonProgress.is_completed == True,
            Lesson.is_required == True
        ).count()

        pct = round((completed_count / total_required_lessons) * 100, 1)
        return {
            "percentage": min(pct, 100.0),
            "completed_lessons": completed_count,
            "total_required_lessons": total_required_lessons,
            "total_lessons": total_lessons,
            "is_course_completed": completed_count >= total_required_lessons
        }
