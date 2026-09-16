// Subject GPA Calculator Logic

const DEFAULT_COMPONENTS = [
    { name: 'Điểm chuyên cần / Thái độ', weight: 10, score: 0 },
    { name: 'Điểm bài tập / Thực hành', weight: 20, score: 0 },
    { name: 'Điểm kiểm tra giữa kỳ', weight: 20, score: 0 },
    { name: 'Điểm thi kết thúc học phần', weight: 50, score: 0 }
];

let components = [];

function getSubjectLetter(g10) {
    if (g10 >= 9.0) return { letter: 'A+', g4: '4.0', rank: 'Xuất sắc', pass: true };
    if (g10 >= 8.5) return { letter: 'A', g4: '4.0', rank: 'Giỏi', pass: true };
    if (g10 >= 8.0) return { letter: 'B+', g4: '3.5', rank: 'Khá giỏi', pass: true };
    if (g10 >= 7.0) return { letter: 'B', g4: '3.0', rank: 'Khá', pass: true };
    if (g10 >= 6.5) return { letter: 'C+', g4: '2.5', rank: 'Trung bình khá', pass: true };
    if (g10 >= 5.5) return { letter: 'C', g4: '2.0', rank: 'Trung bình', pass: true };
    if (g10 >= 5.0) return { letter: 'D+', g4: '1.5', rank: 'Trung bình yếu', pass: true };
    if (g10 >= 4.0) return { letter: 'D', g4: '1.0', rank: 'Trung bình yếu', pass: true };
    return { letter: 'F', g4: '0.0', rank: 'Không đạt (Kém)', pass: false };
}

function renderComponents() {
    const tbody = document.getElementById('componentRowsBody');
    tbody.innerHTML = '';

    components.forEach((c, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <input type="text" class="table-input" value="${c.name}" placeholder="Tên đầu điểm" onchange="updateCompName(${idx}, this.value)">
            </td>
            <td>
                <input type="number" class="table-input comp-weight-input" min="0" max="100" value="${c.weight}" oninput="updateCompWeight(${idx}, this.value)">
            </td>
            <td>
                <input type="number" class="table-input comp-score-input" min="0" max="10" step="0.1" value="${c.score > 0 ? c.score : ''}" placeholder="0.0" oninput="updateCompScore(${idx}, this.value)">
            </td>
            <td>
                <button type="button" class="btn-icon" onclick="removeCompRow(${idx})" title="Xóa dòng">
                    <i class='bx bx-trash'></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    calculateSubjectGrade();
}

function updateCompName(idx, val) {
    components[idx].name = val;
}

function updateCompWeight(idx, val) {
    components[idx].weight = parseFloat(val) || 0;
    calculateSubjectGrade();
}

function updateCompScore(idx, val) {
    components[idx].score = parseFloat(val) || 0;
    calculateSubjectGrade();
}

function removeCompRow(idx) {
    if (components.length <= 1) {
        alert('Cần có tối thiểu 1 thành phần điểm!');
        return;
    }
    components.splice(idx, 1);
    renderComponents();
}

function addCompRow() {
    components.push({ name: 'Thành phần điểm mới', weight: 10, score: 8.0 });
    renderComponents();
}

function calculateSubjectGrade() {
    let totalWeight = 0;
    let weightedScore = 0;

    components.forEach(c => {
        totalWeight += c.weight;
        weightedScore += (c.score * c.weight);
    });

    const weightIndicator = document.getElementById('totalWeightIndicator');
    const alertBox = document.getElementById('weightAlertBox');

    weightIndicator.textContent = `${totalWeight}%`;

    if (totalWeight !== 100) {
        weightIndicator.style.color = '#ef4444';
        alertBox.style.display = 'block';
        alertBox.textContent = `Tổng trọng số hiện tại là ${totalWeight}%. Vui lòng điều chỉnh để tổng đúng bằng 100%!`;
    } else {
        weightIndicator.style.color = '#10b981';
        alertBox.style.display = 'none';
    }

    const final10 = totalWeight > 0 ? (weightedScore / totalWeight) : 0;
    const info = getSubjectLetter(final10);

    const score10El = document.getElementById('subjectFinal10');
    score10El.textContent = final10.toFixed(2);
    score10El.style.color = info.pass ? '#10b981' : '#ef4444';

    document.getElementById('subjectGrade4Badge').textContent = `Hệ 4: ${info.g4}`;
    document.getElementById('subjectLetterBadge').textContent = `Điểm chữ: ${info.letter} (${info.rank})`;

    const statusBadge = document.getElementById('subjectStatusBadge');
    const adviceNote = document.getElementById('subjectAdviceNote');

    if (info.pass) {
        statusBadge.className = 'badge badge-success';
        statusBadge.textContent = 'ĐÃ QUA MÔN';
        adviceNote.className = 'callout callout-success';
        adviceNote.innerHTML = `<strong>Chúc mừng:</strong> Bạn đã hoàn thành học phần với điểm tổng kết <strong>${final10.toFixed(2)}</strong> (Điểm chữ: <strong>${info.letter}</strong>, Hệ 4: <strong>${info.g4}</strong>). Tín chỉ môn này sẽ được tính vào điểm CPA tích lũy.`;
    } else {
        statusBadge.className = 'badge badge-danger';
        statusBadge.textContent = 'CHƯA ĐẠT (HỌC LẠI)';
        adviceNote.className = 'callout callout-danger';
        adviceNote.innerHTML = `<strong>Chưa đạt chuẩn đầu ra:</strong> Điểm tổng kết môn học của bạn dưới 4.0 (${final10.toFixed(2)} - Điểm F). Bạn cần đăng ký học lại môn này ở học kỳ tiếp theo.`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    components = JSON.parse(JSON.stringify(DEFAULT_COMPONENTS));
    renderComponents();

    document.getElementById('btnAddWeightRow').addEventListener('click', addCompRow);
    document.getElementById('btnCalcSubject').addEventListener('click', calculateSubjectGrade);
});
