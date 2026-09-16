document.getElementById('gpaForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const system = document.getElementById('systemSelect').value;
    const target = document.getElementById('targetSelect').value;
    const midtermScore = parseFloat(document.getElementById('midtermScore').value);
    const midtermWeight = parseFloat(document.getElementById('midtermWeight').value);
    const finalWeight = 1 - midtermWeight;

    // Define target numeric values based on system
    // Default values mapping to a standard Vietnamese university scale
    let targetNumeric = 0;
    
    if (system === '10' || system === 'letter') {
        if (target === 'pass') targetNumeric = 4.0; // Qua môn D
        else if (target === 'b') targetNumeric = 7.0; // Điểm Khá B
        else if (target === 'a') targetNumeric = 8.5; // Điểm Giỏi A
    } else if (system === '4') {
        if (target === 'pass') targetNumeric = 1.0;
        else if (target === 'b') targetNumeric = 3.0;
        else if (target === 'a') targetNumeric = 3.6; // Hoặc 4.0 tùy trường, lấy chuẩn 3.6 cho A
    }

    // Convert midterm score if needed (assuming user inputs midterm score in 10-point scale mostly, 
    // but if system is 4, they might input in 4-point scale)
    // To simplify: we assume midterm score is input in the SAME scale as the selected system.

    // Formula: Total = Midterm * MidtermWeight + Final * FinalWeight
    // Target <= Midterm * MidtermWeight + Final * FinalWeight
    // Final >= (Target - Midterm * MidtermWeight) / FinalWeight

    let requiredFinal = (targetNumeric - (midtermScore * midtermWeight)) / finalWeight;
    
    const resultBox = document.getElementById('resultBox');
    const resultValue = document.getElementById('requiredScore');
    const resultMessage = document.getElementById('resultMessage');

    resultBox.classList.remove('active');
    
    // Add small delay for animation
    setTimeout(() => {
        if (requiredFinal > (system === '4' ? 4.0 : 10.0)) {
            resultValue.textContent = "Không thể 😢";
            resultValue.style.color = "var(--danger)";
            resultMessage.textContent = `Bạn cần tới ${requiredFinal.toFixed(2)} điểm, vượt quá mức tối đa!`;
        } else if (requiredFinal < 0) {
            resultValue.textContent = "0.0";
            resultValue.style.color = "var(--success)";
            resultMessage.textContent = "Chúc mừng! Bạn nộp giấy trắng cũng đạt mục tiêu 🥳";
        } else {
            resultValue.textContent = requiredFinal.toFixed(2);
            resultValue.style.color = "var(--success)";
            resultMessage.textContent = "cố lên, bạn làm được mà! 🚀";
        }
        resultBox.classList.add('active');
    }, 100);
});
