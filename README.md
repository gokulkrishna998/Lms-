# Mini LMS – Recorded Course Purchase and Learning Platform

A modern, secure, and production-ready Learning Management System (LMS) built with **React (Vite + Tailwind CSS)** and **Python Flask (SQLAlchemy REST API)**.

The platform is purpose-built for selling and delivering recorded video courses with **strict server-side sequential lesson unlocking**, **single-device active session enforcement**, and **Razorpay INR payment gateway integration**.

---

## 1. Key Architectural Features

- **Strict Sequential Lesson Unlocking (Backend Enforced)**:
  - Lessons unlock sequentially within and across modules.
  - Students cannot bypass restrictions by manipulating URLs, query parameters, or local storage.
  - Supports automatic unlocking upon reaching a configurable viewing threshold (90% watched) as well as an explicit "Mark as Complete" action.
  - Free preview lessons are accessible without enrollment for prospect evaluation.
- **Single-Device Active Session Enforcement**:
  - Each student account is restricted to exactly **one active authenticated device session at a time**.
  - Logging in on a new device immediately revokes any previous device sessions on the server.
  - The previous device receives a `SESSION_TERMINATED` 401 response and displays a clear session invalidation modal.
- **Razorpay INR Payment Integration**:
  - Server-authoritative pricing (retrieved exclusively from the database in paise minor units).
  - HMAC-SHA256 signature verification on payment confirmation callbacks.
  - Webhook endpoint with cryptographic signature verification and idempotent order fulfillment (prevents duplicate enrollments on repeated callbacks).
  - Includes an interactive Sandbox Test Simulator for developer testing before live merchant keys are added.
- **Protected Video Streaming & Range Requests**:
  - Video URLs and storage locations are never leaked to unauthorized users.
  - Short-lived HMAC signed tokens (5-minute TTL) authorize video playback.
  - Streaming endpoint supports HTTP 206 Partial Content (HTTP Range requests) for seamless video scrub and seek.
- **Role-Based Access Control**:
  - Distinct Student and Admin portals.
  - Full Admin dashboard for course authoring, module & lesson curriculum management, video asset assignment, student search, access revocation, and audit logs.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Lucide React, Axios, React Router Dom 7 |
| **Backend** | Python 3.12, Flask 3.1, Flask-SQLAlchemy 3.1, PyJWT, Werkzeug Security, Razorpay SDK |
| **Database** | SQLite (zero-config local development) / PostgreSQL (via `DATABASE_URL` in production) |
| **Security** | Scrypt/PBKDF2 Password Hashing, JWT with Server Session Validation, HMAC-SHA256 Video Tokens |
| **Testing** | Pytest, Test Client Fixtures, Automated Integration Suite |

---

## 3. Project Directory Structure

