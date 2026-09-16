import os
import subprocess
from weasyprint import HTML

def convert_html_to_pdf(input_html: str, output_pdf: str) -> str:
    """
    Converts HTML to PDF using WeasyPrint (standards-compliant CSS Paged Media).
    """
    HTML(filename=input_html).write_pdf(output_pdf)
    if not os.path.exists(output_pdf) or os.path.getsize(output_pdf) == 0:
        raise RuntimeError("Không thể kết xuất HTML sang PDF.")
    return output_pdf

def convert_epub_to_pdf(input_epub: str, output_pdf: str) -> str:
    """
    Converts EPUB to PDF using Calibre ebook-convert engine.
    """
    cmd = [
        "ebook-convert",
        input_epub,
        output_pdf,
        "--paper-size", "a4",
        "--pdf-page-numbers",
        "--preserve-cover-aspect-ratio"
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if not os.path.exists(output_pdf) or os.path.getsize(output_pdf) == 0:
        raise RuntimeError("Không thể chuyển đổi EPUB sang PDF.")
    return output_pdf
