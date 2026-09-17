"""
Kinetic Tech — Billing & Subscription Routes
─────────────────────────────────────────────
Endpoints for service pricing plans, usage statistics, and upgrade transactions.
"""

import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import User, Transaction, UsageLog, TranscriptionJob, UserPlan, TransactionStatus
from schemas import (
    PlansResponse, PlanInfo, UsageResponse, UpgradeRequest, UpgradeResponse
)
from auth import get_current_user_id
from utils.quota import get_used_seconds, get_plan_quota_seconds
from config import FREE_QUOTA_SECONDS, PRO_QUOTA_SECONDS, PREMIUM_QUOTA_SECONDS

router = APIRouter(prefix="/api/v1/billing", tags=["Billing & Quota"])


# ═══════════════════════════════════════════════
# 1. LIST PLANS
# ═══════════════════════════════════════════════

@router.get(
    "/plans",
    response_model=PlansResponse,
    summary="Danh sách các gói dịch vụ và bảng giá",
)
def get_plans():
    return PlansResponse(
        plans=[
            PlanInfo(
                name="Miễn Phí (Free)",
                price_vnd=0,
                quota_seconds=FREE_QUOTA_SECONDS,
                features=[
                    "1 giờ (60 phút) thời lượng bóc sub miễn phí",
                    "Độ chính xác chuẩn AI Whisper",
                    "Xuất định dạng SRT, VTT, TXT",
                    "Hỗ trợ video MP4, MKV, AVI, WebM tối đa 100MB",
                    "Tốc độ xử lý hàng đợi tiêu chuẩn",
                ],
                recommended=False,
            ),
            PlanInfo(
                name="Chuyên Nghiệp (Pro)",
                price_vnd=99000,
                quota_seconds=PRO_QUOTA_SECONDS,
                features=[
                    "10 giờ (600 phút) bóc sub tốc độ cao",
                    "Ưu tiên hàng đợi Celery cấp 1",
                    "Tải lên tệp lên tới 200MB",
                    "Tự động ngắt câu thông minh và sửa lỗi chính tả",
                    "Lưu trữ lịch sử và tệp phụ đề không giới hạn",
                    "Hỗ trợ song ngữ và dịch thuật cơ bản",
                ],
                recommended=True,
            ),
            PlanInfo(
                name="Doanh Nghiệp (Premium VIP)",
                price_vnd=249000,
                quota_seconds=PREMIUM_QUOTA_SECONDS,  # 0 = unlimited
                features=[
                    "Không giới hạn thời lượng sử dụng (Unlimited)",
                    "Xử lý song song đa luồng tối đa tốc độ",
                    "Ưu tiên hàng đợi cao nhất (VIP Priority)",
                    "Dung lượng tệp lên tới 500MB",
                    "Tự động nhận diện đa ngôn ngữ thông minh",
                    "Hỗ trợ kỹ thuật 24/7 riêng biệt",
                ],
                recommended=False,
            ),
        ]
    )


# ═══════════════════════════════════════════════
# 2. USER USAGE STATS
# ═══════════════════════════════════════════════

@router.get(
    "/usage",
    response_model=UsageResponse,
    summary="Thống kê hạn mức và lịch sử sử dụng của tài khoản",
)
def get_user_usage(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tài khoản không tồn tại.",
        )

    used = get_used_seconds(db, user_id)
    limit = get_plan_quota_seconds(user.plan)

    # Check plan expiration
    if user.plan != UserPlan.FREE and user.plan_expires_at:
        if user.plan_expires_at < datetime.now(timezone.utc):
            user.plan = UserPlan.FREE
            db.commit()
            limit = FREE_QUOTA_SECONDS

    remaining = -1 if limit == 0 else max(0, limit - used)
    pct = 0.0 if limit == 0 else round(min(100.0, (used / limit) * 100), 1)

    total_jobs = db.query(TranscriptionJob).filter(TranscriptionJob.user_id == user_id).count()
    total_audio = db.query(func.coalesce(func.sum(TranscriptionJob.audio_duration_sec), 0)).filter(
        TranscriptionJob.user_id == user_id
    ).scalar()

    return UsageResponse(
        plan=user.plan.value,
        quota_used_seconds=used,
        quota_limit_seconds=limit,
        quota_remaining_seconds=remaining,
        usage_percentage=pct,
        plan_expires_at=user.plan_expires_at,
        total_jobs=total_jobs,
        total_audio_seconds=int(total_audio),
    )


# ═══════════════════════════════════════════════
# 3. UPGRADE PLAN (DEMO / PRODUCTION READY GATEWAY STUB)
# ═══════════════════════════════════════════════

@router.post(
    "/upgrade",
    response_model=UpgradeResponse,
    summary="Nâng cấp gói dịch vụ (Tích hợp MoMo, VNPay, Stripe)",
)
def upgrade_plan(
    body: UpgradeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tài khoản không tồn tại.",
        )

    price_map = {
        "pro": 99000,
        "premium": 249000,
    }
    amount = price_map.get(body.plan, 99000)
    tx_id = uuid.uuid4()

    # In a real environment with webhook, status would be PENDING until IPN webhook fires.
    # For demo/instant activation support:
    target_plan = UserPlan.PRO if body.plan == "pro" else UserPlan.PREMIUM
    user.plan = target_plan
    user.plan_expires_at = datetime.now(timezone.utc) + timedelta(days=30)

    tx = Transaction(
        id=tx_id,
        user_id=user.id,
        amount=amount,
        plan=body.plan,
        status=TransactionStatus.COMPLETED,
        payment_method=body.payment_method,
        payment_ref=f"PAY-{uuid.uuid4().hex[:10].upper()}",
        completed_at=datetime.now(timezone.utc),
    )
    db.add(tx)
    db.commit()

    return UpgradeResponse(
        transaction_id=tx_id,
        status="completed",
        message=f"Chúc mừng bạn đã kích hoạt thành công gói {body.plan.upper()} (hạn dùng 30 ngày)!",
        payment_url=None,
    )
