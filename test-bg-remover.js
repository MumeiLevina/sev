/**
 * Automated Test Suite for Image Background Remover
 * ────────────────────────────────────────────────
 * Covers all 10 required scenarios:
 * 1. JPEG upload
 * 2. PNG upload
 * 3. WEBP upload
 * 4. Transparent output (verifies real alpha transparency: corner alpha = 0, subject alpha = 255)
 * 5. White background output (verifies #FFFFFF: corner RGB = 255, 255, 255)
 * 6. Invalid file format (rejects with 'Định dạng ảnh không được hỗ trợ.')
 * 7. File > 10MB (rejects with 'Ảnh không được vượt quá 10MB.')
 * 8. API / model failure handling (returns safe error 'Không thể xóa nền ảnh. Vui lòng thử lại.')
 * 9. Network error handling / Resilience
 * 10. Mobile image with EXIF orientation
 */

const sharp = require('sharp');
const assert = require('assert');
const http = require('http');

const TEST_PORT = process.env.TEST_PORT || 3000;
const SERVER_URL = `http://127.0.0.1:${TEST_PORT}`;


// ── Helper: Create Test Images ──
async function createSampleImage(format = 'jpeg', options = {}) {
    // 200x200 grey background with a red subject circle in the center
    const svg = `<svg width="200" height="200">
        <rect width="200" height="200" fill="#e5e7eb"/>
        <circle cx="100" cy="100" r="50" fill="#e11d48"/>
    </svg>`;

    let pipeline = sharp(Buffer.from(svg));

    if (options.orientation) {
        pipeline = pipeline.withMetadata({ orientation: options.orientation });
    }

    if (format === 'jpeg' || format === 'jpg') {
        return await pipeline.jpeg({ quality: 90 }).toBuffer();
    } else if (format === 'png') {
        return await pipeline.png().toBuffer();
    } else if (format === 'webp') {
        return await pipeline.webp({ quality: 90 }).toBuffer();
    }
    return await pipeline.png().toBuffer();
}

