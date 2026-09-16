import os
import subprocess

UNOSERVER_HOST = os.getenv("UNOSERVER_HOST", "unoserver")
UNOSERVER_PORT = os.getenv("UNOSERVER_PORT", "2003")

def convert_pdf_to_rtf(input_pdf: str, output_rtf: str) -> str:
    """
    Converts PDF to RTF using LibreOffice / unoserver.
    """
    try:
        cmd = [
            "unoconverter",
            "--host", UNOSERVER_HOST,
            "--port", UNOSERVER_PORT,
            input_pdf,
            output_rtf
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=45)
        if res.returncode == 0 and os.path.exists(output_rtf) and os.path.getsize(output_rtf) > 0:
            return output_rtf
    except Exception:
        pass

    # Fallback to direct headless
    temp_dir = os.path.dirname(output_rtf)
    cmd_fallback = [
        "soffice",
        "--headless",
        "--convert-to", "rtf",
        "--outdir", temp_dir,
        input_pdf
    ]
    subprocess.run(cmd_fallback, check=True, timeout=60)

    base = os.path.splitext(os.path.basename(input_pdf))[0]
    generated_rtf = os.path.join(temp_dir, f"{base}.rtf")
    if os.path.exists(generated_rtf) and generated_rtf != output_rtf:
        os.rename(generated_rtf, output_rtf)

    if not os.path.exists(output_rtf):
        raise RuntimeError("Không thể chuyển đổi PDF sang RTF.")

    return output_rtf
