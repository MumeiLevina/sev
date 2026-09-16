"""
Kinetic Tech — Video Subtitle Extraction Service API
────────────────────────────────────────────────────
FastAPI backend for speech-to-text, authentication, quota management, and billing.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import engine, Base
from models import *  # Ensure all models are registered with Base
from routes.auth_routes import router as auth_router
from routes.transcription_routes import router as transcription_router
from routes.billing_routes import router as billing_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize database tables and resources."""
    try:
        Base.metadata.create_all(bind=engine)
        print("[Database] All PostgreSQL tables verified/created successfully.")
    except Exception as e:
        print(f"[Database Error] Table creation error (if DB not yet reachable): {e}")
    yield


app = FastAPI(
    title="Kinetic Tech — AI Subtitle Extractor API",
    version="1.0.0",
    description="Production-grade RESTful API for AI video & audio subtitle extraction powered by Whisper and Celery.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ──
import os as _os
_cors_origins_str = _os.environ.get("ALLOWED_ORIGINS", "").strip()
_cors_origins = [o.strip() for o in _cors_origins_str.split(",") if o.strip()] if _cors_origins_str else [
    "https://studenttools.vn",
    "https://www.studenttools.vn",
    "http://localhost:3000",
    "http://localhost:5500",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include Routers ──
app.include_router(auth_router)
app.include_router(transcription_router)
app.include_router(billing_router)


# ── Health & Status Endpoints ──

@app.get("/", tags=["General"])
def root():
    return {
        "service": "Kinetic Tech AI Subtitle Extractor API",
        "status": "healthy",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["General"])
def health_check():
    return {
        "status": "ok",
        "service": "api",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
