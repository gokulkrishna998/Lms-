import os
import sys
from datetime import datetime, timezone
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.course import Category, Course, Module, Lesson
from app.models.settings import SiteSettings

def seed_database():
    app = create_app()
    with app.app_context():
        print("Creating database tables...")
        db.create_all()

        # Seed Site Settings
        defaults = [
            ("site_name", "Mini LMS", "Platform title"),
            ("support_email", "support@minilms.com", "Support contact email"),
            ("currency_symbol", "₹", "Currency symbol"),
            ("currency_code", "INR", "ISO currency code"),
            ("hero_heading", "Master Practical Skills with High-Quality Recorded Courses", "Homepage hero title"),
            ("hero_subheading", "Structured, step-by-step video courses designed to take you from foundational basics to industry mastery.", "Homepage hero subtitle"),
        ]
        for key, val, desc in defaults:
            SiteSettings.set_setting(key, val, desc)

        # Create Default Admin User
        admin_email = "admin@minilms.com"
        admin = User.query.filter_by(email=admin_email).first()
        if not admin:
            admin = User(
                name="Platform Admin",
                email=admin_email,
                role="admin",
                is_active=True,
                email_verified=True
            )
            admin.set_password("Admin@123456")
            db.session.add(admin)
            print(f"Created admin account: {admin_email} / Admin@123456")
        else:
            admin.set_password("Admin@123456")
            admin.role = "admin"
            print(f"Admin account already exists: {admin_email}")

        # Create Demo Student User
        student_email = "student@example.com"
        student = User.query.filter_by(email=student_email).first()
        if not student:
            student = User(
                name="Aarav Sharma",
                email=student_email,
                role="student",
                is_active=True,
                email_verified=True
            )
            student.set_password("Student@123456")
            db.session.add(student)
            print(f"Created student account: {student_email} / Student@123456")

        # Create Categories
        categories_data = [
            ("Full Stack Development", "full-stack-development", "Modern end-to-end web engineering courses"),
            ("Python & Backend", "python-backend", "Backend development, APIs, architectures and databases"),
            ("Cloud & DevOps", "cloud-devops", "Docker, CI/CD, scalable deployments and infrastructure")
        ]
        cat_map = {}
        for name, slug, desc in categories_data:
            cat = Category.query.filter_by(slug=slug).first()
            if not cat:
                cat = Category(name=name, slug=slug, description=desc)
                db.session.add(cat)
                db.session.flush()
            cat_map[slug] = cat

        # Create Sample Course 1
        course_slug = "full-stack-python-flask-react"
        course = Course.query.filter_by(slug=course_slug).first()
        if not course:
            course = Course(
                title="Full Stack Python: Flask & Modern React",
                slug=course_slug,
                subtitle="Build production-grade full-stack web applications with Python Flask REST APIs, React, and PostgreSQL.",
                description="""A comprehensive, hands-on masterclass designed to take you from foundational Python syntax to deploying high-performance, secure web applications.

You'll build a complete end-to-end platform featuring secure session authentication, relational schema design with SQLAlchemy, Razorpay integration, and a sleek React frontend.""",
                learning_outcomes=[
                    "Architect modular Flask REST APIs using modern Blueprints and application factories",
                    "Design normalized relational databases with SQLAlchemy and handle ACID transactions",
                    "Implement bulletproof single-session login restrictions and JWT token rotation",
                    "Integrate payment gateways (Razorpay) with signature verification and webhook idempotency",
                    "Build responsive, reactive user interfaces with React, Vite, and Tailwind CSS",
                    "Enforce strict server-side sequential curriculum unlocking and secure video streaming"
                ],
                category_id=cat_map["python-backend"].id,
                price_paise=249900, # ₹2,499.00
                thumbnail_url="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
                access_duration_days=None, # Lifetime access
                status="published"
            )
            db.session.add(course)
            db.session.flush()

            # Module 1
            mod1 = Module(
                course_id=course.id,
                title="Module 1: Introduction & Architecture",
                description="Understanding modern client-server architectures and setting up your workspace.",
                order_index=1,
                is_active=True
            )
            db.session.add(mod1)
            db.session.flush()

            les1_1 = Lesson(
                module_id=mod1.id,
                title="Lesson 1: Platform Overview & System Design",
                description="Explore the architecture of modern single-page applications and the course roadmap.",
                video_provider="local_secure",
                video_asset_id="sample_lesson.mp4",
                duration_seconds=300, # 5 mins
                order_index=1,
                is_required=True,
                is_free_preview=True, # Free preview!
                is_published=True
            )
            les1_2 = Lesson(
                module_id=mod1.id,
                title="Lesson 2: Development Workspace Setup",
                description="Configure Python virtual environments, Node.js, and VS Code for productivity.",
                video_provider="local_secure",
                video_asset_id="sample_lesson.mp4",
                duration_seconds=420,
                order_index=2,
                is_required=True,
                is_free_preview=False,
                is_published=True
            )
            les1_3 = Lesson(
                module_id=mod1.id,
                title="Lesson 3: Python Fundamentals & Data Structures",
                description="Quick refresher on modern Python 3.12 types, generators, and decorators.",
                video_provider="local_secure",
                video_asset_id="sample_lesson.mp4",
                duration_seconds=600,
                order_index=3,
                is_required=True,
                is_free_preview=False,
                is_published=True
            )
            db.session.add_all([les1_1, les1_2, les1_3])

            # Module 2
            mod2 = Module(
                course_id=course.id,
                title="Module 2: Backend REST APIs & Security",
                description="Deep dive into Flask blueprints, authentication, and single-device restrictions.",
                order_index=2,
                is_active=True
            )
            db.session.add(mod2)
            db.session.flush()

            les2_1 = Lesson(
                module_id=mod2.id,
                title="Lesson 1: REST API Blueprint Architecture",
                description="Structure scalable REST endpoints with clean error handling and schemas.",
                video_provider="local_secure",
                video_asset_id="sample_lesson.mp4",
                duration_seconds=720,
                order_index=1,
                is_required=True,
                is_free_preview=False,
                is_published=True
            )
            les2_2 = Lesson(
                module_id=mod2.id,
                title="Lesson 2: Single-Device Session Invalidation",
                description="Enforce server-controlled active sessions and device-level session invalidation.",
                video_provider="local_secure",
                video_asset_id="sample_lesson.mp4",
                duration_seconds=850,
                order_index=2,
                is_required=True,
                is_free_preview=False,
                is_published=True
            )
            db.session.add_all([les2_1, les2_2])

            # Module 3
            mod3 = Module(
                course_id=course.id,
                title="Module 3: Payments & Production Launch",
                description="Razorpay checkout integration, webhooks idempotency, and cloud deployment.",
                order_index=3,
                is_active=True
            )
            db.session.add(mod3)
            db.session.flush()

            les3_1 = Lesson(
                module_id=mod3.id,
                title="Lesson 1: Razorpay Payment Verification",
                description="Verify HMAC signatures and manage reliable order-to-enrollment flows.",
                video_provider="local_secure",
                video_asset_id="sample_lesson.mp4",
                duration_seconds=900,
                order_index=1,
                is_required=True,
                is_free_preview=False,
                is_published=True
            )
            db.session.add(les3_1)
            print("Created sample course: Full Stack Python")

        # Create Sample Course 2
        course2_slug = "modern-react-tailwind-mastery"
        course2 = Course.query.filter_by(slug=course2_slug).first()
        if not course2:
            course2 = Course(
                title="Modern React 19 & Tailwind CSS Mastery",
                slug=course2_slug,
                subtitle="Build blazingly fast, responsive, and accessible user interfaces from scratch.",
                description="Learn the modern React mental model: hooks, context, state management, and Tailwind CSS component systems.",
                learning_outcomes=[
                    "Master modern React hooks and custom hooks",
                    "Build reusable, mobile-first layouts with Tailwind CSS",
                    "Handle complex client-side state with Context API and Reducers",
                    "Secure authenticated routes and handle token invalidation modals"
                ],
                category_id=cat_map["full-stack-development"].id,
                price_paise=199900, # ₹1,999.00
                thumbnail_url="https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
                access_duration_days=365, # 1 Year
                status="published"
            )
            db.session.add(course2)
            db.session.flush()

            c2_mod1 = Module(
                course_id=course2.id,
                title="Module 1: React Fundamentals & Vite Setup",
                description="Getting started with Vite, JSX, and components.",
                order_index=1,
                is_active=True
            )
            db.session.add(c2_mod1)
            db.session.flush()

            c2_les1 = Lesson(
                module_id=c2_mod1.id,
                title="Lesson 1: React 19 Component Foundations",
                description="Deconstructing components, props, and declarative rendering.",
                video_provider="local_secure",
                video_asset_id="sample_lesson.mp4",
                duration_seconds=360,
                order_index=1,
                is_required=True,
                is_free_preview=True,
                is_published=True
            )
            db.session.add(c2_les1)
            print("Created sample course: Modern React & Tailwind")

        db.session.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_database()
