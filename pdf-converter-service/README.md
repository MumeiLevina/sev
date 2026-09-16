# Hệ Thống Chuyển Đổi Định Dạng File PDF (PDF Conversion Microservice)

Hệ thống xử lý chuyển đổi tài liệu đa năng, chịu tải cao được thiết kế theo kiến trúc bất đồng bộ (Asynchronous Event-Driven Architecture) với **FastAPI**, **Redis (BullMQ / Celery)**, **MinIO S3 Storage**, **LibreOffice unoserver daemon** và **Poppler C++ Engine**.

---

## 1. Tính Năng & Các Định Dạng Được Hỗ Trợ

### Nhóm 1: Chuyển đổi từ PDF (PDF $\rightarrow$ X)
- **PDF $\rightarrow$ Word (DOCX)**: Giữ nguyên cấu trúc bảng biểu, cột, định dạng văn bản qua `pdf2docx`.
- **PDF $\rightarrow$ Excel (XLSX)**: Trích xuất tự động các bảng biểu thành sheet Excel qua `pdfplumber`.
- **PDF $\rightarrow$ PowerPoint (PPTX)**: Render từng trang trình chiếu độ phân giải cao vào slide qua `pdftoppm` + `python-pptx`.
- **PDF $\rightarrow$ Ảnh (PNG, JPG)**: Kết xuất siêu tốc bằng Poppler C++, tự động đóng gói file `.zip` nếu nhiều trang.
- **PDF $\rightarrow$ EPUB**: Tối ưu hóa mục lục và dàn trang sách điện tử qua Calibre `ebook-convert`.
- **PDF $\rightarrow$ RTF**: Trích xuất rich text qua LibreOffice.
- **PDF $\rightarrow$ HTML**: Chuyển đổi giữ nguyên 100% font chữ và vector.

### Nhóm 2: Chuyển đổi sang PDF (X $\rightarrow$ PDF)
- **Word (DOC/DOCX) $\rightarrow$ PDF**
- **Excel (XLS/XLSX) $\rightarrow$ PDF**
- **PowerPoint (PPT/PPTX) $\rightarrow$ PDF**
- **Ảnh (PNG, JPG, JPEG) $\rightarrow$ PDF**: Đóng gói Lossless không nén lại pixel qua `img2pdf` (< 50ms).
- **Văn bản (RTF, TXT) $\rightarrow$ PDF**
- **Trang web (HTML) $\rightarrow$ PDF**: Render chuẩn CSS Paged Media qua `WeasyPrint`.
- **Sách điện tử (EPUB) $\rightarrow$ PDF**: Dàn trang chuẩn khổ A4 qua Calibre.

---

## 2. Kiến Trúc Hệ Thống (Architecture)

```text
[Client / Web UI] 
       │ (HTTP Multipart Upload)
       ▼
[NGINX Reverse Proxy] (Port 8080: Rate-limit 15 r/s, 50MB Body Limit, CORS)
       │
       ▼
[API Gateway (FastAPI)] 
       │ ── (1) Upload raw file ──► [MinIO (S3 Storage)]
       │ ── (2) Push job task  ──► [Redis Queue (Broker)]
       │ ── (3) Return 202 Accepted { job_id } ──► [Client]
       │
[Worker Nodes (Celery)] 
       │ ◄── (4) Fetch job from queue
       │ ◄── (5) Stream raw file from MinIO to /dev/shm (RAM Disk)
       │ ─── (6) Check Security (QPDF Password / Integrity / Magic Bytes)
       │ ─── (7) Execute Specialized Engine (pdf2docx / unoserver / poppler)
       │ ──► (8) Upload converted file to MinIO (converted/{job_id}/...)
       │ ──► (9) Set Status: COMPLETED in Redis (TTL 1 hour)
       ▼
[Client] ◄── Polling / SSE Status / Download via S3 Presigned URL (HTTP 302)
```

---

## 3. Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### Yêu Cầu Tiên Quyết:
- Đã cài đặt **Docker** (>= 20.10) và **Docker Compose** (>= 2.0).

