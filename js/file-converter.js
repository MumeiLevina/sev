// Universal Client-Side File Converter Engine
// Supported: Images to Combined PDF, PDF to Images (with ZIP), Image Format Converter, Text to PDF

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. TABS CONTROLLER
    // ==========================================
    const tabBtns = document.querySelectorAll('.conv-tab-btn');
    const tabPanes = document.querySelectorAll('.conv-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPaneId = btn.getAttribute('data-tab');
            const targetPane = document.getElementById(targetPaneId);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    function formatBytes(bytes, decimals = 2) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    }

    // ==========================================
    // BACKEND API CLIENT & ASYNC JOB CONTROLLER
    // ==========================================
    const API_BASE = window.PDF_API_URL || (
        location.hostname === 'localhost' || location.hostname === '127.0.0.1'
            ? 'http://localhost:8080/api/v1'
            : 'https://pdf-api.studenttools.vn/api/v1'
    );
    let isBackendOnline = false;

    async function checkBackendHealth() {
        const badge = document.getElementById('apiStatusBadge');
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                isBackendOnline = true;
                if (badge) {
                    badge.className = "api-status-badge online";
                    badge.innerHTML = `<i class='bx bx-check-circle'></i> Backend Connected (Đầy đủ 14+ định dạng)`;
                }
                return;
            }
        } catch (e) {
            // Backend offline
        }
        isBackendOnline = false;
        if (badge) {
            badge.className = "api-status-badge client";
            badge.innerHTML = `<i class='bx bx-laptop'></i> Sẵn sàng kết nối Backend (${API_BASE})`;
        }
    }
    checkBackendHealth();
    setInterval(checkBackendHealth, 20000);

    function pollJobProgress(jobId, handlers) {
        const { percentElem, barElem, statusTextElem, stepDetailElem, downloadArea, downloadBtn, onComplete } = handlers;
        
        const stepMessages = {
            'queued_in_broker': 'Đang xếp hàng trong Message Broker (Redis)...',
            'fetching_from_storage': 'Worker đang tải tài liệu từ Object Storage...',
            'verifying_security': 'Đang kiểm tra bảo mật & tính toàn vẹn tài liệu...',
            'converting': 'Đang chuyển đổi định dạng tài liệu...',
            'storing_result': 'Đang lưu trữ file kết quả & tạo link tải an toàn...',
            'completed': 'Chuyển đổi hoàn tất 100%!'
        };

        const intervalId = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/conversions/${jobId}`);
                if (!res.ok) throw new Error("Không thể lấy trạng thái tác vụ.");

                const data = await res.json();
                const progress = data.progress || 0;

                percentElem.textContent = `${progress}%`;
                barElem.style.width = `${progress}%`;

                if (data.current_step && stepMessages[data.current_step]) {
                    stepDetailElem.textContent = stepMessages[data.current_step];
                } else if (data.current_step) {
                    stepDetailElem.textContent = `Đang thực hiện: ${data.current_step}`;
                }

                if (data.status === 'completed') {
                    clearInterval(intervalId);
                    percentElem.textContent = '100%';
                    barElem.style.width = '100%';
                    statusTextElem.innerHTML = `<i class='bx bx-check-circle' style='color:#10b981;'></i> Hoàn tất!`;
                    stepDetailElem.textContent = `Xử lý thành công trong ${data.duration_ms || 0} ms.`;
                    downloadArea.classList.remove('hidden');
                    if (onComplete) onComplete(data.result || {});
                } else if (data.status === 'failed') {
                    clearInterval(intervalId);
                    statusTextElem.innerHTML = `<i class='bx bx-error-circle' style='color:#ef4444;'></i> Chuyển đổi thất bại`;
                    stepDetailElem.innerHTML = `<span style="color:#ef4444;">${data.error || 'Đã xảy ra lỗi không xác định.'}</span>`;
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 1200);
    }

    // ----------------------------------------------------
    // CONTROLLER: PDF SANG ĐỊNH DẠNG KHÁC (PDF TO X)
    // ----------------------------------------------------
    const dropZonePdf2X = document.getElementById('dropZonePdf2X');
    const inputPdf2X = document.getElementById('inputPdf2X');
    const panelPdf2XConfig = document.getElementById('panelPdf2XConfig');
    const pdf2xFileName = document.getElementById('pdf2xFileName');
    const pdf2xFileSize = document.getElementById('pdf2xFileSize');
    const btnChangePdf2XFile = document.getElementById('btnChangePdf2XFile');
    const pdf2xFormatGrid = document.getElementById('pdf2xFormatGrid');
    const btnStartPdf2X = document.getElementById('btnStartPdf2X');
    const pdf2xProgressCard = document.getElementById('pdf2xProgressCard');
    const pdf2xProgressStatusText = document.getElementById('pdf2xProgressStatusText');
    const pdf2xProgressPercent = document.getElementById('pdf2xProgressPercent');
    const pdf2xProgressBarFill = document.getElementById('pdf2xProgressBarFill');
    const pdf2xStepDetail = document.getElementById('pdf2xStepDetail');
    const pdf2xDownloadArea = document.getElementById('pdf2xDownloadArea');
    const btnDownloadPdf2XResult = document.getElementById('btnDownloadPdf2XResult');
    const btnResetPdf2X = document.getElementById('btnResetPdf2X');

    let currentPdf2XFile = null;
    let selectedPdf2XFormat = 'docx';

    if (dropZonePdf2X) {
        dropZonePdf2X.addEventListener('click', () => inputPdf2X.click());
        btnChangePdf2XFile.addEventListener('click', () => inputPdf2X.click());

        ['dragover', 'dragenter'].forEach(evt => {
            dropZonePdf2X.addEventListener(evt, (e) => {
                e.preventDefault();
                dropZonePdf2X.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            dropZonePdf2X.addEventListener(evt, (e) => {
                e.preventDefault();
                dropZonePdf2X.classList.remove('dragover');
            });
        });

        dropZonePdf2X.addEventListener('drop', (e) => {
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handlePdf2XSelect(e.dataTransfer.files[0]);
            }
        });

        inputPdf2X.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handlePdf2XSelect(e.target.files[0]);
                inputPdf2X.value = '';
            }
        });
    }

    function handlePdf2XSelect(file) {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            alert('Vui lòng chọn file định dạng PDF hợp lệ!');
            return;
        }
        currentPdf2XFile = file;
        pdf2xFileName.textContent = file.name;
        pdf2xFileSize.textContent = `Dung lượng: ${formatBytes(file.size)}`;

        dropZonePdf2X.classList.add('hidden');
        panelPdf2XConfig.classList.remove('hidden');
        pdf2xProgressCard.classList.add('hidden');
    }

    if (pdf2xFormatGrid) {
        const pills = pdf2xFormatGrid.querySelectorAll('.fmt-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                selectedPdf2XFormat = pill.getAttribute('data-fmt');
            });
        });
    }

    if (btnStartPdf2X) {
        btnStartPdf2X.addEventListener('click', async () => {
            if (!currentPdf2XFile) return;

            panelPdf2XConfig.classList.add('hidden');
            pdf2xProgressCard.classList.remove('hidden');
            pdf2xDownloadArea.classList.add('hidden');
            pdf2xProgressPercent.textContent = '10%';
            pdf2xProgressBarFill.style.width = '10%';
            pdf2xProgressStatusText.innerHTML = `<span class="loading-spinner"></span> Đang kết nối hàng đợi xử lý...`;
            pdf2xStepDetail.textContent = 'Đang tải file lên cụm máy chủ chuyển đổi...';

            const options = {
                dpi: parseInt(document.getElementById('pdf2xDpi').value || '150', 10),
                password: document.getElementById('pdf2xPassword').value.trim() || undefined
            };

            const formData = new FormData();
            formData.append('file', currentPdf2XFile);
            formData.append('target_format', selectedPdf2XFormat);
            formData.append('options', JSON.stringify(options));

            try {
                const res = await fetch(`${API_BASE}/conversions`, {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.detail || `Lỗi máy chủ (${res.status})`);
                }

                const data = await res.json();
                const jobId = data.job_id;

                pollJobProgress(jobId, {
                    percentElem: pdf2xProgressPercent,
                    barElem: pdf2xProgressBarFill,
                    statusTextElem: pdf2xProgressStatusText,
                    stepDetailElem: pdf2xStepDetail,
                    downloadArea: pdf2xDownloadArea,
                    downloadBtn: btnDownloadPdf2XResult,
                    onComplete: (result) => {
                        btnDownloadPdf2XResult.href = `${API_BASE}/conversions/${jobId}/download`;
                        btnDownloadPdf2XResult.setAttribute('download', result.filename || 'converted_file');
                    }
                });

            } catch (err) {
                console.warn("Backend API not reachable:", err);
                pdf2xProgressCard.classList.add('hidden');
                panelPdf2XConfig.classList.remove('hidden');

                if (['png', 'jpg'].includes(selectedPdf2XFormat)) {
                    if (confirm("Máy chủ backend đang ngoại tuyến. Bạn có muốn chuyển sang công cụ Tách trang PDF bằng trình duyệt ngay không?")) {
                        const tabBtn = document.querySelector('[data-tab="tab-pdf2img"]');
                        if (tabBtn) tabBtn.click();
                        return;
                    }
                }

                alert(`Không thể kết nối đến máy chủ chuyển đổi Backend (${API_BASE}).\n\n` +
                      `Hướng dẫn khởi chạy Backend:\n` +
                      `1. Mở Terminal tại thư mục: pdf-converter-service\n` +
                      `2. Chạy lệnh: docker-compose up -d\n\n` +
                      `Chi tiết lỗi: ${err.message}`);
            }
        });
    }

    if (btnResetPdf2X) {
        btnResetPdf2X.addEventListener('click', () => {
            currentPdf2XFile = null;
            pdf2xProgressCard.classList.add('hidden');
            panelPdf2XConfig.classList.add('hidden');
            dropZonePdf2X.classList.remove('hidden');
        });
    }

    // ----------------------------------------------------
    // CONTROLLER: CHUYỂN ĐỔI SANG PDF (X TO PDF)
    // ----------------------------------------------------
    const dropZoneX2Pdf = document.getElementById('dropZoneX2Pdf');
    const inputX2Pdf = document.getElementById('inputX2Pdf');
    const panelX2PdfConfig = document.getElementById('panelX2PdfConfig');
    const x2pdfFileName = document.getElementById('x2pdfFileName');
    const x2pdfFileSize = document.getElementById('x2pdfFileSize');
    const btnChangeX2PdfFile = document.getElementById('btnChangeX2PdfFile');
    const btnStartX2Pdf = document.getElementById('btnStartX2Pdf');
    const x2pdfProgressCard = document.getElementById('x2pdfProgressCard');
    const x2pdfProgressStatusText = document.getElementById('x2pdfProgressStatusText');
    const x2pdfProgressPercent = document.getElementById('x2pdfProgressPercent');
    const x2pdfProgressBarFill = document.getElementById('x2pdfProgressBarFill');
    const x2pdfStepDetail = document.getElementById('x2pdfStepDetail');
    const x2pdfDownloadArea = document.getElementById('x2pdfDownloadArea');
    const btnDownloadX2PdfResult = document.getElementById('btnDownloadX2PdfResult');
    const btnResetX2Pdf = document.getElementById('btnResetX2Pdf');

    let currentX2PdfFile = null;

    if (dropZoneX2Pdf) {
        dropZoneX2Pdf.addEventListener('click', () => inputX2Pdf.click());
        btnChangeX2PdfFile.addEventListener('click', () => inputX2Pdf.click());

        ['dragover', 'dragenter'].forEach(evt => {
            dropZoneX2Pdf.addEventListener(evt, (e) => {
                e.preventDefault();
                dropZoneX2Pdf.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            dropZoneX2Pdf.addEventListener(evt, (e) => {
                e.preventDefault();
                dropZoneX2Pdf.classList.remove('dragover');
            });
        });

        dropZoneX2Pdf.addEventListener('drop', (e) => {
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleX2PdfSelect(e.dataTransfer.files[0]);
            }
        });

        inputX2Pdf.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleX2PdfSelect(e.target.files[0]);
                inputX2Pdf.value = '';
            }
        });
    }

    function handleX2PdfSelect(file) {
        currentX2PdfFile = file;
        x2pdfFileName.textContent = file.name;
        x2pdfFileSize.textContent = `Tệp: ${file.name.split('.').pop().toUpperCase()} • ${formatBytes(file.size)}`;

        dropZoneX2Pdf.classList.add('hidden');
        panelX2PdfConfig.classList.remove('hidden');
        x2pdfProgressCard.classList.add('hidden');
    }

    if (btnStartX2Pdf) {
        btnStartX2Pdf.addEventListener('click', async () => {
            if (!currentX2PdfFile) return;

            panelX2PdfConfig.classList.add('hidden');
            x2pdfProgressCard.classList.remove('hidden');
            x2pdfDownloadArea.classList.add('hidden');
            x2pdfProgressPercent.textContent = '10%';
            x2pdfProgressBarFill.style.width = '10%';
            x2pdfProgressStatusText.innerHTML = `<span class="loading-spinner"></span> Đang chuyển đổi sang PDF...`;
            x2pdfStepDetail.textContent = 'Đang tải file lên máy chủ...';

            const formData = new FormData();
            formData.append('file', currentX2PdfFile);
            formData.append('target_format', 'pdf');

            try {
                const res = await fetch(`${API_BASE}/conversions`, {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.detail || `Lỗi máy chủ (${res.status})`);
                }

                const data = await res.json();
                const jobId = data.job_id;

                pollJobProgress(jobId, {
                    percentElem: x2pdfProgressPercent,
                    barElem: x2pdfProgressBarFill,
                    statusTextElem: x2pdfProgressStatusText,
                    stepDetailElem: x2pdfStepDetail,
                    downloadArea: x2pdfDownloadArea,
                    downloadBtn: btnDownloadX2PdfResult,
                    onComplete: (result) => {
                        btnDownloadX2PdfResult.href = `${API_BASE}/conversions/${jobId}/download`;
                        btnDownloadX2PdfResult.setAttribute('download', result.filename || 'converted_file.pdf');
                    }
                });

            } catch (err) {
                console.warn("Backend API not reachable:", err);
                x2pdfProgressCard.classList.add('hidden');
                panelX2PdfConfig.classList.remove('hidden');

                const ext = currentX2PdfFile.name.split('.').pop().toLowerCase();
                if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
                    if (confirm("Máy chủ backend đang ngoại tuyến. Bạn có muốn chuyển ảnh này sang công cụ Ghép PDF trực tiếp trên trình duyệt không?")) {
                        const tabBtn = document.querySelector('[data-tab="tab-img2pdf"]');
                        if (tabBtn) tabBtn.click();
                        return;
                    }
                }

                alert(`Không thể kết nối đến máy chủ chuyển đổi Backend (${API_BASE}).\n\n` +
                      `Hướng dẫn khởi chạy Backend:\n` +
                      `1. Mở Terminal tại thư mục: pdf-converter-service\n` +
                      `2. Chạy lệnh: docker-compose up -d\n\n` +
                      `Chi tiết lỗi: ${err.message}`);
            }
        });
    }

    if (btnResetX2Pdf) {
        btnResetX2Pdf.addEventListener('click', () => {
            currentX2PdfFile = null;
            x2pdfProgressCard.classList.add('hidden');
            panelX2PdfConfig.classList.add('hidden');
            dropZoneX2Pdf.classList.remove('hidden');
        });
    }

    // ==========================================
    // 2. TAB 1: ẢNH SANG PDF (GHÉP BÀI TẬP)
    // ==========================================
    let uploadedImages = []; // Array of { id, file, name, size, dataUrl, width, height, type }

    const dropZoneImg2Pdf = document.getElementById('dropZoneImg2Pdf');
    const inputImg2Pdf = document.getElementById('inputImg2Pdf');
    const img2pdfArea = document.getElementById('img2pdfArea');
    const imageOrderList = document.getElementById('imageOrderList');
    const imgCountBadge = document.getElementById('imgCountBadge');
    const btnAddMoreImgs = document.getElementById('btnAddMoreImgs');
    const btnClearImgs = document.getElementById('btnClearImgs');
    const btnGeneratePdf = document.getElementById('btnGeneratePdf');

    dropZoneImg2Pdf.addEventListener('click', () => inputImg2Pdf.click());
    btnAddMoreImgs.addEventListener('click', () => inputImg2Pdf.click());

    ['dragover', 'dragenter'].forEach(evt => {
        dropZoneImg2Pdf.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZoneImg2Pdf.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropZoneImg2Pdf.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZoneImg2Pdf.classList.remove('dragover');
        });
    });

    dropZoneImg2Pdf.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleNewImages(Array.from(e.dataTransfer.files));
        }
    });

    inputImg2Pdf.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleNewImages(Array.from(e.target.files));
            inputImg2Pdf.value = '';
        }
    });

    async function handleNewImages(files) {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            alert('Vui lòng chọn các file hình ảnh hợp lệ (JPG, PNG, WebP)!');
            return;
        }

        for (const file of imageFiles) {
            const dataUrl = await readFileAsDataUrl(file);
            const dimensions = await getImageDimensions(dataUrl);

            uploadedImages.push({
                id: 'img_' + Math.random().toString(36).substr(2, 9),
                file: file,
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: dataUrl,
                width: dimensions.width,
                height: dimensions.height
            });
        }

        renderImageList();
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    function getImageDimensions(dataUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = () => resolve({ width: 800, height: 600 });
            img.src = dataUrl;
        });
    }

    function renderImageList() {
        if (uploadedImages.length === 0) {
            img2pdfArea.classList.add('hidden');
            dropZoneImg2Pdf.classList.remove('hidden');
            return;
        }

        dropZoneImg2Pdf.classList.add('hidden');
        img2pdfArea.classList.remove('hidden');
        imgCountBadge.textContent = uploadedImages.length;

        imageOrderList.innerHTML = '';
        uploadedImages.forEach((imgObj, idx) => {
            const item = document.createElement('div');
            item.className = 'image-order-item';
            item.innerHTML = `
                <div class="img-page-num">${idx + 1}</div>
                <img src="${imgObj.dataUrl}" class="img-thumb-mini" alt="Trang ${idx + 1}">
                <div class="img-meta-info">
                    <div class="img-meta-name" title="${imgObj.name}">${imgObj.name}</div>
                    <div class="img-meta-size">${formatBytes(imgObj.size)} • ${imgObj.width} x ${imgObj.height} px</div>
                </div>
                <div class="img-btn-group">
                    <button type="button" class="btn-order-action btn-move-up" data-idx="${idx}" title="Chuyển lên trước" ${idx === 0 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
                        <i class='bx bx-chevron-up'></i>
                    </button>
                    <button type="button" class="btn-order-action btn-move-down" data-idx="${idx}" title="Chuyển xuống sau" ${idx === uploadedImages.length - 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
                        <i class='bx bx-chevron-down'></i>
                    </button>
                    <button type="button" class="btn-order-action danger btn-delete-img" data-idx="${idx}" title="Xóa trang này">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            `;
            imageOrderList.appendChild(item);
        });

        // Event listeners for reorder/delete
        imageOrderList.querySelectorAll('.btn-move-up').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.getAttribute('data-idx'), 10);
                if (i > 0) {
                    const temp = uploadedImages[i];
                    uploadedImages[i] = uploadedImages[i - 1];
                    uploadedImages[i - 1] = temp;
                    renderImageList();
                }
            });
        });

        imageOrderList.querySelectorAll('.btn-move-down').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.getAttribute('data-idx'), 10);
                if (i < uploadedImages.length - 1) {
                    const temp = uploadedImages[i];
                    uploadedImages[i] = uploadedImages[i + 1];
                    uploadedImages[i + 1] = temp;
                    renderImageList();
                }
            });
        });

        imageOrderList.querySelectorAll('.btn-delete-img').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.getAttribute('data-idx'), 10);
                uploadedImages.splice(i, 1);
                renderImageList();
            });
        });
    }

    btnClearImgs.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách ảnh đã chọn?')) {
            uploadedImages = [];
            renderImageList();
        }
    });

    btnGeneratePdf.addEventListener('click', async () => {
        if (uploadedImages.length === 0) {
            alert('Vui lòng thêm ít nhất 1 ảnh để tạo file PDF!');
            return;
        }

        btnGeneratePdf.disabled = true;
        btnGeneratePdf.innerHTML = `<span class="loading-spinner"></span> Đang ghép ${uploadedImages.length} trang vào file PDF...`;

        try {
            const { PDFDocument } = PDFLib;
            const pdfDoc = await PDFDocument.create();

            const pageSizeSetting = document.getElementById('pdfPageSize').value;
            const orientationSetting = document.getElementById('pdfOrientation').value;
            let outputName = document.getElementById('pdfOutputName').value.trim();
            if (!outputName) outputName = 'Bai_Tap_Nop.pdf';
            if (!outputName.toLowerCase().endsWith('.pdf')) outputName += '.pdf';

            // A4 dimensions in points (1 pt = 1/72 inch): A4 is 595.28 x 841.89
            const A4_WIDTH = 595.28;
            const A4_HEIGHT = 841.89;

            for (const imgObj of uploadedImages) {
                let embeddedImage;

                // Handle format conversion for PDF-Lib embedding (supports JPEG & PNG directly)
                if (imgObj.type === 'image/png') {
                    const arrayBuffer = await imgObj.file.arrayBuffer();
                    embeddedImage = await pdfDoc.embedPng(arrayBuffer);
                } else {
                    // JPG or WebP: convert to clean JPEG via Canvas
                    const jpegBuffer = await convertDataUrlToJpegBuffer(imgObj.dataUrl);
                    embeddedImage = await pdfDoc.embedJpg(jpegBuffer);
                }

                let pageWidth, pageHeight;
                let drawWidth, drawHeight, drawX, drawY;

                if (pageSizeSetting === 'fit') {
                    // Page size matches image size
                    pageWidth = embeddedImage.width;
                    pageHeight = embeddedImage.height;
                    drawWidth = pageWidth;
                    drawHeight = pageHeight;
                    drawX = 0;
                    drawY = 0;
                } else {
                    // Standard A4
                    const isLandscape = (orientationSetting === 'landscape');
                    pageWidth = isLandscape ? A4_HEIGHT : A4_WIDTH;
                    pageHeight = isLandscape ? A4_WIDTH : A4_HEIGHT;

                    // Margin: 20 points
                    const margin = 20;
                    const maxW = pageWidth - margin * 2;
                    const maxH = pageHeight - margin * 2;

                    const scale = Math.min(maxW / embeddedImage.width, maxH / embeddedImage.height);
                    drawWidth = embeddedImage.width * scale;
                    drawHeight = embeddedImage.height * scale;

                    // Centering
                    drawX = (pageWidth - drawWidth) / 2;
                    drawY = (pageHeight - drawHeight) / 2;
                }

                const page = pdfDoc.addPage([pageWidth, pageHeight]);
                page.drawImage(embeddedImage, {
                    x: drawX,
                    y: drawY,
                    width: drawWidth,
                    height: drawHeight
                });
            }

            const pdfBytes = await pdfDoc.save();
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

            triggerDownload(pdfBlob, outputName);

        } catch (error) {
            console.error('Lỗi khi tạo PDF:', error);
            alert('Đã xảy ra lỗi trong quá trình tạo PDF: ' + (error.message || 'Vui lòng thử lại.'));
        } finally {
            btnGeneratePdf.disabled = false;
            btnGeneratePdf.innerHTML = `<i class='bx bxs-file-pdf'></i> Ghép & Xuất File PDF Ngay`;
        }
    });

    function convertDataUrlToJpegBuffer(dataUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    blob.arrayBuffer().then(resolve);
                }, 'image/jpeg', 0.88);
            };
            img.src = dataUrl;
        });
    }

    // ==========================================
    // 3. TAB 2: PDF SANG ẢNH (TÁCH TRANG)
    // ==========================================
    const dropZonePdf2Img = document.getElementById('dropZonePdf2Img');
    const inputPdf2Img = document.getElementById('inputPdf2Img');
    const pdf2imgArea = document.getElementById('pdf2imgArea');
    const loadedPdfName = document.getElementById('loadedPdfName');
    const loadedPdfMeta = document.getElementById('loadedPdfMeta');
    const pdfRenderingNotice = document.getElementById('pdfRenderingNotice');
    const pdfPagesGrid = document.getElementById('pdfPagesGrid');
    const btnDownloadAllZip = document.getElementById('btnDownloadAllZip');
    const btnResetPdf2Img = document.getElementById('btnResetPdf2Img');

    let currentPdfFile = null;
    let extractedPages = []; // Array of { pageNum, dataUrl, blob, filename }

    dropZonePdf2Img.addEventListener('click', () => inputPdf2Img.click());

    ['dragover', 'dragenter'].forEach(evt => {
        dropZonePdf2Img.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZonePdf2Img.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropZonePdf2Img.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZonePdf2Img.classList.remove('dragover');
        });
    });

    dropZonePdf2Img.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handlePdfToImgFile(e.dataTransfer.files[0]);
        }
    });

    inputPdf2Img.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handlePdfToImgFile(e.target.files[0]);
            inputPdf2Img.value = '';
        }
    });

    async function handlePdfToImgFile(file) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            alert('Vui lòng chọn file định dạng PDF!');
            return;
        }

        currentPdfFile = file;
        extractedPages = [];
        dropZonePdf2Img.classList.add('hidden');
        pdf2imgArea.classList.remove('hidden');

        loadedPdfName.textContent = file.name;
        loadedPdfMeta.textContent = 'Đang đọc cấu trúc tài liệu...';
        pdfRenderingNotice.style.display = 'block';
        pdfPagesGrid.innerHTML = '';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
            const totalPages = pdf.numPages;
            loadedPdfMeta.textContent = `Tổng cộng ${totalPages} trang (${formatBytes(file.size)})`;

            const baseName = file.name.replace(/\.pdf$/i, '');

            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 }); // High resolution

                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');

                await page.render({ canvasContext: ctx, viewport: viewport }).promise;

                const dataUrl = canvas.toDataURL('image/png');
                const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
                const pageFileName = `${baseName}_Trang_${pageNum}.png`;

                extractedPages.push({
                    pageNum,
                    dataUrl,
                    blob,
                    filename: pageFileName
                });

                // Render page card
                const card = document.createElement('div');
                card.className = 'pdf-page-card';
                card.innerHTML = `
                    <img src="${dataUrl}" alt="Trang ${pageNum}">
                    <div class="pdf-page-title">Trang ${pageNum} / ${totalPages}</div>
                    <button type="button" class="btn btn-outline btn-dl-single-page" data-idx="${pageNum - 1}" style="font-size: 0.76rem; padding: 4px 10px; width: 100%;">
                        <i class='bx bxs-download'></i> Tải ảnh
                    </button>
                `;
                pdfPagesGrid.appendChild(card);
            }

            pdfRenderingNotice.style.display = 'none';

            // Attach single page download events
            pdfPagesGrid.querySelectorAll('.btn-dl-single-page').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.getAttribute('data-idx'), 10);
                    const item = extractedPages[idx];
                    if (item) {
                        triggerDownload(item.blob, item.filename);
                    }
                });
            });

        } catch (error) {
            console.error('Lỗi khi đọc PDF:', error);
            alert('Không thể kết xuất trang PDF: ' + (error.message || 'Vui lòng kiểm tra lại file.'));
            btnResetPdf2Img.click();
        }
    }

    btnDownloadAllZip.addEventListener('click', async () => {
        if (extractedPages.length === 0) {
            alert('Chưa có trang nào được kết xuất!');
            return;
        }

        btnDownloadAllZip.disabled = true;
        btnDownloadAllZip.innerHTML = `<span class="loading-spinner"></span> Đang nén file ZIP...`;

        try {
            const zip = new JSZip();
            extractedPages.forEach(p => {
                zip.file(p.filename, p.blob);
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipName = `${currentPdfFile.name.replace(/\.pdf$/i, '')}_tat_ca_trang.zip`;
            triggerDownload(zipBlob, zipName);

        } catch (error) {
            console.error('Lỗi đóng gói zip:', error);
            alert('Có lỗi khi tạo file ZIP: ' + error.message);
        } finally {
            btnDownloadAllZip.disabled = false;
            btnDownloadAllZip.innerHTML = `<i class='bx bxs-archive'></i> Tải tất cả trang (.ZIP)`;
        }
    });

    btnResetPdf2Img.addEventListener('click', () => {
        currentPdfFile = null;
        extractedPages = [];
        pdfPagesGrid.innerHTML = '';
        pdf2imgArea.classList.add('hidden');
        dropZonePdf2Img.classList.remove('hidden');
    });

    // ==========================================
    // 4. TAB 3: ĐỔI ĐỊNH DẠNG ẢNH (JPG/PNG/WEBP)
    // ==========================================
    const dropZoneImgFormat = document.getElementById('dropZoneImgFormat');
    const inputImgFormat = document.getElementById('inputImgFormat');
    const imgFormatArea = document.getElementById('imgFormatArea');
    const formatSourceThumb = document.getElementById('formatSourceThumb');
    const formatSourceName = document.getElementById('formatSourceName');
    const formatSourceMeta = document.getElementById('formatSourceMeta');
    const targetImageFormat = document.getElementById('targetImageFormat');
    const btnConvertImageFormat = document.getElementById('btnConvertImageFormat');

    let currentFormatImg = null;

    dropZoneImgFormat.addEventListener('click', () => inputImgFormat.click());

    dropZoneImgFormat.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZoneImgFormat.classList.add('dragover');
    });

    dropZoneImgFormat.addEventListener('dragleave', () => {
        dropZoneImgFormat.classList.remove('dragover');
    });

    dropZoneImgFormat.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZoneImgFormat.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFormatImgSelect(e.dataTransfer.files[0]);
        }
    });

    inputImgFormat.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFormatImgSelect(e.target.files[0]);
            inputImgFormat.value = '';
        }
    });

    function handleFormatImgSelect(file) {
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file hình ảnh hợp lệ!');
            return;
        }

        currentFormatImg = file;
        const objectUrl = URL.createObjectURL(file);
        formatSourceThumb.src = objectUrl;
        formatSourceName.textContent = file.name;
        formatSourceMeta.textContent = `Gốc: ${file.type.split('/')[1]?.toUpperCase()} • ${formatBytes(file.size)}`;

        imgFormatArea.classList.remove('hidden');
        dropZoneImgFormat.classList.add('hidden');
    }

    btnConvertImageFormat.addEventListener('click', () => {
        if (!currentFormatImg) return;

        btnConvertImageFormat.disabled = true;
        btnConvertImageFormat.innerHTML = `<span class="loading-spinner"></span> Đang chuyển đổi định dạng...`;

        const mime = targetImageFormat.value;
        let ext = 'jpg';
        if (mime === 'image/png') ext = 'png';
        if (mime === 'image/webp') ext = 'webp';

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (mime === 'image/jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                const baseName = currentFormatImg.name.replace(/\.[^/.]+$/, '');
                triggerDownload(blob, `${baseName}_converted.${ext}`);

                btnConvertImageFormat.disabled = false;
                btnConvertImageFormat.innerHTML = `<i class='bx bx-check-circle'></i> Chuyển Đổi & Tải Ảnh Ngay`;
            }, mime, 0.92);
        };
        img.src = formatSourceThumb.src;
    });

    // ==========================================
    // 5. TAB 4: VĂN BẢN SANG PDF (HỖ TRỢ ĐẦY ĐỦ TIẾNG VIỆT & ĐỊNH DẠNG ĐẸP)
    // ==========================================
    const btnTextToPdf = document.getElementById('btnTextToPdf');
    btnTextToPdf.addEventListener('click', async () => {
        const title = document.getElementById('txtDocTitle').value.trim() || 'Tài Liệu Ghi Chú';
        const content = document.getElementById('txtDocContent').value.trim();

        if (!content) {
            alert('Vui lòng nhập hoặc dán nội dung văn bản cần chuyển thành file PDF!');
            return;
        }

        btnTextToPdf.disabled = true;
        btnTextToPdf.innerHTML = `<span class="loading-spinner"></span> Đang tạo file PDF...`;

        try {
            const { PDFDocument } = PDFLib;
            const pdfDoc = await PDFDocument.create();

            // High-resolution A4 canvas settings (1240 x 1754 px at ~150 DPI)
            const CANVAS_WIDTH = 1240;
            const CANVAS_HEIGHT = 1754;
            const PDF_A4_WIDTH = 595.28;
            const PDF_A4_HEIGHT = 841.89;

            const marginX = 80;
            const marginTop = 90;
            const marginBottom = 80;
            const usableWidth = CANVAS_WIDTH - marginX * 2;

            // Helper canvas context for text measurement
            const measureCanvas = document.createElement('canvas');
            const measureCtx = measureCanvas.getContext('2d');
            measureCtx.font = '22px "Inter", "Segoe UI", Roboto, sans-serif';

            // Split content into lines that fit usableWidth
            const rawParagraphs = content.split('\n');
            const wrappedLines = [];

            rawParagraphs.forEach(para => {
                if (para.trim() === '') {
                    wrappedLines.push(''); // Empty paragraph spacer
                    return;
                }

                const words = para.split(' ');
                let currentLine = '';

                words.forEach(w => {
                    const testLine = currentLine ? `${currentLine} ${w}` : w;
                    if (measureCtx.measureText(testLine).width <= usableWidth) {
                        currentLine = testLine;
                    } else {
                        if (currentLine) wrappedLines.push(currentLine);
                        currentLine = w;
                    }
                });
                if (currentLine) wrappedLines.push(currentLine);
                wrappedLines.push(''); // Paragraph gap
            });

            // Calculate pages
            const lineHeight = 34;
            const pageHeaderHeight = 110; // Title + date + divider on page 1
            const startYPage1 = marginTop + pageHeaderHeight;
            const startYOtherPages = marginTop + 20;
            const maxY = CANVAS_HEIGHT - marginBottom;

            const pagesContent = [];
            let currentPageLines = [];
            let currentY = startYPage1;

            wrappedLines.forEach(line => {
                const requiredHeight = (line === '') ? 18 : lineHeight;
                if (currentY + requiredHeight > maxY) {
                    pagesContent.push(currentPageLines);
                    currentPageLines = [line];
                    currentY = startYOtherPages + requiredHeight;
                } else {
                    currentPageLines.push(line);
                    currentY += requiredHeight;
                }
            });
            if (currentPageLines.length > 0) {
                pagesContent.push(currentPageLines);
            }

            const totalPages = pagesContent.length;
            const todayStr = new Date().toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Render each page to canvas and embed into PDF-lib
            for (let pIdx = 0; pIdx < totalPages; pIdx++) {
                const pageNum = pIdx + 1;
                const lines = pagesContent[pIdx];

                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = CANVAS_WIDTH;
                pageCanvas.height = CANVAS_HEIGHT;
                const ctx = pageCanvas.getContext('2d');

                // White paper background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

                // Subtle top colored border accent
                ctx.fillStyle = '#004bb5';
                ctx.fillRect(0, 0, CANVAS_WIDTH, 6);

                let drawY = marginTop;

                if (pageNum === 1) {
                    // Title
                    ctx.fillStyle = '#004bb5';
                    ctx.font = 'bold 34px "Inter", "Segoe UI", Roboto, sans-serif';
                    ctx.fillText(title, marginX, drawY);
                    drawY += 36;

                    // Meta subtitle
                    ctx.fillStyle = '#64748b';
                    ctx.font = '16px "Inter", "Segoe UI", Roboto, sans-serif';
                    ctx.fillText(`Ngày tạo: ${todayStr} • Định dạng văn bản xuất từ Kinetic Tech`, marginX, drawY);
                    drawY += 24;

                    // Divider line
                    ctx.strokeStyle = '#e2e8f0';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(marginX, drawY);
                    ctx.lineTo(CANVAS_WIDTH - marginX, drawY);
                    ctx.stroke();
                    drawY += 36;
                } else {
                    // Running header on page 2+
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '15px "Inter", "Segoe UI", Roboto, sans-serif';
                    ctx.fillText(title, marginX, marginTop);

                    ctx.strokeStyle = '#f1f5f9';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(marginX, marginTop + 12);
                    ctx.lineTo(CANVAS_WIDTH - marginX, marginTop + 12);
                    ctx.stroke();

                    drawY = startYOtherPages;
                }

                // Draw text lines
                ctx.fillStyle = '#0f172a';
                ctx.font = '22px "Inter", "Segoe UI", Roboto, sans-serif';

                lines.forEach(l => {
                    if (l === '') {
                        drawY += 18;
                    } else {
                        ctx.fillText(l, marginX, drawY);
                        drawY += lineHeight;
                    }
                });

                // Footer (page number)
                ctx.fillStyle = '#94a3b8';
                ctx.font = '16px "Inter", "Segoe UI", Roboto, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Trang ${pageNum} / ${totalPages}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 36);
                ctx.textAlign = 'left';

                // Convert canvas to JPEG buffer
                const jpegBlob = await new Promise(res => pageCanvas.toBlob(res, 'image/jpeg', 0.94));
                const jpegBuffer = await jpegBlob.arrayBuffer();
                const embeddedImg = await pdfDoc.embedJpg(jpegBuffer);

                const pdfPage = pdfDoc.addPage([PDF_A4_WIDTH, PDF_A4_HEIGHT]);
                pdfPage.drawImage(embeddedImg, {
                    x: 0,
                    y: 0,
                    width: PDF_A4_WIDTH,
                    height: PDF_A4_HEIGHT
                });
            }

            const pdfBytes = await pdfDoc.save();
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
            const sanitizedTitle = title.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_');
            triggerDownload(pdfBlob, `${sanitizedTitle || 'Tai_Lieu'}.pdf`);

        } catch (error) {
            console.error('Lỗi khi xuất PDF văn bản:', error);
            alert('Có lỗi xảy ra: ' + (error.message || 'Vui lòng kiểm tra lại nội dung.'));
        } finally {
            btnTextToPdf.disabled = false;
            btnTextToPdf.innerHTML = `<i class='bx bxs-file-pdf'></i> Xuất File PDF Đẹp`;
        }
    });
});
