import os
import hmac
import hashlib
import json
import base64
import time
from flask import current_app, Response, request, send_file
from app.models.course import Lesson
from app.models.user import User
from app.services.course_service import CourseService

class VideoService:
    @staticmethod
    def generate_signed_token(user: User, lesson: Lesson) -> tuple[dict, str]:
        """
        Generates a short-lived signed HMAC token for video playback.
        Ensures the student has active enrollment and the lesson is unlocked first.
        """
        can_access, reason = CourseService.can_access_lesson(user, lesson)
        if not can_access:
            return None, reason

        secret = current_app.config["VIDEO_TOKEN_SECRET"]
        expiry_seconds = current_app.config["VIDEO_TOKEN_EXPIRY_SECONDS"]
        expires_at = int(time.time()) + expiry_seconds

        payload = {
            "uid": user.id if user else 0,
            "lid": lesson.id,
            "exp": expires_at,
            "is_preview": lesson.is_free_preview
        }
        payload_str = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
        sig = hmac.new(secret.encode(), payload_str.encode(), hashlib.sha256).hexdigest()
        token = f"{payload_str}.{sig}"

        return {
            "playback_token": token,
            "stream_url": f"/api/learning/lessons/{lesson.id}/stream?token={token}",
            "expires_in": expiry_seconds,
            "expires_at": expires_at,
        }, None

    @staticmethod
    def verify_token(token: str, lesson_id: int) -> tuple[bool, dict, str]:
        """Verify the integrity and expiry of the playback token."""
        if not token:
            return False, None, "Missing playback authorization token."

        try:
            parts = token.split(".")
            if len(parts) != 2:
                return False, None, "Malformed playback token format."

            payload_str, sig = parts
            secret = current_app.config["VIDEO_TOKEN_SECRET"]
            expected_sig = hmac.new(secret.encode(), payload_str.encode(), hashlib.sha256).hexdigest()

            if not hmac.compare_digest(sig, expected_sig):
                return False, None, "Invalid token signature."

            payload_bytes = base64.urlsafe_b64decode(payload_str.encode())
            payload = json.loads(payload_bytes.decode())

            # Check expiration
            if time.time() > payload.get("exp", 0):
                return False, None, "Playback token has expired. Please refresh player."

            # Check lesson ID matching
            if payload.get("lid") != lesson_id:
                return False, None, "Playback token does not match requested lesson."

            return True, payload, None
        except Exception as e:
            return False, None, f"Token verification error: {str(e)}"

    @staticmethod
    def get_range_response(file_path: str, range_header: str) -> Response:
        """
        Handle HTTP Range header for video seeking (206 Partial Content).
        Enables seamless HTML5 scrubbing and smooth playback.
        """
        file_size = os.path.getsize(file_path)
        byte1, byte2 = 0, None

        if range_header:
            range_match = range_header.replace("bytes=", "").split("-")
            if range_match[0]:
                byte1 = int(range_match[0])
            if len(range_match) > 1 and range_match[1]:
                byte2 = int(range_match[1])

        length = file_size - byte1
        if byte2 is not None:
            length = byte2 - byte1 + 1

        chunk_size = 1024 * 1024 # 1MB chunk limit for streaming
        if length > chunk_size and byte2 is None:
            byte2 = byte1 + chunk_size - 1
            length = byte2 - byte1 + 1

        def stream_chunk():
            with open(file_path, "rb") as f:
                f.seek(byte1)
                remaining = length
                while remaining > 0:
                    read_len = min(remaining, 64 * 1024)
                    data = f.read(read_len)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        rv = Response(stream_chunk(), 206, mimetype="video/mp4", direct_passthrough=True)
        rv.headers.add("Content-Range", f"bytes {byte1}-{byte2 or (file_size - 1)}/{file_size}")
        rv.headers.add("Accept-Ranges", "bytes")
        rv.headers.add("Content-Length", str(length))
        rv.headers.add("Cache-Control", "no-cache, no-store, must-revalidate")
        return rv
