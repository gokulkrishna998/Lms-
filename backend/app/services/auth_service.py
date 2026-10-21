import jwt
import secrets
from datetime import datetime, timezone, timedelta
from flask import current_app, request
from app.extensions import db
from app.models.user import User
from app.models.session import ActiveSession

def parse_user_agent(user_agent_str: str) -> str:
    """Extract a friendly device summary from User-Agent string."""
    if not user_agent_str:
        return "Unknown Device"
    ua = user_agent_str.lower()
    os_name = "Device"
    if "windows" in ua:
        os_name = "Windows"
    elif "macintosh" in ua or "mac os" in ua:
        os_name = "macOS"
    elif "iphone" in ua or "ipad" in ua:
        os_name = "iOS"
    elif "android" in ua:
        os_name = "Android"
    elif "linux" in ua:
        os_name = "Linux"

    browser = "Browser"
    if "edg" in ua:
        browser = "Edge"
    elif "chrome" in ua:
        browser = "Chrome"
    elif "firefox" in ua:
        browser = "Firefox"
    elif "safari" in ua and "chrome" not in ua:
        browser = "Safari"

    return f"{browser} on {os_name}"


class AuthService:
    @staticmethod
    def create_token(user: User, session_id: int) -> str:
        """Create a JWT containing user identity and session ID."""
        expiration = datetime.now(timezone.utc) + timedelta(hours=current_app.config["JWT_EXPIRATION_HOURS"])
        payload = {
            "sub": str(user.id),
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "session_id": session_id,
            "exp": expiration,
            "iat": datetime.now(timezone.utc)
        }
        return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")

    @staticmethod
    def login_user(user: User, user_agent: str = None, ip_address: str = None):
        """
        Enforce Single-Device Login Restriction:
        1. Invalidate any existing active sessions for this user.
        2. Create a new active session record.
        3. Issue a new authenticated JWT token linked to this session.
        """
        # Invalidate previous sessions
        ActiveSession.query.filter_by(user_id=user.id, is_active=True).update({
            "is_active": False,
            "last_active_at": datetime.now(timezone.utc)
        })

        session_token = secrets.token_hex(32)
        device_summary = parse_user_agent(user_agent)

        new_session = ActiveSession(
            user_id=user.id,
            session_token=session_token,
            device_info=device_summary,
            ip_address=ip_address or "127.0.0.1",
            is_active=True,
            created_at=datetime.now(timezone.utc),
            last_active_at=datetime.now(timezone.utc)
        )
        db.session.add(new_session)
        db.session.commit()

        token = AuthService.create_token(user, new_session.id)
        return token, new_session

    @staticmethod
    def verify_request_session():
        """
        Verify the Authorization header token and check active session status in DB.
        Returns (user, session, error_tuple)
        """
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None, None, ({"error": "AUTHENTICATION_REQUIRED", "message": "Missing or invalid authorization header."}, 401)

        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return None, None, ({"error": "TOKEN_EXPIRED", "message": "Your session has expired. Please log in again."}, 401)
        except jwt.InvalidTokenError:
            return None, None, ({"error": "TOKEN_INVALID", "message": "Invalid token provided."}, 401)

        user_id = payload.get("user_id")
        session_id = payload.get("session_id")

        user = db.session.get(User, user_id)
        if not user or not user.is_active:
            return None, None, ({"error": "ACCOUNT_DISABLED", "message": "Your account has been deactivated or does not exist."}, 403)

        # Enforce server-side single session check
        session_record = db.session.get(ActiveSession, session_id)
        if not session_record or not session_record.is_active or session_record.user_id != user.id:
            return None, None, ({
                "error": "SESSION_TERMINATED",
                "message": "Your session has been terminated because your account was logged in from another device."
            }, 401)

        # Update last active timestamp
        session_record.last_active_at = datetime.now(timezone.utc)
        db.session.commit()

        return user, session_record, None

    @staticmethod
    def logout_user(session_id: int):
        """Invalidate the session on user logout."""
        session_record = db.session.get(ActiveSession, session_id)
        if session_record:
            session_record.is_active = False
            session_record.last_active_at = datetime.now(timezone.utc)
            db.session.commit()
            return True
        return False
