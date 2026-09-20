"""
Kinetic Tech — Transcription Routes
─────────────────────────────────────
Endpoints for file upload, job status polling, result retrieval, download, and history.
"""

import io
import uuid
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from minio import Minio
from celery import Celery

from database import get_db
from models import User, TranscriptionJob, JobStatus, UserPlan
from schemas import (
    TranscriptionCreateResponse, TranscriptionJobResponse,
    TranscriptionResultResponse, SubtitleSegment,
    JobHistoryResponse, MessageResponse
)
from auth import get_current_user_id
from utils.quota import check_quota
from utils.subtitle_export import export_subtitles
from config import (
    REDIS_URL, S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY,
    S3_BUCKET, S3_SECURE, MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB,
    ALLOWED_EXTENSIONS
)

router = APIRouter(prefix="/api/v1/transcriptions", tags=["Transcription"])

# ── Celery Client ──
celery_client = Celery("subtitle_tasks", broker=REDIS_URL)
celery_client.conf.update(
    broker_transport_options={
        "priority_steps": list(range(10)),
        "sep": ":",
        "queue_order_strategy": "priority",
    },
    task_default_priority=5,
)

# ── MinIO Client ──
minio_client = Minio(
    endpoint=S3_ENDPOINT,
    access_key=S3_ACCESS_KEY,
    secret_key=S3_SECRET_KEY,
    secure=S3_SECURE,
)


def _ensure_bucket():
    try:
        if not minio_client.bucket_exists(S3_BUCKET):
            minio_client.make_bucket(S3_BUCKET)
    except Exception as e:
        print(f"[MinIO Warning] Failed to ensure bucket {S3_BUCKET}: {e}")


# ═══════════════════════════════════════════════
# 1. CREATE TRANSCRIPTION JOB (UPLOAD)
# ═══════════════════════════════════════════════

