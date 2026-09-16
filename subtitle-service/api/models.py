"""
Kinetic Tech — Database Models (SQLAlchemy)
───────────────────────────────────────────
PostgreSQL schema for users, jobs, usage logs, and transactions.
"""

import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Integer, Text, DateTime, Enum, ForeignKey, Index, BigInteger
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


# ── Enums ──

class AuthProvider(str, enum.Enum):
    EMAIL = "email"
    GOOGLE = "google"


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class UserPlan(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    PREMIUM = "premium"


class JobStatus(str, enum.Enum):
    QUEUED = "queued"
    EXTRACTING_AUDIO = "extracting_audio"
    TRANSCRIBING = "transcribing"
    COMPLETED = "completed"
    FAILED = "failed"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


# ── Models ──

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # NULL if Google login
    display_name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    provider = Column(Enum(AuthProvider), default=AuthProvider.EMAIL, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    plan = Column(Enum(UserPlan), default=UserPlan.FREE, nullable=False)
    plan_expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    jobs = relationship("TranscriptionJob", back_populates="user", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    revoked = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="refresh_tokens")


class TranscriptionJob(Base):
    __tablename__ = "transcription_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(JobStatus), default=JobStatus.QUEUED, nullable=False)
    progress = Column(Integer, default=0)  # 0-100
    current_step = Column(String(100), default="queued")
    original_filename = Column(String(255), nullable=False)
    file_size_bytes = Column(BigInteger, default=0)
    audio_duration_sec = Column(Integer, nullable=True)  # Detected after processing
    language = Column(String(10), default="auto")  # 'vi', 'en', 'auto'
    output_format = Column(String(10), default="srt")  # 'srt', 'vtt', 'txt'
    s3_audio_path = Column(String(500), nullable=True)
    result_json = Column(JSONB, nullable=True)  # Full Whisper response with segments
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="jobs")
    usage_log = relationship("UsageLog", back_populates="job", uselist=False)

    __table_args__ = (
        Index("ix_jobs_user_created", "user_id", "created_at"),
    )


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("transcription_jobs.id", ondelete="SET NULL"), nullable=True)
    duration_sec = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="usage_logs")
    job = relationship("TranscriptionJob", back_populates="usage_log")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Integer, nullable=False, default=0)  # VND
    plan = Column(String(20), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False)
    payment_method = Column(String(50), nullable=True)  # 'momo', 'vnpay', 'stripe'
    payment_ref = Column(String(255), nullable=True)  # External reference ID
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="transactions")
