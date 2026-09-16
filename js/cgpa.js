// Cumulative GPA / CPA Calculator Logic

const GRADE_MAP = {
    'A+': { g4: 4.0, g10: 9.5 },
    'A':  { g4: 4.0, g10: 8.7 },
    'B+': { g4: 3.5, g10: 8.2 },
    'B':  { g4: 3.0, g10: 7.4 },
    'C+': { g4: 2.5, g10: 6.7 },
    'C':  { g4: 2.0, g10: 5.9 },
    'D+': { g4: 1.5, g10: 5.2 },
    'D':  { g4: 1.0, g10: 4.5 },
    'F':  { g4: 0.0, g10: 2.0 }
};

let courses = [];

function loadStoredCourses() {
    try {
        const stored = localStorage.getItem('student_cgpa_courses');
        if (stored) {
            courses = JSON.parse(stored);
        }
    } catch (e) {
        courses = [];
    }

    if (!courses || !Array.isArray(courses)) {
        courses = [];
    }
}

function saveCourses() {
    localStorage.setItem('student_cgpa_courses', JSON.stringify(courses));
}

function renderTable() {
    const tbody = document.getElementById('courseTableBody');
    tbody.innerHTML = '';

    if (courses.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;"><i class='bx bx-info-circle'></i> Chưa có môn học nào. Nhấn <strong>"+ Thêm Môn Học"</strong> bên dưới để bắt đầu nhập điểm.</td>`;
        tbody.appendChild(tr);
        calculateCpa();
        return;
    }

    courses.forEach((c, idx) => {
        const gInfo = GRADE_MAP[c.grade] || GRADE_MAP['B'];
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color: var(--text-muted);">${idx + 1}</td>
            <td>
                <input type="text" class="table-input" value="${c.name}" placeholder="Tên môn học" onchange="updateCourseName(${idx}, this.value)">
            </td>
            <td>
                <input type="number" class="table-input" min="1" max="15" value="${c.credits}" onchange="updateCourseCredits(${idx}, this.value)">
            </td>
            <td>
                <select class="table-input" onchange="updateCourseGrade(${idx}, this.value)">
                    ${Object.keys(GRADE_MAP).map(k => `<option value="${k}" ${c.grade === k ? 'selected' : ''}>${k} (${GRADE_MAP[k].g4.toFixed(1)})</option>`).join('')}
                </select>
            </td>
            <td>
                <strong style="color: #6366f1;">${gInfo.g4.toFixed(1)}</strong>
            </td>
            <td>
                <button type="button" class="btn-icon" onclick="removeCourse(${idx})" title="Xóa môn">
                    <i class='bx bx-trash'></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    calculateCpa();
}

function updateCourseName(idx, val) {
    courses[idx].name = val;
    saveCourses();
}

function updateCourseCredits(idx, val) {
    courses[idx].credits = parseInt(val, 10) || 1;
    saveCourses();
    calculateCpa();
}

function updateCourseGrade(idx, val) {
    courses[idx].grade = val;
    saveCourses();
    renderTable();
}

function removeCourse(idx) {
    courses.splice(idx, 1);
    saveCourses();
    renderTable();
}

function addCourse() {
    courses.push({ name: `Môn học ${courses.length + 1}`, credits: 3, grade: 'B+' });
    saveCourses();
    renderTable();
}

function calculateCpa() {
    let totalCredits = 0;
    let totalQualityPoints4 = 0;
    let totalQualityPoints10 = 0;

    courses.forEach(c => {
        const cr = parseInt(c.credits, 10) || 0;
        const gInfo = GRADE_MAP[c.grade] || GRADE_MAP['F'];
        totalCredits += cr;
        totalQualityPoints4 += cr * gInfo.g4;
        totalQualityPoints10 += cr * gInfo.g10;
    });

    const cpa4 = totalCredits > 0 ? (totalQualityPoints4 / totalCredits) : 0;
    const cpa10 = totalCredits > 0 ? (totalQualityPoints10 / totalCredits) : 0;

    document.getElementById('cpa4Display').textContent = cpa4.toFixed(2);
    document.getElementById('cpa10Display').textContent = cpa10.toFixed(2);
    document.getElementById('totalCreditsDisplay').textContent = totalCredits;
    document.getElementById('totalSubjectsDisplay').textContent = `${courses.length} môn học`;

    const rankBadge = document.getElementById('rankBadge');
    if (cpa4 >= 3.6) {
        rankBadge.className = 'badge badge-success';
        rankBadge.textContent = 'XUẤT SẮC';
    } else if (cpa4 >= 3.2) {
        rankBadge.className = 'badge badge-success';
        rankBadge.textContent = 'LOẠI GIỎI';
    } else if (cpa4 >= 2.5) {
        rankBadge.className = 'badge badge-primary';
        rankBadge.textContent = 'LOẠI KHÁ';
    } else if (cpa4 >= 2.0) {
        rankBadge.className = 'badge badge-warning';
        rankBadge.textContent = 'TRUNG BÌNH';
    } else {
        rankBadge.className = 'badge badge-danger';
        rankBadge.textContent = 'YẾU / KÉM';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadStoredCourses();
    renderTable();

    document.getElementById('btnAddCourse').addEventListener('click', addCourse);

    document.getElementById('btnClearAll').addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn xóa tất cả danh sách môn học không?')) {
            courses = [];
            saveCourses();
            renderTable();
        }
    });
});
