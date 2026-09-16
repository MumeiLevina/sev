// Universal Unit Converter Engine
// High precision, bidirectional conversion with base-unit normalization

const CONVERTER_DEFINITIONS = {
    // 1. Pressure (Base unit: Pascal - Pa)
    pressure: {
        name: 'Áp suất',
        base: 'pa',
        units: {
            bar: { name: 'Bar (bar)', toBase: 100000, symbol: 'bar' },
            pa: { name: 'Pascal (Pa)', toBase: 1, symbol: 'Pa' },
            kpa: { name: 'Kilopascal (kPa)', toBase: 1000, symbol: 'kPa' },
            mpa: { name: 'Megapascal (MPa)', toBase: 1000000, symbol: 'MPa' },
            atm: { name: 'Atmosphere tiêu chuẩn (atm)', toBase: 101325, symbol: 'atm' },
            psi: { name: 'Pound / inch vuông (PSI)', toBase: 6894.75729, symbol: 'psi' },
            mmhg: { name: 'Milimét thủy ngân (mmHg / Torr)', toBase: 133.322368, symbol: 'mmHg' }
        },
        defaultFrom: 'bar',
        defaultTo: 'pa',
        defaultVal: 1,
        presets: [0.5, 1, 2, 5, 10, 50, 100]
    },

    // 2. Digital Data & Storage (Base unit: Bit - b)
    data: {
        name: 'Dữ liệu số',
        base: 'bit',
        units: {
            bit: { name: 'Bit (b)', toBase: 1, symbol: 'b' },
            byte: { name: 'Byte (B)', toBase: 8, symbol: 'B' },
            kbit: { name: 'Kilobit (Kb)', toBase: 1000, symbol: 'Kb' },
            kbyte: { name: 'Kilobyte (KB)', toBase: 8 * 1024, symbol: 'KB' },
            mbit: { name: 'Megabit (Mb)', toBase: 1000000, symbol: 'Mb' },
            mbyte: { name: 'Megabyte (MB)', toBase: 8 * 1024 * 1024, symbol: 'MB' },
            gbit: { name: 'Gigabit (Gb)', toBase: 1000000000, symbol: 'Gb' },
            gbyte: { name: 'Gigabyte (GB)', toBase: 8 * 1024 * 1024 * 1024, symbol: 'GB' },
            tbyte: { name: 'Terabyte (TB)', toBase: 8 * Math.pow(1024, 4), symbol: 'TB' }
        },
        defaultFrom: 'mbyte',
        defaultTo: 'mbit',
        defaultVal: 100,
        presets: [1, 8, 64, 128, 256, 512, 1024]
    },

    // 3. Area (Base unit: Square Meter - m²)
    area: {
        name: 'Diện tích & Chiều dài',
        base: 'm2',
        units: {
            ha: { name: 'Héc-ta (ha)', toBase: 10000, symbol: 'ha' },
            m2: { name: 'Mét vuông (m²)', toBase: 1, symbol: 'm²' },
            km2: { name: 'Kilômét vuông (km²)', toBase: 1000000, symbol: 'km²' },
            cm2: { name: 'Centimét vuông (cm²)', toBase: 0.0001, symbol: 'cm²' },
            are: { name: 'A (Are - 100m²)', toBase: 100, symbol: 'a' },
            acre: { name: 'Mẫu Anh (Acre)', toBase: 4046.85642, symbol: 'ac' },
            sq_mile: { name: 'Dặm vuông (sq mi)', toBase: 2589988.11, symbol: 'mi²' }
        },
        defaultFrom: 'ha',
        defaultTo: 'm2',
        defaultVal: 1,
        presets: [0.5, 1, 2, 5, 10, 50, 100]
    },

    // 4. Land Area Vietnam (Base unit: Square Meter - m²)
    land: {
        name: 'Diện tích Ruộng Đất Việt Nam',
        base: 'm2',
        units: {
            ha: { name: 'Héc-ta (ha - 10.000 m²)', toBase: 10000, symbol: 'ha' },
            m2: { name: 'Mét vuông (m²)', toBase: 1, symbol: 'm²' },
            mau_bac: { name: 'Mẫu Bắc Bộ (10 sào = 3.600 m²)', toBase: 3600, symbol: 'mẫu BB' },
            sao_bac: { name: 'Sào Bắc Bộ (360 m²)', toBase: 360, symbol: 'sào BB' },
            thuoc_bac: { name: 'Thước Bắc Bộ (24 m²)', toBase: 24, symbol: 'thước BB' },
            mau_trung: { name: 'Mẫu Trung Bộ (10 sào = 5.000 m²)', toBase: 5000, symbol: 'mẫu TB' },
            sao_trung: { name: 'Sào Trung Bộ (500 m²)', toBase: 500, symbol: 'sào TB' },
            cong_nam_3m: { name: 'Công Nam Bộ tầm 3m (1.000 m²)', toBase: 1000, symbol: 'công nhỏ' },
            cong_nam_dien: { name: 'Công Nam Bộ tầm điền (1.296 m²)', toBase: 1296, symbol: 'công tầm cắt' },
            mau_nam: { name: 'Mẫu Nam Bộ (10 công = 10.000 m² = 1 ha)', toBase: 10000, symbol: 'mẫu NB' }
        },
        defaultFrom: 'ha',
        defaultTo: 'mau_bac',
        defaultVal: 1,
        presets: [1, 2, 5, 10, 20, 50, 100]
    },

    // 5. Energy (Base unit: Joule - J)
    energy: {
        name: 'Năng lượng & Công',
        base: 'j',
        units: {
            j: { name: 'Jun (Joule - J)', toBase: 1, symbol: 'J' },
            ev: { name: 'Electronvolt (eV)', toBase: 1.602176634e-19, symbol: 'eV' },
            kj: { name: 'Kilojun (kJ)', toBase: 1000, symbol: 'kJ' },
            mj: { name: 'Megajun (MJ)', toBase: 1000000, symbol: 'MJ' },
            cal: { name: 'Calo (cal)', toBase: 4.184, symbol: 'cal' },
            kcal: { name: 'Kilocalo (kcal)', toBase: 4184, symbol: 'kcal' },
            wh: { name: 'Watt-giờ (Wh)', toBase: 3600, symbol: 'Wh' },
            kwh: { name: 'Kilowatt-giờ (kWh)', toBase: 3600000, symbol: 'kWh' },
            btu: { name: 'BTU', toBase: 1055.06, symbol: 'BTU' }
        },
        defaultFrom: 'j',
        defaultTo: 'ev',
        defaultVal: 1,
        presets: [1, 10, 100, 1000, 3600, 10000]
    },

    // 6. Weight & Mass (Base unit: Gram - g)
    weight: {
        name: 'Khối lượng & Trọng lượng',
        base: 'g',
        units: {
            kg: { name: 'Kilogam (kg)', toBase: 1000, symbol: 'kg' },
            g: { name: 'Gam (g)', toBase: 1, symbol: 'g' },
            mg: { name: 'Miligam (mg)', toBase: 0.001, symbol: 'mg' },
            oz: { name: 'Ounce (oz)', toBase: 28.349523125, symbol: 'oz' },
            lb: { name: 'Pound (lb)', toBase: 453.59237, symbol: 'lb' },
            tan: { name: 'Tấn (Metric Ton)', toBase: 1000000, symbol: 'tấn' },
            ta: { name: 'Tạ (100 kg)', toBase: 100000, symbol: 'tạ' },
            yen: { name: 'Yến (10 kg)', toBase: 10000, symbol: 'yến' },
            luong_vang: { name: 'Lượng / Cây vàng (37.5 g)', toBase: 37.5, symbol: 'cây' },
            chi_vang: { name: 'Chỉ vàng (3.75 g)', toBase: 3.75, symbol: 'chỉ' }
        },
        defaultFrom: 'kg',
        defaultTo: 'g',
        defaultVal: 1,
        presets: [0.5, 1, 2, 5, 10, 50, 100]
    },

    // 7. Length & Distance (Base unit: Meter - m)
    length: {
        name: 'Chiều dài & Khoảng cách',
        base: 'm',
        units: {
            km: { name: 'Kilomét (km)', toBase: 1000, symbol: 'km' },
            mile: { name: 'Dặm (Mile)', toBase: 1609.344, symbol: 'mi' },
            yard: { name: 'Yard (yd)', toBase: 0.9144, symbol: 'yd' },
            ft: { name: 'Feet (ft)', toBase: 0.3048, symbol: 'ft' },
            m: { name: 'Mét (m)', toBase: 1, symbol: 'm' },
            cm: { name: 'Centimét (cm)', toBase: 0.01, symbol: 'cm' },
            mm: { name: 'Milimét (mm)', toBase: 0.001, symbol: 'mm' },
            inch: { name: 'Inch (in)', toBase: 0.0254, symbol: 'in' },
            nmi: { name: 'Hải lý (Nautical Mile)', toBase: 1852, symbol: 'nmi' }
        },
        defaultFrom: 'km',
        defaultTo: 'mile',
        defaultVal: 1,
        presets: [1, 5, 10, 42.195, 50, 100]
    },

    // 8. Volume & Capacity (Base unit: Liter - L)
    volume: {
        name: 'Thể tích & Dung tích',
        base: 'l',
        units: {
            l: { name: 'Lít (L)', toBase: 1, symbol: 'L' },
            ml: { name: 'Mililít (mL)', toBase: 0.001, symbol: 'mL' },
            megalit: { name: 'Megalít (ML - 1.000.000 L)', toBase: 1000000, symbol: 'ML' },
            jigger_std: { name: 'Jigger chuẩn quốc tế (1.5 fl oz = 44.36 mL)', toBase: 0.04436, symbol: 'jigger (44.36ml)' },
            jigger_30: { name: 'Jigger đong nhỏ (30 mL)', toBase: 0.03, symbol: 'jigger (30ml)' },
            jigger_45: { name: 'Jigger đong lớn (45 mL)', toBase: 0.045, symbol: 'jigger (45ml)' },
            m3: { name: 'Mét khối (m³)', toBase: 1000, symbol: 'm³' },
            gallon_us: { name: 'Gallon Mỹ (gal)', toBase: 3.785411784, symbol: 'gal US' },
            fl_oz_us: { name: 'Ounce chất lỏng (fl oz)', toBase: 0.0295735295625, symbol: 'fl oz' },
            cup: { name: 'Cup chuẩn (250 mL)', toBase: 0.25, symbol: 'cup' },
            tbsp: { name: 'Muỗng canh (Tablespoon - 15 mL)', toBase: 0.015, symbol: 'tbsp' },
            tsp: { name: 'Muỗng cà phê (Teaspoon - 5 mL)', toBase: 0.005, symbol: 'tsp' }
        },
        defaultFrom: 'l',
        defaultTo: 'ml',
        defaultVal: 1,
        presets: [0.5, 1, 2, 5, 10, 100, 1000]
    },

    // 9. Frequency (Base unit: Hertz - Hz)
    frequency: {
        name: 'Tần số',
        base: 'hz',
        units: {
            hz: { name: 'Hertz (Hz)', toBase: 1, symbol: 'Hz' },
            khz: { name: 'Kilohertz (kHz)', toBase: 1000, symbol: 'kHz' },
            mhz: { name: 'Megahertz (MHz)', toBase: 1000000, symbol: 'MHz' },
            ghz: { name: 'Gigahertz (GHz)', toBase: 1000000000, symbol: 'GHz' },
            thz: { name: 'Terahertz (THz)', toBase: 1000000000000, symbol: 'THz' },
            rpm: { name: 'Vòng mỗi phút (RPM)', toBase: 1 / 60, symbol: 'RPM' },
            rad_s: { name: 'Radian mỗi giây (rad/s)', toBase: 1 / (2 * Math.PI), symbol: 'rad/s' }
        },
        defaultFrom: 'mhz',
        defaultTo: 'ghz',
        defaultVal: 2400,
        presets: [50, 60, 100, 1000, 2400, 5000]
    },

    // 10. Time (Base unit: Second - s)
    time: {
        name: 'Thời gian',
        base: 's',
        units: {
            min: { name: 'Phút (min)', toBase: 60, symbol: 'min' },
            hour: { name: 'Giờ (h)', toBase: 3600, symbol: 'h' },
            week: { name: 'Tuần (week)', toBase: 604800, symbol: 'tuần' },
            century: { name: 'Thế kỷ (100 năm)', toBase: 3155760000, symbol: 'thế kỷ' },
            s: { name: 'Giây (s)', toBase: 1, symbol: 's' },
            ms: { name: 'Miligiây (ms)', toBase: 0.001, symbol: 'ms' },
            day: { name: 'Ngày (day)', toBase: 86400, symbol: 'ngày' },
            month: { name: 'Tháng (trung bình 30.4375 ngày)', toBase: 2629800, symbol: 'tháng' },
            year: { name: 'Năm (365.25 ngày)', toBase: 31557600, symbol: 'năm' },
            decade: { name: 'Thập kỷ (10 năm)', toBase: 315576000, symbol: 'thập kỷ' }
        },
        defaultFrom: 'min',
        defaultTo: 'hour',
        defaultVal: 120,
        presets: [1, 15, 30, 60, 120, 1440, 10080]
    },

    // 11. Speed & Velocity (Base unit: Meter per second - m/s)
    speed: {
        name: 'Tốc độ & Vận tốc',
        base: 'm_s',
        units: {
            km_h: { name: 'Kilômét/giờ (km/h)', toBase: 1 / 3.6, symbol: 'km/h' },
            m_s: { name: 'Mét/giây (m/s)', toBase: 1, symbol: 'm/s' },
            mph: { name: 'Dặm/giờ (mph)', toBase: 0.44704, symbol: 'mph' },
            knot: { name: 'Hải lý/giờ (Knot)', toBase: 0.514444, symbol: 'knot' },
            ft_s: { name: 'Feet/giây (ft/s)', toBase: 0.3048, symbol: 'ft/s' },
            mach: { name: 'Số Mach (Tốc độ âm thanh)', toBase: 340.29, symbol: 'Mach' }
        },
        defaultFrom: 'km_h',
        defaultTo: 'm_s',
        defaultVal: 60,
        presets: [20, 40, 60, 80, 100, 120, 300]
    },

    // 12. Temperature (Base unit: Celsius - °C)
    temperature: {
        name: 'Nhiệt độ',
        base: 'c',
        units: {
            c: { name: 'Độ C (Celsius)', toBase: v => v, fromBase: v => v, symbol: '°C' },
            f: { name: 'Độ F (Fahrenheit)', toBase: v => (v - 32) * 5 / 9, fromBase: v => v * 9 / 5 + 32, symbol: '°F' },
            k: { name: 'Kelvin (K)', toBase: v => v - 273.15, fromBase: v => v + 273.15, symbol: 'K' },
            r: { name: 'Rankine (°R)', toBase: v => (v - 491.67) * 5 / 9, fromBase: v => (v + 273.15) * 9 / 5, symbol: '°R' }
        },
        defaultFrom: 'c',
        defaultTo: 'f',
        defaultVal: 25,
        presets: [-20, 0, 25, 37, 100, 200, 500]
    }
};

