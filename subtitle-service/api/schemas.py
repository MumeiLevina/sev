"""
Kinetic Tech — Pydantic Schemas
──────────────────────────────
Request/response validation schemas for all API endpoints.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ═══════════════════════════════════════════════
# AUTH SCHEMAS
# ═══════════════════════════════════════════════

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    display_name: Optional[str] = Field(None, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str
    code: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=4, max_length=10)
    new_password: str = Field(..., min_length=6, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    provider: str
    role: str
    plan: str
    plan_expires_at: Optional[datetime]
    created_at: datetime
    quota_used_seconds: int = 0
    quota_limit_seconds: int = 3600

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════
# TRANSCRIPTION SCHEMAS
# ═══════════════════════════════════════════════

class TranscriptionJobResponse(BaseModel):
    id: uuid.UUID
    status: str
    progress: int
    current_step: str
    original_filename: str
    file_size_bytes: int
    audio_duration_sec: Optional[int]
    language: str
    output_format: str
    created_at: datetime
    completed_at: Optional[datetime]
    error_message: Optional[str]

    class Config:
        from_attributes = True


class SubtitleSegment(BaseModel):
    index: int
    start: float  # seconds
    end: float
    text: str


class TranscriptionResultResponse(BaseModel):
    job_id: uuid.UUID
    status: str
    language: str
    duration_sec: Optional[int]
    segments: List[SubtitleSegment]
    full_text: str


class TranscriptionCreateResponse(BaseModel):
    job_id: uuid.UUID
    status: str
    message: str


class JobHistoryResponse(BaseModel):
    jobs: List[TranscriptionJobResponse]
    total: int
    page: int
    page_size: int


# ═══════════════════════════════════════════════
# BILLING SCHEMAS
# ═══════════════════════════════════════════════

class PlanInfo(BaseModel):
    name: str
    price_vnd: int
    quota_seconds: int  # 0 = unlimited
    features: List[str]
    recommended: bool = False


class PlansResponse(BaseModel):
    plans: List[PlanInfo]


class UsageResponse(BaseModel):
    plan: str
    quota_used_seconds: int
    quota_limit_seconds: int  # 0 = unlimited
    quota_remaining_seconds: int  # -1 = unlimited
    usage_percentage: float
    plan_expires_at: Optional[datetime]
    total_jobs: int
    total_audio_seconds: int


class UpgradeRequest(BaseModel):
    plan: str = Field(..., pattern="^(pro|premium)$")
    payment_method: str = Field(..., pattern="^(momo|vnpay|stripe)$")


class UpgradeResponse(BaseModel):
    transaction_id: uuid.UUID
    status: str
    message: str
    payment_url: Optional[str] = None  # Redirect URL for payment gateway


# ═══════════════════════════════════════════════
# GENERIC SCHEMAS
# ═══════════════════════════════════════════════

class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str
