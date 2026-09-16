// Health & Fitness Hub: Data Synchronization & Calculation Engine

const HEALTH_STORAGE_KEY = 'student_health_data';

// Default state
const defaultHealthData = {
    gender: 'male',
    age: '',
    height: '', // cm
    weight: '',  // kg
    activity: 1.375, // light activity
    formula: 'mifflin',
    goal: 'maintain',
    diet: 'balanced'
};

function getHealthData() {
    try {
        const saved = localStorage.getItem(HEALTH_STORAGE_KEY);
        if (saved) {
            return { ...defaultHealthData, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.warn('Cannot read localStorage', e);
    }
    return { ...defaultHealthData };
}

function saveHealthData(data) {
    try {
        const current = getHealthData();
        const updated = { ...current, ...data };
        localStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.warn('Cannot save localStorage', e);
    }
    return data;
}

// 1. Calculate BMI
function calculateBMI(weightKg, heightCm) {
    const hMeter = heightCm / 100;
    if (hMeter <= 0) return null;
    const bmi = weightKg / (hMeter * hMeter);
    
    // Asian standard (WPRO / IDI)
    let asianStatus = '';
    let asianClass = '';
    let asianColor = '';
    let advice = '';

    if (bmi < 18.5) {
        asianStatus = 'Thiếu cân (Gầy)';
        asianClass = 'underweight';
        asianColor = '#3b82f6';
        advice = 'Bạn đang hơi gầy so với chiều cao. Hãy bổ sung thêm dinh dưỡng đa lượng, ăn thêm bữa phụ và tập luyện thể dục để tăng cân lành mạnh.';
    } else if (bmi < 23) {
        asianStatus = 'Bình thường (Lý tưởng)';
        asianClass = 'normal';
        asianColor = '#10b981';
        advice = 'Chúc mừng! Thể trạng của bạn đang ở mức rất lý tưởng và cân đối. Hãy duy trì chế độ ăn khoa học và thói quen rèn luyện thể thao hàng ngày.';
    } else if (bmi < 25) {
        asianStatus = 'Tiền béo phì (Thừa cân)';
        asianClass = 'overweight';
        asianColor = '#f59e0b';
        advice = 'Bạn đang hơi thừa cân một chút. Nên hạn chế đồ ăn nhanh, nước ngọt có ga và tăng cường vận động đốt cháy calo để tránh tăng cân thêm.';
    } else if (bmi < 30) {
        asianStatus = 'Béo phì độ 1';
        asianClass = 'obese-1';
        asianColor = '#f97316';
        advice = 'Chỉ số mỡ cơ thể đang ở mức cao. Bạn nên lập kế hoạch thâm hụt calo khoa học, giảm tinh bột nhanh và luyện tập cardio/kháng lực đều đặn.';
    } else {
        asianStatus = 'Béo phì độ 2 (Nguy hiểm)';
        asianClass = 'obese-2';
        asianColor = '#ef4444';
        advice = 'Mức béo phì có nguy cơ gây ảnh hưởng tới tim mạch và chuyển hoá. Khuyến nghị bạn tham khảo ý kiến bác sĩ hoặc chuyên gia dinh dưỡng.';
    }

    // WHO International
    let whoStatus = '';
    if (bmi < 18.5) whoStatus = 'Gầy (< 18.5)';
    else if (bmi < 25) whoStatus = 'Bình thường (18.5 – 24.9)';
    else if (bmi < 30) whoStatus = 'Thừa cân (25.0 – 29.9)';
    else if (bmi < 35) whoStatus = 'Béo phì độ 1 (30.0 – 34.9)';
    else whoStatus = 'Béo phì độ 2+ (≥ 35.0)';

    // Ideal weight bounds (BMI 18.5 to 22.9 for Asian standard)
    const idealMin = 18.5 * hMeter * hMeter;
    const idealMax = 22.9 * hMeter * hMeter;

    let diffWeight = 0;
    let diffText = '';
    if (weightKg < idealMin) {
        diffWeight = idealMin - weightKg;
        diffText = `Cần tăng tối thiểu +${diffWeight.toFixed(1)} kg để đạt chuẩn`;
    } else if (weightKg > idealMax) {
        diffWeight = weightKg - idealMax;
        diffText = `Cần giảm khoảng -${diffWeight.toFixed(1)} kg để về mức lý tưởng`;
    } else {
        diffText = 'Cân nặng hiện tại hoàn toàn nằm trong dải chuẩn';
    }

    // Gauge needle percentage (Scale from BMI 14 to 36 => 0% to 100%)
    let gaugePercent = ((bmi - 14) / (36 - 14)) * 100;
    gaugePercent = Math.max(2, Math.min(98, gaugePercent));

    return {
        bmi: parseFloat(bmi.toFixed(2)),
        asianStatus,
        asianClass,
        asianColor,
        whoStatus,
        advice,
        idealMin: parseFloat(idealMin.toFixed(1)),
        idealMax: parseFloat(idealMax.toFixed(1)),
        diffText,
        gaugePercent
    };
}

// 2. Calculate BMR
function calculateBMR(gender, weightKg, heightCm, ageYears, formula = 'mifflin') {
    let bmr = 0;
    if (formula === 'mifflin') {
        // Mifflin-St Jeor (gold standard)
        if (gender === 'male') {
            bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
        } else {
            bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
        }
    } else {
        // Harris-Benedict revised (1984)
        if (gender === 'male') {
            bmr = 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * ageYears);
        } else {
            bmr = 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * ageYears);
        }
    }
    return Math.round(bmr);
}

