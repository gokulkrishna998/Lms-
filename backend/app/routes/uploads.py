import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory, g
from werkzeug.utils import secure_filename
from app.models.course import MediaAsset
from app.extensions import db
from app.utils.decorators import admin_required

uploads_bp = Blueprint("uploads", __name__, url_prefix="/api/uploads")

def allowed_file(filename: str, allowed_set: set) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_set

@uploads_bp.route("/thumbnail", methods=["POST"])
@admin_required
def upload_thumbnail():
    if "file" not in request.files:
        return jsonify({"error": "VALIDATION_ERROR", "message": "No file part in request."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "VALIDATION_ERROR", "message": "No file selected."}), 400

    if not allowed_file(file.filename, current_app.config["ALLOWED_IMAGE_EXTENSIONS"]):
        return jsonify({"error": "INVALID_FILE_TYPE", "message": "Allowed image formats: png, jpg, jpeg, webp, svg."}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"thumb_{uuid.uuid4().hex[:12]}.{ext}"
    target_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "thumbnails")
    os.makedirs(target_dir, exist_ok=True)

    file_path = os.path.join(target_dir, filename)
    file.save(file_path)

    public_url = f"/api/uploads/thumbnails/{filename}"
    return jsonify({
        "message": "Thumbnail uploaded successfully.",
        "url": public_url,
        "filename": filename
    }), 201


@uploads_bp.route("/thumbnails/<filename>", methods=["GET"])
def serve_thumbnail(filename: str):
    target_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "thumbnails")
    return send_from_directory(target_dir, filename)


@uploads_bp.route("/video", methods=["POST"])
@admin_required
def upload_video():
    """Admin endpoint to store protected video assets."""
    if "file" not in request.files:
        return jsonify({"error": "VALIDATION_ERROR", "message": "No video file provided."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "VALIDATION_ERROR", "message": "No file selected."}), 400

    if not allowed_file(file.filename, current_app.config["ALLOWED_VIDEO_EXTENSIONS"]):
        return jsonify({"error": "INVALID_FILE_TYPE", "message": "Allowed video formats: mp4, webm, m4v, mov."}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"vid_{uuid.uuid4().hex[:16]}.{ext}"
    target_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "videos")
    os.makedirs(target_dir, exist_ok=True)

    file_path = os.path.join(target_dir, filename)
    file.save(file_path)
    file_size = os.path.getsize(file_path)

    media = MediaAsset(
        title=file.filename,
        file_path=filename,
        file_size=file_size,
        mime_type=file.mimetype,
        uploader_id=g.current_user.id
    )
    db.session.add(media)
    db.session.commit()

    return jsonify({
        "message": "Protected video asset registered successfully.",
        "video_asset_id": filename,
        "media": media.to_dict()
    }), 201


@uploads_bp.route("/resource", methods=["POST"])
@admin_required
def upload_resource():
    """Upload downloadable lesson resources (e.g. PDF cheatsheets, code zip)."""
    if "file" not in request.files:
        return jsonify({"error": "VALIDATION_ERROR", "message": "No resource file provided."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "VALIDATION_ERROR", "message": "No file selected."}), 400

    if not allowed_file(file.filename, current_app.config["ALLOWED_RESOURCE_EXTENSIONS"]):
        return jsonify({"error": "INVALID_FILE_TYPE", "message": "Allowed formats: pdf, zip, doc, docx, txt."}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"res_{uuid.uuid4().hex[:12]}.{ext}"
    target_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "resources")
    os.makedirs(target_dir, exist_ok=True)

    file_path = os.path.join(target_dir, filename)
    file.save(file_path)

    public_url = f"/api/uploads/resources/{filename}"
    return jsonify({
        "message": "Resource file uploaded successfully.",
        "url": public_url,
        "name": file.filename,
        "filename": filename
    }), 201


@uploads_bp.route("/resources/<filename>", methods=["GET"])
def serve_resource(filename: str):
    target_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "resources")
    return send_from_directory(target_dir, filename)