@router.post(
    "",
    response_model=TranscriptionCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload file video/audio và bắt đầu bóc sub",
)
async def create_transcription_job(
    file: UploadFile = File(...),
    language: str = Form("auto"),
    output_format: str = Form("srt"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # 1. Verify User & Quota
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không hợp lệ hoặc đã bị xóa.",
        )

    quota_info = check_quota(db, user)
    if not quota_info["can_proceed"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Bạn đã sử dụng hết thời lượng khả dụng ({round(quota_info['limit_seconds'] / 60)} phút). "
                "Vui lòng nâng cấp gói Pro hoặc Premium để tiếp tục sử dụng không giới hạn."
            ),
        )

    # 2. Validate File Extension
    filename = file.filename or "upload_audio.mp3"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Định dạng tệp '.{ext}' không được hỗ trợ. Vui lòng tải lên video (MP4, MKV, AVI, MOV...) hoặc audio (MP3, WAV, M4A, FLAC, AAC...).",
        )

    # 3. Read Content & Validate Size
    content = await file.read()
    file_size = len(content)
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Kích thước tệp ({round(file_size / (1024 * 1024), 1)} MB) vượt quá giới hạn cho phép ({MAX_UPLOAD_SIZE_MB} MB).",
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tệp tải lên rỗng (0 bytes). Vui lòng chọn tệp hợp lệ.",
        )

    # 4. Save to MinIO
    job_id = uuid.uuid4()
    s3_object_name = f"{user_id}/{job_id}_{filename}"
    try:
        _ensure_bucket()
        minio_client.put_object(
            bucket_name=S3_BUCKET,
            object_name=s3_object_name,
            data=io.BytesIO(content),
            length=file_size,
            content_type=file.content_type or "application/octet-stream",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lưu trữ tệp tin vào MinIO: {str(e)}",
        )

    # 5. Determine Job Priority based on user subscription plan
    # Premium: Priority 9 (VIP Priority — processed first)
    # Pro: Priority 6 (High priority)
    # Free: Priority 2 (Standard priority)
    if user.plan == UserPlan.PREMIUM:
        task_priority = 9
        initial_step = "Hàng đợi VIP Priority — Ưu tiên xử lý cao nhất..."
        create_msg = "Job đã được đưa vào hàng đợi ưu tiên cao nhất (VIP Priority — Xử lý trước)."
    elif user.plan == UserPlan.PRO:
        task_priority = 6
        initial_step = "Hàng đợi Pro — Ưu tiên xử lý cấp 1..."
        create_msg = "Job đã được đưa vào hàng đợi ưu tiên Pro."
    else:
        task_priority = 2
        initial_step = "Hàng đợi tiêu chuẩn — Đang chờ xử lý..."
        create_msg = "Job đã được tạo thành công và đang được đưa vào hàng đợi xử lý."

    job = TranscriptionJob(
        id=job_id,
        user_id=user.id,
        status=JobStatus.QUEUED,
        progress=0,
        current_step=initial_step,
        original_filename=filename,
        file_size_bytes=file_size,
        language=language,
        output_format=output_format,
        s3_audio_path=s3_object_name,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # 6. Dispatch Celery Task with Plan-Based Priority
    try:
        celery_client.send_task("process_transcription", args=[str(job.id)], priority=task_priority)
    except Exception as e:
        print(f"[Celery Dispatch Error] {e}")

    return TranscriptionCreateResponse(
        job_id=job.id,
        status="queued",
        message=create_msg,
    )


# ═══════════════════════════════════════════════
# 2. GET JOB STATUS
# ═══════════════════════════════════════════════

@router.get(
    "/{job_id}/status",
    response_model=TranscriptionJobResponse,
    summary="Kiểm tra tiến trình xử lý bóc sub",
)
def get_job_status(
    job_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    job = db.query(TranscriptionJob).filter(
        TranscriptionJob.id == job_id,
        TranscriptionJob.user_id == user_id,
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy công việc (job) yêu cầu.",
        )

    return TranscriptionJobResponse(
        id=job.id,
        status=job.status.value,
        progress=job.progress,
        current_step=job.current_step or "",
        original_filename=job.original_filename,
        file_size_bytes=job.file_size_bytes,
        audio_duration_sec=job.audio_duration_sec,
        language=job.language,
        output_format=job.output_format,
        created_at=job.created_at,
        completed_at=job.completed_at,
        error_message=job.error_message,
    )


# ═══════════════════════════════════════════════
# 3. GET JOB RESULT (JSON)
# ═══════════════════════════════════════════════

@router.get(
    "/{job_id}/result",
    response_model=TranscriptionResultResponse,
    summary="Lấy kết quả phụ đề chi tiết (JSON với timestamps)",
)
def get_job_result(
    job_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    job = db.query(TranscriptionJob).filter(
        TranscriptionJob.id == job_id,
        TranscriptionJob.user_id == user_id,
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy công việc (job) yêu cầu.",
        )

    if job.status == JobStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Xử lý bóc sub thất bại: {job.error_message or 'Lỗi không xác định'}",
        )

    if job.status != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail=f"Job vẫn đang trong quá trình xử lý (trạng thái: {job.status.value}, tiến trình: {job.progress}%).",
        )

    result_json = job.result_json or {}
    raw_segments = result_json.get("segments", [])

    segments = []
    for idx, seg in enumerate(raw_segments, start=1):
        segments.append(
            SubtitleSegment(
                index=idx,
                start=float(seg.get("start", 0.0)),
                end=float(seg.get("end", 0.0)),
                text=seg.get("text", "").strip(),
            )
        )

    full_text = result_json.get("text", "")

    return TranscriptionResultResponse(
        job_id=job.id,
        status=job.status.value,
        language=job.language,
        duration_sec=job.audio_duration_sec,
        segments=segments,
        full_text=full_text,
    )


# ═══════════════════════════════════════════════
# 4. DOWNLOAD SUBTITLE FILE (SRT / VTT / TXT)
# ═══════════════════════════════════════════════

@router.get(
    "/{job_id}/download",
    summary="Tải về tệp phụ đề định dạng SRT, VTT hoặc TXT",
)
def download_subtitles(
    job_id: uuid.UUID,
    fmt: str = Query("srt", regex="^(srt|vtt|txt)$"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    job = db.query(TranscriptionJob).filter(
        TranscriptionJob.id == job_id,
        TranscriptionJob.user_id == user_id,
    ).first()

    if not job or job.status != JobStatus.COMPLETED or not job.result_json:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy kết quả hoàn thành của công việc này.",
        )

    segments = job.result_json.get("segments", [])
    content, mime = export_subtitles(segments, format=fmt)

    base_name = job.original_filename.rsplit(".", 1)[0]
    out_filename = f"{base_name}.{fmt}"

    # Use utf-8-sig (with BOM) for srt/txt to guarantee CJK Chinese characters display properly in Premiere, CapCut, Notepad
    encoding = "utf-8-sig" if fmt in ["srt", "txt"] else "utf-8"

    return Response(
        content=content.encode(encoding),
        media_type=mime,
        headers={
            "Content-Disposition": f'attachment; filename="{out_filename}"',
            "Content-Type": f"{mime}; charset=utf-8",
        },
    )


# ═══════════════════════════════════════════════
# 5. DELETE JOB
# ═══════════════════════════════════════════════

@router.delete(
    "/{job_id}",
    response_model=MessageResponse,
    summary="Xóa công việc bóc sub và tệp tạm trên hệ thống",
)
def delete_job(
    job_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    job = db.query(TranscriptionJob).filter(
        TranscriptionJob.id == job_id,
        TranscriptionJob.user_id == user_id,
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy công việc yêu cầu.",
        )

    # Remove file from MinIO if exists
    if job.s3_audio_path:
        try:
            minio_client.remove_object(S3_BUCKET, job.s3_audio_path)
        except Exception:
            pass

    db.delete(job)
    db.commit()

    return MessageResponse(message="Đã xóa công việc thành công.")


# ═══════════════════════════════════════════════
# 6. USER JOB HISTORY
# ═══════════════════════════════════════════════

@router.get(
    "/history",
    response_model=JobHistoryResponse,
    summary="Lấy danh sách lịch sử các tệp đã bóc sub của người dùng",
)
def get_user_job_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size
    query = db.query(TranscriptionJob).filter(TranscriptionJob.user_id == user_id)

    total = query.count()
    jobs = (
        query.order_by(desc(TranscriptionJob.created_at))
        .offset(offset)
        .limit(page_size)
        .all()
    )

    job_responses = [
        TranscriptionJobResponse(
            id=j.id,
            status=j.status.value,
            progress=j.progress,
            current_step=j.current_step or "",
            original_filename=j.original_filename,
            file_size_bytes=j.file_size_bytes,
            audio_duration_sec=j.audio_duration_sec,
            language=j.language,
            output_format=j.output_format,
            created_at=j.created_at,
            completed_at=j.completed_at,
            error_message=j.error_message,
        )
        for j in jobs
    ]

    return JobHistoryResponse(
        jobs=job_responses,
        total=total,
        page=page,
        page_size=page_size,
    )
