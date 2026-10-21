import os
from flask import Flask, jsonify
from app.config import config_by_name
from app.extensions import db, cors

def create_app(config_name="default"):
    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["default"]))

    # Initialize extensions
    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Ensure upload directories exist
    upload_root = app.config.get("UPLOAD_FOLDER")
    if upload_root:
        for sub in ["thumbnails", "videos", "resources"]:
            os.makedirs(os.path.join(upload_root, sub), exist_ok=True)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.courses import courses_bp
    from app.routes.learning import learning_bp
    from app.routes.payments import payments_bp
    from app.routes.student import student_bp
    from app.routes.admin import admin_bp
    from app.routes.uploads import uploads_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(courses_bp)
    app.register_blueprint(learning_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(uploads_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "Mini LMS API",
            "version": "1.0.0"
        }), 200

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({"error": "NOT_FOUND", "message": "The requested API endpoint was not found."}), 404

    @app.errorhandler(413)
    def handle_file_too_large(e):
        return jsonify({"error": "FILE_TOO_LARGE", "message": "Uploaded file exceeds maximum permitted size (100MB)."}), 413

    @app.errorhandler(500)
    def handle_internal_server_error(e):
        return jsonify({"error": "SERVER_ERROR", "message": "An internal server error occurred."}), 500

    return app
