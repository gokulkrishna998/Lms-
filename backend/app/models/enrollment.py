from datetime import datetime, timezone
from app.extensions import db

class Enrollment(db.Model):
    __tablename__ = "enrollments"
    __table_args__ = (
        db.UniqueConstraint("user_id", "course_id", name="uq_user_course_enrollment"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, unique=True)
    access_type = db.Column(db.String(20), nullable=False, default="lifetime") # "lifetime", "limited"
    expires_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="active", index=True) # "active", "expired", "revoked"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="enrollments")
    course = db.relationship("Course", back_populates="enrollments")
    order = db.relationship("Order", back_populates="enrollment")

    def is_valid(self) -> bool:
        if self.status != "active":
            return False
        if self.expires_at:
            now_utc = datetime.now(timezone.utc)
            exp = self.expires_at if self.expires_at.tzinfo else self.expires_at.replace(tzinfo=timezone.utc)
            if exp <= now_utc:
                return False
        return True

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "course_id": self.course_id,
            "course_title": self.course.title if self.course else None,
            "course_slug": self.course.slug if self.course else None,
            "thumbnail_url": self.course.thumbnail_url if self.course else None,
            "order_id": self.order_id,
            "access_type": self.access_type,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "status": self.status,
            "is_valid": self.is_valid(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
