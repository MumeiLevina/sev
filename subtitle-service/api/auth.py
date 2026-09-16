"""
Kinetic Tech — Authentication Module
─────────────────────────────────────
JWT-based authentication with bcrypt password hashing and Google OAuth2 support.
"""

import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from config import (
    JWT_SECRET_KEY, JWT_ALGORITHM,
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES, JWT_REFRESH_TOKEN_EXPIRE_DAYS,
    GOOGLE_CLIENT_ID,
)
from models import User, RefreshToken

# ── Password Hashing ──
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Bearer Token Extractor ──
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a plain-text password with bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against its hash."""
    return pwd_context.verify(plain, hashed)


def hash_token(token: str) -> str:
    """SHA-256 hash of a refresh token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


# ═══════════════════════════════════════════════
# JWT TOKEN CREATION
# ═══════════════════════════════════════════════

def create_access_token(user_id: str, role: str = "user") -> tuple[str, int]:
    """Create a short-lived JWT access token. Returns (token, expires_in_seconds)."""
    expires_delta = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token, int(expires_delta.total_seconds())


def create_refresh_token(user_id: str) -> tuple[str, datetime]:
    """Create a long-lived refresh token. Returns (token, expires_at)."""
    expires_at = datetime.now(timezone.utc) + timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token, expires_at


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token đã hết hạn. Vui lòng đăng nhập lại.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ.",
        )


# ═══════════════════════════════════════════════
# GOOGLE OAUTH2 VERIFICATION
# ═══════════════════════════════════════════════

async def verify_google_id_token(id_token: str) -> dict:
    """
    Verify a Google ID token and return user info.
    Uses google-auth library for proper verification.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Đăng nhập bằng Google chưa được cấu hình.",
        )

    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests

        idinfo = google_id_token.verify_oauth2_token(
            id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )

        if idinfo["iss"] not in ("accounts.google.com", "https://accounts.google.com"):
            raise ValueError("Invalid issuer")

        return {
            "email": idinfo["email"],
            "name": idinfo.get("name", ""),
            "picture": idinfo.get("picture", ""),
            "google_id": idinfo["sub"],
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google token không hợp lệ: {str(e)}",
        )
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google Auth library chưa được cài đặt.",
        )


# ═══════════════════════════════════════════════
# FASTAPI DEPENDENCIES
# ═══════════════════════════════════════════════

def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> str:
    """
    Extract and validate user_id from JWT Bearer token.
    Use as a FastAPI dependency for protected routes.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vui lòng đăng nhập để sử dụng tính năng này.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không đúng loại. Vui lòng dùng access token.",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token thiếu thông tin người dùng.",
        )

    return user_id


def get_optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[str]:
    """Extract user_id if token is provided, otherwise return None."""
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
        return payload.get("sub")
    except HTTPException:
        return None
