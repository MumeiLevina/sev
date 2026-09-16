"""
Kinetic Tech — Subtitle Service Configuration
───────────────────────────────────────────────
Centralized configuration loaded from environment variables.
"""

import os

# ── Database ──
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://kinetic:kinetic_secret_2026@postgres:5432/subtitle_service")

# ── Redis ──
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

# ── JWT ──
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
JWT_REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# ── OpenAI ──
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# ── Google OAuth2 ──
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

# ── S3 / MinIO ──
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://minio:9000").replace("http://", "").replace("https://", "").rstrip("/")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin123")
S3_BUCKET = os.getenv("S3_BUCKET", "subtitle-uploads")
S3_SECURE = os.getenv("S3_SECURE", "false").lower() == "true"

# ── Upload Limits ──
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "100"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

# Allowed audio/video MIME types
ALLOWED_AUDIO_MIMES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
    "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/flac",
    "audio/ogg", "audio/webm", "audio/aac",
}
ALLOWED_VIDEO_MIMES = {
    "video/mp4", "video/x-matroska", "video/avi", "video/x-msvideo",
    "video/quicktime", "video/webm", "video/x-flv", "video/mpeg",
}
ALLOWED_MIMES = ALLOWED_AUDIO_MIMES | ALLOWED_VIDEO_MIMES

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    "mp3", "wav", "m4a", "flac", "ogg", "webm", "aac",
    "mp4", "mkv", "avi", "mov", "flv", "mpeg", "mpg",
}

# ── Quota (seconds) ──
FREE_QUOTA_SECONDS = int(os.getenv("FREE_QUOTA_SECONDS", "3600"))
PRO_QUOTA_SECONDS = int(os.getenv("PRO_QUOTA_SECONDS", "36000"))
PREMIUM_QUOTA_SECONDS = int(os.getenv("PREMIUM_QUOTA_SECONDS", "0"))  # 0 = unlimited

# ── Whisper API ──
WHISPER_MODEL = "whisper-1"
WHISPER_MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB limit
