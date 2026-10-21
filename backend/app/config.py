import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production-798234789-super-secure-key-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-super-secret-key-9812739182-very-secure-and-long-token-signing-key-64bytes")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", 72))

    # Database: SQLite default for zero-setup local dev, or Postgres if DATABASE_URL is set
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'minilms.db')}"
    )
    if SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
    }

    # Uploads & Media Storage
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 100 * 1024 * 1024)) # 100MB
    ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "svg"}
    ALLOWED_VIDEO_EXTENSIONS = {"mp4", "webm", "m4v", "mov"}
    ALLOWED_RESOURCE_EXTENSIONS = {"pdf", "zip", "doc", "docx", "txt"}

    # Video playback security token secret & TTL
    VIDEO_TOKEN_SECRET = os.getenv("VIDEO_TOKEN_SECRET", "video-stream-hmac-secret-token-389172")
    VIDEO_TOKEN_EXPIRY_SECONDS = int(os.getenv("VIDEO_TOKEN_EXPIRY_SECONDS", 300)) # 5 minutes

    # Razorpay Test / Live Configuration
    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder_key_id")
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "rzp_test_placeholder_key_secret")
    RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "rzp_webhook_secret_demo")

    # Timezone & Regional defaults
    TIMEZONE = os.getenv("TIMEZONE", "Asia/Kolkata")
    CURRENCY = os.getenv("CURRENCY", "INR")
    CURRENCY_SYMBOL = os.getenv("CURRENCY_SYMBOL", "₹")

    # CORS
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False
    DEBUG = False

class ProductionConfig(Config):
    DEBUG = False

config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
