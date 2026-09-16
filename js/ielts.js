// IELTS Calculator Logic

function switchIeltsTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    
    if (tabId === 'overall') {
        document.getElementById('btn-ielts-overall').classList.add('active');
        document.getElementById('tab-ielts-overall').classList.add('active');
    } else {
        document.getElementById('btn-ielts-raw').classList.add('active');
        document.getElementById('tab-ielts-raw').classList.add('active');
    }
}

function roundIelts(avg) {
    const integerPart = Math.floor(avg);
    const decimalPart = Math.round((avg - integerPart) * 1000) / 1000;

    if (decimalPart < 0.25) {
        return integerPart;
    } else if (decimalPart < 0.75) {
        return integerPart + 0.5;
    } else {
        return integerPart + 1.0;
    }
}

function getIeltsLevelInfo(band) {
    if (band >= 8.5) return { cefr: 'CEFR C2', level: 'Expert User', desc: 'Có khả năng sử dụng tiếng Anh hoàn toàn lưu loát, chuẩn xác và tinh tế như người bản xứ.' };
    if (band >= 7.5) return { cefr: 'CEFR C1', level: 'Very Good User', desc: 'Nắm vững ngôn ngữ chuyên sâu, đáp ứng xuất sắc mọi yêu cầu học thuật và làm việc quốc tế.' };
    if (band >= 6.5) return { cefr: 'CEFR B2 - C1', level: 'Good User', desc: 'Sử dụng ngôn ngữ hiệu quả, đủ điều kiện du học đại học và thạc sĩ tại các nước nói tiếng Anh.' };
    if (band >= 5.5) return { cefr: 'CEFR B2', level: 'Competent User', desc: 'Đạt chuẩn đầu ra của đa số các trường Đại học tại Việt Nam, giao tiếp và học tập ổn định.' };
    if (band >= 4.5) return { cefr: 'CEFR B1', level: 'Modest User', desc: 'Sử dụng được ngôn ngữ trong các ngữ cảnh quen thuộc hàng ngày.' };
    return { cefr: 'CEFR A2', level: 'Limited User', desc: 'Cần trau dồi thêm từ vựng và ngữ pháp nền tảng.' };
}

// Raw to Band conversions
function getListeningBand(raw) {
    if (raw >= 39) return { band: 9.0, range: '39 - 40 câu' };
    if (raw >= 37) return { band: 8.5, range: '37 - 38 câu' };
    if (raw >= 35) return { band: 8.0, range: '35 - 36 câu' };
    if (raw >= 32) return { band: 7.5, range: '32 - 34 câu' };
    if (raw >= 30) return { band: 7.0, range: '30 - 31 câu' };
    if (raw >= 26) return { band: 6.5, range: '26 - 29 câu' };
    if (raw >= 23) return { band: 6.0, range: '23 - 25 câu' };
    if (raw >= 18) return { band: 5.5, range: '18 - 22 câu' };
    if (raw >= 16) return { band: 5.0, range: '16 - 17 câu' };
    if (raw >= 13) return { band: 4.5, range: '13 - 15 câu' };
    if (raw >= 10) return { band: 4.0, range: '10 - 12 câu' };
    if (raw >= 6) return { band: 3.5, range: '6 - 9 câu' };
    return { band: 3.0, range: 'Dưới 6 câu' };
}

function getReadingAcadBand(raw) {
    if (raw >= 39) return { band: 9.0, range: '39 - 40 câu' };
    if (raw >= 37) return { band: 8.5, range: '37 - 38 câu' };
    if (raw >= 35) return { band: 8.0, range: '35 - 36 câu' };
    if (raw >= 33) return { band: 7.5, range: '33 - 34 câu' };
    if (raw >= 30) return { band: 7.0, range: '30 - 32 câu' };
    if (raw >= 27) return { band: 6.5, range: '27 - 29 câu' };
    if (raw >= 23) return { band: 6.0, range: '23 - 26 câu' };
    if (raw >= 19) return { band: 5.5, range: '19 - 22 câu' };
    if (raw >= 15) return { band: 5.0, range: '15 - 18 câu' };
    if (raw >= 13) return { band: 4.5, range: '13 - 14 câu' };
    if (raw >= 10) return { band: 4.0, range: '10 - 12 câu' };
    return { band: 3.5, range: 'Dưới 10 câu' };
}

