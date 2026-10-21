from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.course import Course
from app.models.order import Order
from app.models.enrollment import Enrollment
from app.services.payment_service import PaymentService
from app.utils.decorators import login_required

payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")

@payments_bp.route("/create-order", methods=["POST"])
@login_required
def create_purchase_order():
    """
    Step 1 of purchase workflow:
    Student initiates checkout for a published course.
    Price is securely fetched from the database.
    """
    data = request.get_json() or {}
    course_id = data.get("course_id")

    if not course_id:
        return jsonify({"error": "VALIDATION_ERROR", "message": "Course ID is required."}), 400

    course = db.session.get(Course, course_id)
    if not course:
        return jsonify({"error": "NOT_FOUND", "message": "Course not found."}), 404

    checkout_data, err_msg = PaymentService.create_order(g.current_user, course)
    if err_msg:
        return jsonify({"error": "ORDER_FAILED", "message": err_msg}), 400

    return jsonify({"order": checkout_data}), 201


@payments_bp.route("/verify", methods=["POST"])
@login_required
def verify_payment():
    """
    Step 2 of purchase workflow:
    Receives payment signature from Razorpay checkout.
    Verifies cryptographic signature before activating enrollment.
    """
    data = request.get_json() or {}
    order_id = data.get("order_id")
    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_signature = data.get("razorpay_signature")

    if not order_id or not razorpay_payment_id:
        return jsonify({"error": "VALIDATION_ERROR", "message": "Missing required payment verification parameters."}), 400

    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({"error": "NOT_FOUND", "message": "Order not found."}), 404

    # Security check: order must belong to the authenticated user
    if order.user_id != g.current_user.id:
        return jsonify({"error": "UNAUTHORIZED", "message": "You cannot verify an order belonging to another user."}), 403

    # Cryptographic signature verification
    is_valid_sig = PaymentService.verify_signature(
        razorpay_order_id or order.razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature or ""
    )

    if not is_valid_sig:
        order.status = "failed"
        db.session.commit()
        return jsonify({"error": "SIGNATURE_VERIFICATION_FAILED", "message": "Payment signature verification failed."}), 400

    success, msg, enrollment = PaymentService.fulfill_order(order, razorpay_payment_id, razorpay_signature or "", data)
    if not success:
        return jsonify({"error": "FULFILLMENT_FAILED", "message": msg}), 400

    return jsonify({
        "success": True,
        "message": "Payment verified and course enrollment activated!",
        "order": order.to_dict(),
        "enrollment": enrollment.to_dict() if enrollment else None,
        "course_slug": order.course.slug if order.course else None
    }), 200


@payments_bp.route("/webhook", methods=["POST"])
def razorpay_webhook():
    """
    Asynchronous payment webhook from Razorpay.
    Verifies X-Razorpay-Signature and idempotently fulfills orders.
    """
    signature = request.headers.get("X-Razorpay-Signature")
    raw_body = request.get_data()

    if not PaymentService.verify_webhook_signature(raw_body, signature):
        return jsonify({"error": "INVALID_SIGNATURE"}), 400

    payload = request.get_json() or {}
    event = payload.get("event")
    event_payload = payload.get("payload", {})

    if event in ("order.paid", "payment.captured"):
        payment_entity = event_payload.get("payment", {}).get("entity", {})
        rzp_order_id = payment_entity.get("order_id")
        rzp_payment_id = payment_entity.get("id")

        if rzp_order_id:
            order = Order.query.filter_by(razorpay_order_id=rzp_order_id).first()
            if order and order.status != "paid":
                PaymentService.fulfill_order(order, rzp_payment_id, signature, payload)

    elif event == "payment.failed":
        payment_entity = event_payload.get("payment", {}).get("entity", {})
        rzp_order_id = payment_entity.get("order_id")
        if rzp_order_id:
            order = Order.query.filter_by(razorpay_order_id=rzp_order_id).first()
            if order and order.status == "pending":
                order.status = "failed"
                db.session.commit()

    return jsonify({"status": "ok"}), 200


@payments_bp.route("/my-orders", methods=["GET"])
@login_required
def get_user_orders():
    """Returns order and payment history for the logged-in student."""
    orders = Order.query.filter_by(user_id=g.current_user.id).order_by(Order.created_at.desc()).all()
    return jsonify({
        "orders": [o.to_dict() for o in orders]
    }), 200
