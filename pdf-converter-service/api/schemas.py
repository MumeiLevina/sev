from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class TargetFormat(str, Enum):
    # Group 1: PDF to X
    DOCX = "docx"
    XLSX = "xlsx"
    PPTX = "pptx"
    PNG = "png"
    JPG = "jpg"
    EPUB = "epub"
    RTF = "rtf"
    HTML = "html"
    
    # Group 2: X to PDF
    PDF = "pdf"

class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ConversionOptions(BaseModel):
    password: Optional[str] = Field(None, description="Password if source PDF is password-protected")
    dpi: Optional[int] = Field(150, ge=72, le=600, description="DPI resolution for image rendering")
    quality: Optional[str] = Field("balanced", description="Compression preset: balanced, max, high")
    page_range: Optional[str] = Field(None, description="Page range to convert (e.g. '1-5, 8')")
    orientation: Optional[str] = Field("portrait", description="Orientation for page generation: portrait or landscape")

class ConversionInitiatedResponse(BaseModel):
    success: bool = True
    job_id: str
    status: JobStatus
    source_format: str
    target_format: str
    original_filename: str
    file_size_bytes: int
    created_at: str
    links: Dict[str, str]

class ConversionResultDetail(BaseModel):
    filename: str
    file_size_bytes: int
    content_type: str
    download_url: str
    expires_at: Optional[str] = None

class ConversionStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress: int = Field(0, ge=0, le=100)
    current_step: Optional[str] = None
    source_format: str
    target_format: str
    duration_ms: Optional[int] = None
    result: Optional[ConversionResultDetail] = None
    error: Optional[str] = None