### Bước 1: Sao chép file cấu hình
```bash
cp .env.example .env
```

### Bước 2: Khởi chạy toàn bộ hạ tầng bằng Docker Compose
```bash
docker-compose up -d --build
```

### Bước 3: Kiểm tra các dịch vụ đang chạy
- **API Gateway & Swagger UI Docs**: [http://localhost:8080/docs](http://localhost:8080/docs)
- **MinIO S3 Web Console**: [http://localhost:9001](http://localhost:9001) *(User: `minioadmin` / Pass: `minioadmin123`)*
- **Health Check Endpoint**: [http://localhost:8080/health](http://localhost:8080/health)

---

## 4. Hướng Dẫn Sử Dụng RESTful API (API Specification)

### 4.1. Khởi tạo tác vụ chuyển đổi
```bash
curl -X POST "http://localhost:8080/api/v1/conversions" \
  -F "file=@/path/to/tai_lieu.pdf" \
  -F "target_format=docx" \
  -F 'options={"dpi": 150}'
```

**Phản hồi mẫu (`HTTP 202 Accepted`):**
```json
{
  "success": true,
  "job_id": "8f395f19-94b2-4d57-b248-cb586e3f568b",
  "status": "queued",
  "source_format": "pdf",
  "target_format": "docx",
  "original_filename": "tai_lieu.pdf",
  "file_size_bytes": 1048576,
  "created_at": "2026-09-14T10:50:00Z",
  "links": {
    "status_url": "/api/v1/conversions/8f395f19-94b2-4d57-b248-cb586e3f568b",
    "download_url": "/api/v1/conversions/8f395f19-94b2-4d57-b248-cb586e3f568b/download",
    "sse_stream": "/api/v1/conversions/8f395f19-94b2-4d57-b248-cb586e3f568b/stream"
  }
}
```

### 4.2. Kiểm tra tiến độ xử lý (Polling)
```bash
curl -X GET "http://localhost:8080/api/v1/conversions/8f395f19-94b2-4d57-b248-cb586e3f568b"
```

**Phản hồi khi hoàn tất:**
```json
{
  "job_id": "8f395f19-94b2-4d57-b248-cb586e3f568b",
  "status": "completed",
  "progress": 100,
  "current_step": "completed",
  "source_format": "pdf",
  "target_format": "docx",
  "duration_ms": 1320,
  "result": {
    "filename": "tai_lieu_converted.docx",
    "file_size_bytes": 894512,
    "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "download_url": "/api/v1/conversions/8f395f19-94b2-4d57-b248-cb586e3f568b/download",
    "expires_at": "2026-09-14T11:50:00Z"
  },
  "error": null
}
```

### 4.3. Tải file kết quả
```bash
curl -L -O "http://localhost:8080/api/v1/conversions/8f395f19-94b2-4d57-b248-cb586e3f568b/download"
```

---

## 5. Mở Rộng & Vận Hành Chịu Tải Cao (Production Scaling)

- **Scale-out Worker Nodes**:
  Để tăng tốc độ xử lý khi lưu lượng truy cập cao, chỉ cần tăng số lượng worker containers:
  ```bash
  docker-compose up -d --scale worker-converter=4
  ```
- **Chống cạn kiệt RAM (OOM Prevention)**:
  - Tất cả các worker được giới hạn tài nguyên tại `docker-compose.yml` (`mem_limit: 2048M`, `cpus: 2.0`).
  - Mọi thao tác trung gian diễn ra trên RAM disk `/dev/shm` và được dọn dẹp bằng khối `finally: shutil.rmtree()`.
  - Giới hạn thời gian chạy cho mọi lệnh CLI `timeout 60s` ngăn chặn triệt để tình trạng treo tiến trình.
- **Tự động xóa file tạm**:
  Toàn bộ file trên Redis và MinIO S3 được gán thời gian hết hạn (TTL) **60 phút**, đảm bảo không làm đầy bộ nhớ máy chủ.
