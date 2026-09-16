// High School Graduation 2026 Exam Calculator

document.addEventListener('DOMContentLoaded', () => {
    function calculateGraduation() {
        const mathEl = document.getElementById('examMath');
        const litEl = document.getElementById('examLit');
        const el1El = document.getElementById('examElective1');
        const el2El = document.getElementById('examElective2');
        const g10El = document.getElementById('gpaGrade10');
        const g11El = document.getElementById('gpaGrade11');
        const g12El = document.getElementById('gpaGrade12');

        const scoreEl = document.getElementById('graduationFinalScore');
        const statusEl = document.getElementById('gradStatusBadge');
        const rankEl = document.getElementById('gradRankBadge');
        const noteEl = document.getElementById('gradNoteCallout');

        if (!mathEl.value.trim() || !litEl.value.trim() || !el1El.value.trim() || !el2El.value.trim() ||
            !g10El.value.trim() || !g11El.value.trim() || !g12El.value.trim()) {
            scoreEl.textContent = '--';
            scoreEl.style.color = 'var(--text-muted)';
            statusEl.className = 'badge badge-primary';
            statusEl.textContent = 'CHỜ NHẬP ĐIỂM';
            rankEl.style.display = 'none';
            document.getElementById('examAvgDisplay').textContent = '--';
            document.getElementById('gpaAvgDisplay').textContent = '--';
            document.getElementById('bonusDisplay').textContent = '--';
            noteEl.className = 'callout callout-info';
            noteEl.innerHTML = 'Vui lòng nhập đầy đủ điểm các bài thi tốt nghiệp và điểm trung bình học bạ 3 năm để xem kết quả xét tốt nghiệp.';
            return;
        }

        const math = parseFloat(mathEl.value) || 0;
        const lit = parseFloat(litEl.value) || 0;
        const el1 = parseFloat(el1El.value) || 0;
        const el2 = parseFloat(el2El.value) || 0;

        const g10 = parseFloat(g10El.value) || 0;
        const g11 = parseFloat(g11El.value) || 0;
        const g12 = parseFloat(g12El.value) || 0;

        const bonusEnc = parseFloat(document.getElementById('bonusEncourage').value) || 0;
        const bonusPrio = parseFloat(document.getElementById('bonusPriority').value) || 0;

        // Check fail threshold (Điểm liệt: <= 1.0)
        const failedSubjects = [];
        if (math <= 1.0) failedSubjects.push(`Toán (${math})`);
        if (lit <= 1.0) failedSubjects.push(`Ngữ văn (${lit})`);
        if (el1 <= 1.0) failedSubjects.push(`${document.getElementById('elective1').value} (${el1})`);
        if (el2 <= 1.0) failedSubjects.push(`${document.getElementById('elective2').value} (${el2})`);

        const examAvg = (math + lit + el1 + el2) / 4;
        const gpaAvg = (g10 + g11 + g12) / 3;

        // Formula 50% Exam + 50% Transcript + Priority
        const examPart = (math + lit + el1 + el2 + bonusEnc) / 4;
        const finalGradScore = (examPart * 0.5 + gpaAvg * 0.5) + bonusPrio;

        // Update UI displays

        scoreEl.textContent = finalGradScore.toFixed(2);
        document.getElementById('examAvgDisplay').textContent = examAvg.toFixed(2);
        document.getElementById('gpaAvgDisplay').textContent = gpaAvg.toFixed(2);
        document.getElementById('bonusDisplay').textContent = `+${(bonusEnc/4 + bonusPrio).toFixed(2)}`;

        if (failedSubjects.length > 0) {
            statusEl.className = 'badge badge-danger';
            statusEl.textContent = 'TRƯỢT TỐT NGHIỆP (DÍNH ĐIỂM LIỆT)';
            rankEl.style.display = 'none';
            scoreEl.style.color = '#ef4444';
            noteEl.className = 'callout callout-danger';
            noteEl.innerHTML = `<strong>Cảnh báo điểm liệt:</strong> Bạn có môn thi ≤ 1.0 điểm gồm: <strong>${failedSubjects.join(', ')}</strong>. Theo quy chế của Bộ GD&ĐT, thí sinh dính điểm liệt ở bất kỳ bài thi nào sẽ không được xét công nhận tốt nghiệp THPT.`;
            return;
        }

        rankEl.style.display = 'inline-block';

        if (finalGradScore < 5.0) {
            statusEl.className = 'badge badge-danger';
            statusEl.textContent = 'CHƯA ĐỦ ĐIỀU KIỆN ĐỖ TỐT NGHIỆP';
            rankEl.style.display = 'none';
            scoreEl.style.color = '#ef4444';
            noteEl.className = 'callout callout-danger';
            noteEl.innerHTML = `<strong>Chưa đạt ngưỡng điểm sàn:</strong> Điểm xét tốt nghiệp của bạn là ${finalGradScore.toFixed(2)} (cần đạt tối thiểu từ 5.00 trở lên để được công nhận tốt nghiệp THPT).`;
        } else {
            statusEl.className = 'badge badge-success';
            statusEl.textContent = 'ĐỦ ĐIỀU KIỆN ĐỖ TỐT NGHIỆP THPT';
            scoreEl.style.color = '#10b981';

            // Check ranking
            const minExam = Math.min(math, lit, el1, el2);
            if (finalGradScore >= 8.0 && minExam >= 7.0 && g12 >= 8.0) {
                rankEl.className = 'badge badge-success';
                rankEl.textContent = 'XẾP LOẠI: GIỎI';
                noteEl.className = 'callout callout-success';
                noteEl.innerHTML = `<strong>Chúc mừng! Bạn tốt nghiệp loại GIỎI:</strong> Điểm xét tốt nghiệp ≥ 8.0, điểm các bài thi đều ≥ 7.0 và điểm trung bình cả năm lớp 12 ≥ 8.0.`;
            } else if (finalGradScore >= 6.5 && minExam >= 6.0 && g12 >= 6.5) {
                rankEl.className = 'badge badge-primary';
                rankEl.textContent = 'XẾP LOẠI: KHÁ';
                noteEl.className = 'callout callout-info';
                noteEl.innerHTML = `<strong>Chúc mừng! Bạn tốt nghiệp loại KHÁ:</strong> Điểm xét tốt nghiệp ≥ 6.5, điểm các bài thi đều ≥ 6.0 và điểm trung bình cả năm lớp 12 ≥ 6.5.`;
            } else {
                rankEl.className = 'badge badge-warning';
                rankEl.textContent = 'XẾP LOẠI: TRUNG BÌNH';
                noteEl.className = 'callout callout-info';
                noteEl.innerHTML = `<strong>Chúc mừng! Bạn đã đỗ tốt nghiệp THPT</strong> (Xếp loại Trung bình).`;
            }
        }
    }

    const allInputs = document.querySelectorAll('#highSchoolForm input, #highSchoolForm select');
    allInputs.forEach(el => {
        el.addEventListener('input', calculateGraduation);
        el.addEventListener('change', calculateGraduation);
    });

    document.getElementById('highSchoolForm').addEventListener('submit', (e) => {
        e.preventDefault();
        calculateGraduation();
    });

    calculateGraduation();
});
