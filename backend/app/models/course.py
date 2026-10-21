import json
from datetime import datetime, timezone
from app.extensions import db

class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    slug = db.Column(db.String(120), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    courses = db.relationship("Course", back_populates="category", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "course_count": self.courses.count() if hasattr(self.courses, "count") else len(self.courses)
        }


class Course(db.Model):
    __tablename__ = "courses"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(220), nullable=False, unique=True, index=True)
    subtitle = db.Column(db.String(300), nullable=True)
    description = db.Column(db.Text, nullable=True)
    _learning_outcomes = db.Column("learning_outcomes", db.Text, nullable=True) # JSON list
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    price_paise = db.Column(db.Integer, nullable=False, default=0) # Integer minor units (100 paise = 1 INR)
    thumbnail_url = db.Column(db.String(500), nullable=True)
    access_duration_days = db.Column(db.Integer, nullable=True) # None = Lifetime access
    status = db.Column(db.String(20), nullable=False, default="draft", index=True) # "draft", "published", "archived"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    category = db.relationship("Category", back_populates="courses")
    modules = db.relationship("Module", back_populates="course", cascade="all, delete-orphan", order_by="Module.order_index")
    enrollments = db.relationship("Enrollment", back_populates="course", cascade="all, delete-orphan", lazy="dynamic")
    orders = db.relationship("Order", back_populates="course", lazy="dynamic")

    @property
    def learning_outcomes(self):
        if not self._learning_outcomes:
            return []
        try:
            return json.loads(self._learning_outcomes)
        except Exception:
            return [line.strip() for line in self._learning_outcomes.split("\n") if line.strip()]

    @learning_outcomes.setter
    def learning_outcomes(self, value):
        if isinstance(value, list):
            self._learning_outcomes = json.dumps(value)
        elif isinstance(value, str):
            try:
                parsed = json.loads(value)
                self._learning_outcomes = json.dumps(parsed if isinstance(parsed, list) else [value])
            except Exception:
                items = [line.strip() for line in value.split("\n") if line.strip()]
                self._learning_outcomes = json.dumps(items)
        else:
            self._learning_outcomes = json.dumps([])

    @property
    def total_lessons_count(self):
        total = 0
        for mod in self.modules:
            total += len(mod.lessons)
        return total

    @property
    def total_duration_seconds(self):
        total = 0
        for mod in self.modules:
            for les in mod.lessons:
                total += (les.duration_seconds or 0)
        return total

    def to_dict(self, include_modules=False, public_view=True):
        data = {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "subtitle": self.subtitle,
            "description": self.description,
            "learning_outcomes": self.learning_outcomes,
            "category_id": self.category_id,
            "category": self.category.to_dict() if self.category else None,
            "price_paise": self.price_paise,
            "price_inr": round(self.price_paise / 100, 2),
            "thumbnail_url": self.thumbnail_url,
            "access_duration_days": self.access_duration_days,
            "access_policy": "Lifetime Access" if not self.access_duration_days else f"{self.access_duration_days} Days Access",
            "status": self.status,
            "modules_count": len(self.modules),
            "lessons_count": self.total_lessons_count,
            "total_duration_seconds": self.total_duration_seconds,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_modules:
            data["modules"] = [m.to_dict(public_view=public_view) for m in self.modules]
        return data


class Module(db.Model):
    __tablename__ = "modules"

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    order_index = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    course = db.relationship("Course", back_populates="modules")
    lessons = db.relationship("Lesson", back_populates="module", cascade="all, delete-orphan", order_by="Lesson.order_index")

    def to_dict(self, public_view=True):
        return {
            "id": self.id,
            "course_id": self.course_id,
            "title": self.title,
            "description": self.description,
            "order_index": self.order_index,
            "is_active": self.is_active,
            "lessons_count": len(self.lessons),
            "lessons": [l.to_dict(public_view=public_view) for l in self.lessons]
        }


class Lesson(db.Model):
    __tablename__ = "lessons"

    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    video_provider = db.Column(db.String(50), nullable=False, default="local_secure") # "local_secure", "external_secure"
    video_asset_id = db.Column(db.String(500), nullable=True) # Storage path or provider ID (NEVER exposed directly to unauthorized users)
    duration_seconds = db.Column(db.Integer, nullable=False, default=0)
    resource_url = db.Column(db.String(500), nullable=True)
    resource_name = db.Column(db.String(200), nullable=True)
    order_index = db.Column(db.Integer, nullable=False, default=0)
    is_required = db.Column(db.Boolean, nullable=False, default=True)
    is_free_preview = db.Column(db.Boolean, nullable=False, default=False)
    is_published = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    module = db.relationship("Module", back_populates="lessons")
    progress_records = db.relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self, public_view=True, is_enrolled=False, is_admin=False):
        data = {
            "id": self.id,
            "module_id": self.module_id,
            "title": self.title,
            "description": self.description,
            "duration_seconds": self.duration_seconds,
            "order_index": self.order_index,
            "is_required": self.is_required,
            "is_free_preview": self.is_free_preview,
            "is_published": self.is_published,
            "has_resource": bool(self.resource_url),
            "resource_name": self.resource_name if (is_enrolled or is_admin or self.is_free_preview) else None,
        }
        # In admin mode, expose full video backend metadata
        if is_admin:
            data["video_provider"] = self.video_provider
            data["video_asset_id"] = self.video_asset_id
            data["resource_url"] = self.resource_url
        return data


class MediaAsset(db.Model):
    __tablename__ = "media_assets"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False, default=0)
    mime_type = db.Column(db.String(100), nullable=True)
    duration_seconds = db.Column(db.Integer, nullable=True, default=0)
    uploader_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "duration_seconds": self.duration_seconds,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
