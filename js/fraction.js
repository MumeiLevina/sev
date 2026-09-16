// Fraction Calculator Logic

function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        let t = b;
        b = a % b;
        a = t;
    }
    return a;
}

function lcm(a, b) {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a * b) / gcd(a, b);
}

function switchFracTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    if (tabId === 'calc') {
        document.getElementById('btn-frac-calc').classList.add('active');
        document.getElementById('tab-frac-calc').classList.add('active');
    } else {
        document.getElementById('btn-frac-simplify').classList.add('active');
        document.getElementById('tab-frac-simplify').classList.add('active');
    }
}

function calculateFraction() {
    const n1 = parseInt(document.getElementById('num1').value, 10);
    const d1 = parseInt(document.getElementById('den1').value, 10);
    const op = document.getElementById('fractionOp').value;
    const n2 = parseInt(document.getElementById('num2').value, 10);
    const d2 = parseInt(document.getElementById('den2').value, 10);

    if (d1 === 0 || d2 === 0) {
        alert('Mẫu số không thể bằng 0! Vui lòng nhập mẫu số khác 0.');
        return;
    }

    if (op === '/' && n2 === 0) {
        alert('Không thể chia cho phân số có tử số bằng 0!');
        return;
    }

    let rawNum, rawDen;
    let steps = [];

    if (op === '+' || op === '-') {
        const commonDen = lcm(d1, d2);
        const m1 = commonDen / d1;
        const m2 = commonDen / d2;
        const newN1 = n1 * m1;
        const newN2 = n2 * m2;

        steps.push(`
            <div class="step-card">
                <h4>Bước 1: Quy đồng mẫu số</h4>
                <p>Tìm Bội chung nhỏ nhất (BCNN) của hai mẫu số ${d1} và ${d2} là <strong>${commonDen}</strong>.</p>
                <p>Quy đồng phân số thứ nhất: (${n1} × ${m1}) / (${d1} × ${m1}) = <strong>${newN1} / ${commonDen}</strong></p>
                <p>Quy đồng phân số thứ hai: (${n2} × ${m2}) / (${d2} × ${m2}) = <strong>${newN2} / ${commonDen}</strong></p>
            </div>
        `);

        if (op === '+') {
            rawNum = newN1 + newN2;
            steps.push(`
                <div class="step-card">
                    <h4>Bước 2: Cộng các tử số với nhau</h4>
                    <p>Giữ nguyên mẫu số chung ${commonDen}, cộng hai tử số: ${newN1} + ${newN2} = <strong>${rawNum}</strong>.</p>
                    <p>Phân số tạm thời là: <strong>${rawNum} / ${commonDen}</strong>.</p>
                </div>
            `);
        } else {
            rawNum = newN1 - newN2;
            steps.push(`
                <div class="step-card">
                    <h4>Bước 2: Trừ các tử số với nhau</h4>
                    <p>Giữ nguyên mẫu số chung ${commonDen}, trừ hai tử số: ${newN1} - ${newN2} = <strong>${rawNum}</strong>.</p>
                    <p>Phân số tạm thời là: <strong>${rawNum} / ${commonDen}</strong>.</p>
                </div>
            `);
        }
        rawDen = commonDen;
    } else if (op === '*') {
        rawNum = n1 * n2;
        rawDen = d1 * d2;
        steps.push(`
            <div class="step-card">
                <h4>Bước 1: Nhân tử với tử và mẫu với mẫu</h4>
                <p>Tử số mới = ${n1} × ${n2} = <strong>${rawNum}</strong>.</p>
                <p>Mẫu số mới = ${d1} × ${d2} = <strong>${rawDen}</strong>.</p>
                <p>Phân số thu được: <strong>${rawNum} / ${rawDen}</strong>.</p>
            </div>
        `);
    } else if (op === '/') {
        steps.push(`
            <div class="step-card">
                <h4>Bước 1: Nhân với phân số nghịch đảo</h4>
                <p>Chia cho phân số ${n2}/${d2} tương đương với nhân với phân số nghịch đảo <strong>${d2}/${n2}</strong>.</p>
                <p>Ta có: (${n1}/${d1}) × (${d2}/${n2})</p>
            </div>
        `);
        rawNum = n1 * d2;
        rawDen = d1 * n2;
        steps.push(`
            <div class="step-card">
                <h4>Bước 2: Thực hiện phép nhân phân số</h4>
                <p>Tử số = ${n1} × ${d2} = <strong>${rawNum}</strong>.</p>
                <p>Mẫu số = ${d1} × ${n2} = <strong>${rawDen}</strong>.</p>
                <p>Phân số thu được: <strong>${rawNum} / ${rawDen}</strong>.</p>
            </div>
        `);
    }

    // Simplify
    if (rawDen < 0) {
        rawNum = -rawNum;
        rawDen = -rawDen;
    }

    const g = gcd(rawNum, rawDen);
    const finalNum = rawNum / g;
    const finalDen = rawDen / g;

    if (g > 1) {
        steps.push(`
            <div class="step-card">
                <h4>Bước ${steps.length + 1}: Rút gọn về phân số tối giản</h4>
                <p>Tìm Ước chung lớn nhất (ƯCLN) của ${Math.abs(rawNum)} và ${rawDen} là <strong>${g}</strong>.</p>
                <p>Chia cả tử và mẫu cho ${g}: (${rawNum} ÷ ${g}) / (${rawDen} ÷ ${g}) = <strong>${finalNum} / ${finalDen}</strong>.</p>
            </div>
        `);
    } else {
        steps.push(`
            <div class="step-card">
                <h4>Bước ${steps.length + 1}: Kiểm tra tối giản</h4>
                <p>Phân số ${finalNum} / ${finalDen} đã ở dạng tối giản (ƯCLN = 1).</p>
            </div>
        `);
    }

    // Display
    document.getElementById('resRawNum').textContent = finalNum;
    document.getElementById('resRawDen').textContent = finalDen;

    const decimalVal = finalNum / finalDen;
    document.getElementById('resDecimal').textContent = decimalVal.toFixed(4);

    const mixedEl = document.getElementById('resMixedNumber');
    if (Math.abs(finalNum) > finalDen && finalDen !== 1) {
        const whole = Math.floor(Math.abs(finalNum) / finalDen) * (finalNum < 0 ? -1 : 1);
        const rem = Math.abs(finalNum) % finalDen;
        mixedEl.style.display = 'inline-flex';
        mixedEl.innerHTML = `${whole} <span class="fraction" style="font-size: 1.1rem; margin-left: 6px;"><span class="num">${rem}</span><span class="den">${finalDen}</span></span>`;
    } else {
        mixedEl.style.display = 'none';
    }

    document.getElementById('stepsContainer').innerHTML = steps.join('');
}

