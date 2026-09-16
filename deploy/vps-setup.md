# Deploy Backend lên VPS (PDF Converter + Subtitle Extractor)

Hướng dẫn deploy 2 microservices backend lên một VPS Ubuntu server.

---

## Yêu cầu VPS tối thiểu

| Spec | Tối thiểu | Khuyến nghị |
|---|---|---|
| **OS** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 40 GB SSD | 80 GB NVMe SSD |
| **Bandwidth** | 2 TB/tháng | Unlimited |

### Provider gợi ý (giá tham khảo):

| Provider | Gói | Giá/tháng |
|---|---|---|
| **Hetzner** (EU) | CX32 (4 vCPU, 8GB) | ~€7.5 (~$8) |
| **DigitalOcean** | Basic 4GB | $24 |
| **Vultr** | Cloud Compute 4GB | $24 |
| **Contabo** (EU) | VPS S (8GB RAM) | €6.99 |

---

## Bước 1: Setup Server cơ bản

```bash
# SSH vào VPS
ssh root@<VPS_IP>

# Cập nhật hệ thống
apt update && apt upgrade -y

# Tạo user deploy (không dùng root)
adduser deploy
usermod -aG sudo deploy

# Cấu hình SSH key cho user deploy
su - deploy
mkdir -p ~/.ssh
# Copy public key vào ~/.ssh/authorized_keys

# Tắt SSH password login (bảo mật)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

---

## Bước 2: Cài Docker & Docker Compose

```bash
# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Thêm user deploy vào group docker
sudo usermod -aG docker deploy
newgrp docker

# Verify
docker --version
docker compose version
```

---

## Bước 3: Cài Nginx (Host-level Reverse Proxy)

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
```

---

## Bước 4: Clone code & cấu hình

```bash
# Clone repository
cd /home/deploy
git clone https://github.com/<username>/student-micro-tools.git
cd student-micro-tools/deploy

# Tạo file .env.production từ template
cp .env.production.template .env.production

# ⚠️ QUAN TRỌNG: Sửa tất cả giá trị CHANGE_ME
nano .env.production
```

### Tạo secrets tự động:

```bash
# Tạo S3 Access Key (PDF)
python3 -c "import secrets; print('PDF_S3_ACCESS_KEY=' + secrets.token_hex(16))"

# Tạo S3 Secret Key (PDF)
python3 -c "import secrets; print('PDF_S3_SECRET_KEY=' + secrets.token_hex(32))"

# Tạo JWT Secret Key (Subtitle)
python3 -c "import secrets; print('SUB_JWT_SECRET_KEY=' + secrets.token_hex(32))"

# Tạo Postgres Password (Subtitle)
python3 -c "import secrets; print('SUB_POSTGRES_PASSWORD=' + secrets.token_hex(24))"

# Tạo S3 Access/Secret Keys (Subtitle)
python3 -c "import secrets; print('SUB_S3_ACCESS_KEY=' + secrets.token_hex(16))"
python3 -c "import secrets; print('SUB_S3_SECRET_KEY=' + secrets.token_hex(32))"
```

> Sau khi tạo, copy các giá trị vào file `.env.production`. Nhớ cập nhật `SUB_DATABASE_URL` nếu đổi password Postgres.

---

## Bước 5: Cấu hình SSL Certificates

### Option A: Dùng Cloudflare Origin Certificate (Khuyến nghị)

1. Vào Cloudflare Dashboard → **SSL/TLS** → **Origin Server**
2. **Create Certificate** cho `*.studenttools.vn`
3. Chọn RSA (2048), thời hạn 15 năm
4. Download `.pem` và `.key`
5. Upload lên VPS:

```bash
sudo mkdir -p /etc/nginx/ssl
# Upload files lên server (dùng scp hoặc paste content)
sudo nano /etc/nginx/ssl/pdf-api.studenttools.vn.pem    # Paste Origin Certificate
sudo nano /etc/nginx/ssl/pdf-api.studenttools.vn.key    # Paste Private Key
# Cùng cert cho sub-api (wildcard cert)
sudo cp /etc/nginx/ssl/pdf-api.studenttools.vn.pem /etc/nginx/ssl/sub-api.studenttools.vn.pem
sudo cp /etc/nginx/ssl/pdf-api.studenttools.vn.key /etc/nginx/ssl/sub-api.studenttools.vn.key
sudo chmod 600 /etc/nginx/ssl/*.key
```