// 3. Calculate TDEE
function calculateTDEE(bmr, activityMultiplier) {
    return Math.round(bmr * parseFloat(activityMultiplier));
}

// 4. Calculate Calorie Target & Macros
function calculateCaloriesAndMacros(tdee, goal = 'maintain', diet = 'balanced') {
    let targetCal = tdee;
    let goalDesc = '';

    switch (goal) {
        case 'lose-slow':
            targetCal = tdee - 250;
            goalDesc = 'Giảm cân an toàn (~0.25 kg/tuần)';
            break;
        case 'lose-standard':
            targetCal = tdee - 500;
            goalDesc = 'Giảm cân chuẩn khuyến nghị (~0.5 kg/tuần)';
            break;
        case 'lose-fast':
            targetCal = tdee - 750;
            goalDesc = 'Giảm cân nhanh (~0.75 kg/tuần)';
            break;
        case 'gain-slow':
            targetCal = tdee + 250;
            goalDesc = 'Tăng cân/tăng cơ an toàn (~0.25 kg/tuần)';
            break;
        case 'gain-standard':
            targetCal = tdee + 500;
            goalDesc = 'Tăng cân nhanh / Tăng cơ (~0.5 kg/tuần)';
            break;
        case 'maintain':
        default:
            targetCal = tdee;
            goalDesc = 'Giữ nguyên mức cân nặng hiện tại';
            break;
    }

    // Safety warning if too low
    let safetyWarning = '';
    if (targetCal < 1200) {
        safetyWarning = 'Lưu ý: Mức nạp dưới 1200 kcal/ngày có thể làm chậm quá trình trao đổi chất và thiếu vi chất. Khuyến nghị không nên ăn thấp hơn 1200 kcal.';
    }

    // Macro Ratios: { p: protein%, c: carb%, f: fat% }
    const diets = {
        balanced: { name: 'Cân Bằng', p: 0.30, c: 0.40, f: 0.30, desc: 'Tỷ lệ vàng phổ biến, dễ áp dụng hàng ngày' },
        high_protein: { name: 'Tăng Cơ / High Protein', p: 0.35, c: 0.45, f: 0.20, desc: 'Tối ưu phát triển khối cơ nạc và hồi phục' },
        low_carb: { name: 'Giảm Mỡ / Low-Carb', p: 0.40, c: 0.25, f: 0.35, desc: 'Hạn chế tinh bột, tập trung đạm và chất béo tốt' },
        keto: { name: 'Keto (Rất ít Carb)', p: 0.20, c: 0.05, f: 0.75, desc: 'Đốt mỡ làm nguồn năng lượng chính' }
    };

    const curDiet = diets[diet] || diets.balanced;
    const pCal = targetCal * curDiet.p;
    const cCal = targetCal * curDiet.c;
    const fCal = targetCal * curDiet.f;

    const proteinGrams = Math.round(pCal / 4);
    const carbGrams = Math.round(cCal / 4);
    const fatGrams = Math.round(fCal / 9);

    return {
        targetCal: Math.round(targetCal),
        tdee: Math.round(tdee),
        calorieDiff: Math.round(targetCal - tdee),
        goalDesc,
        safetyWarning,
        dietName: curDiet.name,
        dietDesc: curDiet.desc,
        protein: { grams: proteinGrams, cal: Math.round(pCal), percent: Math.round(curDiet.p * 100) },
        carb: { grams: carbGrams, cal: Math.round(cCal), percent: Math.round(curDiet.c * 100) },
        fat: { grams: fatGrams, cal: Math.round(fCal), percent: Math.round(curDiet.f * 100) }
    };
}
