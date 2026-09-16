import os
from minio import Minio
from redis import Redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://minio:9000").replace("http://", "").replace("https://", "").rstrip("/")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin123")
S3_BUCKET = os.getenv("S3_BUCKET", "pdf-conversions")
S3_SECURE = os.getenv("S3_SECURE", "false").lower() == "true"
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

# Initialize MinIO Client
minio_client = Minio(
    S3_ENDPOINT,
    access_key=S3_ACCESS_KEY,
    secret_key=S3_SECRET_KEY,
    secure=S3_SECURE
)

# Initialize Redis Client
redis_client = Redis.from_url(REDIS_URL, decode_responses=True)

def init_storage():
    """Ensure S3 Bucket exists and configure lifecycle rules."""
    try:
        if not minio_client.bucket_exists(S3_BUCKET):
            minio_client.make_bucket(S3_BUCKET)
            print(f"[Storage] Created bucket: {S3_BUCKET}")
        else:
            print(f"[Storage] Bucket already exists: {S3_BUCKET}")
    except Exception as e:
        print(f"[Storage Error] Could not initialize bucket: {e}")
