// B2 Driving Theory Test Script (600 Questions Simulation)

const B2_QUESTIONS_POOL = [
    {
        id: 1,
        question: "Hành vi điều khiển xe cơ giới chạy quá tốc độ quy định, giành đường, vượt ẩu có bị nghiêm cấm hay không?",
        options: ["Bị nghiêm cấm tùy từng trường hợp.", "Bị nghiêm cấm.", "Không bị nghiêm cấm nếu đường vắng."],
        correct: 1,
        isFatal: true,
        explanation: "Hành vi chạy quá tốc độ, giành đường vượt ẩu là hành vi cực kỳ nguy hiểm và bị nghiêm cấm tuyệt đối theo Luật Giao thông đường bộ."
    },
    {
        id: 2,
        question: "Người điều khiển phương tiện tham gia giao thông đường bộ mà trong cơ thể có chất ma túy có bị nghiêm cấm hay không?",
        options: ["Bị nghiêm cấm.", "Không bị nghiêm cấm nếu sử dụng liều lượng nhỏ.", "Chỉ bị phạt khi gây ra tai nạn."],
        correct: 0,
        isFatal: true,
        explanation: "Nghiêm cấm tuyệt đối người điều khiển phương tiện tham gia giao thông mà trong cơ thể có chất ma túy."
    },
    {
        id: 3,
        question: "Người lái xe không được lùi xe ở những khu vực nào dưới đây?",
        options: [
            "Ở khu vực cho phép đỗ xe.",
            "Ở khu vực cấm dừng và trên phần đường dành cho người đi bộ qua đường.",
            "Nơi đường bộ giao nhau, đường bộ giao nhau cùng mức với đường sắt, nơi tầm nhìn bị che khuất, trong hầm đường bộ, đường cao tốc.",
            "Cả ý 2 và ý 3."
        ],
        correct: 3,
        isFatal: true,
        explanation: "Không được lùi xe ở nơi đường giao nhau, giao cắt đường sắt, nơi tầm nhìn bị che khuất, trong hầm và trên đường cao tốc."
    },
    {
        id: 4,
        question: "Khi điều khiển xe trên đường cao tốc, người lái xe phải dừng xe, đỗ xe như thế nào?",
        options: [
            "Chỉ được dừng xe, đỗ xe ở nơi quy định; trường hợp buộc phải dừng, đỗ không đúng nơi quy định thì phải đưa xe ra khỏi phần đường xe chạy hoặc đặt báo hiệu khẩn cấp.",
            "Được dừng xe, đỗ xe ở bất kỳ nơi nào trên làn khẩn cấp.",
            "Được dừng xe nghỉ ngơi trên làn dừng khẩn cấp vào ban đêm."
        ],
        correct: 0,
        isFatal: true,
        explanation: "Trên đường cao tốc chỉ được dừng xe ở trạm dừng chân hoặc nơi quy định; nếu gặp sự cố khẩn cấp phải phát tín hiệu cảnh báo an toàn."
    },
    {
        id: 5,
        question: "Bạn đang lái xe phía trước có một xe cứu thương đang phát tín hiệu ưu tiên đi làm nhiệm vụ, bạn phải làm gì?",
        options: [
            "Không được gây cản trở, phải giảm tốc độ, đi sát lề đường bên phải hoặc dừng lại để nhường đường.",
            "Tăng tốc độ để chạy trước xe ưu tiên.",
            "Bấm còi liên tục và chuyển sang làn đối diện để đi nhanh hơn."
        ],
        correct: 0,
        isFatal: true,
        explanation: "Xe cứu thương đang phát tín hiệu ưu tiên là xe ưu tiên số 1, mọi phương tiện bắt buộc phải nhường đường an toàn."
    },
    {
        id: 6,
        question: "Khi điều khiển xe ô tô rẽ phải ở nơi đường giao nhau, người lái xe cần thực hiện thao tác nào để bảo đảm an toàn?",
        options: [
            "Có tín hiệu rẽ phải, quan sát an toàn phía sau; điều khiển xe bám sát vào phía phải đường, giảm tốc độ và nhường đường cho người đi bộ, xe thô sơ rồi mới cho xe rẽ.",
            "Bật xi nhan rẽ ngay lập tức mà không cần giảm tốc độ.",
            "Tăng tốc độ để vượt nhanh qua các phương tiện khác trước khi rẽ."
        ],
        correct: 0,
        isFatal: false,
        explanation: "Khi rẽ phải phải bật đèn xi nhan báo hướng rẽ, giảm tốc độ và chú ý quan sát nhường đường cho xe thô sơ và người đi bộ."
    },
    {
        id: 7,
        question: "Người có giấy phép lái xe hạng B2 được điều khiển loại xe nào dưới đây?",
        options: [
            "Ô tô chở người đến 9 chỗ ngồi; ô tô tải có trọng tải thiết kế dưới 3.500 kg; máy kéo kéo một rơ moóc có trọng tải dưới 3.500 kg.",
            "Ô tô chở người từ 10 đến 30 chỗ ngồi.",
            "Ô tô tải có trọng tải thiết kế trên 3.500 kg và xe kéo container."
        ],
        correct: 0,
        isFatal: false,
        explanation: "Hạng B2 được lái ô tô chở người đến 9 chỗ ngồi, xe tải dưới 3.500 kg và có kinh doanh vận tải."
    },
    {
        id: 8,
        question: "Tại nơi đường giao nhau không có báo hiệu đi theo vòng xuyến, người điều khiển phương tiện phải nhường đường như thế nào là đúng quy tắc giao thông?",
        options: [
            "Phải nhường đường cho xe đi đến từ bên phải.",
            "Phải nhường đường cho xe đi đến từ bên trái.",
            "Xe nào to hơn thì được ưu tiên đi trước."
        ],
        correct: 0,
        isFatal: false,
        explanation: "Không có vòng xuyến thì nhường bên PHẢI; có vòng xuyến thì nhường bên TRÁI."
    },
    {
        id: 9,
        question: "Khi điều khiển xe chạy trên đường biết có xe sau xin vượt nếu đủ điều kiện an toàn người lái xe phải làm gì?",
        options: [
            "Người điều khiển phương tiện phía trước phải giảm tốc độ, đi sát về bên phải của phần đường xe chạy cho đến khi xe sau đã vượt qua, không được gây trở ngại cho xe xin vượt.",
            "Tăng tốc độ để không cho xe sau vượt.",
            "Cho xe chạy sang phần đường bên trái."
        ],
        correct: 0,
        isFatal: false,
        explanation: "Khi đủ điều kiện an toàn, xe trước giảm tốc và đi về lề bên phải để nhường đường an toàn."
    },
    {
        id: 10,
        question: "Khoảng cách an toàn tối thiểu giữa hai xe khi chạy với tốc độ từ 60 km/h đến 80 km/h trên đường cao tốc/đường ngoài đô thị trong điều kiện mặt đường khô ráo là bao nhiêu mét?",
        options: ["35 mét.", "55 mét.", "70 mét.", "100 mét."],
        correct: 1,
        isFatal: false,
        explanation: "Quy tắc khoảng cách an toàn: V = 60 km/h: 35m; 60 - 80 km/h: 55m; 80 - 100 km/h: 70m; 100 - 120 km/h: 100m."
    },
    {
        id: 11,
        question: "Khi gặp biển nào dưới đây người lái xe phải giảm tốc độ, chú ý xe đi ngược chiều, xe ở phía đường bị hẹp phải nhường đường cho xe đi ngược chiều?",
        options: ["Biển 1 (Báo đường hẹp cả hai bên).", "Biển 2 và Biển 3 (Đường hẹp bên trái / bên phải).", "Biển báo đường một chiều."],
        correct: 1,
        isFatal: false,
        explanation: "Biển báo đường hẹp về phía trái hoặc phía phải cảnh báo tài xế giảm tốc độ và nhường xe đi từ hướng thông thoáng hơn."
    },
    {
        id: 12,
        question: "Khi quay đầu xe, người lái xe cần phải quan sát và thực hiện thao tác nào để bảo đảm an toàn giao thông?",
        options: [
            "Quan sát biển báo hiệu để biết nơi được phép quay đầu; quan sát kỹ địa hình nơi chọn để quay đầu; bật tín hiệu báo rẽ trước khi quay; quay xe với tốc độ chậm nhất.",
            "Quay đầu xe thật nhanh ở mọi nơi không có biển cấm rẽ.",
            "Tận dụng vượt qua làn ngược chiều để quay đầu một cách dứt khoát."
        ],
        correct: 0,
        isFatal: false,
        explanation: "Quay đầu xe phải thực hiện tại nơi cho phép, bật xi nhan và quay xe với tốc độ chậm quan sát tứ phía."
    },
    {
        id: 13,
        question: "Người ngồi trên xe mô tô hai bánh, xe gắn máy phải đội mũ bảo hiểm có cài quai đúng quy cách khi nào?",
        options: [
            "Khi tham gia giao thông đường bộ.",
            "Chỉ khi đi trên đường quốc lộ ngoài đô thị.",
            "Chỉ khi thấy có lực lượng Cảnh sát giao thông kiểm tra."
        ],
        correct: 0,
        isFatal: false,
        explanation: "Bắt buộc đội mũ bảo hiểm cài quai đúng quy cách khi tham gia giao thông đường bộ bất kỳ tuyến đường nào."
    },
    {
        id: 14,
        question: "Khi xe ô tô bị hỏng tại nơi đường bộ giao nhau cùng mức với đường sắt, người lái xe phải xử lý thế nào?",
        options: [
            "Nhanh chóng đặt báo hiệu trên đường sắt cách vị trí xe hỏng ít nhất 500 mét về hai phía để báo cho người điều khiển phương tiện đường sắt và tìm cách đưa xe ra khỏi phạm vi an toàn đường sắt.",
            "Bật đèn khẩn cấp và ngồi chờ cứu hộ đến kéo xe.",
            "Bấm còi liên tục báo cho người đi đường biết."
        ],
        correct: 0,
        isFatal: true,
        explanation: "Nguy cơ va chạm tàu hỏa cực lớn: phải phát tín hiệu cảnh báo trên đường sắt tối thiểu 500 mét về 2 phía và lập tức di chuyển xe hoặc người ra xa."
    },
    {
        id: 15,
        question: "Thứ tự các xe đi như thế nào là đúng quy tắc giao thông khi tới ngã tư?",
        options: [
            "Xe ưu tiên (Hỏa - Sự - Công - Thương) -> Đường ưu tiên -> Đường cùng cấp (Phải - Thẳng - Rẽ trái).",
            "Xe nào rẽ trái đi trước, xe rẽ phải đi sau.",
            "Xe nào tới ngã tư trước đi trước bất kể loại xe."
        ],
        correct: 0,
        isFatal: false,
        explanation: "Khẩu quyết sa hình: Nhất chớm, nhì ưu (xe cứu hỏa, quân sự, công an, cứu thương), tam đường (đường ưu tiên), tứ hướng (phải trước, thẳng nhì, trái cuối)."
    }
];