function simplifySingle() {
    let n = parseInt(document.getElementById('simpNum').value, 10);
    let d = parseInt(document.getElementById('simpDen').value, 10);

    if (d === 0) {
        alert('Mẫu số không thể bằng 0!');
        return;
    }

    if (d < 0) {
        n = -n;
        d = -d;
    }

    const g = gcd(n, d);
    const finalNum = n / g;
    const finalDen = d / g;

    document.getElementById('simpOriginalNum').textContent = n;
    document.getElementById('simpOriginalDen').textContent = d;
    document.getElementById('simpFinalNum').textContent = finalNum;
    document.getElementById('simpFinalDen').textContent = finalDen;
    document.getElementById('simpDecimal').textContent = (finalNum / finalDen).toFixed(4);

    document.getElementById('simpGcdInfo').innerHTML = `
        Ước chung lớn nhất (ƯCLN / GCD) của ${Math.abs(n)} và ${d} là <strong>${g}</strong>.<br>
        Chia cả tử và mẫu cho <strong>${g}</strong> ta được phân số tối giản là <strong>${finalNum} / ${finalDen}</strong>.
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fractionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        calculateFraction();
    });

    document.getElementById('simplifyForm').addEventListener('submit', (e) => {
        e.preventDefault();
        simplifySingle();
    });

    // Only calculate if inputs are present
    const n1 = document.getElementById('num1');
    if (n1 && n1.value.trim() !== '') {
        calculateFraction();
    }
    const simpNum = document.getElementById('simpNum');
    if (simpNum && simpNum.value.trim() !== '') {
        simplifySingle();
    }
});
