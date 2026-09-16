import io
import json
import uuid
import datetime
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status, Query, Header
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import magic
from celery import Celery

from config import (
    minio_client, redis_client, init_storage,
    S3_BUCKET, REDIS_URL, MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB
)
from schemas import (
    TargetFormat, JobStatus, ConversionInitiatedResponse,
    ConversionStatusResponse, ConversionResultDetail
)

app = FastAPI(
    title="PDF Conversion System API",
    description="High-throughput, asynchronous PDF conversion engine with distributed Celery workers.",
    version="1.0.0"
)

# CORS — configurable via environment variable
_cors_origins = os.environ.get("ALLOWED_ORIGINS", "").strip()
CORS_ORIGINS = [o.strip() for o in _cors_origins.split(",") if o.strip()] if _cors_origins else [
    "https://studenttools.vn",
    "https://www.studenttools.vn",
    "http://localhost:3000",
    "http://localhost:5500",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5500",
]

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Celery Client
celery_app = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)

@app.on_event("startup")
def on_startup():
    init_storage()

# Mapping of valid extension pairs
VALID_PAIRS = {
    # PDF to X
    ("pdf", "docx"),
    ("pdf", "xlsx"),
    ("pdf", "pptx"),
    ("pdf", "png"),
    ("pdf", "jpg"),
    ("pdf", "epub"),
    ("pdf", "rtf"),
    ("pdf", "html"),
    
    # X to PDF
    ("docx", "pdf"),
    ("doc", "pdf"),
    ("xlsx", "pdf"),
    ("xls", "pdf"),
    ("pptx", "pdf"),
    ("ppt", "pdf"),
    ("png", "pdf"),
    ("jpg", "pdf"),
    ("jpeg", "pdf"),
    ("epub", "pdf"),
    ("rtf", "pdf"),
    ("html", "pdf"),
    ("txt", "pdf"),
}

def detect_file_extension(filename: str, file_bytes: bytes) -> str:
    """Detect file format using magic bytes with fallback to extension."""
    mime = magic.from_buffer(file_bytes[:2048], mime=True)
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    
    mime_map = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "application/msword": "doc",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
        "application/vnd.ms-excel": "xls",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
        "application/vnd.ms-powerpoint": "ppt",
        "image/png": "png",
        "image/jpeg": "jpg",
        "application/epub+zip": "epub",
        "text/rtf": "rtf",
        "text/html": "html",
        "text/plain": "txt"
    }
    
    detected = mime_map.get(mime)
    if detected:
        return detected
    return ext

@app.post(
    "/api/v1/conversions",
    response_model=ConversionInitiatedResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload file and queue conversion job"
)
async def create_conversion_job(
    file: UploadFile = File(...),
    target_format: TargetFormat = Form(...),
    options: Optional[str] = Form(None),
    x_pdf_password: Optional[str] = Header(None, alias="X-PDF-Password")
):
    # Read file into memory and validate size
    file_bytes = await file.read()
    file_size = len(file_bytes)
    
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Dung lượng file ({file_size / (1024*1024):.1f} MB) vượt quá giới hạn cho phép ({MAX_UPLOAD_SIZE_MB} MB)."
        )
    
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File rỗng không có nội dung."
        )

    source_ext = detect_file_extension(file.filename, file_bytes)
    target_ext = target_format.value.lower()

    if (source_ext, target_ext) not in VALID_PAIRS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cặp chuyển đổi từ .{source_ext} sang .{target_ext} hiện không được hỗ trợ."
        )

    job_id = str(uuid.uuid4())
    raw_s3_path = f"raw/{job_id}/{file.filename}"

    # Upload raw file to MinIO
    try:
        minio_client.put_object(
            bucket_name=S3_BUCKET,
            object_name=raw_s3_path,
            data=io.BytesIO(file_bytes),
            length=file_size,
            content_type=file.content_type or "application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lưu trữ tạm thời: {str(e)}"
        )

    # Parse options JSON
    parsed_options = {}
    if options:
        try:
            parsed_options = json.loads(options)
        except Exception:
            pass
    if x_pdf_password:
        parsed_options["password"] = x_pdf_password

    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    
    # Save initial Job state to Redis with 1-hour TTL
    job_data = {
        "job_id": job_id,
        "status": JobStatus.QUEUED.value,
        "progress": 0,
        "current_step": "queued_in_broker",
        "source_format": source_ext,
        "target_format": target_ext,
        "original_filename": file.filename,
        "file_size_bytes": file_size,
        "raw_s3_path": raw_s3_path,
        "created_at": now_iso,
        "options": json.dumps(parsed_options),
        "error": ""
    }
    
    redis_client.hset(f"job:{job_id}", mapping=job_data)
    redis_client.expire(f"job:{job_id}", 3600)  # Auto expire in 1 hour

    # Route to appropriate queue
    queue_name = "fast" if target_ext in ["png", "jpg", "pdf"] and source_ext in ["png", "jpg"] else "heavy"

    celery_app.send_task(
        "tasks.execute_conversion",
        args=[job_id],
        queue=queue_name
    )

    return ConversionInitiatedResponse(
        success=True,
        job_id=job_id,
        status=JobStatus.QUEUED,
        source_format=source_ext,
        target_format=target_ext,
        original_filename=file.filename,
        file_size_bytes=file_size,
        created_at=now_iso,
        links={
            "status_url": f"/api/v1/conversions/{job_id}",
            "download_url": f"/api/v1/conversions/{job_id}/download",
            "sse_stream": f"/api/v1/conversions/{job_id}/stream"
        }
    )

