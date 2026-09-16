// Intelligent Study Plan Generator & Pomodoro Controller
// Client-side execution with LocalStorage persistence

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for syllabus passed from pdf-extractor.html
    const importedSyllabus = localStorage.getItem('student_imported_syllabus');
    if (importedSyllabus) {
        const topicsInput = document.getElementById('topics');
        if (topicsInput) {
            topicsInput.value = importedSyllabus;
            const status = document.getElementById('folderStatus');
            if (status) {
                status.innerHTML = `<i class='bx bx-check-circle'></i> Đã tự động điền nội dung đề cương từ công cụ Trích xuất PDF!`;
                status.style.display = 'block';
                setTimeout(() => { status.style.display = 'none'; }, 6000);
            }
        }
        localStorage.removeItem('student_imported_syllabus');
    }

    // 2. Folder Upload Extraction
    const folderInput = document.getElementById('folderInput');
    if (folderInput) {
        folderInput.addEventListener('change', function(e) {
            const files = e.target.files;
            if (files.length === 0) return;

            let fileNames = [];
            for (let i = 0; i < files.length; i++) {
                let name = files[i].name;
                if (name.startsWith('.')) continue;
                name = name.replace(/\.(pdf|pptx|docx|doc|ppt|txt)$/i, '');
                name = name.replace(/[_-]/g, ' ');
                fileNames.push(name.trim());
            }

            if (fileNames.length > 0) {
                fileNames = [...new Set(fileNames)];
                document.getElementById('topics').value = fileNames.join('\n');
                
                const status = document.getElementById('folderStatus');
                status.innerHTML = `<i class='bx bx-check-circle'></i> Đã trích xuất ${fileNames.length} chương bài giảng từ tên file thư mục!`;
                status.style.display = 'block';
                setTimeout(() => { status.style.display = 'none'; }, 5000);
            }
        });
    }

    // 3. Live Pomodoro Timer Widget
    let pomoDuration = 25 * 60; // 25 minutes in seconds
    let pomoRemaining = pomoDuration;
    let pomoTimerId = null;
    let isPomoRunning = false;

    const pomoDisplay = document.getElementById('pomoDisplay');
    const btnPomoStart = document.getElementById('btnPomoStart');
    const btnPomoReset = document.getElementById('btnPomoReset');
    const pomoModeBtns = document.querySelectorAll('.pomo-mode-btn');

    function updatePomoDisplay() {
        const minutes = Math.floor(pomoRemaining / 60);
        const seconds = pomoRemaining % 60;
        pomoDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function playChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc1 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.25); // A5
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
            osc1.connect(gain);
            gain.connect(ctx.destination);
            osc1.start();
            osc1.stop(ctx.currentTime + 1.2);
        } catch (e) {
            console.warn('Audio Context not allowed without interaction');
        }
    }

    pomoModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            pomoModeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            clearInterval(pomoTimerId);
            isPomoRunning = false;
            btnPomoStart.innerHTML = "<i class='bx bx-play'></i> Bắt đầu";

            const minutes = parseInt(btn.getAttribute('data-time'), 10) || 25;
            pomoDuration = minutes * 60;
            pomoRemaining = pomoDuration;
            updatePomoDisplay();
        });
    });

    btnPomoStart.addEventListener('click', () => {
        if (!isPomoRunning) {
            isPomoRunning = true;
            btnPomoStart.innerHTML = "<i class='bx bx-pause'></i> Tạm dừng";
            pomoTimerId = setInterval(() => {
                if (pomoRemaining > 0) {
                    pomoRemaining--;
                    updatePomoDisplay();
                } else {
                    clearInterval(pomoTimerId);
                    isPomoRunning = false;
                    btnPomoStart.innerHTML = "<i class='bx bx-play'></i> Bắt đầu";
                    playChime();
                    alert('🎉 Hoàn thành phiên Pomodoro! Hãy nghỉ ngơi một chút trước khi tiếp tục.');
                }
            }, 1000);
        } else {
            isPomoRunning = false;
            clearInterval(pomoTimerId);
            btnPomoStart.innerHTML = "<i class='bx bx-play'></i> Tiếp tục";
        }
    });

    btnPomoReset.addEventListener('click', () => {
        clearInterval(pomoTimerId);
        isPomoRunning = false;
        btnPomoStart.innerHTML = "<i class='bx bx-play'></i> Bắt đầu";
        pomoRemaining = pomoDuration;
        updatePomoDisplay();
    });

    // 4. Study Plan Generator Logic
    let currentPlanData = null;

    function parseTopics(rawText) {
        if (!rawText) return [];
        // Split by lines or commas
        let items = rawText.split(/\r?\n|,|;/).map(t => t.trim()).filter(t => t.length > 0);
        // Clean leading numbers like "1.", "Chương 1:", etc.
        return items.map(it => it.replace(/^[\d\.\-\*•]+\s*/, '').trim()).filter(it => it.length > 0);
    }

    document.getElementById('plannerForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const subject = document.getElementById('subjectName').value.trim();
        const days = parseInt(document.getElementById('daysLeft').value, 10) || 7;
        const topicsRaw = document.getElementById('topics').value.trim();
        const goal = document.getElementById('goal').value;

        const generateBtn = document.getElementById('generateBtn');
        const resultBox = document.getElementById('resultBox');
        const planContainer = document.getElementById('planContainer');

        let topics = parseTopics(topicsRaw);
        if (topics.length === 0) {
            topics = ['Kiến thức trọng tâm phần 1', 'Kiến thức trọng tâm phần 2', 'Bài tập thực hành'];
        }

        generateBtn.disabled = true;
        generateBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> AI Đang phân tích và chia nhỏ lộ trình...";

        setTimeout(() => {
            currentPlanData = generateStructuredPlan(subject, days, topics, goal);
            renderPlan(currentPlanData);

            resultBox.style.display = 'block';
            resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });

            generateBtn.disabled = false;
            generateBtn.innerHTML = "<i class='bx bx-brain'></i> AI Phân Bổ Lộ Trình Ôn Thi";
        }, 600);
    });

    function generateStructuredPlan(subject, days, topics, goal) {
        const plan = [];
        const numTopics = topics.length;

        if (days === 1) {
            plan.push({
                dayNumber: 1,
                title: `Ngày cấp tốc: Tổng ôn toàn diện ${subject}`,
                badge: 'NƯỚC RÚT 24H',
                badgeColor: '#ef4444',
                sessions: [
                    `Phiên 1 (Sáng - 25p): Hệ thống hóa lý thuyết cốt lõi của: ${topics.slice(0, 2).join(', ')}.`,
                    `Phiên 2 (Sáng - 25p): Đọc hiểu các định lý và dạng câu hỏi then chốt của: ${topics.slice(2).join(', ') || topics[0]}.`,
                    `Phiên 3 (Chiều - 25p): Giải trực tiếp đề cương mẫu các năm trước.`,
                    `Phiên 4 (Chiều - 25p): Ghi chép các công thức hay nhầm lẫn ra tờ tóm tắt A4.`,
                    `Phiên 5 (Tối - 25p): Ôn tập Spaced Repetition các lỗi sai vừa làm và nghỉ ngơi sớm trước 23h.`
                ]
            });
            return { subject, days, goal, daysList: plan };
        }

        const teachingDays = Math.max(1, days - 2); // Reserve 2 days for review and mock testing if days >= 3
        const topicsPerDay = Math.ceil(numTopics / teachingDays);

        let topicIndex = 0;
        for (let d = 1; d <= teachingDays; d++) {
            const dayTopics = [];
            for (let k = 0; k < topicsPerDay && topicIndex < numTopics; k++) {
                dayTopics.push(topics[topicIndex]);
                topicIndex++;
            }

            const topicLabel = dayTopics.length > 0 ? dayTopics.join(' & ') : topics[topicIndex % numTopics];

            plan.push({
                dayNumber: d,
                title: `Ngày ${d}: Nạp kiến thức & Giải bài tập trọng tâm`,
                badge: `PHẦN ${d}`,
                badgeColor: '#3b82f6',
                sessions: [
                    `Phiên 1 (Sáng): Đọc slide / giáo trình và ghi chú sơ đồ tư duy cho: ${topicLabel}.`,
                    `Phiên 2 (Sáng): Nắm vững các công thức, định lý và ví dụ mẫu của ${topicLabel}.`,
                    `Phiên 3 (Chiều): Giải 5-10 bài tập rèn luyện trong sách bài tập hoặc đề cương.`,
                    `Phiên 4 (Tối): Ôn lại ngắt quãng 15 phút các kiến thức của các ngày trước đó.`
                ]
            });
        }

        // Day D-1: Mock Exam & Remediation
        if (days >= 3) {
            plan.push({
                dayNumber: days - 1,
                title: `Ngày ${days - 1}: Luyện giải đề thi thử & Khắc phục điểm yếu`,
                badge: 'THI THỬ SÁT THỰC',
                badgeColor: '#f59e0b',
                sessions: [
                    `Phiên 1 (Sáng): Bấm giờ làm 01 đề thi thử trọn vẹn trong điều kiện phòng thi thật (không xem tài liệu).`,
                    `Phiên 2 (Sáng): So sánh đáp án, chấm điểm và đánh dấu tất cả các câu sai.`,
                    `Phiên 3 (Chiều): Đọc lại lý thuyết của những phần làm sai để sửa chữa triệt để lỗ hổng.`,
                    `Phiên 4 (Tối): Luyện thêm 3 bài tập tương tự của các dạng đề bạn còn lúng túng.`
                ]
            });
        }

        // Final Day: Spaced Repetition & Mental Preparation
        plan.push({
            dayNumber: days,
            title: `Ngày ${days} (Ngày cuối): Tổng ôn Spaced Repetition & Sẵn sàng đi thi`,
            badge: 'TỔNG ÔN & VỀ ĐÍCH',
            badgeColor: '#10b981',
            sessions: [
                `Phiên 1 (Sáng): Ôn lại toàn bộ tờ tổng hợp công thức A4 và Flashcard đã chuẩn bị.`,
                `Phiên 2 (Chiều): Xem lại các bài tập đã đánh dấu sao / làm sai ở các ngày trước.`,
                `Phiên 3 (Tối): Dừng ôn tập trước 21h, chuẩn bị thẻ sinh viên, máy tính bỏ túi, bút thước và ngủ đủ 8 tiếng!`
            ]
        });

        return { subject, days, goal, daysList: plan };
    }

    function renderPlan(planData) {
        const planContainer = document.getElementById('planContainer');
        planContainer.innerHTML = '';

        const storageKey = `student_plan_progress_${planData.subject}`;
        let savedChecked = {};
        try {
            savedChecked = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (e) {
            savedChecked = {};
        }

        let totalSessions = 0;
        let checkedSessions = 0;

        planData.daysList.forEach(day => {
            const card = document.createElement('div');
            card.className = 'day-plan-card';
            card.id = `dayCard_${day.dayNumber}`;

            let dayCheckedCount = 0;
            const daySessionsHtml = day.sessions.map((sess, sIdx) => {
                totalSessions++;
                const sessKey = `d${day.dayNumber}_s${sIdx}`;
                const isChecked = !!savedChecked[sessKey];
                if (isChecked) {
                    checkedSessions++;
                    dayCheckedCount++;
                }

                return `
                    <div class="session-item ${isChecked ? 'checked' : ''}" id="sessRow_${sessKey}">
                        <input type="checkbox" class="session-checkbox" data-key="${sessKey}" ${isChecked ? 'checked' : ''}>
                        <span><strong>Pomodoro ${sIdx + 1}:</strong> ${sess}</span>
                    </div>
                `;
            }).join('');

            if (dayCheckedCount === day.sessions.length) {
                card.classList.add('completed');
            }

            card.innerHTML = `
                <div class="day-header">
                    <div class="day-title">
                        <i class='bx bx-calendar' style="color: #004bb5;"></i>
                        <span>${day.title}</span>
                    </div>
                    <span class="day-badge" style="background: ${day.badgeColor}18; color: ${day.badgeColor}; border: 1px solid ${day.badgeColor}40;">
                        ${day.badge}
                    </span>
                </div>
                <div>${daySessionsHtml}</div>
            `;

            planContainer.appendChild(card);
        });

        updateProgressStats(checkedSessions, totalSessions);

        // Attach Checkbox Handlers
        const checkboxes = planContainer.querySelectorAll('.session-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                const key = cb.getAttribute('data-key');
                const row = document.getElementById(`sessRow_${key}`);
                if (cb.checked) {
                    row.classList.add('checked');
                    savedChecked[key] = true;
                } else {
                    row.classList.remove('checked');
                    delete savedChecked[key];
                }

                localStorage.setItem(storageKey, JSON.stringify(savedChecked));

                // Recalculate stats
                const total = planContainer.querySelectorAll('.session-checkbox').length;
                const done = planContainer.querySelectorAll('.session-checkbox:checked').length;
                updateProgressStats(done, total);

                // Update Day Card completed state
                planData.daysList.forEach(day => {
                    const dayCard = document.getElementById(`dayCard_${day.dayNumber}`);
                    const dayCbs = dayCard.querySelectorAll('.session-checkbox');
                    const dayDones = dayCard.querySelectorAll('.session-checkbox:checked');
                    if (dayCbs.length > 0 && dayCbs.length === dayDones.length) {
                        dayCard.classList.add('completed');
                    } else {
                        dayCard.classList.remove('completed');
                    }
                });
            });
        });
    }

    function updateProgressStats(done, total) {
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const progressText = document.getElementById('progressText');
        const streakBadge = document.getElementById('streakBadge');

        progressText.textContent = `${done} / ${total} phiên Pomodoro (${pct}%)`;

        if (pct === 100) {
            streakBadge.className = 'badge badge-success';
            streakBadge.innerHTML = `<i class='bx bxs-party'></i> Xuất sắc! Sẵn sàng 10 điểm`;
        } else if (pct >= 50) {
            streakBadge.className = 'badge badge-primary';
            streakBadge.innerHTML = `<i class='bx bxs-hot'></i> Đang giữ vững phong độ (${pct}%)`;
        } else if (pct > 0) {
            streakBadge.className = 'badge badge-warning';
            streakBadge.innerHTML = `<i class='bx bx-run'></i> Đã bắt đầu (${pct}%)`;
        } else {
            streakBadge.className = 'badge badge-primary';
            streakBadge.innerHTML = `<i class='bx bxs-flame'></i> Sẵn sàng xuất phát`;
        }
    }

    // 5. Plan Actions: Copy, Download, Reset
    document.getElementById('btnCopyPlan').addEventListener('click', () => {
        if (!currentPlanData) return;
        let text = `LỘ TRÌNH ÔN THI: ${currentPlanData.subject.toUpperCase()}\n`;
        text += `Mục tiêu: ${currentPlanData.goal} trong ${currentPlanData.days} ngày\n\n`;

        currentPlanData.daysList.forEach(d => {
            text += `[${d.title}]\n`;
            d.sessions.forEach(s => {
                text += `  - ${s}\n`;
            });
            text += `\n`;
        });

        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('btnCopyPlan');
            const prev = btn.innerHTML;
            btn.innerHTML = `<i class='bx bx-check'></i> Đã sao chép!`;
            setTimeout(() => { btn.innerHTML = prev; }, 2000);
        });
    });

    document.getElementById('btnDownloadPlan').addEventListener('click', () => {
        if (!currentPlanData) return;
        let text = `=========================================\n`;
        text += `   LỘ TRÌNH ÔN THI MÔN: ${currentPlanData.subject.toUpperCase()}\n`;
        text += `   Mục tiêu: ${currentPlanData.goal} | Thời gian: ${currentPlanData.days} ngày\n`;
        text += `=========================================\n\n`;

        currentPlanData.daysList.forEach(d => {
            text += `-----------------------------------------\n`;
            text += `${d.title} [${d.badge}]\n`;
            text += `-----------------------------------------\n`;
            d.sessions.forEach(s => {
                text += ` [ ] ${s}\n`;
            });
            text += `\n`;
        });

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lich_On_Thi_${currentPlanData.subject.replace(/\s+/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('btnResetProgress').addEventListener('click', () => {
        if (!currentPlanData) return;
        if (confirm('Bạn có chắc muốn đặt lại toàn bộ dấu tích của môn học này?')) {
            localStorage.removeItem(`student_plan_progress_${currentPlanData.subject}`);
            renderPlan(currentPlanData);
        }
    });
});
