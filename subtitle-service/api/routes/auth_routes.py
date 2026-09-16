"""
Kinetic Tech — Auth Routes
──────────────────────────
Endpoints for user registration, login, Google OAuth, token refresh, and profile.
"""

from datetime import datetime, timezone, timedelta
import random
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User, RefreshToken, AuthProvider, UserPlan
from schemas import (
    RegisterRequest, LoginRequest, GoogleLoginRequest,
    ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest,
    TokenResponse, RefreshRequest, UserResponse, MessageResponse,
)
from auth import (
    hash_password, verify_password, hash_token,
    create_access_token, create_refresh_token,
    decode_token, verify_google_id_token,
    get_current_user_id,
)
from utils.quota import get_used_seconds, get_plan_quota_seconds

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

_password_reset_codes = {}


# ═══════════════════════════════════════════════
# REGISTER
# ═══════════════════════════════════════════════

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Đăng ký tài khoản mới",
)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    clean_email = body.email.strip().lower()
    # Check if email already exists (mỗi email duy nhất 1 tài khoản)
    existing = db.query(User).filter(User.email.ilike(clean_email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email này đã được đăng ký. Mỗi email chỉ được đăng ký duy nhất 1 tài khoản. Vui lòng chuyển sang Đăng Nhập.",
        )

    # Create new user
    user = User(
        email=clean_email,
        password_hash=hash_password(body.password),
        display_name=body.display_name or clean_email.split("@")[0],
        provider=AuthProvider.EMAIL,
        plan=UserPlan.FREE,
        last_login_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate tokens
    access_token, expires_in = create_access_token(str(user.id), user.role.value)
    refresh_token_str, refresh_expires = create_refresh_token(str(user.id))

    # Store refresh token hash
    rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token_str),
        expires_at=refresh_expires,
    )
    db.add(rt)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        expires_in=expires_in,
    )


# ═══════════════════════════════════════════════
# LOGIN
# ═══════════════════════════════════════════════

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Đăng nhập bằng email & mật khẩu",
)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    clean_email = body.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(clean_email)).first()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng.",
        )

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng.",
        )

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    # Generate tokens
    access_token, expires_in = create_access_token(str(user.id), user.role.value)
    refresh_token_str, refresh_expires = create_refresh_token(str(user.id))

    rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token_str),
        expires_at=refresh_expires,
    )
    db.add(rt)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        expires_in=expires_in,
    )


# ═══════════════════════════════════════════════
# FORGOT & RESET PASSWORD
# ═══════════════════════════════════════════════

@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    summary="Yêu cầu mã xác thực để đặt lại mật khẩu",
)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    clean_email = body.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tài khoản với email này.",
        )

    otp = f"{random.randint(100000, 999999):06d}"
    _password_reset_codes[clean_email] = {
        "code": otp,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=15),
    }

    return ForgotPasswordResponse(
        message="Mã xác thực OTP đã được tạo thành công (hiệu lực 15 phút).",
        code=otp,
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Đặt lại mật khẩu mới bằng mã OTP",
)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    clean_email = body.email.strip().lower()
    record = _password_reset_codes.get(clean_email)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yêu cầu đặt lại mật khẩu không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu lại mã OTP.",
        )

    if datetime.now(timezone.utc) > record["expires_at"]:
        _password_reset_codes.pop(clean_email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP đã hết hạn (chỉ có hiệu lực trong 15 phút). Vui lòng yêu cầu mã mới.",
        )

    if str(record["code"]).strip() != str(body.code).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã xác thực OTP không chính xác.",
        )

    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tài khoản người dùng.",
        )

    user.password_hash = hash_password(body.new_password)
    db.commit()
    _password_reset_codes.pop(clean_email, None)

    return MessageResponse(message="Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.")


# ═══════════════════════════════════════════════
# GOOGLE OAUTH2
# ═══════════════════════════════════════════════

@router.post(
    "/google",
    response_model=TokenResponse,
    summary="Đăng nhập bằng Google",
)
async def google_login(body: GoogleLoginRequest, db: Session = Depends(get_db)):
    google_info = await verify_google_id_token(body.id_token)

    # Find or create user
    user = db.query(User).filter(User.email == google_info["email"]).first()

    if user is None:
        # Auto-register
        user = User(
            email=google_info["email"],
            display_name=google_info.get("name", ""),
            avatar_url=google_info.get("picture", ""),
            provider=AuthProvider.GOOGLE,
            plan=UserPlan.FREE,
            last_login_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update info
        user.last_login_at = datetime.now(timezone.utc)
        if google_info.get("picture"):
            user.avatar_url = google_info["picture"]
        if google_info.get("name") and not user.display_name:
            user.display_name = google_info["name"]
        db.commit()

    # Generate tokens
    access_token, expires_in = create_access_token(str(user.id), user.role.value)
    refresh_token_str, refresh_expires = create_refresh_token(str(user.id))

    rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token_str),
        expires_at=refresh_expires,
    )
    db.add(rt)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        expires_in=expires_in,
    )


# ═══════════════════════════════════════════════
# REFRESH TOKEN
# ═══════════════════════════════════════════════

@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Làm mới access token",
)
def refresh_token(body: RefreshRequest, db: Session = Depends(get_db)):
    # Decode refresh token
    payload = decode_token(body.refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không phải loại refresh.",
        )

    user_id = payload.get("sub")

    # Verify refresh token exists and is not revoked
    token_hash = hash_token(body.refresh_token)
    stored_rt = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked.is_(None),
    ).first()

    if not stored_rt:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token đã bị thu hồi hoặc không tồn tại.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Người dùng không tồn tại.",
        )

    # Revoke old refresh token
    stored_rt.revoked = datetime.now(timezone.utc)

    # Issue new tokens
    access_token, expires_in = create_access_token(str(user.id), user.role.value)
    new_refresh_str, new_refresh_expires = create_refresh_token(str(user.id))

    new_rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(new_refresh_str),
        expires_at=new_refresh_expires,
    )
    db.add(new_rt)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_str,
        expires_in=expires_in,
    )


# ═══════════════════════════════════════════════
# PROFILE
# ═══════════════════════════════════════════════

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Lấy thông tin tài khoản hiện tại",
)
def get_me(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tài khoản.",
        )

    used = get_used_seconds(db, user_id)
    limit = get_plan_quota_seconds(user.plan)

    return UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        provider=user.provider.value,
        role=user.role.value,
        plan=user.plan.value,
        plan_expires_at=user.plan_expires_at,
        created_at=user.created_at,
        quota_used_seconds=used,
        quota_limit_seconds=limit,
    )


# ═══════════════════════════════════════════════
# LOGOUT
# ═══════════════════════════════════════════════

@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Đăng xuất (thu hồi refresh token)",
)
def logout(
    body: Optional[RefreshRequest] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if body and body.refresh_token:
        token_hash = hash_token(body.refresh_token)
        stored_rt = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id == user_id,
            RefreshToken.revoked.is_(None),
        ).first()

        if stored_rt:
            stored_rt.revoked = datetime.now(timezone.utc)
            db.commit()

    return MessageResponse(message="Đã đăng xuất thành công.")
