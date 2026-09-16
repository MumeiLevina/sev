import os
import subprocess
import magic

class SecurityException(Exception):
    pass

class PasswordRequiredException(SecurityException):
    pass

class CorruptedFileException(SecurityException):
    pass

class ConversionTimeoutException(SecurityException):
    pass

def run_sandboxed_command(cmd: list, timeout_sec: int = 60, cwd: str = None) -> subprocess.CompletedProcess:
    """Executes CLI command with rigid timeout and error capture."""
    try:
        res = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout_sec,
            cwd=cwd
        )
        if res.returncode != 0:
            error_msg = res.stderr.strip() or res.stdout.strip()
            raise SecurityException(f"Command failed ({' '.join(cmd[:3])}...): {error_msg}")
        return res
    except subprocess.TimeoutExpired:
        raise ConversionTimeoutException(f"Tác vụ bị hủy do vượt quá thời gian tối đa ({timeout_sec}s).")

def check_pdf_security(pdf_path: str, password: str = None) -> str:
    """
    Validates PDF integrity and handles password decryption.
    Returns: Path to decrypted/verified PDF ready for processing.
    """
    # 1. Verify file exists and is not empty
    if not os.path.exists(pdf_path) or os.path.getsize(pdf_path) == 0:
        raise CorruptedFileException("File nguồn không tồn tại hoặc rỗng.")

    # 2. Check encryption via QPDF
    check_enc = subprocess.run(["qpdf", "--is-encrypted", pdf_path])
    is_encrypted = (check_enc.returncode == 0)

    if is_encrypted:
        if not password:
            raise PasswordRequiredException("File PDF này được bảo vệ bằng mật khẩu. Vui lòng cung cấp mật khẩu để tiếp tục.")
        
        # Attempt decryption
        decrypted_path = pdf_path.replace(".pdf", "_unlocked.pdf")
        decrypt_res = subprocess.run(
            ["qpdf", f"--password={password}", "--decrypt", pdf_path, decrypted_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        if decrypt_res.returncode != 0:
            raise PasswordRequiredException("Mật khẩu cung cấp không chính xác. Không thể mở khóa tài liệu.")
        return decrypted_path

    # 3. Check PDF integrity via pdfinfo
    info_res = subprocess.run(["pdfinfo", pdf_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if info_res.returncode != 0:
        raise CorruptedFileException("Cấu trúc file PDF bị lỗi hoặc hỏng nặng (Corrupted).")

    return pdf_path
