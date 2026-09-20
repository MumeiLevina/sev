"""
Kinetic Tech — Celery Worker Tasks
────────────────────────────────────
Background transcription processing using FFmpeg and OpenAI Whisper API.
"""

import os
import io
import json
import uuid
import shutil
import tempfile
import subprocess
from datetime import datetime, timezone

from celery import Celery
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, Enum, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import sessionmaker, declarative_base
from minio import Minio

# ── Environment & Config ──
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://kinetic:kinetic_secret_2026@postgres:5432/subtitle_service")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://minio:9000").replace("http://", "").replace("https://", "").rstrip("/")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin123")
S3_BUCKET = os.getenv("S3_BUCKET", "subtitle-uploads")
S3_SECURE = os.getenv("S3_SECURE", "false").lower() == "true"

# ── Celery Setup ──
app = Celery("subtitle_tasks", broker=REDIS_URL)
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
    broker_transport_options={
        "priority_steps": list(range(10)),
        "sep": ":",
        "queue_order_strategy": "priority",
    },
    task_default_priority=5,
)

# ── Database Setup ──
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class TranscriptionJob(Base):
    __tablename__ = "transcription_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    status = Column(String(50), default="queued", nullable=False)
    progress = Column(Integer, default=0)
    current_step = Column(String(100), default="queued")
    original_filename = Column(String(255), nullable=False)
    file_size_bytes = Column(BigInteger, default=0)
    audio_duration_sec = Column(Integer, nullable=True)
    language = Column(String(10), default="auto")
    output_format = Column(String(10), default="srt")
    s3_audio_path = Column(String(500), nullable=True)
    result_json = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    job_id = Column(UUID(as_uuid=True), nullable=True)
    duration_sec = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── MinIO Setup ──
minio_client = Minio(
    endpoint=S3_ENDPOINT,
    access_key=S3_ACCESS_KEY,
    secret_key=S3_SECRET_KEY,
    secure=S3_SECURE,
)


def get_audio_duration(file_path: str) -> float:
    """Get audio/video duration in seconds using ffprobe."""
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            file_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return float(res.stdout.strip())
    except Exception as e:
        print(f"[ffprobe error] {e}")
        return 30.0  # Fallback duration


def convert_to_optimized_audio(input_path: str, output_base_path: str) -> str:
    """
    Extract and optimize audio to 16kHz mono PCM WAV (or high-bitrate MP3 128k if WAV > 24MB).
    Model ASR Whisper performs best with 16kHz mono 16-bit PCM Linear.
    """
    wav_path = output_base_path + ".wav"
    cmd_wav = [
        "ffmpeg", "-y", "-i", input_path,
        "-vn", "-acodec", "pcm_s16le",
        "-ar", "16000", "-ac", "1",
        wav_path
    ]
    subprocess.run(cmd_wav, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

    # Check size: OpenAI Whisper API limit is 25MB (26,214,400 bytes)
    wav_size = os.path.getsize(wav_path) if os.path.exists(wav_path) else 0
    if wav_size > 24 * 1024 * 1024:
        mp3_path = output_base_path + ".mp3"
        cmd_mp3 = [
            "ffmpeg", "-y", "-i", wav_path,
            "-vn", "-acodec", "libmp3lame",
            "-ar", "16000", "-ac", "1",
            "-b:a", "128k",
            mp3_path
        ]
        subprocess.run(cmd_mp3, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        if os.path.exists(wav_path):
            os.remove(wav_path)
        return mp3_path

    return wav_path

@app.task(name="process_transcription", bind=True)
def process_transcription(self, job_id_str: str):
    """Main worker task to process video/audio transcription."""
    db = SessionLocal()
    temp_dir = tempfile.mkdtemp(prefix=f"transcribe_{job_id_str}_")
    try:
        job = db.query(TranscriptionJob).filter(TranscriptionJob.id == job_id_str).first()
        if not job:
            print(f"[Worker] Job {job_id_str} not found in DB.")
            return

        # ── Step 1: Downloading file from MinIO ──
        job.status = "extracting_audio"
        job.progress = 15
        job.current_step = "Đang tải tệp tin từ máy chủ lưu trữ..."
        db.commit()

        input_local_path = os.path.join(temp_dir, "input_media")
        minio_client.fget_object(S3_BUCKET, job.s3_audio_path, input_local_path)

        # ── Step 2: Extracting Audio & Measuring Duration ──
        job.progress = 30
        job.current_step = "Đang trích xuất và tối ưu hóa dải âm thanh..."
        db.commit()

        audio_output_path = convert_to_optimized_audio(input_local_path, os.path.join(temp_dir, "extracted_audio"))

        duration = get_audio_duration(audio_output_path)
        duration_sec = max(1, int(round(duration)))
        job.audio_duration_sec = duration_sec

        # ── Step 3: Transcribing with OpenAI Whisper ──
        job.status = "transcribing"
        job.progress = 55
        job.current_step = "AI Whisper đang bóc băng và nhận diện tiếng nói..."
        db.commit()

        has_valid_key = bool(OPENAI_API_KEY and not OPENAI_API_KEY.startswith("sk-your-openai-api-key"))

        if has_valid_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=OPENAI_API_KEY)

                with open(audio_output_path, "rb") as af:
                    kwargs = {
                        "model": "whisper-1",
                        "file": af,
                        "response_format": "verbose_json",
                        "temperature": 0.0,
                    }
                    if job.language and job.language != "auto":
                        kwargs["language"] = job.language
                        if job.language == "zh":
                            kwargs["prompt"] = "以下是普通话的音频内容，包含简体中文及正确的标点符号。"

                    transcription = client.audio.transcriptions.create(**kwargs)

                if hasattr(transcription, "model_dump"):
                    result_dict = transcription.model_dump()
                elif hasattr(transcription, "to_dict"):
                    result_dict = transcription.to_dict()
                elif isinstance(transcription, dict):
                    result_dict = transcription
                else:
                    result_dict = json.loads(str(transcription))
            except Exception as whisper_err:
                raise RuntimeError(f"OpenAI Whisper transcription failed: {whisper_err}")
        else:
            raise RuntimeError("OPENAI_API_KEY is not configured on the subtitle-service worker.")

        # ── Step 4: Record Usage Log ──
        usage = UsageLog(
            user_id=job.user_id,
            job_id=job.id,
            duration_sec=duration_sec,
        )
        db.add(usage)

        # ── Step 5: Mark Job as Completed ──
        job.status = "completed"
        job.progress = 100
        job.current_step = "Hoàn thành trích xuất phụ đề!"
        job.result_json = result_dict
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
        print(f"[Worker] Job {job_id_str} completed successfully! Duration: {duration_sec}s.")

    except Exception as e:
        print(f"[Worker Error] Job {job_id_str} failed: {e}")
        try:
            job = db.query(TranscriptionJob).filter(TranscriptionJob.id == job_id_str).first()
            if job:
                job.status = "failed"
                job.progress = 0
                job.current_step = "Xử lý thất bại"
                job.error_message = str(e)
                db.commit()
        except Exception as dbe:
            print(f"[Worker DB Error] {dbe}")
    finally:
        db.close()
        shutil.rmtree(temp_dir, ignore_errors=True)
