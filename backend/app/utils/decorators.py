from functools import wraps
from flask import g, jsonify, request
from app.services.auth_service import AuthService

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user, session, err_response = AuthService.verify_request_session()
        if err_response:
            return jsonify(err_response[0]), err_response[1]

        g.current_user = user
        g.current_session = session
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user, session, err_response = AuthService.verify_request_session()
        if err_response:
            return jsonify(err_response[0]), err_response[1]

        if not user.is_admin():
            return jsonify({
                "error": "FORBIDDEN",
                "message": "Administrator privileges required to access this resource."
            }), 403

        g.current_user = user
        g.current_session = session
        return f(*args, **kwargs)
    return decorated_function


def optional_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        g.current_user = None
        g.current_session = None

        if auth_header and auth_header.startswith("Bearer "):
            user, session, err = AuthService.verify_request_session()
            if not err:
                g.current_user = user
                g.current_session = session

        return f(*args, **kwargs)
    return decorated_function
