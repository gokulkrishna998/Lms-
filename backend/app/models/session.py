from datetime import datetime, timezone
from app.extensions import db

class ActiveSession(db.Model):
    __tablename__ = "active_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_token = db.Column(db.String(255), unique=True, nullable=False, index=True)
    device_info = db.Column(db.String(255), nullable=True) # User-Agent summary (e.g., "Chrome on Windows")
    ip_address = db.Column(db.String(64), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_active_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="sessions")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "device_info": self.device_info,
            "ip_address": self.ip_address,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_active_at": self.last_active_at.isoformat() if self.last_active_at else None,
        }
