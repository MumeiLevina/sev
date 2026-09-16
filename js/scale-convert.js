// Scale 4 to 10 Converter Logic

function switchScaleTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    if (tabId === '10to4') {
        document.getElementById('btn-tab-10to4').classList.add('active');
        document.getElementById('tab-10to4').classList.add('active');
    } else {
        document.getElementById('btn-tab-4to10').classList.add('active');
        document.getElementById('tab-4to10').classList.add('active');
    }
}

function convert10to4(score10) {
    if (score10 >= 9.0) return { g4: '4.0', letter: 'A+', rank: 'Xuất sắc', desc: 'Đạt điểm số tối ưu cao nhất trong học phần.' };
    if (score10 >= 8.5) return { g4: '4.0', letter: 'A', rank: 'Giỏi', desc: 'Nắm vững toàn diện kiến thức học phần.' };
    if (score10 >= 8.0) return { g4: '3.5', letter: 'B+', rank: 'Khá giỏi', desc: 'Hoàn thành tốt các mục tiêu học tập.' };
    if (score10 >= 7.0) return { g4: '3.0', letter: 'B', rank: 'Khá', desc: 'Nắm vững kiến thức trọng tâm học phần.' };
    if (score10 >= 6.5) return { g4: '2.5', letter: 'C+', rank: 'Trung bình khá', desc: 'Đạt yêu cầu chuẩn đầu ra ở mức khá.' };
    if (score10 >= 5.5) return { g4: '2.0', letter: 'C', rank: 'Trung bình', desc: 'Đạt chuẩn đầu ra tối thiểu của học phần.' };
    if (score10 >= 5.0) return { g4: '1.5', letter: 'D+', rank: 'Trung bình yếu', desc: 'Đạt ngưỡng qua môn nhưng nên cải thiện điểm.' };
    if (score10 >= 4.0) return { g4: '1.0', letter: 'D', rank: 'Trung bình yếu', desc: 'Mức điểm tối thiểu để được công nhận tích lũy tín chỉ.' };
    return { g4: '0.0', letter: 'F', rank: 'Kém (Trượt)', desc: 'Không đạt chuẩn học phần, bắt buộc phải đăng ký học lại.' };
}

function convert4to10(score4) {
    if (score4 >= 3.6) return { range10: '8.5 – 10.0', letter: 'A / A+', rank: 'Giỏi / Xuất sắc' };
    if (score4 >= 3.2) return { range10: '8.0 – 8.4', letter: 'B+ / A', rank: 'Giỏi' };
    if (score4 >= 2.5) return { range10: '7.0 – 7.9', letter: 'B', rank: 'Khá' };
    if (score4 >= 2.0) return { range10: '5.5 – 6.9', letter: 'C / C+', rank: 'Trung bình' };
    if (score4 >= 1.0) return { range10: '4.0 – 5.4', letter: 'D / D+', rank: 'Trung bình yếu' };
    return { range10: '< 4.0', letter: 'F', rank: 'Kém (Không đạt)' };
}

document.addEventListener('DOMContentLoaded', () => {
    const input10 = document.getElementById('inputScale10');
    const input4 = document.getElementById('inputScale4');

    function update10to4() {
        if (!input10.value.trim() || isNaN(parseFloat(input10.value))) {
            document.getElementById('resScale4').textContent = '---';
            document.getElementById('resLetter').textContent = '---';
            document.getElementById('resRank').textContent = '---';
            document.getElementById('scaleDesc10').textContent = 'Nhập điểm hệ 10 để xem quy đổi sang hệ 4 và điểm chữ.';
            return;
        }
        const val = Math.min(10, Math.max(0, parseFloat(input10.value)));
        const res = convert10to4(val);

        document.getElementById('resScale4').textContent = res.g4;
        document.getElementById('resLetter').textContent = res.letter;
        document.getElementById('resRank').textContent = res.rank;
        document.getElementById('scaleDesc10').textContent = res.desc;
    }

    function update4to10() {
        if (!input4.value.trim() || isNaN(parseFloat(input4.value))) {
            document.getElementById('res4to10Score').textContent = '---';
            document.getElementById('res4toLetter').textContent = '---';
            document.getElementById('res4toRank').textContent = '---';
            document.getElementById('scaleDesc4').textContent = 'Nhập điểm hệ 4 để xem quy đổi sang hệ 10 và điểm chữ.';
            return;
        }
        const val = Math.min(4, Math.max(0, parseFloat(input4.value)));
        const res = convert4to10(val);

        document.getElementById('res4to10Score').textContent = res.range10;
        document.getElementById('res4toLetter').textContent = res.letter;
        document.getElementById('res4toRank').textContent = res.rank;
    }

    input10.addEventListener('input', update10to4);
    input4.addEventListener('input', update4to10);

    update10to4();
    update4to10();
});