```
antigravity/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Flask app factory, CORS, blueprints, error handlers
│   │   ├── config.py             # Development, Testing, Production configurations
│   │   ├── extensions.py         # SQLAlchemy and CORS instances
│   │   ├── models/               # Relational database models
│   │   │   ├── user.py           # User model with password hashing and roles
│   │   │   ├── course.py         # Category, Course, Module, Lesson, MediaAsset
│   │   │   ├── order.py          # Order, OrderItem, Payment
│   │   │   ├── enrollment.py     # Course Enrollment with expiration & revocation
│   │   │   ├── progress.py       # LessonProgress with playback position & completion
│   │   │   ├── session.py        # ActiveSession for single-device restriction
│   │   │   ├── audit.py          # AuditLog for sensitive administrative actions
│   │   │   └── settings.py       # SiteSettings for configurable site defaults
│   │   ├── routes/               # Modular REST Blueprints
│   │   │   ├── auth.py           # Register, login (single session), logout, me, reset
│   │   │   ├── courses.py        # Public catalog, category filters, course details
│   │   │   ├── learning.py       # Sequential curriculum, playback tokens, video range streaming
│   │   │   ├── payments.py       # Razorpay order create, signature verify, webhooks
│   │   │   ├── student.py        # Student dashboard, my courses, enrolled progress
│   │   │   ├── admin.py          # Admin metrics, course CRUD, curriculum editor, students
│   │   │   └── uploads.py        # Thumbnail, protected video, and PDF resource uploads
│   │   ├── services/             # Core business logic
│   │   │   ├── auth_service.py   # Token creation & single-device invalidation
│   │   │   ├── course_service.py # Sequential unlocking engine & progress calculation
│   │   │   ├── payment_service.py# Razorpay order generation & signature validation
│   │   │   └── video_service.py  # HMAC signed token generation & HTTP range streaming
│   │   └── utils/
│   │       └── decorators.py     # @login_required, @admin_required, @optional_auth
│   ├── uploads/                  # Local protected file storage
│   │   ├── thumbnails/
│   │   ├── videos/               # Sample and uploaded MP4 assets
│   │   └── resources/            # Downloadable PDF cheat sheets
│   ├── tests/                    # Automated integration tests
│   │   ├── conftest.py
│   │   ├── test_auth_and_sessions.py
│   │   ├── test_courses_and_curriculum.py
│   │   └── test_payments_and_enrollment.py
│   ├── seed.py                   # Initial database seeding script
│   ├── run.py                    # Backend development server entrypoint
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js         # Axios client with session termination interceptor
│   │   │   └── endpoints.js      # Typed API client endpoints
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Auth state & single-device modal controller
│   │   │   └── ToastContext.jsx  # Floating toast notifications
│   │   ├── components/
│   │   │   ├── common/           # Navbar, Footer, CourseCard, ProgressBar, SessionModal
│   │   │   ├── payment/          # PaymentModal with Razorpay & Sandbox simulator
│   │   │   └── admin/            # AdminLayout & compact sidebar
│   │   ├── pages/
│   │   │   ├── public/           # Home, Courses, CourseDetails, Login, Register, Policies
│   │   │   ├── student/          # Dashboard, MyCourses, LearningPage, Orders, Profile
│   │   │   └── admin/            # AdminDashboard, AdminCourses, AdminCurriculumEditor, AdminStudents, AdminOrders, AdminSettings
│   │   ├── utils/
│   │   │   └── formatters.js     # Currency (paise to INR ₹), duration, dates (Asia/Kolkata)
│   │   ├── App.jsx               # Routes, guards, and layout tree
│   │   ├── main.jsx
│   │   └── index.css             # Tailwind CSS v4 directives
│   ├── index.html                # App root with Razorpay checkout script
│   ├── vite.config.js            # Tailwind plugin and backend proxy config
│   └── package.json
└── README.md
```

---

## 4. Quick Start & Local Setup

### Prerequisites
- **Python**: 3.10 or higher (Python 3.12 recommended)
- **Node.js**: v18.0 or higher (Node 20+ recommended)
- **Git**

---

### Step 1: Set Up Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create the `.env` configuration:
   ```bash
   cp .env.example .env
   ```

5. Seed the database with initial admin, student, sample categories, courses, and lessons:
   ```bash
   python seed.py
   ```

6. Start the Flask backend server:
   ```bash
   python run.py
   ```
   *The backend will be running at `http://127.0.0.1:5000` with interactive health check at `/api/health`.*

---

### Step 2: Set Up Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run at `http://localhost:5173` with automatic API proxying to `http://127.0.0.1:5000`.*

---

## 5. Default Credentials

The `python seed.py` script automatically configures the following demo accounts:

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **Platform Admin** | `admin@minilms.com` | `Admin@123456` | Full admin privileges (Course editor, student management, settings, audit logs) |
| **Demo Student** | `student@example.com` | `Student@123456` | Student access (Course browsing, checkout, sequential learning, dashboard) |

*You can also register new student accounts freely using the **Get Started** button on the public homepage.*

---

## 6. Razorpay Payment Gateway Configuration

The LMS is configured for Razorpay INR payments.

### Testing Mode vs Sandbox Simulation:
- **Default Sandbox Simulation**:
  When placeholder keys (`rzp_test_placeholder_key_id`) are in `.env`, the checkout modal automatically offers an interactive **Sandbox Simulator** allowing developers to simulate both successful and failed payment flows without requiring a Razorpay merchant account.
