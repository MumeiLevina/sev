/**
 * Kinetic Tech — Image Background Remover (AI Fashion & E-Commerce)
 * ─────────────────────────────────────────────────────────────────
 * Handles client-side validation, drag-and-drop, EXIF preview,
 * multipart communication with /api/v1/remove-background,
 * checkerboard preview toggles, and PNG/JPG downloads.
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ── DOM Element References ──
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const optionsControl = document.getElementById('optionsControl');
    const cardTransparent = document.getElementById('cardTransparent');
    const cardWhite = document.getElementById('cardWhite');
    const removeBgBtn = document.getElementById('removeBgBtn');
    const changeFileBtn = document.getElementById('changeFileBtn');
    const fileInfoText = document.getElementById('fileInfoText');

    const loadingSection = document.getElementById('loadingSection');
    const loadingStepText = document.getElementById('loadingStepText');
    const loadingProgressFill = document.getElementById('loadingProgressFill');

    const workspaceSection = document.getElementById('workspaceSection');
    const originalImg = document.getElementById('originalImg');
    const processedImg = document.getElementById('processedImg');
    const resultBadge = document.getElementById('resultBadge');
    const resultViewport = document.getElementById('resultViewport');
    const origDimensions = document.getElementById('origDimensions');
    const origFileSize = document.getElementById('origFileSize');
    const procDimensions = document.getElementById('procDimensions');
    const procFormatTag = document.getElementById('procFormatTag');

    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadJpgBtn = document.getElementById('downloadJpgBtn');
    const resetAllBtn = document.getElementById('resetAllBtn');

    const alertBox = document.getElementById('alertBox');
    const alertMessage = document.getElementById('alertMessage');

    // ── Application State ──
    let currentFile = null;
    let currentBgType = 'transparent';
    let originalObjectURL = null;
    let loadingInterval = null;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    // ── Alert Helpers ──
    function showAlert(msg, isSuccess = false) {
        alertMessage.textContent = msg;
        alertBox.className = 'bgr-alert ' + (isSuccess ? 'success' : 'error');
        alertBox.style.display = 'flex';
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideAlert() {
        alertBox.style.display = 'none';
    }

    function formatBytes(bytes, decimals = 2) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // ── Option Card Toggles ──
    function setBackgroundType(type) {
        currentBgType = type;
        if (type === 'transparent') {
            cardTransparent.classList.add('active');
            cardWhite.classList.remove('active');
            cardTransparent.querySelector('input[type="radio"]').checked = true;
        } else {
            cardWhite.classList.add('active');
            cardTransparent.classList.remove('active');
            cardWhite.querySelector('input[type="radio"]').checked = true;
        }
    }

    cardTransparent.addEventListener('click', () => setBackgroundType('transparent'));
    cardWhite.addEventListener('click', () => setBackgroundType('white'));

    // ── File Selection & Validation ──
    function handleFile(file) {
        hideAlert();
        if (!file) return;

        // Validate MIME type & extension
        const type = (file.type || '').toLowerCase();
        const name = (file.name || '').toLowerCase();
        const validExt = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp');

        if (!ALLOWED_MIME_TYPES.includes(type) && !validExt) {
            showAlert('Định dạng ảnh không được hỗ trợ.');
            return;
        }

        // Validate File Size (10MB)
        if (file.size > MAX_FILE_SIZE) {
            showAlert('Ảnh không được vượt quá 10MB.');
            return;
        }

        currentFile = file;

        // Clean up previous Object URL
        if (originalObjectURL) {
            URL.revokeObjectURL(originalObjectURL);
        }
        originalObjectURL = URL.createObjectURL(file);

        // Preview original image
        originalImg.src = originalObjectURL;
        origFileSize.textContent = formatBytes(file.size);
        fileInfoText.textContent = `${file.name} (${formatBytes(file.size)})`;

        // Read natural image dimensions
        const probeImg = new Image();
        probeImg.onload = () => {
            origDimensions.textContent = `${probeImg.naturalWidth} x ${probeImg.naturalHeight} px`;
        };
        probeImg.src = originalObjectURL;

        // Display controls and scroll to view
        optionsControl.style.display = 'block';
        workspaceSection.style.display = 'none';
        dropZone.style.display = 'none';

        optionsControl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ── Drag & Drop Event Listeners ──
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    changeFileBtn.addEventListener('click', () => {
        fileInput.value = '';
        fileInput.click();
    });

    // ── Loading Animation Steps ──
    const STEPS = [
        { text: 'Đang kiểm tra định dạng và chuẩn hóa góc chụp EXIF...', progress: '25%' },
        { text: 'AI đang phân tích nhận diện chủ thể và đường viền sản phẩm...', progress: '55%' },
        { text: 'Đang bóc tách nền và tinh chỉnh viền cạnh (Alpha Matting)...', progress: '80%' },
        { text: 'Đang kết xuất tệp ảnh chất lượng cao...', progress: '95%' }
    ];

    function startLoading() {
        loadingSection.style.display = 'block';
        optionsControl.style.display = 'none';
        workspaceSection.style.display = 'none';
        removeBgBtn.disabled = true;

        let stepIndex = 0;
        loadingStepText.textContent = STEPS[0].text;
        loadingProgressFill.style.width = STEPS[0].progress;

        loadingInterval = setInterval(() => {
            stepIndex = (stepIndex + 1) % STEPS.length;
            loadingStepText.textContent = STEPS[stepIndex].text;
            loadingProgressFill.style.width = STEPS[stepIndex].progress;
        }, 1100);

        loadingSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function stopLoading() {
        if (loadingInterval) {
            clearInterval(loadingInterval);
            loadingInterval = null;
        }
        loadingSection.style.display = 'none';
        removeBgBtn.disabled = false;
    }

    // ── Remove Background Action ──
    removeBgBtn.addEventListener('click', async () => {
        if (!currentFile) {
            showAlert('Vui lòng chọn ảnh trước khi xóa nền.');
            return;
        }

        hideAlert();
        startLoading();

        try {
            const formData = new FormData();
            formData.append('image', currentFile);
            formData.append('background', currentBgType);

            // Optional Auth Token
            const token = localStorage.getItem('kt_sub_access_token') || localStorage.getItem('kt_access_token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/v1/remove-background', {
                method: 'POST',
                headers: headers,
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                const errMsg = data.detail || 'Không thể xóa nền ảnh. Vui lòng thử lại.';
                throw new Error(errMsg);
            }

            // Successful Processing!
            stopLoading();

            // Render result
            processedImg.src = data.processedUrl;
            procDimensions.textContent = `${data.width} x ${data.height} px`;

            const baseFileName = (currentFile.name || 'fashion-product').replace(/\.[^/.]+$/, '');

            if (currentBgType === 'white') {
                resultViewport.className = 'bgr-viewport bgr-viewport-white';
                resultBadge.textContent = 'White #FFFFFF';
                resultBadge.className = 'bgr-panel-badge bgr-badge-proc';
                procFormatTag.textContent = 'Nền trắng #FFFFFF (Catalog E-Commerce)';

                downloadPngBtn.href = data.processedUrl;
                downloadPngBtn.download = `${baseFileName}-white.png`;
                downloadPngBtn.innerHTML = "<i class='bx bx-download'></i> Tải PNG (Nền trắng)";

                if (data.jpgUrl) {
                    downloadJpgBtn.href = data.jpgUrl;
                    downloadJpgBtn.download = `${baseFileName}-white.jpg`;
                    downloadJpgBtn.style.display = 'inline-flex';
                } else {
                    downloadJpgBtn.style.display = 'none';
                }
            } else {
                resultViewport.className = 'bgr-viewport bgr-viewport-transparent';
                resultBadge.textContent = 'Transparent PNG';
                resultBadge.className = 'bgr-panel-badge bgr-badge-proc';
                procFormatTag.textContent = 'PNG RGBA (Kênh Alpha Thực Tế)';

                downloadPngBtn.href = data.processedUrl;
                downloadPngBtn.download = `${baseFileName}-transparent.png`;
                downloadPngBtn.innerHTML = "<i class='bx bx-download'></i> Tải PNG (Trong suốt)";

                downloadJpgBtn.style.display = 'none';
            }

            workspaceSection.style.display = 'block';
            workspaceSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        } catch (err) {
            stopLoading();
            optionsControl.style.display = 'block';
            showAlert(err.message || 'Không thể xóa nền ảnh. Vui lòng thử lại.');
        }
    });

    // ── Reset / Process Another Image ──
    resetAllBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        if (originalObjectURL) {
            URL.revokeObjectURL(originalObjectURL);
            originalObjectURL = null;
        }
        originalImg.src = '';
        processedImg.src = '';
        hideAlert();
        optionsControl.style.display = 'none';
        workspaceSection.style.display = 'none';
        dropZone.style.display = 'block';
        dropZone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
});
