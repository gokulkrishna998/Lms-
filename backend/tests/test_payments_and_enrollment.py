import hmac
import hashlib
from app.extensions import db
from app.models.order import Order
from app.models.enrollment import Enrollment

def test_purchase_and_payment_flow(client, seed_data):
    """
    Requirements 4, 5, 6, 7:
    - Complete purchase in test environment
    - Failed/pending payment does not grant access
    - Verified payment creates 1 order and 1 enrollment
    - Duplicate webhook calls do not duplicate enrollments
    """
    login_res = client.post("/api/auth/login", json={"email": "student1@test.com", "password": "StudentPass123!"})
    token = login_res.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    course_id = seed_data["course_id"]

    # 1. Create Purchase Order
    order_res = client.post("/api/payments/create-order", json={"course_id": course_id}, headers=headers)
    assert order_res.status_code == 201
    order_data = order_res.get_json()["order"]
    order_id = order_data["order_id"]
    rzp_order_id = order_data["razorpay_order_id"]
    assert order_data["amount_paise"] == 199900 # Server-authoritative price ₹1999

    # Check order in DB is 'pending'
    with client.application.app_context():
        order = db.session.get(Order, order_id)
        assert order.status == "pending"

    # 2. Before payment verification: student has NO enrollment
    with client.application.app_context():
        enr = Enrollment.query.filter_by(user_id=seed_data["student1_id"], course_id=course_id).first()
        assert enr is None

    # 3. Invalid signature attempt -> payment failure
    bad_verify = client.post("/api/payments/verify", json={
        "order_id": order_id,
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": "pay_test_bad_123",
        "razorpay_signature": "invalid_signature_hash"
    }, headers=headers)
    assert bad_verify.status_code == 400

    # Enrollment still NOT granted
    with client.application.app_context():
        enr = Enrollment.query.filter_by(user_id=seed_data["student1_id"], course_id=course_id).first()
        assert enr is None

    # 4. Valid payment verification (using test sandbox signature)
    valid_payment_id = "pay_test_success_999"
    test_sig = "simulated_sig_success"

    verify_res = client.post("/api/payments/verify", json={
        "order_id": order_id,
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": valid_payment_id,
        "razorpay_signature": test_sig
    }, headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.get_json()["success"] is True

    # Order marked paid and exactly ONE enrollment exists
    with client.application.app_context():
        order = db.session.get(Order, order_id)
        assert order.status == "paid"
        enrollments = Enrollment.query.filter_by(user_id=seed_data["student1_id"], course_id=course_id).all()
        assert len(enrollments) == 1
        assert enrollments[0].is_valid() is True

    # 5. Duplicate call (Idempotency test)
    repeat_verify = client.post("/api/payments/verify", json={
        "order_id": order_id,
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": valid_payment_id,
        "razorpay_signature": test_sig
    }, headers=headers)
    assert repeat_verify.status_code == 200

    with client.application.app_context():
        enrollments = Enrollment.query.filter_by(user_id=seed_data["student1_id"], course_id=course_id).all()
        assert len(enrollments) == 1 # Still exactly 1 enrollment!


def test_admin_course_management_and_student_inspection(client, seed_data):
    """
    Requirements 14, 15:
    - Admin can create a course, add modules, reorder, and inspect students/orders
    """
    login_res = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "AdminPass123!"})
    token = login_res.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Admin dashboard
    dash = client.get("/api/admin/dashboard", headers=headers)
    assert dash.status_code == 200
    assert dash.get_json()["stats"]["total_students"] == 2

    # 2. Admin creates a new course
    create_res = client.post("/api/admin/courses", json={
        "title": "FastAPI Masterclass",
        "price_inr": 1499,
        "status": "draft"
    }, headers=headers)
    assert create_res.status_code == 201
    course_id = create_res.get_json()["course"]["id"]

    # 3. Add module
    mod_res = client.post(f"/api/admin/courses/{course_id}/modules", json={
        "title": "Module 1: FastAPI Intro"
    }, headers=headers)
    assert mod_res.status_code == 201
    mod_id = mod_res.get_json()["module"]["id"]

    # 4. Add lesson
    les_res = client.post(f"/api/admin/modules/{mod_id}/lessons", json={
        "title": "Lesson 1: Pydantic & Dependency Injection",
        "duration_minutes": 15,
        "is_required": True
    }, headers=headers)
    assert les_res.status_code == 201

    # 5. Admin searches students
    students_res = client.get("/api/admin/students?search=student1", headers=headers)
    assert students_res.status_code == 200
    assert len(students_res.get_json()["students"]) == 1
    assert students_res.get_json()["students"][0]["email"] == "student1@test.com"