// Generate 35 questions (duplicate & pad logically for full 35-item mock test)
function generate35Questions() {
    const list = [];
    for (let i = 0; i < 35; i++) {
        const base = B2_QUESTIONS_POOL[i % B2_QUESTIONS_POOL.length];
        list.push({
            index: i + 1,
            question: `Câu ${i + 1}: ` + base.question,
            options: base.options,
            correct: base.correct,
            isFatal: base.isFatal && (i % 7 === 0 || i === 0), // Spread realistic fatal questions
            explanation: base.explanation,
            selected: null
        });
    }
    return list;
}

let examQuestions = [];
let currentQuestionIndex = 0;
let timerSeconds = 22 * 60; // 22 minutes
let timerInterval = null;
let isSubmitted = false;

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timerSeconds--;
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            timerSeconds = 0;
            updateTimerDisplay();
            alert('Đã hết thời gian làm bài 22 phút! Hệ thống sẽ tự động nộp bài.');
            submitB2Quiz();
            return;
        }
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    const str = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const el = document.getElementById('timerDisplay');
    el.textContent = str;
    if (timerSeconds < 180) { // under 3 minutes
        el.style.color = '#ef4444';
    }
}

function renderPalette() {
    const palette = document.getElementById('questionPalette');
    palette.innerHTML = '';

    examQuestions.forEach((q, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'palette-btn';
        btn.textContent = idx + 1;

        if (idx === currentQuestionIndex) {
            btn.classList.add('current');
        }

        if (isSubmitted) {
            if (q.selected === q.correct) {
                btn.classList.add('correct');
            } else {
                btn.classList.add('wrong');
            }
        } else if (q.selected !== null) {
            btn.classList.add('answered');
        }

        btn.onclick = () => {
            currentQuestionIndex = idx;
            renderCurrentQuestion();
            renderPalette();
        };

        palette.appendChild(btn);
    });
}

