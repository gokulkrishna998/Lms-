from datetime import datetime, timezone
from app.extensions import db

class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = db.Column(db.String(100), nullable=False, index=True) # e.g. "COURSE_PUBLISHED", "ACCESS_REVOKED", "ORDER_REFUNDED"
    resource_type = db.Column(db.String(50), nullable=True) # e.g. "Course", "Enrollment", "Order"
    resource_id = db.Column(db.String(50), nullable=True)
    details = db.Column(db.Text, nullable=True) # JSON or descriptive string
    ip_address = db.Column(db.String(64), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = db.relationship("User", back_populates="audit_logs")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else "System",
            "user_email": self.user.email if self.user else None,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "details": self.details,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
