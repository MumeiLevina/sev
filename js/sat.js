// SAT Score Calculator Script

function switchSatTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    
    if (tabId === 'score-calc') {
        document.getElementById('btn-score-calc').classList.add('active');
        document.getElementById('tab-score-calc').classList.add('active');
    } else {
        document.getElementById('btn-raw-convert').classList.add('active');
        document.getElementById('tab-raw-convert').classList.add('active');
    }
}

// Percentile table approximation from College Board
function getSatPercentile(total) {
    if (total >= 1550) return { p: 99, tier: 'Top 1% Xuất sắc (Ivy League / Top Global)', badge: 'badge-success', advice: 'Điểm số mơ ước! Bạn đủ điều kiện nộp đơn vào các trường Top thế giới và được ưu tiên tuyển thẳng hầu hết các trường ĐH tại VN.' };
    if (total >= 1500) return { p: 98, tier: 'Top 2% Rất xuất sắc (Top 20-30 ĐH Mỹ)', badge: 'badge-success', advice: 'Mức điểm lý tưởng để nộp tuyển thẳng vào NEU, FTU, Bách Khoa và xin học bổng du học Mỹ/Úc/Canada giá trị cao.' };
    if (total >= 1400) return { p: 93, tier: 'Top 7% Cực kỳ cạnh tranh', badge: 'badge-success', advice: 'Điểm rất tốt! Đạt ngưỡng yêu cầu SAT của các trường ĐH hàng đầu Việt Nam (thường yêu cầu từ 1200 - 1300 trở lên).' };
    if (total >= 1300) return { p: 86, tier: 'Top 14% Rất tốt', badge: 'badge-primary', advice: 'Vượt trội so với mặt bằng chung. Thích hợp để xét tuyển sớm các trường ĐH lớn và trường quốc tế.' };
    if (total >= 1200) return { p: 74, tier: 'Top 26% Khá giỏi', badge: 'badge-primary', advice: 'Đạt chuẩn sàn tuyển sinh bằng điểm SAT của phần lớn các trường Đại học tại Việt Nam.' };
    if (total >= 1100) return { p: 60, tier: 'Top 40% Trên trung bình', badge: 'badge-warning', advice: 'Điểm số ổn, có thể cải thiện thêm phần Math (Toán) để tăng 100-150 điểm nhanh chóng.' };
    if (total >= 1000) return { p: 45, tier: 'Mức trung bình toàn cầu', badge: 'badge-warning', advice: 'Cần ôn luyện thêm từ vựng Reading và các dạng toán đại số Module 2.' };
    return { p: 25, tier: 'Dưới mức trung bình', badge: 'badge-danger', advice: 'Nên lập kế hoạch ôn tập lại các kiến thức nền tảng Reading, Writing và Math.' };
}

// Raw to Scaled (Module 1 + Module 2 curve approx)
function rawToScaledRw(raw) {
    // raw max 54
    if (raw <= 0) return 200;
    if (raw >= 54) return 800;
    const scaled = Math.round(200 + (raw / 54) * 600);
    return Math.round(scaled / 10) * 10;
}

function rawToScaledMath(raw) {
    // raw max 44
    if (raw <= 0) return 200;
    if (raw >= 44) return 800;
    const scaled = Math.round(200 + (raw / 44) * 600);
    return Math.round(scaled / 10) * 10;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const rwInput = document.getElementById('rwScore');
    const mathInput = document.getElementById('mathScore');
    const rwDisplay = document.getElementById('rwScoreDisplay');
    const mathDisplay = document.getElementById('mathScoreDisplay');

    function updateScoreCalc() {
        const rw = parseInt(rwInput.value, 10);
        const math = parseInt(mathInput.value, 10);
        rwDisplay.textContent = rw;
        mathDisplay.textContent = math;

        const total = rw + math;
        const totalEl = document.getElementById('satTotalScore');
        const percentileEl = document.getElementById('satPercentileBadge');
        const compEl = document.getElementById('satCompetitiveness');
        const adviceEl = document.getElementById('satAdvice');

        totalEl.textContent = total;
        const info = getSatPercentile(total);
        percentileEl.textContent = `Top ${100 - info.p}% thí sinh (${info.p}th Percentile)`;
        compEl.textContent = info.tier;
        compEl.className = `badge ${info.badge}`;
        adviceEl.textContent = info.advice;
    }

    rwInput.addEventListener('input', updateScoreCalc);
    mathInput.addEventListener('input', updateScoreCalc);

    document.getElementById('satScoreForm').addEventListener('submit', (e) => {
        e.preventDefault();
        updateScoreCalc();
    });

    // Tab 2 Raw Form
    document.getElementById('satRawForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const rwRaw = Math.min(54, Math.max(0, parseInt(document.getElementById('rwRaw').value, 10) || 0));
        const mathRaw = Math.min(44, Math.max(0, parseInt(document.getElementById('mathRaw').value, 10) || 0));

        const rwScaled = rawToScaledRw(rwRaw);
        const mathScaled = rawToScaledMath(mathRaw);
        const total = rwScaled + mathScaled;

        document.getElementById('estRwScore').textContent = rwScaled;
        document.getElementById('estMathScore').textContent = mathScaled;
        document.getElementById('rawEstimatedTotal').textContent = total;
        document.getElementById('satRawResult').classList.add('active');
    });

    updateScoreCalc();
});
