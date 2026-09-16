# Hướng Dẫn Triển Khai Website Dịch Vụ Bóc Sub Video AI (SaaS) Lên Internet

Tài liệu này hướng dẫn chi tiết cách đưa toàn bộ hệ thống bóc phụ đề video bằng AI Whisper lên môi trường Internet thực tế (Production), có tên miền riêng, chứng chỉ bảo mật HTTPS (SSL) và cơ chế thu phí/quản lý tài khoản người dùng.

---

## 1. Tổng quan Kiến trúc Dịch vụ

```
                          [ KHÁCH HÀNG TRÊN INTERNET ]
                                       │
                      Cloudflare DNS & SSL (Miễn phí)
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
             https://yourdomain.com           https://sub-api.yourdomain.com
             [ FRONTEND WEB ]                 [ BACKEND REVERSE PROXY ]
             • Nginx / Cloudflare Pages       • Nginx Port 8090 (SSL / Rate-limit)
             • Giao diện bóc sub              • FastAPI Gateway (Port 8000)
             • Chỉnh sửa timeline             • PostgreSQL: Lưu User, Quota, Lịch sử
             • Xuất SRT / VTT / TXT           • Redis: Hàng đợi bóc sub đa luồng
                                              • MinIO: Lưu trữ video tải lên
                                              • Celery Worker: FFmpeg + OpenAI Whisper
```

---

## 2. Chi Phí Vận Hành Dự Kiến

| Khoản mục | Nhà cung cấp gợi ý | Chi phí ước tính |
|---|---|---|
| **Tên miền (.vn / .com)** | Namecheap, GoDaddy, iNet, PA | ~250.000đ – 350.000đ / năm |
| **Máy chủ VPS (Ubuntu)** | Hetzner (CX22/CX32), Vultr, DigitalOcean, Vietnix | ~150.000đ – 250.000đ / tháng (4GB–8GB RAM) |
| **Chứng chỉ SSL** | Cloudflare / Let's Encrypt | **0đ (Miễn phí 100%)** |
| **Chi phí AI Whisper** | OpenAI Whisper API | **$0.006 / phút** audio (~150đ / phút video). Video 5 phút tốn ~750đ. |

> 💡 **Biên lợi nhuận:** Người dùng trả 99.000đ cho gói Pro (10 giờ = 600 phút). Chi phí API trả cho OpenAI chỉ khoảng 90.000đ / 600 phút (nếu họ dùng hết 100%), thực tế người dùng thường chỉ dùng 50-70% hạn mức, đem lại biên lợi nhuận ổn định.

---

## 3. Các Bước Triển Khai Lên VPS (Từng bước chi tiết)

### Bước 1: Thuê VPS và Đăng nhập
1. Thuê VPS Ubuntu 22.04 LTS hoặc 24.04 LTS (RAM tối thiểu 4GB, khuyến nghị 8GB).
2. Mở Terminal (PowerShell / Command Prompt) trên máy tính và SSH vào VPS:
   ```bash
   ssh root@<IP_VPS_CUA_BAN>
   ```

### Bước 2: Cập nhật VPS và Cài đặt Docker
Chạy lần lượt các lệnh sau trên VPS:
```bash
# Cập nhật gói hệ thống
apt update && apt upgrade -y

# Cài đặt Docker & Docker Compose chính thức
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Kiểm tra Docker đã chạy
docker --version
docker compose version
```

### Bước 3: Đưa Mã Nguồn Dự Án Lên VPS
```bash
# Clone repo từ GitHub hoặc tải source code lên
git clone https://github.com/<tai-khoan-cua-ban>/student-micro-tools.git
cd student-micro-tools/deploy

# Tạo file cấu hình production từ template
cp .env.production.template .env.production
```

### Bước 4: Điền API Key và Cấu hình Môi Trường
Mở file `.env.production` để chỉnh sửa:
```bash
nano .env.production
```
Điền các giá trị quan trọng:
```env
# ── Khóa bí mật OpenAI ──
SUB_OPENAI_API_KEY=sk-proj-cZdeJx6VY9woc0jx... (Khóa OpenAI của bạn)

# ── Khóa bảo mật JWT (đăng nhập) ──
SUB_JWT_SECRET_KEY=mot_chuoi_ngau_nhien_dai_it_nhat_32_ky_tu_bao_mat_2026

# ── Mật khẩu Database ──
SUB_POSTGRES_PASSWORD=MatKhauDatabaseBaoMat2026!

# ── MinIO S3 Keys ──
SUB_S3_ACCESS_KEY=subadmin
SUB_S3_SECRET_KEY=MatKhauMinioBaoMat2026!
```
Nhấn `Ctrl + O` -> `Enter` để lưu, `Ctrl + X` để thoát.

### Bước 5: Kích Hoạt Hệ Thống Bằng 1 Lệnh Duy Nhất
```bash
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build
```
Kiểm tra toàn bộ 6 container đã chạy xanh (`healthy` / `running`):
```bash
docker compose -f docker-compose.production.yml ps
```
Hệ thống sẽ chạy:
- `prod_sub_proxy`: Cổng 8090 (Nginx)
- `prod_sub_api`: Cổng 8000 (FastAPI Gateway)
- `prod_sub_worker`: Celery Worker + FFmpeg + OpenAI Whisper
- `prod_sub_postgres`: Cổng 5432 (PostgreSQL)
- `prod_sub_redis`: Cổng 6379 (Redis Queue)
- `prod_sub_minio`: Cổng 9000 & 9002 (Storage S3)

---

## 4. Cấu Hình Tên Miền & SSL (Cloudflare)

1. Trỏ DNS tại Cloudflare:
   - `yourdomain.com` ➔ Trỏ Record `A` về IP của VPS (Bật Proxy vàng).
   - `sub-api.yourdomain.com` ➔ Trỏ Record `A` về IP của VPS (Bật Proxy vàng).
2. Trên VPS, cấu hình Nginx Host để chuyển hướng cổng 80/443 sang cổng 8090 theo file mẫu tại [`deploy/nginx/production.conf`](file:///c:/Users/hantu/.gemini/antigravity-ide/scratch/student-micro-tools/deploy/nginx/production.conf).

---

## 5. Kiểm Thử Cục Bộ Trước Khi Deploy (Local Testing)

Trên máy tính của bạn hiện tại, lệnh `npm run dev` đã được tích hợp sẵn `dev-server.js`:
```bash
npm run dev
```
1. Mở trình duyệt tại `http://localhost:3000/subtitle-extractor.html`.
2. Đăng nhập hoặc đăng ký tài khoản (được tặng ngay 60:00 phút miễn phí).
3. Kéo thả video tiếng Trung vào và bấm **"Bắt Đầu Bóc Sub Với AI"**.
4. Hệ thống sẽ bóc tách trực tiếp bằng **OpenAI Whisper AI thật** và hiển thị đầy đủ các câu thoại của video kèm mốc thời gian chuẩn từng mili-giây!
