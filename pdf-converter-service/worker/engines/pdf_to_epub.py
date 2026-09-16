import os
import subprocess

def convert_pdf_to_epub(input_pdf: str, output_epub: str) -> str:
    """
    Converts PDF to EPUB using Calibre ebook-convert engine.
    """
    cmd = [
        "ebook-convert",
        input_pdf,
        output_epub,
        "--enable-heuristics",
        "--unsmarten-punctuation"
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if not os.path.exists(output_epub):
        raise RuntimeError("Không thể tạo file EPUB từ PDF.")

    return output_epub
