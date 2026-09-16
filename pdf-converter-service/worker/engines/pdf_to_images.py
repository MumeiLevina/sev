import os
import glob
import zipfile
import subprocess

def convert_pdf_to_images(input_pdf: str, output_path: str, img_format: str = "png", dpi: int = 150) -> str:
    """
    Renders PDF pages to PNG/JPG. If multi-page, packs into a ZIP file.
    """
    temp_dir = os.path.dirname(output_path)
    prefix = os.path.join(temp_dir, "page")
    fmt_flag = f"-{img_format.lower()}"

    subprocess.run(
        ["pdftoppm", fmt_flag, "-r", str(dpi), input_pdf, prefix],
        check=True
    )

    rendered_images = sorted(glob.glob(f"{prefix}-*.{img_format.lower()}"))
    if not rendered_images:
        raise RuntimeError(f"Không thể kết xuất trang ảnh từ PDF ({img_format}).")

    if len(rendered_images) == 1 and not output_path.endswith(".zip"):
        os.rename(rendered_images[0], output_path)
        return output_path

    # Multi-page or ZIP requested: package into zip
    zip_path = output_path if output_path.endswith(".zip") else f"{output_path}.zip"
    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for idx, img in enumerate(rendered_images, 1):
            zf.write(img, arcname=f"Trang_{idx:03d}.{img_format.lower()}")

    return zip_path
