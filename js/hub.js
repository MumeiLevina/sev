/**
 * Sinh Viên Hub - Interactive Controller
 * Real-time search, category filtering, keyboard shortcuts, and quick calculators.
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('hubSearchInput');
    const filterPills = document.querySelectorAll('.hub-filter-pill');
    const navItems = document.querySelectorAll('.hub-nav-item');
    const sections = document.querySelectorAll('.hub-tool-section');
    const allCards = document.querySelectorAll('.hub-tool-card');
    const menuToggle = document.getElementById('hubMenuToggle');
    const sidebar = document.getElementById('hubSidebar');

    // 1. Keyboard Shortcut (Ctrl + K / Cmd + K) for Quick Search
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        if (e.key === 'Escape' && searchInput && document.activeElement === searchInput) {
            searchInput.value = '';
            filterTools('');
            searchInput.blur();
        }
    });

    // 2. Real-time Search Filtering
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            filterTools(query);
        });
    }

    function filterTools(query) {
        let hasAnyVisible = false;

        sections.forEach(section => {
            const cards = section.querySelectorAll('.hub-tool-card');
            let sectionVisibleCount = 0;

            cards.forEach(card => {
                const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
                const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
                const tag = card.querySelector('.hub-card-tag')?.textContent.toLowerCase() || '';

                if (!query || title.includes(query) || desc.includes(query) || tag.includes(query)) {
                    card.classList.remove('hub-hidden');
                    sectionVisibleCount++;
                    hasAnyVisible = true;
                } else {
                    card.classList.add('hub-hidden');
                }
            });

            if (sectionVisibleCount === 0 && query !== '') {
                section.classList.add('hub-hidden');
            } else {
                section.classList.remove('hub-hidden');
            }
        });

        // Reset active pills when searching
        if (query !== '') {
            filterPills.forEach(pill => pill.classList.remove('active'));
        } else {
            const defaultPill = document.querySelector('.hub-filter-pill[data-category="all"]');
            if (defaultPill) defaultPill.classList.add('active');
        }
    }

    // 3. Category Filter Tabs
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const cat = pill.getAttribute('data-category');

            // Update active pill
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            // Clear search query
            if (searchInput) searchInput.value = '';

            if (cat === 'all') {
                sections.forEach(sec => sec.classList.remove('hub-hidden'));
                allCards.forEach(c => c.classList.remove('hub-hidden'));
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                sections.forEach(sec => {
                    if (sec.getAttribute('data-category') === cat) {
                        sec.classList.remove('hub-hidden');
                        sec.querySelectorAll('.hub-tool-card').forEach(c => c.classList.remove('hub-hidden'));
                        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        sec.classList.add('hub-hidden');
                    }
                });
            }

            // Sync sidebar active state
            navItems.forEach(item => {
                const itemCat = item.getAttribute('data-category');
                if (itemCat === cat) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        });
    });

    // 4. Sidebar Nav Clicks
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = item.getAttribute('data-category');

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Clear search query
            if (searchInput) searchInput.value = '';

            // Update filter pill
            filterPills.forEach(p => {
                if (p.getAttribute('data-category') === cat) {
                    p.classList.add('active');
                } else {
                    p.classList.remove('active');
                }
            });

            if (cat === 'all') {
                sections.forEach(sec => sec.classList.remove('hub-hidden'));
                allCards.forEach(c => c.classList.remove('hub-hidden'));
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                sections.forEach(sec => {
                    if (sec.getAttribute('data-category') === cat) {
                        sec.classList.remove('hub-hidden');
                        sec.querySelectorAll('.hub-tool-card').forEach(c => c.classList.remove('hub-hidden'));
                        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        sec.classList.add('hub-hidden');
                    }
                });
            }

            // Close sidebar on mobile
            if (window.innerWidth <= 992 && sidebar) {
                sidebar.classList.remove('open');
            }
        });
    });

    // 5. Mobile Drawer Toggle
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 992 && 
                sidebar.classList.contains('open') && 
                !sidebar.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    // 6. Bottom Banner Quick Final Exam Calculator Trigger
    const quickCalcBtn = document.getElementById('hubQuickCalcBtn');
    const quickScoreInput = document.getElementById('hubQuickScoreInput');

    if (quickCalcBtn && quickScoreInput) {
        quickCalcBtn.addEventListener('click', () => {
            const score = parseFloat(quickScoreInput.value);
            if (!isNaN(score)) {
                window.location.href = `final-exam.html?score=${encodeURIComponent(score)}`;
            } else {
                window.location.href = 'final-exam.html';
            }
        });

        quickScoreInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                quickCalcBtn.click();
            }
        });
    }
});
