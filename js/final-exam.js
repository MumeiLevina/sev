// Final Exam Required Score Calculator

function getGradeLetter(g10) {
    if (g10 >= 8.5) return { letter: 'A', g4: '4.0' };
    if (g10 >= 8.0) return { letter: 'B+', g4: '3.5' };
    if (g10 >= 7.0) return { letter: 'B', g4: '3.0' };
    if (g10 >= 6.5) return { letter: 'C+', g4: '2.5' };
    if (g10 >= 5.5) return { letter: 'C', g4: '2.0' };
    if (g10 >= 5.0) return { letter: 'D+', g4: '1.5' };
    if (g10 >= 4.0) return { letter: 'D', g4: '1.0' };
    return { letter: 'F', g4: '0.0' };
}

document.addEventListener('DOMContentLoaded', () => {
    const targetSelect = document.getElementById('targetGrade');
    const customGroup = document.getElementById('customTargetGroup');
    const customScoreInput = document.getElementById('customTargetScore');
    
    const attWeight = document.getElementById('attendanceWeight');
    const hwWeight = document.getElementById('homeworkWeight');
    const midWeight = document.getElementById('midtermWeight');
    const finalWeightDisplay = document.getElementById('finalWeightDisplay');

    function updateFinalWeight() {
        const w1 = parseFloat(attWeight.value) || 0;
        const w2 = parseFloat(hwWeight.value) || 0;
        const w3 = parseFloat(midWeight.value) || 0;
        const remaining = 100 - (w1 + w2 + w3);
        finalWeightDisplay.textContent = remaining + '%';
        if (remaining <= 0) {
            finalWeightDisplay.style.color = '#ef4444';
        } else {
            finalWeightDisplay.style.color = '#a5b4fc';
        }
    }

    [attWeight, hwWeight, midWeight].forEach(el => {
        el.addEventListener('input', updateFinalWeight);
    });

    targetSelect.addEventListener('change', () => {
        if (targetSelect.value === 'custom') {
            customGroup.style.display = 'block';
        } else {
            customGroup.style.display = 'none';
        }
    });

    document.getElementById('finalExamForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const w1 = parseFloat(attWeight.value) || 0;
        const w2 = parseFloat(hwWeight.value) || 0;
        const w3 = parseFloat(midWeight.value) || 0;
        const finalWeight = 100 - (w1 + w2 + w3);

        if (finalWeight <= 0) {
            alert('Tổng trọng số các điểm quá trình đã vượt quá hoặc bằng 100%. Vui lòng kiểm tra lại!');
            return;
        }

        const s1 = parseFloat(document.getElementById('attendanceScore').value) || 0;
        const s2 = parseFloat(document.getElementById('homeworkScore').value) || 0;
        const s3 = parseFloat(document.getElementById('midtermScore').value) || 0;

        let target = 4.0;
        if (targetSelect.value === 'custom') {
            target = parseFloat(customScoreInput.value);
            if (isNaN(target) || target < 0 || target > 10) {
                alert('Vui lòng nhập điểm mục tiêu hợp lệ từ 0 đến 10');
                return;
            }
        } else {
            target = parseFloat(targetSelect.value);
        }

        // Process score earned so far
        const processScore = (s1 * w1 + s2 * w2 + s3 * w3) / 100;
        // Target = processScore + finalScore * (finalWeight / 100)
        // finalScore = (Target - processScore) / (finalWeight / 100)
        const requiredFinal = (target - processScore) / (finalWeight / 100);

        const resultBox = document.getElementById('finalResultBox');
        const scoreDisplay = document.getElementById('requiredFinalScore');
        const feasibility = document.getElementById('feasibilityNote');

        resultBox.classList.add('active');

        if (requiredFinal <= 0) {
            scoreDisplay.textContent = '0.0 điểm';
            scoreDisplay.style.color = '#10b981';
            feasibility.innerHTML = `<span class="badge badge-success">Đã chắc chắn đạt mục tiêu</span><br><br>Điểm quá trình của bạn (${processScore.toFixed(2)}) đã đủ để đạt điểm mục tiêu ngay cả khi làm bài cuối kỳ 0 điểm (Lưu ý: Không để bị điểm liệt theo quy chế trường).`;
        } else if (requiredFinal > 10) {
            scoreDisplay.textContent = `${requiredFinal.toFixed(1)} / 10`;
            scoreDisplay.style.color = '#ef4444';
            feasibility.innerHTML = `<span class="badge badge-danger">Bất khả thi</span><br><br>Rất tiếc! Dù thi cuối kỳ được tối đa 10 điểm, điểm tổng kết cao nhất bạn có thể đạt là ${(processScore + 10 * (finalWeight / 100)).toFixed(2)}. Bạn nên hạ mục tiêu xuống mức thấp hơn một chút.`;
        } else {
            scoreDisplay.textContent = `${requiredFinal.toFixed(2)} điểm`;
            scoreDisplay.style.color = requiredFinal <= 6.5 ? '#10b981' : (requiredFinal <= 8.2 ? '#f59e0b' : '#ef4444');

            let badgeClass = 'badge-success';
            let msg = 'Mục tiêu rất khả quan!';
            if (requiredFinal > 8.0) {
                badgeClass = 'badge-danger';
                msg = 'Thử thách lớn! Bạn cần ôn thi cực kỳ tập trung để đạt điểm cao.';
            } else if (requiredFinal > 6.0) {
                badgeClass = 'badge-warning';
                msg = 'Mục tiêu hoàn toàn trong tầm tay nếu bạn có sự chuẩn bị chu đáo.';
            }

            feasibility.innerHTML = `<span class="badge ${badgeClass}">${msg}</span>`;
        }

        // Build scenario table
        const tbody = document.getElementById('scenarioTableBody');
        tbody.innerHTML = '';
        const testScores = [4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
        testScores.forEach(testScore => {
            const total = processScore + testScore * (finalWeight / 100);
            const conv = getGradeLetter(total);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${testScore.toFixed(1)}</strong></td>
                <td><strong style="color: #6366f1;">${total.toFixed(2)}</strong></td>
                <td><span class="badge badge-primary">${conv.letter} (Hệ 4: ${conv.g4})</span></td>
            `;
            tbody.appendChild(tr);
        });
    });

    // Check URL parameters (e.g. ?score=7.5 from hub mini-tool)
    const urlParams = new URLSearchParams(window.location.search);
    const scoreParam = urlParams.get('score');
    if (scoreParam) {
        const parsed = parseFloat(scoreParam);
        if (!isNaN(parsed)) {
            const mid = document.getElementById('midtermScore');
            if (mid) mid.value = parsed.toFixed(1);
            const form = document.getElementById('finalExamForm');
            if (form) form.dispatchEvent(new Event('submit'));
        }
    }
});

