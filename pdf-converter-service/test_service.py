"""
Automated Test Suite for PDF Converter Microservice
Verifies Health Endpoint, Job Submission, Redis Queuing, Celery Execution, and Result Download.
Usage:
    python test_service.py [http://localhost:8080]
"""

import sys
import time
import requests
import json
import io

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"

def log(msg, status="INFO"):
    symbol = "🔹" if status == "INFO" else ("✅" if status == "SUCCESS" else "❌")
    print(f"[{status}] {symbol} {msg}")

def test_health():
    log(f"Kiểm tra Health Endpoint tại {BASE_URL}/health ...")
    try:
        res = requests.get(f"{BASE_URL}/health", timeout=5)
        if res.status_code == 200:
            data = res.json()
            log(f"Dịch vụ hoạt động bình thường: {data}", "SUCCESS")
            return True
        else:
            log(f"Health check thất bại: HTTP {res.status_code} - {res.text}", "FAIL")
            return False
    except Exception as e:
        log(f"Không thể kết nối đến máy chủ ({BASE_URL}): {e}", "FAIL")
        return False

def test_conversion_txt_to_pdf():
    log("Kiểm tra luồng chuyển đổi: TXT -> PDF ...")
    sample_content = (
        "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n"
        "Độc lập - Tự do - Hạnh phúc\n\n"
        "TÀI LIỆU KIỂM THỬ HỆ THỐNG STUDENT TOOLS\n"
        "Dịch vụ chuyển đổi định dạng tài liệu hiệu năng cao.\n"
        "Thời gian kiểm thử: " + time.strftime("%Y-%m-%d %H:%M:%S") + "\n"
    )
    
    file_bytes = sample_content.encode('utf-8')
    files = {
        'file': ('test_document.txt', io.BytesIO(file_bytes), 'text/plain')
    }
    data = {
        'target_format': 'pdf'
    }

    try:
        t0 = time.time()
        res = requests.post(f"{BASE_URL}/api/v1/conversions", files=files, data=data, timeout=10)
        if res.status_code not in [200, 202]:
            log(f"Khởi tạo tác vụ thất bại: HTTP {res.status_code} - {res.text}", "FAIL")
            return False

        init_data = res.json()
        job_id = init_data.get("job_id")
        log(f"Tác vụ đã được ghi nhận: Job ID = {job_id}", "SUCCESS")

        # Poll status
        max_attempts = 45
        for attempt in range(max_attempts):
            time.sleep(1.0)
            status_res = requests.get(f"{BASE_URL}/api/v1/conversions/{job_id}", timeout=5)
            if status_res.status_code != 200:
                continue

            job_status = status_res.json()
            state = job_status.get("status")
            progress = job_status.get("progress", 0)
            step = job_status.get("current_step", "")

            print(f"   ↳ [Tiến độ {progress}%] Bước: {step} ({state})")

            if state == "completed":
                elapsed = time.time() - t0
                result = job_status.get("result", {})
                dl_url = result.get("download_url")
                size = result.get("file_size_bytes", 0)
                log(f"Chuyển đổi thành công sau {elapsed:.2f}s! Dung lượng: {size} bytes", "SUCCESS")
                
                # Test download
                full_dl = f"{BASE_URL}{dl_url}" if dl_url.startswith("/") else dl_url
                dl_res = requests.get(full_dl, timeout=10, allow_redirects=True)
                if dl_res.status_code == 200 and len(dl_res.content) > 0:
                    log(f"Tải file kết quả thành công ({len(dl_res.content)} bytes)!", "SUCCESS")
                    return True
                else:
                    log(f"Tải file thất bại: HTTP {dl_res.status_code}", "FAIL")
                    return False
            
            elif state == "failed":
                err = job_status.get("error", "Unknown error")
                log(f"Tác vụ chuyển đổi thất bại: {err}", "FAIL")
                return False

        log("Tác vụ quá thời gian chờ (Timeout polling).", "FAIL")
        return False

    except Exception as e:
        log(f"Lỗi kiểm thử chuyển đổi: {e}", "FAIL")
        return False

if __name__ == "__main__":
    print("=" * 65)
    print("🚀 BẮT ĐẦU KIỂM THỬ MICROSERVICE PDF CONVERTER")
    print("=" * 65)
    
    if not test_health():
        print("\n⚠️ Hướng dẫn: Khởi chạy dịch vụ trước khi kiểm thử:")
        print("   cd pdf-converter-service")
        print("   docker-compose up -d")
        sys.exit(1)

    print("-" * 65)
    success = test_conversion_txt_to_pdf()
    print("=" * 65)
    if success:
        print("🎉 TẤT CẢ KIỂM THỬ ĐỀU ĐẠT CHUẨN!")
        sys.exit(0)
    else:
        print("❌ CÓ LỖI XẢY RA TRONG QUÁ TRÌNH KIỂM THỬ.")
        sys.exit(1)