// Format numbers nicely: decimals or scientific notation
function formatValue(num) {
    if (num === 0) return '0';
    if (isNaN(num) || !isFinite(num)) return '–';
    
    const abs = Math.abs(num);
    if (abs >= 1e12 || (abs < 1e-6 && abs > 0)) {
        return num.toExponential(4).replace('e+', ' × 10^').replace('e-', ' × 10^-');
    }
    
    // Format up to 6 significant fractional digits without trailing zeros
    let formatted = num.toLocaleString('en-US', { maximumFractionDigits: 6 });
    return formatted;
}

// Format raw number for clipboard
function formatRawValue(num) {
    if (num === 0) return '0';
    if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-6 && Math.abs(num) > 0)) {
        return num.toExponential(6);
    }
    return parseFloat(num.toFixed(8)).toString();
}

// Master init function for a conversion category page
function initConverterPage(categoryKey, options = {}) {
    const config = CONVERTER_DEFINITIONS[categoryKey];
    if (!config) {
        console.error('Unknown conversion category:', categoryKey);
        return;
    }

    const inputVal = document.getElementById('inputVal');
    const selectFrom = document.getElementById('selectFrom');
    const selectTo = document.getElementById('selectTo');
    const btnSwap = document.getElementById('btnSwap');
    const resMainVal = document.getElementById('resMainVal');
    const resUnitName = document.getElementById('resUnitName');
    const formulaText = document.getElementById('formulaText');
    const presetsBox = document.getElementById('presetsBox');
    const multiGrid = document.getElementById('multiUnitGrid');
    const btnCopy = document.getElementById('btnCopyRes');

    // Populate unit dropdowns
    const unitEntries = Object.entries(config.units);
    
    function populateSelect(selectEl, selectedKey) {
        selectEl.innerHTML = '';
        unitEntries.forEach(([key, unit]) => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = unit.name;
            if (key === selectedKey) opt.selected = true;
            selectEl.appendChild(opt);
        });
    }

    const defaultFrom = options.defaultFrom || config.defaultFrom;
    const defaultTo = options.defaultTo || config.defaultTo;
    const defaultVal = options.defaultVal !== undefined ? options.defaultVal : config.defaultVal;

    populateSelect(selectFrom, defaultFrom);
    populateSelect(selectTo, defaultTo);

    if (inputVal) {
        inputVal.value = '';
        inputVal.placeholder = 'Nhập giá trị...';
    }

    // Presets ("Giá trị mẫu") removed
    if (presetsBox) {
        presetsBox.style.display = 'none';
        presetsBox.innerHTML = '';
    }

    let lastConvertedRaw = 0;

    function performConversion() {
        if (!inputVal || inputVal.value.trim() === '' || isNaN(parseFloat(inputVal.value))) {
            if (resMainVal) resMainVal.textContent = '---';
            if (formulaText) formulaText.textContent = 'Nhập giá trị để xem kết quả quy đổi';
            if (multiGrid) {
                multiGrid.innerHTML = '';
                unitEntries.forEach(([k, u]) => {
                    const card = document.createElement('div');
                    card.className = 'multi-unit-card';
                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <span class="multi-unit-name">${u.name}</span>
                        </div>
                        <div class="multi-unit-val">--- <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">${u.symbol}</span></div>
                    `;
                    multiGrid.appendChild(card);
                });
            }
            return;
        }

        const val = parseFloat(inputVal.value);

        const fromKey = selectFrom.value;
        const toKey = selectTo.value;
        const fromUnit = config.units[fromKey];
        const toUnit = config.units[toKey];

        if (!fromUnit || !toUnit) return;

        // Convert value to base unit
        const baseVal = val * fromUnit.toBase;
        // Convert from base unit to target unit
        const targetVal = baseVal / toUnit.toBase;
        lastConvertedRaw = targetVal;

        // Display main result
        resMainVal.textContent = formatValue(targetVal);
        resUnitName.textContent = toUnit.name;

        // Formula display
        const ratio1 = fromUnit.toBase / toUnit.toBase;
        formulaText.textContent = `1 ${fromUnit.symbol} = ${formatValue(ratio1)} ${toUnit.symbol}   |   ${val} × ${formatValue(ratio1)} = ${formatValue(targetVal)} ${toUnit.symbol}`;

        // Update multi-unit grid
        if (multiGrid) {
            multiGrid.innerHTML = '';
            unitEntries.forEach(([k, u]) => {
                const converted = baseVal / u.toBase;
                const card = document.createElement('div');
                card.className = 'multi-unit-card';
                if (k === toKey) {
                    card.style.borderColor = 'var(--primary)';
                    card.style.background = 'rgba(99, 102, 241, 0.15)';
                }

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <span class="multi-unit-name">${u.name}</span>
                        <button type="button" class="copy-mini-btn" title="Sao chép" onclick="copyValueToClipboard('${formatRawValue(converted)}', this)">
                            <i class='bx bx-copy'></i>
                        </button>
                    </div>
                    <div class="multi-unit-val">${formatValue(converted)} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">${u.symbol}</span></div>
                `;

                // Clicking card sets as target unit
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.copy-mini-btn')) return;
                    selectTo.value = k;
                    performConversion();
                });

                multiGrid.appendChild(card);
            });
        }
    }

    // Swap button event
    if (btnSwap) {
        btnSwap.addEventListener('click', () => {
            const currentFrom = selectFrom.value;
            const currentTo = selectTo.value;
            selectFrom.value = currentTo;
            selectTo.value = currentFrom;
            performConversion();
        });
    }

    // Copy result button
    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            navigator.clipboard.writeText(formatRawValue(lastConvertedRaw)).then(() => {
                const originalHtml = btnCopy.innerHTML;
                btnCopy.innerHTML = "<i class='bx bx-check'></i> Đã sao chép!";
                btnCopy.style.color = '#10b981';
                setTimeout(() => {
                    btnCopy.innerHTML = originalHtml;
                    btnCopy.style.color = '';
                }, 2000);
            }).catch(err => {
                console.error('Cannot copy', err);
            });
        });
    }

    const convertPairSelect = document.getElementById('convertPairSelect');
    const decimalSelect = document.getElementById('decimalSelect');
    const btnConvert = document.getElementById('btnConvert');
    const summaryBox = document.getElementById('conversionResultSummary');

    if (convertPairSelect) {
        convertPairSelect.addEventListener('change', () => {
            const parts = convertPairSelect.value.split('-');
            if (parts.length === 2) {
                if (selectFrom) selectFrom.value = parts[0];
                if (selectTo) selectTo.value = parts[1];
            }
            performConversion();
        });
    }

    if (decimalSelect) {
        decimalSelect.addEventListener('change', performConversion);
    }

    if (btnConvert) {
        btnConvert.addEventListener('click', performConversion);
    }

    if (inputVal) inputVal.addEventListener('input', performConversion);
    if (selectFrom) selectFrom.addEventListener('change', performConversion);
    if (selectTo) selectTo.addEventListener('change', performConversion);

    // Override formatValue with decimal choice if selected
    const originalFormatValue = formatValue;
    function formatWithDecimal(num) {
        if (!decimalSelect || decimalSelect.value === 'auto') {
            return originalFormatValue(num);
        }
        const decimals = parseInt(decimalSelect.value, 10);
        return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }

    function performConversion() {
        if (!inputVal || inputVal.value.trim() === '' || isNaN(parseFloat(inputVal.value))) {
            if (resMainVal) resMainVal.textContent = '---';
            if (formulaText) formulaText.textContent = 'Nhập nhiệt độ để xem kết quả quy đổi';
            if (summaryBox) summaryBox.textContent = '';
            if (multiGrid) {
                multiGrid.innerHTML = '';
                unitEntries.forEach(([k, u]) => {
                    const card = document.createElement('div');
                    card.className = 'multi-unit-card';
                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <span class="multi-unit-name">${u.name}</span>
                        </div>
                        <div class="multi-unit-val">--- <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">${u.symbol}</span></div>
                    `;
                    multiGrid.appendChild(card);
                });
            }
            return;
        }

        const val = parseFloat(inputVal.value);

        let fromKey = selectFrom ? selectFrom.value : defaultFrom;
        let toKey = selectTo ? selectTo.value : defaultTo;

        if (convertPairSelect) {
            const parts = convertPairSelect.value.split('-');
            if (parts.length === 2) {
                fromKey = parts[0];
                toKey = parts[1];
            }
        }

        const fromUnit = config.units[fromKey];
        const toUnit = config.units[toKey];

        if (!fromUnit || !toUnit) return;

        // Convert value to base unit
        const baseVal = typeof fromUnit.toBase === 'function' ? fromUnit.toBase(val) : val * fromUnit.toBase;
        // Convert from base unit to target unit
        const targetVal = typeof toUnit.fromBase === 'function' ? toUnit.fromBase(baseVal) : baseVal / toUnit.toBase;
        lastConvertedRaw = targetVal;

        const formattedTarget = formatWithDecimal(targetVal);

        // Display main result
        if (resMainVal) resMainVal.textContent = formattedTarget;
        if (resUnitName) resUnitName.textContent = toUnit.name;
        if (summaryBox) {
            summaryBox.textContent = `= ${formattedTarget} ${toUnit.symbol}`;
        }

        // Formula display
        if (typeof fromUnit.toBase === 'function' || typeof toUnit.fromBase === 'function') {
            if (formulaText) {
                formulaText.textContent = `${val} ${fromUnit.symbol} = ${formattedTarget} ${toUnit.symbol}`;
            }
        } else {
            const ratio1 = fromUnit.toBase / toUnit.toBase;
            if (formulaText) {
                formulaText.textContent = `1 ${fromUnit.symbol} = ${originalFormatValue(ratio1)} ${toUnit.symbol}   |   ${val} × ${originalFormatValue(ratio1)} = ${formattedTarget} ${toUnit.symbol}`;
            }
        }

        // Update multi-unit grid if present
        if (multiGrid) {
            multiGrid.innerHTML = '';
            unitEntries.forEach(([k, u]) => {
                const converted = typeof u.fromBase === 'function' ? u.fromBase(baseVal) : baseVal / u.toBase;
                const card = document.createElement('div');
                card.className = 'multi-unit-card';
                if (k === toKey) {
                    card.style.borderColor = 'var(--header-blue)';
                    card.style.background = '#f1f5f9';
                }

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <span class="multi-unit-name">${u.name}</span>
                        <button type="button" class="copy-mini-btn" title="Sao chép" onclick="copyValueToClipboard('${formatRawValue(converted)}', this)">
                            <i class='bx bx-copy'></i>
                        </button>
                    </div>
                    <div class="multi-unit-val">${originalFormatValue(converted)} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">${u.symbol}</span></div>
                `;

                card.addEventListener('click', (e) => {
                    if (e.target.closest('.copy-mini-btn')) return;
                    if (selectTo) selectTo.value = k;
                    if (convertPairSelect) {
                        const newPair = `${fromKey}-${k}`;
                        if (convertPairSelect.querySelector(`option[value="${newPair}"]`)) {
                            convertPairSelect.value = newPair;
                        }
                    }
                    performConversion();
                });

                multiGrid.appendChild(card);
            });
        }
    }

    performConversion();
}

function copyValueToClipboard(text, btnEl) {
    navigator.clipboard.writeText(text).then(() => {
        if (btnEl) {
            btnEl.innerHTML = "<i class='bx bx-check' style='color: #10b981;'></i>";
            setTimeout(() => {
                btnEl.innerHTML = "<i class='bx bx-copy'></i>";
            }, 1500);
        }
    });
}