function getReadingGenBand(raw) {
    if (raw >= 40) return { band: 9.0, range: '40 câu' };
    if (raw >= 39) return { band: 8.5, range: '39 câu' };
    if (raw >= 37) return { band: 8.0, range: '37 - 38 câu' };
    if (raw >= 36) return { band: 7.5, range: '36 câu' };
    if (raw >= 34) return { band: 7.0, range: '34 - 35 câu' };
    if (raw >= 32) return { band: 6.5, range: '32 - 33 câu' };
    if (raw >= 30) return { band: 6.0, range: '30 - 31 câu' };
    if (raw >= 27) return { band: 5.5, range: '27 - 29 câu' };
    if (raw >= 23) return { band: 5.0, range: '23 - 26 câu' };
    if (raw >= 19) return { band: 4.5, range: '19 - 22 câu' };
    if (raw >= 15) return { band: 4.0, range: '15 - 18 câu' };
    return { band: 3.5, range: 'Dưới 15 câu' };
}

document.addEventListener('DOMContentLoaded', () => {
    // Populate Band Options (0.0 - 9.0)
    const skills = ['ieltsListening', 'ieltsReading', 'ieltsWriting', 'ieltsSpeaking'];

    skills.forEach(id => {
        const select = document.getElementById(id);
        const placeholderOpt = document.createElement('option');
        placeholderOpt.value = '';
        placeholderOpt.textContent = '-- Chọn Band --';
        placeholderOpt.selected = true;
        select.appendChild(placeholderOpt);
        for (let b = 9.0; b >= 1.0; b -= 0.5) {
            const opt = document.createElement('option');
            const valStr = b.toFixed(1);
            opt.value = valStr;
            opt.textContent = valStr;
            select.appendChild(opt);
        }
    });

    function calculateOverall() {
        const l = parseFloat(document.getElementById('ieltsListening').value);
        const r = parseFloat(document.getElementById('ieltsReading').value);
        const w = parseFloat(document.getElementById('ieltsWriting').value);
        const s = parseFloat(document.getElementById('ieltsSpeaking').value);

        if (isNaN(l) || isNaN(r) || isNaN(w) || isNaN(s)) {
            document.getElementById('ieltsOverall').textContent = '---';
            document.getElementById('ieltsAverageText').textContent = 'Vui lòng chọn đủ 4 kỹ năng';
            document.getElementById('cefrBadge').textContent = '---';
            document.getElementById('ieltsLevelBadge').textContent = '---';
            document.getElementById('ieltsDescription').textContent = 'Chọn band điểm cho từng kỹ năng ở trên để xem đánh giá tổng quan.';
            return;
        }

        const avg = (l + r + w + s) / 4;
        const overall = roundIelts(avg);
        const info = getIeltsLevelInfo(overall);

        document.getElementById('ieltsOverall').textContent = overall.toFixed(1);
        document.getElementById('ieltsAverageText').textContent = `Điểm trung bình cộng: ${avg.toFixed(3)}`;
        document.getElementById('cefrBadge').textContent = `Tương đương ${info.cefr}`;
        document.getElementById('ieltsLevelBadge').textContent = info.level;
        document.getElementById('ieltsDescription').textContent = info.desc;
    }

    skills.forEach(id => {
        document.getElementById(id).addEventListener('change', calculateOverall);
    });

    document.getElementById('ieltsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        calculateOverall();
    });

    // Tab 2 Raw Convert
    const rawInput = document.getElementById('ieltsRawInput');
    const skillType = document.getElementById('rawSkillType');

    function updateRawScore() {
        if (!rawInput.value.trim() || isNaN(parseInt(rawInput.value, 10))) {
            document.getElementById('rawBandScore').textContent = '---';
            document.getElementById('rawBandDetail').textContent = 'Vui lòng nhập số câu đúng (0 - 40)';
            return;
        }
        const val = Math.min(40, Math.max(0, parseInt(rawInput.value, 10) || 0));
        const type = skillType.value;
        let res;

        if (type === 'listening') {
            res = getListeningBand(val);
        } else if (type === 'reading-acad') {
            res = getReadingAcadBand(val);
        } else {
            res = getReadingGenBand(val);
        }

        document.getElementById('rawBandScore').textContent = res.band.toFixed(1);
        document.getElementById('rawBandDetail').textContent = `Đạt khoảng ${res.range} (${val} / 40 câu)`;
    }

    rawInput.addEventListener('input', updateRawScore);
    skillType.addEventListener('change', updateRawScore);

    calculateOverall();
    updateRawScore();
});