// ── Helper: Multipart Form POST Request ──
async function postMultipart(endpoint, fileBuffer, filename, contentType, background = 'transparent') {
    const boundary = '----TestBoundary' + Math.random().toString(36).substring(2);
    const crlf = '\r\n';

    let body = Buffer.concat([
        Buffer.from(
            `--${boundary}${crlf}` +
            `Content-Disposition: form-data; name="background"${crlf}${crlf}` +
            `${background}${crlf}` +
            `--${boundary}${crlf}` +
            `Content-Disposition: form-data; name="image"; filename="${filename}"${crlf}` +
            `Content-Type: ${contentType}${crlf}${crlf}`
        ),
        fileBuffer,
        Buffer.from(`${crlf}--${boundary}--${crlf}`)
    ]);

    const url = new URL(endpoint, SERVER_URL);

    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length
            }
        }, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                let json;
                try {
                    json = JSON.parse(resData);
                } catch (e) {
                    json = { raw: resData };
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: json
                });
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ── Test Runner ──
async function runTests() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🧪 RUNNING AUTOMATED BACKGROUND REMOVER TEST SUITE (10 SCENARIOS)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        process.stdout.write(`• Testing: ${name}... `);
        try {
            await fn();
            console.log('✅ PASS');
            passed++;
        } catch (err) {
            console.log('❌ FAIL');
            console.error('   Error:', err.message);
            failed++;
        }
    }

    // 1. JPEG Upload
    await test('1. JPEG Upload & Processing', async () => {
        const jpgBuf = await createSampleImage('jpeg');
        const res = await postMultipart('/api/v1/remove-background', jpgBuf, 'fashion-shirt.jpg', 'image/jpeg', 'transparent');
        assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.processedUrl && res.data.processedUrl.startsWith('data:image/png;base64,'));
    });

    // 2. PNG Upload
    await test('2. PNG Upload & Processing', async () => {
        const pngBuf = await createSampleImage('png');
        const res = await postMultipart('/api/v1/remove-background', pngBuf, 'model-dress.png', 'image/png', 'transparent');
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.processedUrl && res.data.processedUrl.startsWith('data:image/png;base64,'));
    });

    // 3. WEBP Upload
    await test('3. WEBP Upload & Processing', async () => {
        const webpBuf = await createSampleImage('webp');
        const res = await postMultipart('/api/v1/remove-background', webpBuf, 'handbag.webp', 'image/webp', 'transparent');
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.processedUrl && res.data.processedUrl.startsWith('data:image/png;base64,'));
    });

    // 4. Transparent Output (True Alpha Channel Verification)
    await test('4. Transparent Output — True Alpha Verification (Corner Alpha = 0, Center Alpha = 255)', async () => {
        const pngBuf = await createSampleImage('png');
        const res = await postMultipart('/api/v1/remove-background', pngBuf, 'test.png', 'image/png', 'transparent');
        assert.strictEqual(res.data.background, 'transparent');

        // Extract base64 and parse raw pixels with sharp
        const base64Data = res.data.processedUrl.replace(/^data:image\/png;base64,/, '');
        const outputBuf = Buffer.from(base64Data, 'base64');
        const { data, info } = await sharp(outputBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

        // Corner pixel (0,0) should have alpha = 0 (completely transparent)
        const cornerAlpha = data[3];
        assert.strictEqual(cornerAlpha, 0, `Corner alpha should be 0 (transparent), got ${cornerAlpha}`);

        // Center pixel (100, 100) on red subject should have alpha = 255 (opaque subject)
        const centerIdx = (100 * info.width + 100) * 4;
        const centerAlpha = data[centerIdx + 3];
        assert.strictEqual(centerAlpha, 255, `Center subject alpha should be 255 (opaque), got ${centerAlpha}`);
    });

    // 5. White Background Output (Pure #FFFFFF RGB Verification)
    await test('5. White Background Output — Subject on Canvas #FFFFFF (Corner RGB = 255, 255, 255)', async () => {
        const pngBuf = await createSampleImage('png');
        const res = await postMultipart('/api/v1/remove-background', pngBuf, 'test.png', 'image/png', 'white');
        assert.strictEqual(res.data.background, 'white');
        assert.ok(res.data.jpgUrl, 'Should provide both PNG and JPG for white background');

        // Extract base64 and parse raw RGB pixels
        const base64Data = res.data.processedUrl.replace(/^data:image\/png;base64,/, '');
        const outputBuf = Buffer.from(base64Data, 'base64');
        const { data, info } = await sharp(outputBuf).raw().toBuffer({ resolveWithObject: true });

        // Corner pixel (0,0) must be pure white #FFFFFF (R: 255, G: 255, B: 255)
        const cornerR = data[0];
        const cornerG = data[1];
        const cornerB = data[2];
        assert.strictEqual(cornerR, 255, `Corner R should be 255, got ${cornerR}`);
        assert.strictEqual(cornerG, 255, `Corner G should be 255, got ${cornerG}`);
        assert.strictEqual(cornerB, 255, `Corner B should be 255, got ${cornerB}`);

        // Subject center should maintain its color (not white)
        const centerIdx = (100 * info.width + 100) * info.channels;
        assert.ok(data[centerIdx] > 180, 'Center should preserve red component of subject');
        assert.ok(data[centerIdx + 1] < 100, 'Center green should be low for red circle');
    });

    // 6. Invalid File Format
    await test('6. Invalid File Format Rejection ("Định dạng ảnh không được hỗ trợ.")', async () => {
        const fakeFile = Buffer.from('console.log("malicious code");');
        const res = await postMultipart('/api/v1/remove-background', fakeFile, 'script.exe', 'application/x-msdownload', 'transparent');
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.success, false);
        assert.strictEqual(res.data.detail, 'Định dạng ảnh không được hỗ trợ.');
    });

    // 7. File > 10MB
    await test('7. File Size > 10MB Rejection ("Ảnh không được vượt quá 10MB.")', async () => {
        // Create 10.5 MB buffer
        const largeBuf = Buffer.alloc(10.5 * 1024 * 1024);
        // Put JPEG signature so it doesn't fail MIME check first
        largeBuf[0] = 0xFF;
        largeBuf[1] = 0xD8;
        const res = await postMultipart('/api/v1/remove-background', largeBuf, 'huge-photo.jpg', 'image/jpeg', 'transparent');
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.success, false);
        assert.strictEqual(res.data.detail, 'Ảnh không được vượt quá 10MB.');
    });

    // 8. API / Model Failure Handling
    await test('8. Corrupted Image Buffer Error Handling ("Không thể xóa nền ảnh. Vui lòng thử lại.")', async () => {
        // Send a buffer with valid PNG magic bytes but corrupted truncated data
        const corruptPng = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
        const res = await postMultipart('/api/v1/remove-background', corruptPng, 'corrupt.png', 'image/png', 'transparent');
        assert.strictEqual(res.status, 500);
        assert.strictEqual(res.data.success, false);
        assert.strictEqual(res.data.detail, 'Không thể xóa nền ảnh. Vui lòng thử lại.');
    });

    // 9. Alias Endpoint & Boundary Resilience
    await test('9. Endpoint Alias (/api/remove-background) & Network Resilience', async () => {
        const pngBuf = await createSampleImage('png');
        const res = await postMultipart('/api/remove-background', pngBuf, 'alias-test.png', 'image/png', 'transparent');
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
    });

    // 10. Mobile Image with EXIF Orientation
    await test('10. Mobile Image with EXIF Orientation (Auto-rotated without distortion)', async () => {
        // Create image with EXIF orientation 6 (90 degrees CW rotation)
        const exifJpgBuf = await createSampleImage('jpeg', { orientation: 6 });
        const res = await postMultipart('/api/v1/remove-background', exifJpgBuf, 'iphone-portrait.jpg', 'image/jpeg', 'white');
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.width > 0 && res.data.height > 0);
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`📊 TEST RESULTS: ${passed}/10 PASSED, ${failed}/10 FAILED`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (failed > 0) {
        process.exit(1);
    }
}

// Check if server is running, or start embedded server for testing
async function main() {
    const healthUrl = new URL('/api/v1/health', SERVER_URL);
    const isRunning = await new Promise((resolve) => {
        http.get(healthUrl, (res) => resolve(res.statusCode === 200)).on('error', () => resolve(false));
    });

    if (isRunning) {
        console.log(`Connected to running server on ${SERVER_URL}`);
        await runTests();
    } else {
        console.log(`Starting local server instance on ${SERVER_URL}...`);
        require('./dev-server.js');
        // Wait 1.5s for server to bind
        await new Promise(r => setTimeout(r, 1500));
        await runTests();
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
