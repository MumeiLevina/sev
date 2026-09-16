"""
Kinetic Tech — Quota Management Utility
───────────────────────────────────────
Server-side quota enforcement for Free/Pro/Premium plans.
"""

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import User, UsageLog, UserPlan
from config import FREE_QUOTA_SECONDS, PRO_QUOTA_SECONDS, PREMIUM_QUOTA_SECONDS


def get_plan_quota_seconds(plan: UserPlan) -> int:
    """Return the quota limit in seconds for a given plan. 0 = unlimited."""
    mapping = {
        UserPlan.FREE: FREE_QUOTA_SECONDS,
        UserPlan.PRO: PRO_QUOTA_SECONDS,
        UserPlan.PREMIUM: PREMIUM_QUOTA_SECONDS,
    }
    return mapping.get(plan, FREE_QUOTA_SECONDS)


def get_used_seconds(db: Session, user_id: str) -> int:
    """Sum all usage logs for a user to get total consumed seconds."""
    result = db.query(func.coalesce(func.sum(UsageLog.duration_sec), 0)).filter(
        UsageLog.user_id == user_id
    ).scalar()
    return int(result)


def check_quota(db: Session, user: User) -> dict:
    """
    Check if user has remaining quota.
    Returns dict with quota info and whether user can proceed.
    """
    plan_limit = get_plan_quota_seconds(user.plan)
    used = get_used_seconds(db, str(user.id))

    # Check if plan has expired (Pro/Premium)
    if user.plan != UserPlan.FREE and user.plan_expires_at:
        if user.plan_expires_at < datetime.now(timezone.utc):
            # Plan expired, revert to free
            plan_limit = FREE_QUOTA_SECONDS

    # 0 = unlimited
    if plan_limit == 0:
        return {
            "can_proceed": True,
            "used_seconds": used,
            "limit_seconds": 0,
            "remaining_seconds": -1,  # -1 = unlimited
            "usage_percentage": 0.0,
        }

    remaining = max(0, plan_limit - used)

    return {
        "can_proceed": remaining > 0,
        "used_seconds": used,
        "limit_seconds": plan_limit,
        "remaining_seconds": remaining,
        "usage_percentage": round((used / plan_limit) * 100, 1) if plan_limit > 0 else 0.0,
    }


def record_usage(db: Session, user_id: str, job_id: str, duration_sec: int):
    """Record audio processing duration in the usage log."""
    log = UsageLog(
        user_id=user_id,
        job_id=job_id,
        duration_sec=duration_sec,
    )
    db.add(log)
    db.commit()
