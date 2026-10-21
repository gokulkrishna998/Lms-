from datetime import datetime, timezone
from app.extensions import db

class LessonProgress(db.Model):
    __tablename__ = "lesson_progress"
    __table_args__ = (
        db.UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson_progress"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    is_completed = db.Column(db.Boolean, nullable=False, default=False, index=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    last_position_seconds = db.Column(db.Integer, nullable=False, default=0)
    max_position_seconds = db.Column(db.Integer, nullable=False, default=0)
    total_duration_seconds = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="progress_records")
    lesson = db.relationship("Lesson", back_populates="progress_records")
    course = db.relationship("Course")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "lesson_id": self.lesson_id,
            "course_id": self.course_id,
            "is_completed": self.is_completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "last_position_seconds": self.last_position_seconds,
            "max_position_seconds": self.max_position_seconds,
            "total_duration_seconds": self.total_duration_seconds,
            "completion_percentage": round(
                (self.max_position_seconds / self.total_duration_seconds * 100) if self.total_duration_seconds > 0 else (100 if self.is_completed else 0),
                1
            ),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
