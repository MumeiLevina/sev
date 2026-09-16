/**
 * Kinetic Tech — Billing / Payment Frontend Helper
 * ──────────────────────────────────────────────────
 * Shared billing utilities used by pricing.html and subtitle-extractor.html
 */

const KT_BILLING = {
    API_BASE: '',

    /**
     * Show upgrade prompt banner inside subtitle-extractor
     */
    showUpgradeBanner(remainingSeconds) {
        const banner = document.getElementById('upgrade-banner');
        if (!banner) return;

        const mins = Math.floor(remainingSeconds / 60);
        if (remainingSeconds <= 0) {
            banner.innerHTML = `
                <div class="upgrade-banner-inner urgent" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; background: linear-gradient(135deg, #fef2f2, #fee2e2); border: 1.5px solid #f87171; border-radius: 12px; padding: 14px 20px; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.1);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class='bx bxs-error-circle' style='font-size: 1.6rem; color: #dc2626;'></i>
                        <div>
                            <strong style="color: #991b1b; font-size: 0.95rem; display: block;">Hết thời lượng bóc sub miễn phí (00:00)</strong>
                            <span style="color: #b91c1c; font-size: 0.84rem;">Mua thêm giờ (chỉ từ 9.000đ) hoặc nâng cấp gói Pro để tiếp tục sử dụng ngay.</span>
                        </div>
                    </div>
                    <a href="pricing.html" class="upgrade-banner-btn" style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: #ffffff; padding: 9px 18px; border-radius: 8px; font-size: 0.88rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);">
                        <i class='bx bx-bolt-circle'></i> Nạp Quota Ngay →
                    </a>
                </div>`;
            banner.style.display = 'block';
        } else if (remainingSeconds <= 600) {
            banner.innerHTML = `
                <div class="upgrade-banner-inner warning" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 1.5px solid #fcd34d; border-radius: 12px; padding: 14px 20px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.08);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class='bx bxs-time-five' style='font-size: 1.6rem; color: #d97706;'></i>
                        <div>
                            <strong style="color: #92400e; font-size: 0.95rem; display: block;">Chỉ còn ${mins} phút thời lượng khả dụng</strong>
                            <span style="color: #b45309; font-size: 0.84rem;">Nâng cấp trước để không bị gián đoạn khi xử lý video dung lượng dài.</span>
                        </div>
                    </div>
                    <a href="pricing.html" class="upgrade-banner-btn" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; padding: 9px 18px; border-radius: 8px; font-size: 0.88rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);">
                        <i class='bx bx-crown'></i> Nâng Cấp Pro (Từ 9k) →
                    </a>
                </div>`;
            banner.style.display = 'block';
        } else {
            banner.style.display = 'none';
        }
    },

    /**
     * Format number as Vietnamese currency
     */
    formatPrice(amount) {
        return amount.toLocaleString('vi-VN') + 'đ';
    },

    /**
     * Format seconds to MM:SS
     */
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
};

window.KT_BILLING = KT_BILLING;
