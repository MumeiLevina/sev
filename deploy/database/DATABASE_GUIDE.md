# Hướng Dẫn Triển Khai Database Lên Môi Trường Internet — Kinetic Tech

Tài liệu này hướng dẫn bạn cách khởi tạo và triển khai Cơ Sở Dữ Liệu (**PostgreSQL**) lên môi trường Internet để lưu trữ tài khoản người dùng, phân quyền, lịch sử bóc subtitle và quản lý hạn mức (quota).

---

## ⚠️ Giải Thích Lỗi `EADDRINUSE :::3000` Lúc Nãy
Khi bạn chạy `npm run dev`, hệ thống báo lỗi `address already in use :::3000` là do **tiến trình dev-server trước đó vẫn đang chạy ngầm trên máy**.
> **Đã xử lý**: Cổng `3000` hiện đã được giải phóng hoàn toàn! Bạn có thể chạy lại `npm run dev` bất cứ lúc nào bạn muốn.

---

## Lựa Chọn Cách Triển Khai Database

| Phương án | Chi phí | Thời gian thiết lập | Độ phức tạp | Khuyên dùng cho |
|---|---|---|---|---|
| **Cách 1: Cloud PostgreSQL (Supabase / Neon)** | **Miễn phí 100%** | **2 phút** | Rất dễ (Giao diện web) | **Khuyên dùng nhất** (Không cần cài đặt gì trên máy) |
| **Cách 2: Tự Host trên VPS (Docker Compose)** | Phí thuê VPS (~100-150k/tháng) | 15 phút | Trung bình (Cần SSH Linux) | Khi đã có sẵn VPS riêng |

---

## Cách 1: Sử Dụng Cloud PostgreSQL Miễn Phí (Supabase) — KHUYÊN DÙNG ⭐

### Bước 1: Tạo Database Miễn Phí Trên Supabase
1. Truy cập [https://supabase.com](https://supabase.com) $\to$ Bấm **Start your project** $\to$ Đăng nhập bằng Google hoặc GitHub.
2. Bấm **New Project**:
   - **Name**: `kinetic-tech-db`
   - **Database Password**: Nhập mật khẩu bảo mật (ví dụ: `KineticPass2026!#`) $\to$ **Lưu lại mật khẩu này!**
   - **Region**: Chọn **Singapore (ap-southeast-1)** để có tốc độ truy cập từ Việt Nam nhanh nhất.
   - **Pricing Plan**: Chọn **Free Plan**.
3. Bấm **Create new project** (chờ khoảng 1-2 phút để hệ thống tạo xong DB).

### Bước 2: Khởi Tạo Cấu Trúc Bảng (Schema)
1. Trong bảng điều khiển Supabase, chọn mục **SQL Editor** ở thanh menu bên trái.
2. Bấm **New Query**.
3. Mở tệp [deploy/database/init_schema.sql](file:///c:/Users/hantu/.gemini/antigravity-ide/scratch/student-micro-tools/deploy/database/init_schema.sql) trong dự án này, **copy toàn bộ nội dung** và dán vào ô SQL Editor.
4. Bấm nút **Run** (màu xanh lá).
   - Hệ thống sẽ tự động tạo đầy đủ các bảng:
     - `users`: Quản lý tài khoản, email, mật khẩu, gói cước, quota 1 giờ miễn phí.
     - `refresh_tokens`: Token xác thực đăng nhập lâu dài.
     - `transcription_jobs`: Lưu các lượt bóc sub AI.
     - `usage_logs`: Ghi nhận nhật ký trừ thời lượng video.
     - `transactions`: Giao dịch nạp tiền, nâng cấp gói Pro.

### Bước 3: Lấy Chuỗi Kết Nối (Connection String)
1. Trong Supabase, vào mục **Project Settings** (biểu tượng bánh răng) $\to$ **Database**.
2. Cuộn xuống phần **Connection String** $\to$ Chọn tab **URI**.
3. Copy đường link có dạng:
   ```text
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres
   ```
   *(Thay `[YOUR-PASSWORD]` bằng mật khẩu bạn đã đặt ở Bước 1)*.

### Bước 4: Cấu Hình Vào Dự Án & Đồng Bộ Dữ Liệu
Mở tệp `subtitle-service/.env` và điền:
```ini
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxxx.supabase.co:5432/postgres
```

Chạy lệnh đồng bộ người dùng từ máy lên Cloud DB:
```bash
python deploy/database/setup_db.py "postgresql://postgres:YOUR_PASSWORD@db.xxxxxx.supabase.co:5432/postgres"
```
Toàn bộ tài khoản bạn vừa tạo (bao gồm `hantung345@gmail.com` và tài khoản học viên) sẽ được chuyển tự động lên Internet!

---

## Cách 2: Triển Khai Trên VPS Linux (Docker Compose)

Nếu bạn đã thuê một máy chủ ảo VPS (Ubuntu 22.04 / 24.04):

1. **Cài đặt Docker trên VPS**:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
2. **Copy thư mục dự án lên VPS** (bằng Git hoặc SCP / FileZilla).
3. **Chạy Docker Compose có sẵn**:
   ```bash
   cd subtitle-service
   docker compose up -d postgres redis
   ```
4. **Kiểm tra trạng thái**:
   ```bash
   docker ps
   ```
   Cơ sở dữ liệu PostgreSQL sẽ chạy an toàn tại cổng nội bộ `5432` và tự động khôi phục khi VPS khởi động lại.

---

## Danh Sách Các Bảng & Dữ Liệu Trong Database

```text
┌────────────────────────────────────────────────────────┐
│                   users (Tài khoản)                    │
├────────────────────────────────────────────────────────┤
│ • id (UUID)                                            │
│ • email (VARCHAR - Duy nhất 1 tài khoản/email)         │
│ • password_hash (Mã hóa SHA-256 / Bcrypt)              │
│ • display_name (Tên hiển thị)                          │
│ • plan (free / pro / premium)                          │
│ • quota_used_seconds (Thời lượng đã bóc sub)          │
│ • quota_limit_seconds (Hạn mức: 3600s = 1 giờ free)    │
└────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌──────────────────┐           ┌────────────────────────┐
│  refresh_tokens  │           │   transcription_jobs   │
├──────────────────┤           ├────────────────────────┤
│ • token_hash     │           │ • original_filename    │
│ • expires_at     │           │ • audio_duration_sec   │
│ • revoked        │           │ • result_json (SRT)    │
└──────────────────┘           └────────────────────────┘
```
