import os
import json
import time
import shutil
import datetime
from celery import Celery
from minio import Minio
from redis import Redis

from security import check_pdf_security, SecurityException
from engines.pdf_to_docx import convert_pdf_to_docx
from engines.pdf_to_xlsx import convert_pdf_to_xlsx
from engines.pdf_to_pptx import convert_pdf_to_pptx
from engines.pdf_to_images import convert_pdf_to_images
from engines.pdf_to_epub import convert_pdf_to_epub
from engines.pdf_to_html import convert_pdf_to_html
from engines.pdf_to_rtf import convert_pdf_to_rtf
from engines.office_to_pdf import convert_office_to_pdf
from engines.images_to_pdf import convert_images_to_pdf
from engines.web_to_pdf import convert_html_to_pdf, convert_epub_to_pdf

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://minio:9000").replace("http://", "").replace("https://", "").rstrip("/")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin123")
S3_BUCKET = os.getenv("S3_BUCKET", "pdf-conversions")
S3_SECURE = os.getenv("S3_SECURE", "false").lower() == "true"

celery_app = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)

minio_client = Minio(
    S3_ENDPOINT,
    access_key=S3_ACCESS_KEY,
    secret_key=S3_SECRET_KEY,
    secure=S3_SECURE
)

redis_client = Redis.from_url(REDIS_URL, decode_responses=True)

MIME_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "png": "image/png",
    "jpg": "image/jpeg",
    "epub": "application/epub+zip",
    "rtf": "text/rtf",
    "html": "text/html",
    "zip": "application/zip"
}

@celery_app.task(name="tasks.execute_conversion", bind=True)
def execute_conversion(self, job_id: str):
    start_time = time.time()
    job_key = f"job:{job_id}"
    job_data = redis_client.hgetall(job_key)

    if not job_data:
        print(f"[Worker] Job {job_id} not found in Redis. Aborting.")
        return

    # Use /dev/shm (RAM disk) if available for max I/O speed, fallback to /tmp
    base_tmp = "/dev/shm" if os.path.exists("/dev/shm") else "/tmp"
    work_dir = os.path.join(base_tmp, f"conv_{job_id}")
    os.makedirs(work_dir, exist_ok=True)

    def update_progress(percent: int, step: str):
        redis_client.hset(job_key, mapping={"progress": percent, "current_step": step})

    try:
        update_progress(10, "fetching_from_storage")
        raw_s3_path = job_data["raw_s3_path"]
        orig_filename = job_data["original_filename"]
        source_ext = job_data["source_format"].lower()
        target_ext = job_data["target_format"].lower()
        options = json.loads(job_data.get("options", "{}"))

        local_input_path = os.path.join(work_dir, orig_filename)
        minio_client.fget_object(S3_BUCKET, raw_s3_path, local_input_path)

        update_progress(25, "verifying_security")
        active_input_path = local_input_path

        # PDF Security & Integrity Check
        if source_ext == "pdf":
            user_pw = options.get("password")
            active_input_path = check_pdf_security(local_input_path, user_pw)

        update_progress(45, f"converting_{source_ext}_to_{target_ext}")
        base_name = os.path.splitext(orig_filename)[0]
        local_output_path = os.path.join(work_dir, f"{base_name}_converted.{target_ext}")

        # ----------------------------------------------------
        # ROUTE TO SPECIALIZED CONVERSION ENGINE
        # ----------------------------------------------------
        final_output_path = local_output_path

        if source_ext == "pdf":
            # Group 1: PDF to X
            if target_ext == "docx":
                final_output_path = convert_pdf_to_docx(active_input_path, local_output_path, options.get("page_range"))
            elif target_ext == "xlsx":
                final_output_path = convert_pdf_to_xlsx(active_input_path, local_output_path)
            elif target_ext == "pptx":
                dpi = int(options.get("dpi", 150))
                final_output_path = convert_pdf_to_pptx(active_input_path, local_output_path, dpi=dpi)
            elif target_ext in ("png", "jpg"):
                dpi = int(options.get("dpi", 150))
                final_output_path = convert_pdf_to_images(active_input_path, local_output_path, img_format=target_ext, dpi=dpi)
            elif target_ext == "epub":
                final_output_path = convert_pdf_to_epub(active_input_path, local_output_path)
            elif target_ext == "rtf":
                final_output_path = convert_pdf_to_rtf(active_input_path, local_output_path)
            elif target_ext == "html":
                final_output_path = convert_pdf_to_html(active_input_path, local_output_path)
            else:
                raise ValueError(f"Không hỗ trợ chuyển đổi sang .{target_ext}")
        else:
            # Group 2: X to PDF
            if source_ext in ("docx", "doc", "xlsx", "xls", "pptx", "ppt", "rtf", "txt"):
                final_output_path = convert_office_to_pdf(active_input_path, local_output_path)
            elif source_ext in ("png", "jpg", "jpeg"):
                final_output_path = convert_images_to_pdf(active_input_path, local_output_path)
            elif source_ext == "html":
                final_output_path = convert_html_to_pdf(active_input_path, local_output_path)
            elif source_ext == "epub":
                final_output_path = convert_epub_to_pdf(active_input_path, local_output_path)
            else:
                raise ValueError(f"Không hỗ trợ chuyển đổi từ .{source_ext} sang PDF.")

        update_progress(80, "storing_result")

        # Determine final extension and content-type
        actual_filename = os.path.basename(final_output_path)
        actual_ext = actual_filename.split(".")[-1].lower()
        content_type = MIME_TYPES.get(actual_ext, "application/octet-stream")
        result_s3_path = f"converted/{job_id}/{actual_filename}"

        # Upload result to MinIO
        minio_client.fput_object(
            bucket_name=S3_BUCKET,
            object_name=result_s3_path,
            file_path=final_output_path,
            content_type=content_type
        )

        duration_ms = int((time.time() - start_time) * 1000)
        file_size_bytes = os.path.getsize(final_output_path)
        expires_at = (datetime.datetime.utcnow() + datetime.timedelta(hours=1)).isoformat() + "Z"

        # Update Redis Job State to Completed
        redis_client.hset(
            job_key,
            mapping={
                "status": "completed",
                "progress": 100,
                "current_step": "completed",
                "result_s3_path": result_s3_path,
                "result_filename": actual_filename,
                "result_size_bytes": file_size_bytes,
                "result_content_type": content_type,
                "duration_ms": duration_ms,
                "expires_at": expires_at
            }
        )
        print(f"[Worker] Successfully completed job {job_id} in {duration_ms}ms")

    except SecurityException as se:
        print(f"[Worker Error] Security exception on job {job_id}: {se}")
        redis_client.hset(job_key, mapping={"status": "failed", "error": str(se), "current_step": "security_failed"})
    except Exception as e:
        print(f"[Worker Error] Conversion failure on job {job_id}: {e}")
        redis_client.hset(job_key, mapping={"status": "failed", "error": f"Lỗi chuyển đổi: {str(e)}", "current_step": "conversion_failed"})
    finally:
        # Guarantee RAM disk temporary cleanup
        shutil.rmtree(work_dir, ignore_errors=True)