@app.get(
    "/api/v1/conversions/{job_id}",
    response_model=ConversionStatusResponse,
    summary="Get status and progress of a conversion job"
)
def get_conversion_status(job_id: str):
    data = redis_client.hgetall(f"job:{job_id}")
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tác vụ chuyển đổi không tồn tại hoặc đã hết hạn (TTL 1h)."
        )

    result_detail = None
    if data.get("status") == JobStatus.COMPLETED.value:
        result_detail = ConversionResultDetail(
            filename=data.get("result_filename", "converted_output"),
            file_size_bytes=int(data.get("result_size_bytes", 0)),
            content_type=data.get("result_content_type", "application/octet-stream"),
            download_url=f"/api/v1/conversions/{job_id}/download",
            expires_at=data.get("expires_at")
        )

    return ConversionStatusResponse(
        job_id=job_id,
        status=JobStatus(data.get("status", JobStatus.QUEUED.value)),
        progress=int(data.get("progress", 0)),
        current_step=data.get("current_step"),
        source_format=data.get("source_format", ""),
        target_format=data.get("target_format", ""),
        duration_ms=int(data.get("duration_ms", 0)) if data.get("duration_ms") else None,
        result=result_detail,
        error=data.get("error") if data.get("error") else None
    )

@app.get(
    "/api/v1/conversions/{job_id}/download",
    summary="Download converted file via 302 Presigned URL or Direct Stream"
)
def download_conversion_result(job_id: str):
    data = redis_client.hgetall(f"job:{job_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Tác vụ không tồn tại.")
    
    if data.get("status") != JobStatus.COMPLETED.value:
        raise HTTPException(
            status_code=400,
            detail=f"File chưa hoàn thành xử lý (Trạng thái hiện tại: {data.get('status')})."
        )

    result_s3_path = data.get("result_s3_path")
    if not result_s3_path:
        raise HTTPException(status_code=500, detail="Không tìm thấy đường dẫn kết quả.")

    try:
        # Generate 15-minute Presigned Download URL from MinIO
        presigned_url = minio_client.presigned_get_object(
            bucket_name=S3_BUCKET,
            object_name=result_s3_path,
            expires=datetime.timedelta(minutes=15),
            response_headers={
                "response-content-disposition": f'attachment; filename="{data.get("result_filename")}"'
            }
        )
        return RedirectResponse(url=presigned_url, status_code=status.HTTP_302_FOUND)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không thể tạo link tải: {str(e)}")

@app.get("/api/v1/conversions/{job_id}/stream", summary="Server-Sent Events (SSE) Live Progress")
async def stream_job_progress(job_id: str):
    """Streams JSON updates to clients in real-time."""
    import asyncio
    
    async def event_generator():
        while True:
            data = redis_client.hgetall(f"job:{job_id}")
            if not data:
                yield f"data: {json.dumps({'error': 'Job not found'})}\n\n"
                break
            
            payload = {
                "job_id": job_id,
                "status": data.get("status"),
                "progress": int(data.get("progress", 0)),
                "current_step": data.get("current_step")
            }
            yield f"data: {json.dumps(payload)}\n\n"
            
            if data.get("status") in [JobStatus.COMPLETED.value, JobStatus.FAILED.value]:
                break
            await asyncio.sleep(1.0)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/v1/health", summary="Health check endpoint")
def health_check():
    redis_ok = False
    try:
        redis_ok = redis_client.ping()
    except Exception:
        pass

    s3_ok = False
    try:
        s3_ok = minio_client.bucket_exists(S3_BUCKET)
    except Exception:
        pass

    return {
        "status": "healthy" if (redis_ok and s3_ok) else "degraded",
        "redis_connected": redis_ok,
        "storage_connected": s3_ok,
        "max_upload_size_mb": MAX_UPLOAD_SIZE_MB
    }
