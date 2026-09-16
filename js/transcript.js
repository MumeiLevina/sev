// High School Academic Transcript Calculator Logic

const COMBOS = {
    'A00': ['Toán học', 'Vật lý', 'Hóa học'],
    'A01': ['Toán học', 'Vật lý', 'Tiếng Anh'],
    'B00': ['Toán học', 'Hóa học', 'Sinh học'],
    'C00': ['Ngữ văn', 'Lịch sử', 'Địa lý'],
    'D01': ['Toán học', 'Ngữ văn', 'Tiếng Anh'],
    'D07': ['Toán học', 'Hóa học', 'Tiếng Anh'],
    'custom': ['Môn 1', 'Môn 2', 'Môn 3']
};

document.addEventListener('DOMContentLoaded', () => {
    const methodSelect = document.getElementById('methodSelect');
    const comboSelect = document.getElementById('comboSelect');
    const container = document.getElementById('subjectInputsContainer');

    function renderSubjectInputs() {
        const method = methodSelect.value;
        const comboKey = comboSelect.value;
        const subjects = COMBOS[comboKey] || COMBOS['A00'];

        let html = '';

        if (method === 'method12') {
            html += `<p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 12px;">Nhập điểm trung bình cả năm lớp 12 của từng môn:</p>`;
            html += `<div class="flex gap-4" style="flex-wrap: wrap;">`;
            subjects.forEach((subj, idx) => {
                html += `
                    <div class="form-group" style="flex: 1; min-width: 180px;">
                        <label class="form-label">${subj}</label>
                        <input type="number" class="form-control score-12" id="score_12_${idx}" step="0.01" min="0" max="10" value="8.0" required>
                    </div>
                `;
            });
            html += `</div>`;
        } else if (method === 'method3hk') {
            html += `<p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 12px;">Nhập điểm 3 học kỳ (HK1 lớp 11, HK2 lớp 11, HK1 lớp 12) từng môn:</p>`;
            subjects.forEach((subj, idx) => {
                html += `
                    <div style="background: rgba(15, 23, 42, 0.4); padding: 14px; border-radius: 8px; margin-bottom: 12px; border: 1px solid var(--glass-border);">
                        <strong style="color: #a5b4fc; display: block; margin-bottom: 8px;">${subj}</strong>
                        <div class="flex gap-4" style="flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 130px;">
                                <label class="form-label" style="font-size: 0.8rem;">HK1 Lớp 11</label>
                                <input type="number" class="form-control hk3-input" id="hk1_11_${idx}" step="0.01" min="0" max="10" value="8.0" required>
                            </div>
                            <div style="flex: 1; min-width: 130px;">
                                <label class="form-label" style="font-size: 0.8rem;">HK2 Lớp 11</label>
                                <input type="number" class="form-control hk3-input" id="hk2_11_${idx}" step="0.01" min="0" max="10" value="8.2" required>
                            </div>
                            <div style="flex: 1; min-width: 130px;">
                                <label class="form-label" style="font-size: 0.8rem;">HK1 Lớp 12</label>
                                <input type="number" class="form-control hk3-input" id="hk1_12_${idx}" step="0.01" min="0" max="10" value="8.5" required>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else if (method === 'method5hk') {
            html += `<p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 12px;">Nhập điểm 5 học kỳ (Cả năm lớp 10, Cả năm lớp 11, HK1 lớp 12) từng môn:</p>`;
            subjects.forEach((subj, idx) => {
                html += `
                    <div style="background: rgba(15, 23, 42, 0.4); padding: 14px; border-radius: 8px; margin-bottom: 12px; border: 1px solid var(--glass-border);">
                        <strong style="color: #a5b4fc; display: block; margin-bottom: 8px;">${subj}</strong>
                        <div class="flex gap-4" style="flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 130px;">
                                <label class="form-label" style="font-size: 0.8rem;">Cả năm Lớp 10</label>
                                <input type="number" class="form-control hk5-input" id="cn_10_${idx}" step="0.01" min="0" max="10" value="7.8" required>
                            </div>
                            <div style="flex: 1; min-width: 130px;">
                                <label class="form-label" style="font-size: 0.8rem;">Cả năm Lớp 11</label>
                                <input type="number" class="form-control hk5-input" id="cn_11_${idx}" step="0.01" min="0" max="10" value="8.0" required>
                            </div>
                            <div style="flex: 1; min-width: 130px;">
                                <label class="form-label" style="font-size: 0.8rem;">HK1 Lớp 12</label>
                                <input type="number" class="form-control hk5-input" id="hk1_12_5_${idx}" step="0.01" min="0" max="10" value="8.4" required>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        container.innerHTML = html;
        calculateTranscriptScore();
    }

    function calculateTranscriptScore() {
        const method = methodSelect.value;
        let s1 = 0, s2 = 0, s3 = 0;

        if (method === 'method12') {
            s1 = parseFloat(document.getElementById('score_12_0')?.value) || 0;
            s2 = parseFloat(document.getElementById('score_12_1')?.value) || 0;
            s3 = parseFloat(document.getElementById('score_12_2')?.value) || 0;
        } else if (method === 'method3hk') {
            const m1_1 = parseFloat(document.getElementById('hk1_11_0')?.value) || 0;
            const m1_2 = parseFloat(document.getElementById('hk2_11_0')?.value) || 0;
            const m1_3 = parseFloat(document.getElementById('hk1_12_0')?.value) || 0;
            s1 = (m1_1 + m1_2 + m1_3) / 3;

            const m2_1 = parseFloat(document.getElementById('hk1_11_1')?.value) || 0;
            const m2_2 = parseFloat(document.getElementById('hk2_11_1')?.value) || 0;
            const m2_3 = parseFloat(document.getElementById('hk1_12_1')?.value) || 0;
            s2 = (m2_1 + m2_2 + m2_3) / 3;

            const m3_1 = parseFloat(document.getElementById('hk1_11_2')?.value) || 0;
            const m3_2 = parseFloat(document.getElementById('hk2_11_2')?.value) || 0;
            const m3_3 = parseFloat(document.getElementById('hk1_12_2')?.value) || 0;
            s3 = (m3_1 + m3_2 + m3_3) / 3;
        } else if (method === 'method5hk') {
            const m1_1 = parseFloat(document.getElementById('cn_10_0')?.value) || 0;
            const m1_2 = parseFloat(document.getElementById('cn_11_0')?.value) || 0;
            const m1_3 = parseFloat(document.getElementById('hk1_12_5_0')?.value) || 0;
            s1 = (m1_1 + m1_2 + m1_3) / 3;

            const m2_1 = parseFloat(document.getElementById('cn_10_1')?.value) || 0;
            const m2_2 = parseFloat(document.getElementById('cn_11_1')?.value) || 0;
            const m2_3 = parseFloat(document.getElementById('hk1_12_5_1')?.value) || 0;
            s2 = (m2_1 + m2_2 + m2_3) / 3;

            const m3_1 = parseFloat(document.getElementById('cn_10_2')?.value) || 0;
            const m3_2 = parseFloat(document.getElementById('cn_11_2')?.value) || 0;
            const m3_3 = parseFloat(document.getElementById('hk1_12_5_2')?.value) || 0;
            s3 = (m3_1 + m3_2 + m3_3) / 3;
        }

        const rawTotal = s1 + s2 + s3;

        // Priority calculation
        const regScore = parseFloat(document.getElementById('regionSelect').value) || 0;
        const objScore = parseFloat(document.getElementById('priorityObjectSelect').value) || 0;
        const baseBonus = regScore + objScore;

        let appliedBonus = baseBonus;
        // Quy chế Bộ GD&ĐT: Nếu rawTotal >= 22.5 thì giảm trừ tuyến tính
        if (rawTotal >= 22.5) {
            appliedBonus = ((30 - rawTotal) / 7.5) * baseBonus;
            if (appliedBonus < 0) appliedBonus = 0;
        }

        const finalScore = Math.min(30, rawTotal + appliedBonus);

        document.getElementById('totalTranscriptScore').textContent = finalScore.toFixed(2);
        document.getElementById('rawScore3M').textContent = `${rawTotal.toFixed(2)} (${s1.toFixed(2)} + ${s2.toFixed(2)} + ${s3.toFixed(2)})`;
        document.getElementById('appliedBonusScore').textContent = `+${appliedBonus.toFixed(2)} (Gốc: ${baseBonus.toFixed(2)})`;

        // Evaluation
        const evalEl = document.getElementById('transcriptEvaluation');
        if (finalScore >= 27.0) {
            evalEl.className = 'callout callout-success';
            evalEl.innerHTML = `<strong>Khả năng trúng tuyển: Rất Cao (Top 1)</strong><br>Mức điểm này có cơ hội cạnh tranh vào hầu hết các ngành HOT của các trường Đại học hàng đầu (Bách Khoa, Kinh tế Quốc dân, Ngoại Thương, Y Dược, v.v.).`;
        } else if (finalScore >= 24.0) {
            evalEl.className = 'callout callout-info';
            evalEl.innerHTML = `<strong>Khả năng trúng tuyển: Cao (Trường Top & Tầm Trung)</strong><br>Đạt điểm chuẩn học bạ của nhiều ngành khối Kinh tế, Kỹ thuật, Sư phạm, Ngôn ngữ tại các trường công lập uy tín.`;
        } else if (finalScore >= 21.0) {
            evalEl.className = 'callout callout-warning';
            evalEl.innerHTML = `<strong>Khả năng trúng tuyển: Khá Ổn định</strong><br>Phù hợp nộp xét tuyển vào các trường đại học công lập nhóm giữa hoặc các trường tư thục chất lượng cao.`;
        } else {
            evalEl.className = 'callout callout-danger';
            evalEl.innerHTML = `<strong>Khả năng trúng tuyển: Cần cân nhắc</strong><br>Nên tham khảo điểm chuẩn các năm trước của các trường xét tuyển từ 18 - 21 điểm hoặc kết hợp thêm phương thức thi Đánh giá năng lực / Điểm thi tốt nghiệp THPT.`;
        }
    }

    methodSelect.addEventListener('change', renderSubjectInputs);
    comboSelect.addEventListener('change', renderSubjectInputs);
    document.getElementById('regionSelect').addEventListener('change', calculateTranscriptScore);
    document.getElementById('priorityObjectSelect').addEventListener('change', calculateTranscriptScore);

    container.addEventListener('input', calculateTranscriptScore);

    document.getElementById('transcriptForm').addEventListener('submit', (e) => {
        e.preventDefault();
        calculateTranscriptScore();
    });

    renderSubjectInputs();
});