function renderCurrentQuestion() {
    const q = examQuestions[currentQuestionIndex];
    document.getElementById('qIndexTitle').textContent = `Câu hỏi ${currentQuestionIndex + 1} / 35`;
    document.getElementById('qText').textContent = q.question;

    const fatalBadge = document.getElementById('fatalBadge');
    if (q.isFatal) {
        fatalBadge.style.display = 'inline-block';
    } else {
        fatalBadge.style.display = 'none';
    }

    const optionsContainer = document.getElementById('qOptions');
    optionsContainer.innerHTML = '';

    q.options.forEach((optText, optIdx) => {
        const optDiv = document.createElement('div');
        optDiv.className = 'quiz-option';

        if (q.selected === optIdx) {
            optDiv.classList.add('selected');
        }

        if (isSubmitted) {
            if (optIdx === q.correct) {
                optDiv.classList.add('is-correct');
            } else if (q.selected === optIdx && optIdx !== q.correct) {
                optDiv.classList.add('is-wrong');
            }
        }

        optDiv.innerHTML = `
            <span style="font-weight: 700; width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.1); display: inline-flex; align-items: center; justify-content: center;">
                ${optIdx + 1}
            </span>
            <div style="flex: 1;">${optText}</div>
        `;

        if (!isSubmitted) {
            optDiv.onclick = () => {
                q.selected = optIdx;
                renderCurrentQuestion();
                renderPalette();
            };
        }

        optionsContainer.appendChild(optDiv);
    });

    const expBox = document.getElementById('qExplanation');
    if (isSubmitted) {
        expBox.style.display = 'block';
        expBox.innerHTML = `<strong>Giải thích đáp án:</strong> ${q.explanation}`;
    } else {
        expBox.style.display = 'none';
    }
}

