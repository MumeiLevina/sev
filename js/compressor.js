// Universal Client-Side File Compressor (Images & PDF)
// 100% Local processing in browser RAM

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfoArea = document.getElementById('fileInfoArea');
    const fileName = document.getElementById('fileName');
    const fileMetaType = document.getElementById('fileMetaType');
    const fileThumbIcon = document.getElementById('fileThumbIcon');
    const fileBadgeTag = document.getElementById('fileBadgeTag');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const compressionRatio = document.getElementById('compressionRatio');
    const compressBtn = document.getElementById('compressBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressStatusText = document.getElementById('progressStatusText');
    const presetCards = document.querySelectorAll('.preset-card');

    let currentFile = null;
    let currentFileType = null; // 'image' or 'pdf'
    let compressedBlob = null;
    let currentPreset = 'balanced';

    // Preset Selection
    presetCards.forEach(card => {
        card.addEventListener('click', () => {
            presetCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentPreset = card.getAttribute('data-preset');
        });
    });

    // Drag & Drop
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function handleFileSelect(file) {
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        if (!isImage && !isPdf) {
            alert('Định dạng không được hỗ trợ. Vui lòng chọn file Ảnh (JPG, PNG, WEBP) hoặc file PDF!');
            return;
        }

        if (file.size > 60 * 1024 * 1024) {
            alert('File quá lớn! Vui lòng chọn file dưới 60MB để đảm bảo hiệu năng trình duyệt.');
            return;
        }

        currentFile = file;
        currentFileType = isImage ? 'image' : 'pdf';

        fileName.textContent = file.name;
        originalSize.textContent = formatBytes(file.size);
        fileMetaType.textContent = isImage ? `Định dạng: Ảnh (${file.type.split('/')[1]?.toUpperCase() || 'IMG'})` : 'Định dạng: Tài liệu PDF';

        // Set Thumbnail / Icon
        fileThumbIcon.innerHTML = '';
        if (isImage) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            fileThumbIcon.appendChild(img);
        } else {
            fileThumbIcon.innerHTML = `<i class='bx bxs-file-pdf' style='color: #ef4444; font-size: 2.2rem;'></i>`;
        }

        // Reset UI State
        compressedSize.textContent = '-- MB';
        compressionRatio.textContent = '--%';
        fileBadgeTag.className = 'badge badge-primary';
        fileBadgeTag.textContent = 'Sẵn sàng nén';

        compressBtn.classList.remove('hidden');
        compressBtn.disabled = false;
        downloadBtn.classList.add('hidden');
        resetBtn.classList.add('hidden');
        progressContainer.style.display = 'none';
        progressStatusText.style.display = 'none';
        progressBarFill.style.width = '0%';

        fileInfoArea.classList.remove('hidden');
    }

    // Compression Presets Configurations
    const IMAGE_PRESETS = {
        balanced: { maxSizeMB: 0.9, maxWidthOrHeight: 1600, initialQuality: 0.75 },
        extreme: { maxSizeMB: 0.35, maxWidthOrHeight: 1200, initialQuality: 0.55 },
        light: { maxSizeMB: 2.2, maxWidthOrHeight: 2400, initialQuality: 0.88 }
    };

    const PDF_PRESETS = {
        balanced: { scale: 1.25, quality: 0.65 },
        extreme: { scale: 1.0, quality: 0.45 },
        light: { scale: 1.6, quality: 0.82 }
    };

    // Main Compress Action
    compressBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        compressBtn.disabled = true;
        progressContainer.style.display = 'block';
        progressStatusText.style.display = 'block';
        progressBarFill.style.width = '15%';
        fileBadgeTag.className = 'badge badge-warning';
        fileBadgeTag.textContent = 'Đang nén...';

        try {
            if (currentFileType === 'image') {
                await compressImageFile();
            } else {
                await compressPdfFile();
            }

            // Calculation Results
            const savedBytes = currentFile.size - compressedBlob.size;
            let ratio = 0;
            if (savedBytes > 0) {
                ratio = ((savedBytes / currentFile.size) * 100).toFixed(1);
            }

            compressedSize.textContent = formatBytes(compressedBlob.size);
            compressionRatio.textContent = `Giảm ${ratio}%`;

            // Prepare download link
            const downloadUrl = URL.createObjectURL(compressedBlob);
            downloadBtn.href = downloadUrl;
            downloadBtn.download = `compressed_${currentFile.name}`;

            progressBarFill.style.width = '100%';
            progressStatusText.style.display = 'none';

            fileBadgeTag.className = 'badge badge-success';
            fileBadgeTag.textContent = 'Nén thành công';

            compressBtn.classList.add('hidden');
            downloadBtn.classList.remove('hidden');
            resetBtn.classList.remove('hidden');

        } catch (error) {
            console.error('Compression error:', error);
            alert('Đã xảy ra lỗi trong quá trình nén file: ' + (error.message || 'Vui lòng thử lại với file khác.'));
            compressBtn.disabled = false;
            progressContainer.style.display = 'none';
            progressStatusText.style.display = 'none';
            fileBadgeTag.className = 'badge badge-danger';
            fileBadgeTag.textContent = 'Lỗi nén';
        }
    });

    // 1. Image Compression Routine
    async function compressImageFile() {
        const conf = IMAGE_PRESETS[currentPreset] || IMAGE_PRESETS.balanced;
        const options = {
            maxSizeMB: conf.maxSizeMB,
            maxWidthOrHeight: conf.maxWidthOrHeight,
            initialQuality: conf.initialQuality,
            useWebWorker: true,
            onProgress: (p) => {
                progressBarFill.style.width = `${Math.min(90, Math.round(p))}%`;
            }
        };

        compressedBlob = await imageCompression(currentFile, options);
    }

    // 2. PDF Compression Routine (Canvas Rasterization & PDF Re-packaging)
    async function compressPdfFile() {
        const conf = PDF_PRESETS[currentPreset] || PDF_PRESETS.balanced;
        const fileBuffer = await currentFile.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) }).promise;
        const totalPages = pdfDoc.numPages;

        const { PDFDocument } = PDFLib;
        const outputPdf = await PDFDocument.create();

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            progressStatusText.innerHTML = `<span class="loading-spinner"></span> Đang xử lý trang ${pageNum} / ${totalPages}...`;
            progressBarFill.style.width = `${Math.round((pageNum / totalPages) * 85)}%`;

            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: conf.scale });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            await page.render({ canvasContext: ctx, viewport: viewport }).promise;

            // Export canvas as compressed JPEG
            const imgDataUrl = canvas.toDataURL('image/jpeg', conf.quality);
            const imgBytes = await fetch(imgDataUrl).then(res => res.arrayBuffer());
            const embeddedImage = await outputPdf.embedJpg(imgBytes);

            const newPage = outputPdf.addPage([viewport.width, viewport.height]);
            newPage.drawImage(embeddedImage, {
                x: 0,
                y: 0,
                width: viewport.width,
                height: viewport.height
            });
        }

        progressStatusText.innerHTML = `<span class="loading-spinner"></span> Đang hoàn tất tệp PDF...`;
        progressBarFill.style.width = '95%';

        const finalPdfBytes = await outputPdf.save();
        compressedBlob = new Blob([finalPdfBytes], { type: 'application/pdf' });
    }

    // Reset Routine
    resetBtn.addEventListener('click', () => {
        currentFile = null;
        currentFileType = null;
        compressedBlob = null;
        fileInput.value = '';
        fileInfoArea.classList.add('hidden');
    });
});
