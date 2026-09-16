import os
import subprocess

UNOSERVER_HOST = os.getenv("UNOSERVER_HOST", "unoserver")
UNOSERVER_PORT = os.getenv("UNOSERVER_PORT", "2003")

def convert_office_to_pdf(input_file: str, output_pdf: str) -> str:
    """
    Converts DOC, DOCX, XLS, XLSX, PPTX, RTF to PDF using LibreOffice / unoserver.
    """
    # 1. Try unoconverter (Fast socket daemon)
    try:
        cmd = [
            "unoconverter",
            "--host", UNOSERVER_HOST,
            "--port", UNOSERVER_PORT,
            input_file,
            output_pdf
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=45)
        if res.returncode == 0 and os.path.exists(output_pdf) and os.path.getsize(output_pdf) > 0:
            return output_pdf
    except Exception:
        pass

    # 2. Fallback to direct headless LibreOffice
    temp_dir = os.path.dirname(output_pdf)
    cmd_fallback = [
        "soffice",
        "--headless",
        "--convert-to", "pdf",
        "--outdir", temp_dir,
        input_file
    ]
    subprocess.run(cmd_fallback, check=True, timeout=60)

    # Resolve generated filename
    base = os.path.splitext(os.path.basename(input_file))[0]
    generated_pdf = os.path.join(temp_dir, f"{base}.pdf")
    if os.path.exists(generated_pdf) and generated_pdf != output_pdf:
        os.rename(generated_pdf, output_pdf)

    if not os.path.exists(output_pdf):
        raise RuntimeError("Không thể chuyển đổi tài liệu Office sang PDF.")

    return output_pdf