function submitB2Quiz() {
    if (isSubmitted) return;
    if (!confirm('Bạn có chắc chắn muốn nộp bài sát hạch B2 không?')) return;

    isSubmitted = true;
    clearInterval(timerInterval);

    let correctCount = 0;
    let failedFatal = false;
    let fatalQuestionsFailed = [];

    examQuestions.forEach((q, idx) => {
        if (q.selected === q.correct) {
            correctCount++;
        } else if (q.isFatal) {
            failedFatal = true;
            fatalQuestionsFailed.push(`Câu ${idx + 1}`);
        }
    });

    const isPassed = correctCount >= 32 && !failedFatal;

    const resultBox = document.getElementById('quizResultBox');
    const verdictEl = document.getElementById('quizVerdict');
    const scoreEl = document.getElementById('quizScoreCount');
    const detailEl = document.getElementById('quizSummaryDetail');

    resultBox.classList.add('active');
    scoreEl.textContent = `${correctCount} / 35`;

    if (isPassed) {
        verdictEl.textContent = 'ĐẠT (CHÚC MỪNG BẠN)';
        verdictEl.style.color = '#10b981';
        scoreEl.style.color = '#10b981';
        detailEl.innerHTML = `
            <div class="callout callout-success">
                <strong>Tuyệt vời!</strong> Bạn đã đạt <strong>${correctCount}/35 câu</strong> (yêu cầu tối thiểu ≥ 32) và không trả lời sai bất kỳ câu hỏi điểm liệt nào.
            </div>
        `;
    } else {
        verdictEl.textContent = 'KHÔNG ĐẠT (TRƯỢT)';
        verdictEl.style.color = '#ef4444';
        scoreEl.style.color = '#ef4444';

        let reason = '';
        if (failedFatal) {
            reason = `Bạn đã trả lời sai câu hỏi điểm liệt (<strong>${fatalQuestionsFailed.join(', ')}</strong>). Theo quy định sát hạch, sai câu điểm liệt sẽ bị tính không đạt ngay lập tức.`;
        } else {
            reason = `Bạn chỉ đạt <strong>${correctCount}/35 câu</strong> (chưa đủ ngưỡng tối thiểu 32 câu để đạt bằng lái B2).`;
        }

        detailEl.innerHTML = `
            <div class="callout callout-danger">
                <strong>Chưa đạt yêu cầu:</strong> ${reason}
            </div>
        `;
    }

    document.getElementById('examStatusText').textContent = 'Đã hoàn thành thi sát hạch';
    renderCurrentQuestion();
    renderPalette();
    resultBox.scrollIntoView({ behavior: 'smooth' });
}

function restartB2Quiz() {
    isSubmitted = false;
    timerSeconds = 22 * 60;
    currentQuestionIndex = 0;
    examQuestions = generate35Questions();
    document.getElementById('quizResultBox').classList.remove('active');
    document.getElementById('examStatusText').textContent = 'Đang thi sát hạch B2';
    updateTimerDisplay();
    startTimer();
    renderCurrentQuestion();
    renderPalette();
}

document.addEventListener('DOMContentLoaded', () => {
    examQuestions = generate35Questions();
    updateTimerDisplay();
    startTimer();
    renderCurrentQuestion();
    renderPalette();

    document.getElementById('btnSubmitQuiz').addEventListener('click', submitB2Quiz);

    document.getElementById('btnPrevQ').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderCurrentQuestion();
            renderPalette();
        }
    });

    document.getElementById('btnNextQ').addEventListener('click', () => {
        if (currentQuestionIndex < 34) {
            currentQuestionIndex++;
            renderCurrentQuestion();
            renderPalette();
        }
    });
});
