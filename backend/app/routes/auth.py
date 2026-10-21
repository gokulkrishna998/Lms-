import re
import secrets
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import User
from app.models.session import ActiveSession
from app.services.auth_service import AuthService
from app.utils.decorators import login_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or len(name) < 2:
        return jsonify({"error": "VALIDATION_ERROR", "message": "Full name is required (minimum 2 characters)."}), 400

    if not email or not re.match(EMAIL_REGEX, email):
        return jsonify({"error": "VALIDATION_ERROR", "message": "A valid email address is required."}), 400

    if not password or len(password) < 6:
        return jsonify({"error": "VALIDATION_ERROR", "message": "Password must be at least 6 characters long."}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "DUPLICATE_EMAIL", "message": "An account with this email address already exists."}), 409

    # Create new student account
    user = User(
        name=name,
        email=email,
        role="student",
        is_active=True,
        email_verified=True, # Auto-verified for seamless MVP onboarding
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Automatically log the user in on their device
    user_agent = request.headers.get("User-Agent", "")
    ip_addr = request.remote_addr
    token, session_obj = AuthService.login_user(user, user_agent, ip_addr)

    return jsonify({
        "message": "Account created successfully.",
        "token": token,
        "user": user.to_dict(),
        "session": session_obj.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "VALIDATION_ERROR", "message": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "INVALID_CREDENTIALS", "message": "Invalid email or password."}), 401

    if not user.is_active:
        return jsonify({"error": "ACCOUNT_DISABLED", "message": "Your account has been deactivated. Please contact support."}), 403

    user_agent = request.headers.get("User-Agent", "")
    ip_addr = request.remote_addr

    # Enforce Single-Device Login: Invalidate any previous session and issue a new one
    token, session_obj = AuthService.login_user(user, user_agent, ip_addr)

    return jsonify({
        "message": "Login successful.",
        "token": token,
        "user": user.to_dict(),
        "session": session_obj.to_dict()
    }), 200


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    session_id = g.current_session.id
    AuthService.logout_user(session_id)
    return jsonify({"message": "Successfully logged out."}), 200


@auth_bp.route("/me", methods=["GET"])
@login_required
def get_current_user():
    return jsonify({
        "user": g.current_user.to_dict(),
        "session": g.current_session.to_dict()
    }), 200


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()

    # Always return a generic response to prevent user enumeration
    generic_msg = "If your email is registered in our system, you will receive password reset instructions shortly."

    if not email:
        return jsonify({"message": generic_msg}), 200

    user = User.query.filter_by(email=email).first()
    if user:
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_token_expiry = datetime.now(timezone.utc) + timedelta(hours=1)
        db.session.commit()
        # For development / test convenience, return token in response header or debug field if local
        return jsonify({
            "message": generic_msg,
            "dev_reset_token": reset_token if current_app.debug else None
        }), 200

    return jsonify({"message": generic_msg}), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    token = data.get("token") or ""
    new_password = data.get("new_password") or ""

    if not token or not new_password or len(new_password) < 6:
        return jsonify({"error": "VALIDATION_ERROR", "message": "Valid reset token and minimum 6 character password required."}), 400

    user = User.query.filter_by(reset_token=token).first()
    if not user or not user.reset_token_expiry:
        return jsonify({"error": "INVALID_TOKEN", "message": "Password reset token is invalid or has expired."}), 400

    exp = user.reset_token_expiry if user.reset_token_expiry.tzinfo else user.reset_token_expiry.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > exp:
        return jsonify({"error": "EXPIRED_TOKEN", "message": "Password reset token has expired."}), 400

    user.set_password(new_password)
    user.reset_token = None
    user.reset_token_expiry = None

    # Invalidate all existing sessions on password reset for security
    ActiveSession.query.filter_by(user_id=user.id).update({"is_active": False})
    db.session.commit()

    return jsonify({"message": "Password reset successfully. You can now log in with your new password."}), 200


@auth_bp.route("/profile", methods=["PUT"])
@login_required
def update_profile():
    data = request.get_json() or {}
    user = g.current_user

    name = data.get("name")
    if name and len(name.strip()) >= 2:
        user.name = name.strip()

    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if new_password:
        if not current_password or not user.check_password(current_password):
            return jsonify({"error": "INVALID_PASSWORD", "message": "Current password does not match."}), 400
        if len(new_password) < 6:
            return jsonify({"error": "VALIDATION_ERROR", "message": "New password must be at least 6 characters."}), 400
        user.set_password(new_password)

    user.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        "message": "Profile updated successfully.",
        "user": user.to_dict()
    }), 200
