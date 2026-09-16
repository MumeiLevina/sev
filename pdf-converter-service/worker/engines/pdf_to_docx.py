import os
from pdf2docx import Converter

def convert_pdf_to_docx(input_pdf: str, output_docx: str, page_range: str = None) -> str:
    """
    Converts PDF to editable Word DOCX preserving tables, paragraphs, and styles.
    """
    cv = Converter(input_pdf)
    try:
        if page_range:
            # e.g. "0:5" for first 5 pages
            pages = []
            for part in page_range.split(','):
                if '-' in part:
                    s, e = map(int, part.split('-'))
                    pages.extend(range(s - 1, e))
                else:
                    pages.append(int(part) - 1)
            cv.convert(output_docx, pages=pages)
        else:
            cv.convert(output_docx)
    finally:
        cv.close()

    if not os.path.exists(output_docx) or os.path.getsize(output_docx) == 0:
        raise RuntimeError("Không thể tạo file DOCX từ PDF.")
    
    return output_docx
