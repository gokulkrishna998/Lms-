import pytest
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.course import Category, Course, Module, Lesson
from app.models.enrollment import Enrollment
from app.models.progress import LessonProgress
from app.models.order import Order

@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def seed_data(app):
    with app.app_context():
        # Admin
        admin = User(name="Admin User", email="admin@test.com", role="admin", is_active=True)
        admin.set_password("AdminPass123!")

        # Student 1
        student1 = User(name="Student One", email="student1@test.com", role="student", is_active=True)
        student1.set_password("StudentPass123!")

        # Student 2
        student2 = User(name="Student Two", email="student2@test.com", role="student", is_active=True)
        student2.set_password("StudentPass123!")

        # Category
        cat = Category(name="Backend Development", slug="backend-dev")
        db.session.add_all([admin, student1, student2, cat])
        db.session.flush()

        # Published Course
        course = Course(
            title="Python Mastery",
            slug="python-mastery",
            subtitle="Learn Python from scratch",
            description="Complete Python course description",
            price_paise=199900,
            status="published",
            category_id=cat.id
        )

        # Draft Course (unpublished)
        draft_course = Course(
            title="Draft Course",
            slug="draft-course",
            price_paise=99900,
            status="draft",
            category_id=cat.id
        )
        db.session.add_all([course, draft_course])
        db.session.flush()

        # Module 1
        m1 = Module(course_id=course.id, title="Module 1: Basics", order_index=1, is_active=True)
        # Module 2
        m2 = Module(course_id=course.id, title="Module 2: Advanced", order_index=2, is_active=True)
        db.session.add_all([m1, m2])
        db.session.flush()

        # Module 1 Lessons
        l1_1 = Lesson(
            module_id=m1.id,
            title="Lesson 1.1: Intro (Free Preview)",
            duration_seconds=300,
            order_index=1,
            is_required=True,
            is_free_preview=True,
            is_published=True
        )
        l1_2 = Lesson(
            module_id=m1.id,
            title="Lesson 1.2: Variables",
            duration_seconds=400,
            order_index=2,
            is_required=True,
            is_free_preview=False,
            is_published=True
        )

        # Module 2 Lessons
        l2_1 = Lesson(
            module_id=m2.id,
            title="Lesson 2.1: OOP",
            duration_seconds=500,
            order_index=1,
            is_required=True,
            is_free_preview=False,
            is_published=True
        )
        db.session.add_all([l1_1, l1_2, l2_1])
        db.session.commit()

        return {
            "admin_id": admin.id,
            "student1_id": student1.id,
            "student2_id": student2.id,
            "course_id": course.id,
            "draft_course_id": draft_course.id,
            "m1_id": m1.id,
            "m2_id": m2.id,
            "l1_1_id": l1_1.id,
            "l1_2_id": l1_2.id,
            "l2_1_id": l2_1.id,
        }
