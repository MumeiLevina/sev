import os
import img2pdf
from PIL import Image

def convert_images_to_pdf(input_image: str, output_pdf: str) -> str:
    """
    Converts PNG/JPG to PDF using lossless img2pdf engine with Pillow fallback.
    """
    try:
        with open(output_pdf, "wb") as f:
            f.write(img2pdf.convert(input_image))
    except Exception:
        # Fallback to Pillow if color space or format is exotic (e.g. RGBA PNG needing RGB JPEG canvas)
        img = Image.open(input_image)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(output_pdf, "PDF", resolution=150.0)

    if not os.path.exists(output_pdf) or os.path.getsize(output_pdf) == 0:
        raise RuntimeError("Không thể chuyển đổi ảnh sang PDF.")

    return output_pdf