### Option B: Dùng Let's Encrypt (nếu không dùng Cloudflare proxy)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d pdf-api.studenttools.vn -d sub-api.studenttools.vn
# Certbot sẽ tự cấu hình SSL trong Nginx
```

---

## Bước 6: Cấu hình Nginx Host-level

```bash
# Copy production Nginx config
sudo cp /home/deploy/student-micro-tools/deploy/nginx/production.conf /etc/nginx/nginx.conf

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Bước 7: Khởi động Docker Services

```bash
cd /home/deploy/student-micro-tools/deploy

# Build và khởi chạy tất cả services
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build

# Xem logs
docker compose -f docker-compose.production.yml logs -f

# Kiểm tra tất cả containers đang chạy
docker compose -f docker-compose.production.yml ps
```

### Kết quả mong đợi:

```
NAME                 STATUS    PORTS
prod_pdf_proxy       Up        0.0.0.0:8080->80/tcp
prod_pdf_api         Up        
prod_pdf_redis       Up        
prod_pdf_minio       Up        
prod_pdf_unoserver   Up        
pdf-worker-1         Up        
pdf-worker-2         Up        
prod_sub_proxy       Up        0.0.0.0:8090->80/tcp
prod_sub_api         Up        
prod_sub_postgres    Up (healthy)
prod_sub_redis       Up (healthy)
prod_sub_minio       Up        
prod_sub_worker      Up        
```

---

## Bước 8: Kiểm tra hoạt động

```bash
# Health check PDF service
curl http://localhost:8080/health
# Expected: {"status":"healthy","redis_connected":true,"storage_connected":true}

# Health check Subtitle service
curl http://localhost:8090/health
# Expected: {"status":"ok","service":"api"}

# Test qua domain (sau khi DNS propagated)
curl https://pdf-api.studenttools.vn/health
curl https://sub-api.studenttools.vn/health
```

---

## Bước 9: Cấu hình Firewall

```bash
# Chỉ mở các port cần thiết
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp      # HTTP (redirect to HTTPS)
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# KHÔNG mở port 8080, 8090, 9001 ra public
# Nginx master proxy sẽ route từ 443 → localhost:8080/8090
```

---

## Bước 10: Auto-restart & Monitoring

### Docker auto-restart (đã cấu hình `restart: unless-stopped`)

```bash
# Đảm bảo Docker tự start khi VPS reboot
sudo systemctl enable docker
```

### Xem resource usage

```bash
# Real-time container stats
docker stats

# Disk usage
docker system df
```

### Log rotation

```bash
# Tạo Docker log rotation config
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
```

---

## Cập nhật code (Re-deploy)

```bash
cd /home/deploy/student-micro-tools

# Pull code mới
git pull origin main

# Rebuild và restart services
cd deploy
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build

# Hoặc chỉ restart 1 service cụ thể
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build pdf-api
```

---

## Troubleshooting

### Container không start
```bash
docker compose -f docker-compose.production.yml logs <service-name>
# Ví dụ: docker compose -f docker-compose.production.yml logs pdf-api
```

### Database connection error (Subtitle service)
```bash
# Kiểm tra Postgres đã healthy chưa
docker inspect prod_sub_postgres | grep Health
```

### MinIO bucket lỗi
```bash
# Vào MinIO container
docker exec -it prod_pdf_minio mc ls local/pdf-conversions
```

### Nginx 502 Bad Gateway
```bash
# Kiểm tra backend service có đang chạy
curl http://localhost:8080/health
curl http://localhost:8090/health

# Kiểm tra Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Out of Memory
```bash
# Kiểm tra memory
free -h
docker stats --no-stream

# Scale down workers nếu cần
docker compose -f docker-compose.production.yml --env-file .env.production up -d --scale pdf-worker=1
```
