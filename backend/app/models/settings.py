from datetime import datetime, timezone
from app.extensions import db

class SiteSettings(db.Model):
    __tablename__ = "site_settings"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False, index=True)
    value = db.Column(db.Text, nullable=True)
    description = db.Column(db.String(255), nullable=True)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    @classmethod
    def get_setting(cls, key: str, default: str = None) -> str:
        record = cls.query.filter_by(key=key).first()
        if record and record.value is not None:
            return record.value
        return default

    @classmethod
    def set_setting(cls, key: str, value: str, description: str = None):
        record = cls.query.filter_by(key=key).first()
        if not record:
            record = cls(key=key, value=value, description=description)
            db.session.add(record)
        else:
            record.value = value
            if description:
                record.description = description
        db.session.commit()
        return record

    def to_dict(self):
        return {
            "key": self.key,
            "value": self.value,
            "description": self.description,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
