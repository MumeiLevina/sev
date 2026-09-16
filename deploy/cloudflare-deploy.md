# Deploy Frontend lên Cloudflare Pages

Hướng dẫn deploy trang web tĩnh **Kinetic Tech** (HTML/CSS/JS) lên **Cloudflare Pages** — hosting miễn phí, CDN toàn cầu, SSL tự động.

---

## Bước 1: Chuẩn bị GitHub Repository

```bash
# Tại thư mục gốc dự án student-micro-tools/
git init
git add .
git commit -m "Initial commit: Kinetic Tech student tools"

# Tạo repo trên GitHub (Public hoặc Private đều được)
# Rồi push lên:
git remote add origin https://github.com/<username>/student-micro-tools.git
git branch -M main
git push -u origin main
```

> **Lưu ý:** File `.gitignore` đã được tạo sẵn, sẽ tự động loại trừ `.env`, `node_modules/`, v.v.

---

## Bước 2: Kết nối Cloudflare Pages

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vào **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Chọn GitHub account → Authorize Cloudflare
4. Chọn repository `student-micro-tools`
5. Cấu hình build:

| Mục | Giá trị |
|---|---|
| **Production branch** | `main` |
| **Build command** | *(để trống — không cần build)* |
| **Build output directory** | `/` (thư mục gốc) |
| **Root directory** | `/` |

6. Click **Save and Deploy**

> ⏳ Lần deploy đầu tiên mất ~1-2 phút. Sau đó mỗi lần `git push` sẽ auto-deploy.

---

## Bước 3: Cấu hình Custom Domain

### 3a. Thêm domain vào Cloudflare Pages

1. Trong project Pages → **Custom domains** → **Set up a custom domain**
2. Nhập: `studenttools.vn`
3. Cloudflare sẽ tự tạo DNS record **CNAME** trỏ tới `<project>.pages.dev`
4. Lặp lại cho `www.studenttools.vn`

### 3b. Cấu hình DNS Records (nếu domain ở nơi khác)

Nếu DNS của domain `studenttools.vn` chưa được quản lý bởi Cloudflare:

1. Vào **Cloudflare Dashboard** → **DNS** → Thêm site `studenttools.vn`
2. Chuyển nameserver của domain sang Cloudflare (cập nhật tại nhà đăng ký domain)
3. Chờ propagation (thường 1-24 giờ)

### 3c. DNS Records cần có

```
Type    Name                    Content                         Proxy
──────  ──────────────────────  ──────────────────────────────  ──────
CNAME   studenttools.vn         <project>.pages.dev             ✅ Proxied
CNAME   www                     <project>.pages.dev             ✅ Proxied
A       pdf-api                 <VPS_IP_ADDRESS>                ✅ Proxied
A       sub-api                 <VPS_IP_ADDRESS>                ✅ Proxied
```

> Thay `<project>` bằng tên project trên Cloudflare Pages.
> Thay `<VPS_IP_ADDRESS>` bằng IP thực của VPS backend.

---

## Bước 4: Cấu hình SSL/TLS

1. Vào **Cloudflare Dashboard** → **SSL/TLS** → **Overview**
2. Chọn encryption mode: **Full (strict)**
3. Vào **Edge Certificates** → Bật **Always Use HTTPS**
4. Bật **Automatic HTTPS Rewrites**

### Cho API subdomains (pdf-api, sub-api):

1. Vào **SSL/TLS** → **Origin Server** → **Create Certificate**
2. Tạo Origin Certificate cho `*.studenttools.vn`
3. Download cert (`.pem`) và key (`.key`)
4. Upload lên VPS tại `/etc/nginx/ssl/`

---

## Bước 5: Cấu hình Page Rules (Tùy chọn)

1. **Cache everything** cho static assets:
   - URL: `studenttools.vn/*.css`
   - Cache Level: Cache Everything, Edge Cache TTL: 1 month

2. **Redirect www → non-www**:
   - URL: `www.studenttools.vn/*`
   - Forwarding URL (301): `https://studenttools.vn/$1`

---

## Bước 6: Kiểm tra

```bash
# Kiểm tra trang chủ
curl -I https://studenttools.vn/

# Kiểm tra SSL certificate
openssl s_client -connect studenttools.vn:443 -servername studenttools.vn </dev/null 2>/dev/null | openssl x509 -noout -subject -dates

# Kiểm tra sitemap
curl https://studenttools.vn/sitemap.xml

# Google Search Console — submit sitemap
# https://search.google.com/search-console → Add property → URL prefix → https://studenttools.vn
```

---

## Sau khi deploy thành công

- ✅ Website live tại `https://studenttools.vn`
- ✅ Tất cả 30+ tools client-side hoạt động ngay
- ✅ CDN Cloudflare phân phối content toàn cầu
- ✅ SSL/HTTPS tự động
- ✅ Auto-deploy khi push code lên GitHub
- ⏳ Các tools cần backend (File Converter tab PDF→X, Subtitle Extractor) cần deploy VPS theo hướng dẫn `vps-setup.md`