- **Configuring Your Razorpay Test Keys**:
  1. Register for free at [https://dashboard.razorpay.com](https://dashboard.razorpay.com).
  2. Switch to **Test Mode**.
  3. Generate **Key ID** and **Key Secret** in *Settings -> API Keys*.
  4. Update `backend/.env`:
     ```env
     RAZORPAY_KEY_ID=rzp_test_yourActualKeyId
     RAZORPAY_KEY_SECRET=yourActualKeySecret
     RAZORPAY_WEBHOOK_SECRET=yourWebhookSecret
     ```
  5. Restart the Flask backend. Now, clicking **Purchase Course** launches the official Razorpay test checkout window supporting card, UPI, and netbanking test modes.

---

## 7. Video Protection & Storage Configuration

1. **Storage Location**:
   Protected videos are stored under `backend/uploads/videos/`. A high-definition sample video `sample_lesson.mp4` is included out of the box for immediate playback testing.
2. **Access Control**:
   Videos cannot be downloaded directly via public URLs. Instead, the student learning interface requests a signed playback token via `/api/learning/lessons/<id>`. The backend validates active enrollment and sequential unlock status before issuing a signed HMAC token with a 5-minute expiry.
3. **HTTP Range Streaming**:
   The `/api/learning/lessons/<id>/stream?token=...` endpoint handles HTTP Range headers (`206 Partial Content`), allowing HTML5 video players to seek, buffer, and resume playback without downloading entire files at once.
4. **Third-Party Video Providers**:
   In addition to local protected storage, the Admin Curriculum Editor supports configuring external secure providers (such as Cloudflare Stream, Vimeo OTT, or signed HLS URLs).

---

## 8. Running Automated Tests

A comprehensive integration test suite is located in `backend/tests/` covering:
- Student registration, login, logout, and token expiration.
- Single-device login invalidation (login on Device B terminates Device A's session).
- Sequential lesson unlocking (subsequent lessons stay locked until prior lessons are completed).
- Viewing threshold auto-completion (reaching >= 90% watched completes the lesson).
- Purchase order creation, Razorpay HMAC signature verification, and webhook idempotency.
- Access revocation and unpublished course purchase blocking.

To execute the tests:
```bash
# In the backend directory with virtual environment activated:
pytest -v backend/tests
```

Expected output:
```
backend/tests/test_auth_and_sessions.py::test_student_registration_and_login PASSED
backend/tests/test_auth_and_sessions.py::test_single_device_login_restriction PASSED
backend/tests/test_auth_and_sessions.py::test_generic_password_reset_response PASSED
backend/tests/test_courses_and_curriculum.py::test_public_course_browsing_and_details PASSED
backend/tests/test_courses_and_curriculum.py::test_sequential_lesson_unlocking_and_progress PASSED
backend/tests/test_courses_and_curriculum.py::test_revoked_access_enforcement PASSED
backend/tests/test_payments_and_enrollment.py::test_purchase_and_payment_flow PASSED
backend/tests/test_payments_and_enrollment.py::test_admin_course_management_and_student_inspection PASSED

============================== 8 passed in 4.27s ==============================
```

---

## 9. Production Deployment Guidelines

1. **PostgreSQL Setup**:
   Set `DATABASE_URL=postgresql://user:password@host:5432/minilms` in `backend/.env`. SQLAlchemy automatically handles PostgreSQL connection pooling.
2. **Reverse Proxy (Nginx)**:
   Serve frontend static assets (`npm run build` generates `frontend/dist`) and proxy `/api` requests to Gunicorn running the Flask backend (`gunicorn -w 4 -b 127.0.0.1:5000 run:app`).
3. **Environment Security**:
   - Generate strong, random 64-byte keys for `SECRET_KEY`, `JWT_SECRET_KEY`, and `VIDEO_TOKEN_SECRET`.
   - Set `FLASK_DEBUG=False`.
   - Enforce HTTPS across all domain endpoints.
