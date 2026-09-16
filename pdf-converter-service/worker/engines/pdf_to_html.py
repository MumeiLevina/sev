import os
import subprocess

def convert_pdf_to_html(input_pdf: str, output_html: str) -> str:
    """
    Converts PDF to HTML preserving layout and fonts.
    """
    cmd = [
        "pdftohtml",
        "-c",          # Complex layout
        "-noframes",    # Single standalone HTML file
        "-i",          # Ignore images or embed
        input_pdf,
        output_html
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    # pdftohtml sometimes writes to output_htmls.html
    base = os.path.splitext(output_html)[0]
    expected_alt = f"{base}s.html"
    if os.path.exists(expected_alt) and not os.path.exists(output_html):
        os.rename(expected_alt, output_html)

    if not os.path.exists(output_html):
        raise RuntimeError("Không thể tạo file HTML từ PDF.")

    return output_html
