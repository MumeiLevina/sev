/**
 * Kinetic Tech — Site-wide Components
 * ─────────────────────────────────────
 * Dynamically injects: Navbar, Enhanced Footer, Ad Placeholders,
 * SEO Meta Tags, JSON-LD Structured Data, Cookie Consent Banner.
 *
 * Usage: Add <script src="js/site-components.js"></script> before </body>
 */
(function () {
    'use strict';

    /* ═══════════════════════════════════════════════════════════════
       CONFIG
       ═══════════════════════════════════════════════════════════════ */
     const SITE_NAME  = 'Kinetic Tech';
    const SITE_URL   = 'https://studenttools.vn';   // ← update when deploying
    const CURRENT_PAGE = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

    /* Per-page SEO data – used for meta description, OG tags, canonical */
    const PAGE_META = {
        'index.html':              { d: 'Bộ 30+ công cụ miễn phí dành cho sinh viên và học sinh: tính GPA, BMI, chuyển đổi đơn vị, nén file, thi thử B2 và nhiều hơn nữa.' },
        'bmi.html':                { d: 'Tính chỉ số BMI (Body Mass Index) trực tuyến miễn phí. Đánh giá thể trạng theo chuẩn WHO và chuẩn Châu Á WPRO/IDI.' },
        'bmr.html':                { d: 'Tính chỉ số BMR — trao đổi chất cơ bản theo công thức Mifflin-St Jeor. Biết lượng calo tối thiểu cơ thể cần mỗi ngày.' },
        'tdee.html':               { d: 'Tính TDEE — tổng năng lượng tiêu hao hàng ngày theo mức vận động. Công cụ miễn phí cho sinh viên.' },
        'calorie.html':            { d: 'Phân bổ Calo và Macro (protein, carb, fat) theo mục tiêu: giảm cân, tăng cơ, hoặc duy trì cân nặng.' },
        'gpa.html':                { d: 'Tính điểm GPA ngược — biết chính xác điểm thi cuối kỳ tối thiểu cần đạt để qua môn hoặc đạt học bổng.' },
        'final-exam.html':         { d: 'Tính điểm thi cuối kỳ cần đạt theo mục tiêu. Hỗ trợ hệ 10, hệ 4, hệ chữ A/B/C/D.' },
        'cgpa.html':               { d: 'Tính GPA tích lũy toàn khóa (CPA/CGPA) cho sinh viên đại học. Nhập điểm từng học kỳ, tính tự động.' },
        'gpa-subject.html':        { d: 'Tính điểm tổng kết môn học theo trọng số các cột điểm. Hỗ trợ tùy chỉnh số cột và tỷ lệ phần trăm.' },
        'scale-convert.html':      { d: 'Quy đổi điểm hệ 4 ↔ hệ 10 ↔ điểm chữ A/B/C/D. Bảng quy đổi chuẩn các trường ĐH Việt Nam.' },
        'high-school.html':        { d: 'Tính điểm xét tốt nghiệp THPT 2026 chính xác. Bao gồm điểm thi, học bạ, ưu tiên, khuyến khích.' },
        'transcript.html':         { d: 'Tính điểm xét học bạ THPT cho xét tuyển đại học. Hỗ trợ nhiều tổ hợp môn, tính điểm tự động.' },
        'ielts.html':              { d: 'Tính điểm IELTS Overall Band Score chính xác theo quy tắc làm tròn chính thức từ British Council.' },
        'sat.html':                { d: 'Tính điểm Digital SAT 1600 từ số câu đúng. Chuyển đổi raw score sang scaled score chuẩn College Board.' },
        'fraction.html':           { d: 'Máy tính phân số trực tuyến miễn phí. Cộng, trừ, nhân, chia phân số với lời giải chi tiết từng bước.' },
        'b2-theory.html':          { d: 'Thi thử lý thuyết lái xe B2 online miễn phí. Bộ 600 câu hỏi cập nhật, chấm điểm tự động.' },
        'planner.html':            { d: 'Pomodoro timer và lịch ôn thi thông minh cho sinh viên. Quản lý thời gian học tập hiệu quả.' },
        'convert-length.html':     { d: 'Chuyển đổi đơn vị chiều dài: km, mét, cm, dặm, yard, feet, inch. Kết quả tức thì, chính xác.' },
        'convert-weight.html':     { d: 'Chuyển đổi đơn vị khối lượng: kg, gram, ounce, pound, tấn. Nhanh chóng và chính xác.' },
        'convert-area.html':       { d: 'Chuyển đổi đơn vị diện tích: m², km², hecta, acre, feet vuông. Bảng quy đổi đầy đủ.' },
        'convert-land.html':       { d: 'Chuyển đổi diện tích đất Việt Nam: sào, mẫu, công, m². Chuẩn theo 3 miền Bắc, Trung, Nam.' },
        'convert-volume.html':     { d: 'Chuyển đổi đơn vị thể tích: lít, ml, gallon, cup, fluid ounce. Công cụ miễn phí.' },
        'convert-time.html':       { d: 'Chuyển đổi đơn vị thời gian: giây, phút, giờ, ngày, tuần, tháng, năm. Tính toán nhanh.' },
        'convert-data.html':       { d: 'Chuyển đổi dung lượng: byte, KB, MB, GB, TB, PB. Hỗ trợ hệ nhị phân (1024) và thập phân (1000).' },
        'convert-energy.html':     { d: 'Chuyển đổi năng lượng: Joule, Calorie, kWh, BTU, eV. Kết quả tức thì.' },
        'convert-pressure.html':   { d: 'Chuyển đổi áp suất: Pascal, Bar, Atm, mmHg, PSI, Torr. Công cụ trực tuyến chính xác.' },
        'convert-frequency.html':  { d: 'Chuyển đổi tần số: Hz, kHz, MHz, GHz, RPM. Công cụ trực tuyến miễn phí.' },
        'compressor.html':         { d: 'Nén file ảnh và tài liệu trực tuyến miễn phí. Giảm dung lượng PNG, JPG, PDF mà vẫn giữ chất lượng.' },
        'file-converter.html':     { d: 'Chuyển đổi định dạng file trực tuyến: ảnh, PDF, Word, Excel. Không cần cài phần mềm.' },
        'pdf-extractor.html':      { d: 'Trích xuất văn bản và tách trang PDF trực tuyến. Miễn phí, bảo mật, không cần đăng ký.' },
        'subtitle-extractor.html': { d: 'Bóc sub video và audio tự động bằng AI Whisper. Tách phụ đề, gán timestamp chính xác, xuất file SRT, VTT, TXT với 1 giờ miễn phí cho tài khoản mới.' },
        'compound-interest.html':  { d: 'Tính lãi suất kép và kế hoạch tiết kiệm tích lũy trực tuyến. Xem biểu đồ tăng trưởng tiền gốc và tiền lãi qua từng năm.' },
        'budget-planner.html':     { d: 'Quản lý ngân sách và chi tiêu sinh viên theo quy tắc 50/30/20. Tối ưu thu chi, cảnh báo thâm hụt tài chính.' },
        'room-splitter.html':      { d: 'Chia tiền phòng trọ, hóa đơn điện nước theo công tơ, wifi, rác cho sinh viên. Tạo tin nhắn hóa đơn gửi Zalo/Messenger.' },
        'currency-converter.html': { d: 'Quy đổi tiền tệ trực tuyến giữa VND và ngoại tệ: USD, EUR, JPY, GBP, KRW, CNY... Tỷ giá tham khảo cập nhật.' },
        'tax-calculator.html':     { d: 'Tính thuế thu nhập cá nhân (TNCN) và quy đổi lương Gross sang Net chuẩn biểu thuế lũy tiến 7 bậc và bảo hiểm Việt Nam.' },
        'word-counter.html':       { d: 'Đếm số từ, ký tự, câu, đoạn văn và ước tính thời gian đọc văn bản trực tuyến. Phù hợp viết tiểu luận, luận văn, IELTS.' },
        'password-generator.html': { d: 'Tạo mật khẩu mạnh, an toàn và ngẫu nhiên theo tiêu chuẩn NIST. Tùy chỉnh độ dài, ký tự và đo thời gian bẻ khóa.' },
        'qr-generator.html':       { d: 'Tạo mã QR trực tuyến miễn phí cho link website, chia sẻ mạng WiFi phòng trọ, văn bản và số điện thoại. Tải ảnh PNG sắc nét.' },
        'convert-base.html':       { d: 'Chuyển đổi cơ số và hệ đếm: Nhị phân (Binary), Thập phân (Decimal), Bát phân (Octal), Hexadecimal cho sinh viên CNTT.' },
        'stopwatch-timer.html':    { d: 'Đồng hồ bấm giờ chính xác đến mili-giây và hẹn giờ đếm ngược có chuông báo âm thanh cho học tập và thi cử.' },
        'convert-temperature.html':{ d: 'Chuyển đổi nhiệt độ giữa Độ C (Celsius), Độ F (Fahrenheit), Kelvin (K) và Rankine (°R) theo thời gian thực.' },
        'convert-speed.html':      { d: 'Chuyển đổi vận tốc và tốc độ giữa km/h, m/s, mph, Knot và Mach. Bảng so sánh tốc độ thực tế trong đời sống.' },
        'privacy-policy.html':     { d: 'Chính sách bảo mật của Kinetic Tech. Cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.' },
        'terms-of-use.html':       { d: 'Điều khoản sử dụng Kinetic Tech. Quy định về quyền và trách nhiệm khi sử dụng dịch vụ.' },
        'about.html':              { d: 'Giới thiệu Kinetic Tech — bộ công cụ trực tuyến miễn phí dành cho sinh viên và học sinh Việt Nam.' },
        'contact.html':            { d: 'Liên hệ với Kinetic Tech. Gửi phản hồi, báo lỗi, hoặc đề xuất tính năng mới.' },
        'login.html':              { d: 'Đăng nhập hoặc đăng ký tài khoản Kinetic Tech để mở khóa 1 giờ bóc subtitle AI miễn phí và lưu trữ tiện ích học tập.' }
    };

    /* ═══════════════════════════════════════════════════════════════
       1. AUTH & NAVBAR
       ═══════════════════════════════════════════════════════════════ */
    const AUTH_TOKEN_KEY    = 'kt_sub_access_token';
    const AUTH_REFRESH_KEY  = 'kt_sub_refresh_token';
    const AUTH_USER_KEY     = 'kt_sub_user_cache';
    const AUTH_API_BASE     = window.SUBTITLE_API_URL || (
        location.hostname === 'localhost' || location.hostname === '127.0.0.1'
            ? (location.port === '3000' ? '/api/v1' : 'http://localhost:3000/api/v1')
            : '/api/v1'
    );

    function getStoredUser() {
        try {
            var raw = localStorage.getItem(AUTH_USER_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    }

    function setStoredAuth(user, access, refresh) {
        try { localStorage.removeItem('kt_sub_remaining_seconds_v2'); } catch (_) {}
        if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        if (access) localStorage.setItem(AUTH_TOKEN_KEY, access);
        if (refresh) localStorage.setItem(AUTH_REFRESH_KEY, refresh);
        window.dispatchEvent(new CustomEvent('kt:auth-changed', { detail: { user: user } }));
    }

    function clearStoredAuth() {
        try { localStorage.removeItem('kt_sub_remaining_seconds_v2'); } catch (_) {}
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_REFRESH_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        window.dispatchEvent(new CustomEvent('kt:auth-changed', { detail: { user: null } }));
    }

    function renderNavAuth(container) {
        if (!container) container = document.getElementById('navAuthSlot');
        if (!container) return;

        var user = getStoredUser();

        if (user) {
            var name = user.display_name || (user.email ? user.email.split('@')[0] : 'Người dùng');
            var initial = (name || 'K').trim().charAt(0).toUpperCase();
            var email = user.email || '';
            var isPro = user.plan === 'pro' || user.plan === 'premium';
            var planLabel = isPro ? 'Thành viên PRO' : 'Tài khoản Miễn phí';
            var planClass = isPro ? 'pro' : '';

            container.innerHTML = `
                <div class="nav-user-menu" id="navUserMenu">
                    <button type="button" class="nav-user-trigger" id="navUserTrigger" aria-label="Tài khoản cá nhân" aria-expanded="false">
                        <span class="user-avatar-badge">${initial}</span>
                        <span class="user-name-label">${escapeHtml(name)}</span>
                        <i class='bx bx-chevron-down user-chevron'></i>
                    </button>
                    <div class="nav-user-dropdown" id="navUserDropdown">
                        <div class="user-dropdown-header">
                            <div class="dropdown-avatar-large">${initial}</div>
                            <div class="dropdown-user-meta">
                                <div class="dropdown-user-name">${escapeHtml(name)}</div>
                                <div class="dropdown-user-email">${escapeHtml(email)}</div>
                                <span class="dropdown-plan-badge ${planClass}">
                                    <i class='bx ${isPro ? "bx-crown" : "bx-check-shield"}'></i> ${planLabel}
                                </span>
                            </div>
                        </div>
                        <div class="dropdown-menu-list">
                            <a href="subtitle-extractor.html" class="dropdown-menu-item">
                                <i class='bx bx-captions' style="color: #2563eb;"></i>
                                <div class="dropdown-menu-item-text">
                                    <div class="dropdown-menu-item-title">Bóc Subtitle AI</div>
                                    <div class="dropdown-menu-item-desc">Tách phụ đề video tự động (1h free)</div>
                                </div>
                            </a>
                            <a href="index.html" class="dropdown-menu-item">
                                <i class='bx bx-grid-alt' style="color: #10b981;"></i>
                                <div class="dropdown-menu-item-text">
                                    <div class="dropdown-menu-item-title">Bộ 30+ Công Cụ</div>
                                    <div class="dropdown-menu-item-desc">GPA, BMI, Đổi đơn vị, Nén file...</div>
                                </div>
                            </a>
                            <div class="dropdown-item-divider"></div>
                            <button type="button" class="dropdown-menu-item dropdown-logout-btn" id="navLogoutBtn">
                                <i class='bx bx-log-out'></i>
                                <div class="dropdown-menu-item-text">
                                    <div class="dropdown-menu-item-title">Đăng xuất</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>`;

            var trigger  = container.querySelector('#navUserTrigger');
            var dropdown = container.querySelector('#navUserDropdown');
            var logout   = container.querySelector('#navLogoutBtn');

            if (trigger && dropdown) {
                trigger.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var active = dropdown.classList.toggle('active');
                    trigger.classList.toggle('active', active);
                    trigger.setAttribute('aria-expanded', active);
                });
            }

            if (logout) {
                logout.addEventListener('click', async function (e) {
                    e.stopPropagation();
                    var token = localStorage.getItem(AUTH_TOKEN_KEY);
                    var refresh = localStorage.getItem(AUTH_REFRESH_KEY);
                    if (token || refresh) {
                        try {
                            await fetch(AUTH_API_BASE + '/auth/logout', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { 'Authorization': 'Bearer ' + token } : {})
                                },
                                body: JSON.stringify({ refresh_token: refresh || '' })
                            });
                        } catch (_) {}
                    }
                    clearStoredAuth();
                    renderNavAuth();
                });
            }
        } else {
            container.innerHTML = `
                <button type="button" class="nav-login-btn" id="navLoginBtn">
                    <i class='bx bx-user-circle'></i>
                    <span>Đăng nhập</span>
                </button>`;

            var loginBtn = container.querySelector('#navLoginBtn');
            if (loginBtn) {
                loginBtn.addEventListener('click', function () {
                    openSiteAuthModal('login');
                });
            }
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function injectGlobalAuthModal() {
        if (document.getElementById('siteAuthModal') || document.getElementById('authModal')) return;

        var overlay = document.createElement('div');
        overlay.className = 'site-auth-overlay';
        overlay.id = 'siteAuthModal';
        overlay.innerHTML = `
            <div class="site-auth-box">
                <div class="site-auth-header">
                    <div class="site-auth-header-brand">
                        <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                            <rect width="32" height="32" rx="7" fill="#004bb5"/>
                            <text x="16" y="22" text-anchor="middle" fill="#fff" font-size="16" font-weight="800" font-family="Inter,sans-serif">K</text>
                        </svg>
                        <div>
                            <div class="site-auth-header-title">Kinetic Tech ID</div>
                            <div class="site-auth-header-sub">Đăng nhập tài khoản sinh viên</div>
                        </div>
                    </div>
                    <button type="button" class="site-auth-close-btn" id="siteAuthCloseBtn" aria-label="Đóng">
                        <i class='bx bx-x'></i>
                    </button>
                </div>
                <div class="site-auth-body">
                    <div class="site-auth-tabs">
                        <button type="button" class="site-auth-tab-btn active" id="tabBtnModalLogin">Đăng Nhập</button>
                        <button type="button" class="site-auth-tab-btn" id="tabBtnModalRegister">Đăng Ký Mới</button>
                    </div>

                    <div id="siteAuthAlert" class="site-auth-alert"></div>

                    <!-- Form Đăng Nhập -->
                    <form id="siteFormLogin">
                        <div class="site-auth-field">
                            <label class="site-auth-label">Email tài khoản</label>
                            <div class="site-auth-input-wrap">
                                <i class='bx bx-envelope site-auth-input-icon'></i>
                                <input type="email" id="modalLoginEmail" class="site-auth-input" placeholder="tenban@gmail.com" required autocomplete="email">
                            </div>
                        </div>
                        <div class="site-auth-field">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <label class="site-auth-label" style="margin-bottom: 0;">Mật khẩu</label>
                                <a href="login.html?action=forgot" style="font-size: 0.78rem; color: #004bb5; text-decoration: none; font-weight: 600;">Quên mật khẩu?</a>
                            </div>
                            <div class="site-auth-input-wrap">
                                <i class='bx bx-lock-alt site-auth-input-icon'></i>
                                <input type="password" id="modalLoginPassword" class="site-auth-input" placeholder="••••••••" required autocomplete="current-password">
                                <button type="button" class="site-auth-toggle-pwd" id="toggleLoginPwd" aria-label="Hiện mật khẩu">
                                    <i class='bx bx-show'></i>
                                </button>
                            </div>
                        </div>
                        <button type="submit" class="site-auth-submit-btn" id="btnSubmitModalLogin">
                            <i class='bx bx-log-in'></i> Đăng Nhập Ngay
                        </button>
                    </form>

                    <!-- Form Đăng Ký -->
                    <form id="siteFormRegister" style="display: none;">
                        <div class="site-auth-field">
                            <label class="site-auth-label">Họ và tên</label>
                            <div class="site-auth-input-wrap">
                                <i class='bx bx-user site-auth-input-icon'></i>
                                <input type="text" id="modalRegName" class="site-auth-input" placeholder="Nguyễn Văn A" required>
                            </div>
                        </div>
                        <div class="site-auth-field">
                            <label class="site-auth-label">Địa chỉ Email</label>
                            <div class="site-auth-input-wrap">
                                <i class='bx bx-envelope site-auth-input-icon'></i>
                                <input type="email" id="modalRegEmail" class="site-auth-input" placeholder="tenban@gmail.com" required autocomplete="email">
                            </div>
                        </div>
                        <div class="site-auth-field">
                            <label class="site-auth-label">Mật khẩu (tối thiểu 6 ký tự)</label>
                            <div class="site-auth-input-wrap">
                                <i class='bx bx-lock-alt site-auth-input-icon'></i>
                                <input type="password" id="modalRegPassword" class="site-auth-input" placeholder="••••••••" minlength="6" required autocomplete="new-password">
                            </div>
                        </div>
                        <div class="site-auth-field">
                            <label class="site-auth-label">Nhập lại mật khẩu</label>
                            <div class="site-auth-input-wrap">
                                <i class='bx bx-lock-alt site-auth-input-icon'></i>
                                <input type="password" id="modalRegPasswordConfirm" class="site-auth-input" placeholder="••••••••" minlength="6" required autocomplete="new-password">
                            </div>
                        </div>
                        <button type="submit" class="site-auth-submit-btn" id="btnSubmitModalRegister">
                            <i class='bx bx-user-plus'></i> Tạo Tài Khoản Miễn Phí
                        </button>
                    </form>
                </div>
            </div>`;

        document.body.appendChild(overlay);

        // Bind elements
        var closeBtn    = overlay.querySelector('#siteAuthCloseBtn');
        var tabLogin    = overlay.querySelector('#tabBtnModalLogin');
        var tabRegister = overlay.querySelector('#tabBtnModalRegister');
        var formLogin   = overlay.querySelector('#siteFormLogin');
        var formReg     = overlay.querySelector('#siteFormRegister');
        var alertBox    = overlay.querySelector('#siteAuthAlert');
        var togglePwd   = overlay.querySelector('#toggleLoginPwd');

        function showAlert(msg, isError) {
            alertBox.className = 'site-auth-alert ' + (isError ? 'error' : 'success');
            alertBox.innerHTML = "<i class='bx " + (isError ? "bx-error-circle" : "bx-check-circle") + "'></i> " + msg;
            alertBox.style.display = 'flex';
        }

        function clearAlert() {
            alertBox.style.display = 'none';
            alertBox.innerHTML = '';
        }

        closeBtn.addEventListener('click', function () {
            overlay.classList.remove('active');
            clearAlert();
        });

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                clearAlert();
            }
        });

        tabLogin.addEventListener('click', function () {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            formLogin.style.display = 'block';
            formReg.style.display = 'none';
            clearAlert();
        });

        tabRegister.addEventListener('click', function () {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            formLogin.style.display = 'none';
            formReg.style.display = 'block';
            clearAlert();
        });

        if (togglePwd) {
            togglePwd.addEventListener('click', function () {
                var inp = overlay.querySelector('#modalLoginPassword');
                if (inp.type === 'password') {
                    inp.type = 'text';
                    togglePwd.innerHTML = "<i class='bx bx-hide'></i>";
                } else {
                    inp.type = 'password';
                    togglePwd.innerHTML = "<i class='bx bx-show'></i>";
                }
            });
        }

        // Submit login
        formLogin.addEventListener('submit', async function (e) {
            e.preventDefault();
            clearAlert();
            var email = overlay.querySelector('#modalLoginEmail').value.trim();
            var password = overlay.querySelector('#modalLoginPassword').value;
            var submitBtn = overlay.querySelector('#btnSubmitModalLogin');

            submitBtn.disabled = true;
            submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Đang xử lý...";

            try {
                var resp = await fetch(AUTH_API_BASE + '/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                });

                if (resp.ok) {
                    var data = await resp.json();
                    var profileResp = await fetch(AUTH_API_BASE + '/auth/me', {
                        headers: { 'Authorization': 'Bearer ' + data.access_token }
                    }).catch(function () { return null; });

                    var userObj = (profileResp && profileResp.ok) ? await profileResp.json() : {
                        email: email,
                        display_name: email.split('@')[0],
                        plan: 'free'
                    };

                    setStoredAuth(userObj, data.access_token, data.refresh_token);
                    overlay.classList.remove('active');
                    renderNavAuth();
                } else {
                    var errData = await resp.json().catch(function () { return {}; });
                    throw new Error(errData.detail || 'Email hoặc mật khẩu không chính xác.');
                }
            } catch (err) {
                // If backend is offline/unreachable, gracefully log in as local authenticated user
                if (err.message.indexOf('fetch') !== -1 || err.message.indexOf('Network') !== -1 || err.message.indexOf('Failed') !== -1) {
                    var fallbackUser = {
                        id: 'offline-' + Date.now(),
                        email: email,
                        display_name: email.split('@')[0],
                        plan: 'free',
                        quota_limit_seconds: 3600,
                        quota_used_seconds: 0
                    };
                    setStoredAuth(fallbackUser, 'offline-token', 'offline-refresh');
                    overlay.classList.remove('active');
                    renderNavAuth();
                } else {
                    showAlert(err.message, true);
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = "<i class='bx bx-log-in'></i> Đăng Nhập Ngay";
            }
        });

        // Submit register
        formReg.addEventListener('submit', async function (e) {
            e.preventDefault();
            clearAlert();
            var name = overlay.querySelector('#modalRegName').value.trim();
            var email = overlay.querySelector('#modalRegEmail').value.trim();
            var password = overlay.querySelector('#modalRegPassword').value;
            var confirm = overlay.querySelector('#modalRegPasswordConfirm').value;
            var submitBtn = overlay.querySelector('#btnSubmitModalRegister');

            if (password !== confirm) {
                showAlert('Mật khẩu xác nhận không khớp.', true);
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Đang tạo tài khoản...";

            try {
                var resp = await fetch(AUTH_API_BASE + '/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password, display_name: name })
                });

                if (resp.ok) {
                    var data = await resp.json();
                    var userObj = null;
                    try {
                        var pResp = await fetch(AUTH_API_BASE + '/auth/me', {
                            headers: { 'Authorization': 'Bearer ' + data.access_token }
                        });
                        if (pResp.ok) userObj = await pResp.json();
                    } catch (_) {}

                    if (!userObj) {
                        userObj = {
                            id: data.user_id || ('user-' + Date.now()),
                            email: email,
                            display_name: name || email.split('@')[0],
                            plan: 'free',
                            quota_limit_seconds: 3600,
                            quota_used_seconds: 0
                        };
                    }
                    setStoredAuth(userObj, data.access_token, data.refresh_token);
                    overlay.classList.remove('active');
                    renderNavAuth();
                } else {
                    var errData = await resp.json().catch(function () { return {}; });
                    if (resp.status === 409) {
                        showAlert(errData.detail || 'Email này đã được đăng ký. Mỗi email chỉ được đăng ký duy nhất 1 tài khoản. Vui lòng chuyển sang Đăng Nhập.', true);
                        var loginEmailInp = overlay.querySelector('#modalLoginEmail');
                        if (loginEmailInp) loginEmailInp.value = email;
                        return;
                    }
                    throw new Error(errData.detail || 'Không thể đăng ký. Vui lòng kiểm tra lại.');
                }
            } catch (err) {
                if (err.message.indexOf('fetch') !== -1 || err.message.indexOf('Network') !== -1 || err.message.indexOf('Failed') !== -1) {
                    var localUser = {
                        id: 'offline-' + Date.now(),
                        email: email,
                        display_name: name,
                        plan: 'free',
                        quota_limit_seconds: 3600,
                        quota_used_seconds: 0
                    };
                    setStoredAuth(localUser, 'offline-token', 'offline-refresh');
                    overlay.classList.remove('active');
                    renderNavAuth();
                } else {
                    showAlert(err.message, true);
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = "<i class='bx bx-user-plus'></i> Tạo Tài Khoản Miễn Phí";
            }
        });
    }

    function openSiteAuthModal(tab) {
        // If on subtitle-extractor.html which already has authModal
        var existingModal = document.getElementById('authModal');
        if (existingModal) {
            existingModal.classList.add('active');
            var tabBtn = existingModal.querySelector(tab === 'register' ? '#tabBtnRegister' : '#tabBtnLogin');
            if (tabBtn) tabBtn.click();
            return;
        }

        injectGlobalAuthModal();
        var modal = document.getElementById('siteAuthModal');
        if (modal) {
            modal.classList.add('active');
            var tabBtnModal = modal.querySelector(tab === 'register' ? '#tabBtnModalRegister' : '#tabBtnModalLogin');
            if (tabBtnModal) tabBtnModal.click();
        }
    }

    function injectNavbar() {
        if (document.querySelector('.site-navbar')) return;

        const isAct = (p) => CURRENT_PAGE === p ? ' active' : '';
        const nav = document.createElement('nav');
        nav.className = 'site-navbar';
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'Điều hướng chính');
        nav.innerHTML = `
            <div class="navbar-inner">
                <a href="index.html" class="navbar-brand" aria-label="${SITE_NAME}">
                    <svg class="brand-logo" viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="32" height="32" rx="7" fill="#004bb5"/>
                        <text x="16" y="22" text-anchor="middle" fill="#fff" font-size="16" font-weight="800" font-family="Inter,sans-serif">K</text>
                    </svg>
                    <span>Kinetic <span style="color:#3b82f6">Tech</span></span>
                </a>
                <button class="navbar-toggle" id="navToggle" aria-label="Mở menu" aria-expanded="false">
                    <i class='bx bx-menu'></i>
                </button>
                <div class="navbar-links" id="navLinks">
                    <a href="index.html" class="${isAct('index.html')}"><i class='bx bx-home-alt'></i> Trang chủ</a>
                    <a href="about.html" class="${isAct('about.html')}"><i class='bx bx-info-circle'></i> Giới thiệu</a>
                    <a href="contact.html" class="${isAct('contact.html')}"><i class='bx bx-envelope'></i> Liên hệ</a>
                    <div class="navbar-auth" id="navAuthSlot"></div>
                </div>
            </div>`;
        document.body.insertBefore(nav, document.body.firstChild);

        /* Render Auth Button or User Profile Dropdown */
        renderNavAuth(nav.querySelector('#navAuthSlot'));

        /* Mobile toggle */
        var toggle = document.getElementById('navToggle');
        var links  = document.getElementById('navLinks');
        if (toggle && links) {
            toggle.addEventListener('click', function () {
                var open = links.classList.toggle('active');
                toggle.setAttribute('aria-expanded', open);
                var icon = toggle.querySelector('i');
                if (icon) icon.className = open ? 'bx bx-x' : 'bx bx-menu';
            });
        }

        /* Close user dropdown on clicking outside */
        document.addEventListener('click', function (e) {
            var dropdown = document.getElementById('navUserDropdown');
            var trigger  = document.getElementById('navUserTrigger');
            if (dropdown && trigger && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
                trigger.classList.remove('active');
                trigger.setAttribute('aria-expanded', 'false');
            }
        });

        /* Listen for auth changes across components/tabs */
        window.addEventListener('kt:auth-changed', function () {
            renderNavAuth();
        });
        window.addEventListener('storage', function (e) {
            if (e.key === AUTH_USER_KEY || e.key === AUTH_TOKEN_KEY) {
                renderNavAuth();
            }
        });

        /* Inject Global Auth Modal into DOM */
        injectGlobalAuthModal();
    }

    /* ═══════════════════════════════════════════════════════════════
       2. ENHANCED FOOTER
       ═══════════════════════════════════════════════════════════════ */
    function injectFooter() {
        var old = document.querySelector('.minimal-footer');
        if (!old) return;

        var footer = document.createElement('footer');
        footer.className = 'site-footer';
        footer.setAttribute('role', 'contentinfo');
        footer.innerHTML =
            '<div class="footer-inner">' +
                '<div class="footer-grid">' +
                    '<div class="footer-col footer-about">' +
                        '<div class="footer-brand">' +
                            '<svg viewBox="0 0 32 32" width="24" height="24" fill="none"><rect width="32" height="32" rx="7" fill="#3b82f6"/><text x="16" y="22" text-anchor="middle" fill="#fff" font-size="16" font-weight="800" font-family="Inter,sans-serif">K</text></svg>' +
                            '<span>Kinetic Tech</span>' +
                        '</div>' +
                        '<p>Bộ công cụ trực tuyến miễn phí dành cho sinh viên và học sinh Việt Nam. Tính điểm, chuyển đổi đơn vị, xử lý tệp và nhiều tiện ích khác.</p>' +
                    '</div>' +
                    '<div class="footer-col">' +
                        '<h4>Công cụ nổi bật</h4><ul>' +
                        '<li><a href="gpa.html">Tính điểm GPA</a></li>' +
                        '<li><a href="bmi.html">Tính chỉ số BMI</a></li>' +
                        '<li><a href="ielts.html">Tính điểm IELTS</a></li>' +
                        '<li><a href="high-school.html">Xét tốt nghiệp THPT</a></li>' +
                        '<li><a href="file-converter.html">Chuyển đổi file</a></li>' +
                        '</ul>' +
                    '</div>' +
                    '<div class="footer-col">' +
                        '<h4>Danh mục</h4><ul>' +
                        '<li><a href="convert-length.html">Chuyển đổi đơn vị</a></li>' +
                        '<li><a href="gpa.html">Học tập &amp; Thi cử</a></li>' +
                        '<li><a href="compound-interest.html">Tài chính</a></li>' +
                        '<li><a href="word-counter.html">Văn bản &amp; Năng suất</a></li>' +
                        '<li><a href="bmi.html">Sức khoẻ &amp; Dinh dưỡng</a></li>' +
                        '<li><a href="compressor.html">Xử lý tệp</a></li>' +
                        '</ul>' +
                    '</div>' +
                    '<div class="footer-col">' +
                        '<h4>Thông tin</h4><ul>' +
                        '<li><a href="about.html">Giới thiệu</a></li>' +
                        '<li><a href="contact.html">Liên hệ</a></li>' +
                        '<li><a href="privacy-policy.html">Chính sách Bảo mật</a></li>' +
                        '<li><a href="terms-of-use.html">Điều khoản Sử dụng</a></li>' +
                        '</ul>' +
                    '</div>' +
                '</div>' +
                '<div class="footer-bottom">' +
                    '<p>&copy; ' + new Date().getFullYear() + ' Kinetic Tech. Công cụ hỗ trợ học tập miễn phí cho sinh viên Việt Nam.</p>' +
                '</div>' +
            '</div>';

        /* Move footer outside .container for full-width dark background */
        var container = old.closest('.container');
        if (container && container.parentNode) {
            old.remove();
            container.parentNode.insertBefore(footer, container.nextSibling);
        } else {
            old.parentNode.replaceChild(footer, old);
        }
    }

    /* ═══════════════════════════════════════════════════════════════
       3. AD PLACEHOLDERS
       ═══════════════════════════════════════════════════════════════ */
    function injectAdSlots() {
        var skip = ['privacy-policy.html','terms-of-use.html','about.html','contact.html'];
        if (skip.indexOf(CURRENT_PAGE) !== -1) return;

        /* Sidebar ad slot */
        var sidebar = document.querySelector('.tool-category-sidebar');
        if (sidebar) {
            var adSide = document.createElement('div');
            adSide.className = 'ad-slot ad-sidebar-slot';
            adSide.id = 'ad-slot-sidebar';
            adSide.innerHTML = '<!-- Google AdSense: Sidebar 300x250 -->';
            sidebar.appendChild(adSide);
        }

        /* Bottom content ad slot — before footer */
        var footer = document.querySelector('.site-footer');
        if (footer && footer.parentNode) {
            var adBottom = document.createElement('div');
            adBottom.className = 'ad-slot ad-bottom-slot';
            adBottom.id = 'ad-slot-bottom';
            adBottom.innerHTML = '<!-- Google AdSense: Bottom Content -->';
            footer.parentNode.insertBefore(adBottom, footer);
        }
    }

    /* ═══════════════════════════════════════════════════════════════
       4. SEO META TAGS (description, OG, canonical, twitter)
       ═══════════════════════════════════════════════════════════════ */
    function injectSEO() {
        var meta = PAGE_META[CURRENT_PAGE];
        if (!meta) return;
        var head = document.head;
        var desc = meta.d;
        var title = document.title || SITE_NAME;
        var url = SITE_URL + '/' + CURRENT_PAGE;

        function addMeta(attr, key, val) {
            if (!document.querySelector('meta[' + attr + '="' + key + '"]')) {
                var el = document.createElement('meta');
                el.setAttribute(attr, key);
                el.content = val;
                head.appendChild(el);
            }
        }

        /* Standard meta */
        addMeta('name', 'description', desc);
        addMeta('name', 'robots', 'index, follow');

        /* Canonical */
        if (!document.querySelector('link[rel="canonical"]')) {
            var link = document.createElement('link');
            link.rel = 'canonical';
            link.href = url;
            head.appendChild(link);
        }

        /* Open Graph */
        addMeta('property', 'og:title',       title);
        addMeta('property', 'og:description', desc);
        addMeta('property', 'og:type',        'website');
        addMeta('property', 'og:url',         url);
        addMeta('property', 'og:site_name',   SITE_NAME);
        addMeta('property', 'og:locale',      'vi_VN');

        /* Twitter */
        addMeta('name', 'twitter:card',        'summary');
        addMeta('name', 'twitter:title',       title);
        addMeta('name', 'twitter:description', desc);
    }

    /* ═══════════════════════════════════════════════════════════════
       5. JSON-LD STRUCTURED DATA
       ═══════════════════════════════════════════════════════════════ */
    function injectJsonLd() {
        function addSchema(obj) {
            var s = document.createElement('script');
            s.type = 'application/ld+json';
            s.textContent = JSON.stringify(obj);
            document.head.appendChild(s);
        }

        /* WebSite schema — all pages */
        addSchema({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            'name': SITE_NAME,
            'url': SITE_URL,
            'description': 'Bộ công cụ trực tuyến miễn phí dành cho sinh viên và học sinh Việt Nam.',
            'inLanguage': 'vi',
            'potentialAction': {
                '@type': 'SearchAction',
                'target': SITE_URL + '/index.html?q={search_term_string}',
                'query-input': 'required name=search_term_string'
            }
        });

        /* WebApplication schema — tool pages only */
        var skip = ['index.html','privacy-policy.html','terms-of-use.html','about.html','contact.html'];
        var meta = PAGE_META[CURRENT_PAGE];
        if (meta && skip.indexOf(CURRENT_PAGE) === -1) {
            addSchema({
                '@context': 'https://schema.org',
                '@type': 'WebApplication',
                'name': document.title || '',
                'url': SITE_URL + '/' + CURRENT_PAGE,
                'description': meta.d,
                'applicationCategory': 'UtilityApplication',
                'operatingSystem': 'Any',
                'browserRequirements': 'Requires JavaScript',
                'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'VND' },
                'creator': { '@type': 'Organization', 'name': SITE_NAME, 'url': SITE_URL }
            });
        }
    }

    /* ═══════════════════════════════════════════════════════════════
       6. COOKIE CONSENT BANNER
       ═══════════════════════════════════════════════════════════════ */
    function injectCookieConsent() {
        if (localStorage.getItem('st_cookie_consent')) return;

        var banner = document.createElement('div');
        banner.className = 'cookie-consent';
        banner.id = 'cookieConsent';
        banner.innerHTML =
            '<div class="cookie-inner">' +
                '<p><i class="bx bx-cookie"></i> Website này sử dụng cookies để cải thiện trải nghiệm và hiển thị quảng cáo phù hợp. ' +
                'Xem <a href="privacy-policy.html">Chính sách Bảo mật</a> để biết thêm chi tiết.</p>' +
                '<div class="cookie-actions">' +
                    '<button class="cookie-btn cookie-accept" id="cookieAccept">Đồng ý</button>' +
                    '<button class="cookie-btn cookie-decline" id="cookieDecline">Từ chối</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(banner);

        function dismiss(val) {
            localStorage.setItem('st_cookie_consent', val);
            banner.classList.add('cookie-hidden');
            setTimeout(function () { banner.remove(); }, 350);
        }

        document.getElementById('cookieAccept').addEventListener('click',  function () { dismiss('accepted'); });
        document.getElementById('cookieDecline').addEventListener('click', function () { dismiss('declined'); });
    }

    /* ═══════════════════════════════════════════════════════════════
       INIT
       ═══════════════════════════════════════════════════════════════ */
    function init() {
        injectNavbar();
        injectFooter();
        injectAdSlots();
        injectSEO();
        injectJsonLd();
        injectCookieConsent();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
