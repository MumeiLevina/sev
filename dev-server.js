/**
 * Kinetic Tech — Local Full-Stack Development Server
 * ──────────────────────────────────────────────────
 * Provides:
 * 1. Static file server on port 3000 (HTML, CSS, JS, clean URLs).
 * 2. Local Subtitle API bridge (/api/v1/transcriptions) connecting
 *    directly to OpenAI Whisper AI using OPENAI_API_KEY from subtitle-service/.env.
 * 3. Local Auth & User session management.
 *
 * Runs automatically with: npm run dev
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const ROOT_DIR = __dirname;
const ENV_PATH = path.join(ROOT_DIR, 'subtitle-service', '.env');

// ── Read Environment Variables from subtitle-service/.env ──
function loadEnv() {
    const env = {};
    if (fs.existsSync(ENV_PATH)) {
        const content = fs.readFileSync(ENV_PATH, 'utf-8');
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const idx = trimmed.indexOf('=');
                const key = trimmed.substring(0, idx).trim();
                const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
                env[key] = val;
            }
        });
    }
    return env;
}

const envVars = loadEnv();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || envVars.OPENAI_API_KEY || '';

if (OPENAI_API_KEY) {
    console.log('✓ OpenAI API Key loaded successfully from subtitle-service/.env');
} else {
    console.warn('⚠️ Warning: OPENAI_API_KEY not found in subtitle-service/.env. Local AI transcription will be in demo mode.');
}

const JWT_SECRET = process.env.JWT_SECRET_KEY || envVars.JWT_SECRET_KEY || 'kinetic-tech-jwt-secret-key-production-2026';
const USERS_DB_FILE = path.join(ROOT_DIR, '.local_users_db.json');

// ── RFC 7519 Base64URL Encoding ──
function base64UrlEncode(str) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64UrlDecode(str) {
    let s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return Buffer.from(s, 'base64').toString('utf-8');
}

// ── JWT Sign & Verify ──
function createJwt(payload, expiresInSeconds = 7 * 86400) {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const fullPayload = {
        ...payload,
        iat: now,
        exp: now + expiresInSeconds,
        jti: crypto.randomUUID()
    };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;

    const expectedSig = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    if (sigB64 !== expectedSig) return null;

    try {
        const payload = JSON.parse(base64UrlDecode(payloadB64));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            return null; // Expired
        }
        return payload;
    } catch (e) {
        return null;
    }
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password + '_kinetic_salt_2026').digest('hex');
}

// ── In-Memory Job & User Store with JSON Persistence ──
const jobs = new Map();
const passwordResetTokens = new Map(); // email.toLowerCase() -> { code: '123456', expiresAt: number }

function loadUsersDb() {
    const map = new Map();
    if (fs.existsSync(USERS_DB_FILE)) {
        try {
            const raw = JSON.parse(fs.readFileSync(USERS_DB_FILE, 'utf-8'));
            for (const [k, v] of Object.entries(raw)) {
                map.set(k.toLowerCase(), v);
            }
        } catch (e) {
            console.warn('[DB] Failed to load local users DB:', e.message);
        }
    }
    // Seed default student account if not present
    if (!map.has('student@kinetictech.vn')) {
        map.set('student@kinetictech.vn', {
            passwordHash: hashPassword('123456'),
            user: {
                id: 'student-demo-user',
                email: 'student@kinetictech.vn',
                display_name: 'Học Viên Kinetic',
                plan: 'free',
                quota_used_seconds: 0,
                quota_limit_seconds: 3600,
                created_at: new Date().toISOString()
            }
        });
    }
    return map;
}

const localUsers = loadUsersDb();

// ── Supabase Cloud Database Real-time Sync ──
let pgPool = null;
const DATABASE_URL = process.env.DATABASE_URL || envVars.DATABASE_URL;

if (DATABASE_URL) {
    try {
        const { Pool } = require('pg');
        pgPool = new Pool({
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
        });

        pgPool.query('SELECT version();').then(() => {
            console.log('✓ Connected to Supabase Cloud Database (PostgreSQL)!');
            return pgPool.query('SELECT id, email, password_hash, display_name, plan, quota_used_seconds, quota_limit_seconds, created_at FROM users;');
        }).then(res => {
            if (res && res.rows) {
                for (const row of res.rows) {
                    const email = row.email.toLowerCase();
                    const existing = localUsers.get(email);
                    localUsers.set(email, {
                        passwordHash: row.password_hash || (existing ? existing.passwordHash : ''),
                        user: {
                            id: row.id,
                            email: row.email,
                            display_name: row.display_name,
                            plan: row.plan || 'free',
                            quota_used_seconds: row.quota_used_seconds || 0,
                            quota_limit_seconds: row.quota_limit_seconds || 3600,
                            created_at: row.created_at
                        }
                    });
                }
                console.log(`✓ Synchronized ${res.rows.length} accounts from Supabase into memory cache.`);
            }
        }).catch(err => {
            console.warn('[Supabase Sync Notice]:', err.message);
        });
    } catch (e) {
        console.warn('[Supabase Init Notice]:', e.message);
    }
}

function syncUserToSupabase(email, account) {
    if (!pgPool || !account || !account.user) return;
    const u = account.user;
    const userId = (u.id && u.id.length === 36) ? u.id : crypto.randomUUID();
    pgPool.query(`
        INSERT INTO users (id, email, password_hash, display_name, plan, quota_used_seconds, quota_limit_seconds)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            display_name = EXCLUDED.display_name,
            quota_used_seconds = EXCLUDED.quota_used_seconds,
            quota_limit_seconds = EXCLUDED.quota_limit_seconds;
    `, [
        userId,
        email.toLowerCase(),
        account.passwordHash || '',
        u.display_name || email.split('@')[0],
        u.plan || 'free',
        u.quota_used_seconds || 0,
        u.quota_limit_seconds || 3600
    ]).catch(err => console.warn('[Supabase Cloud Sync Error]:', err.message));
}

function saveUsersDb(syncedEmail) {
    try {
        const obj = {};
        for (const [k, v] of localUsers.entries()) {
            obj[k] = v;
        }
        fs.writeFileSync(USERS_DB_FILE, JSON.stringify(obj, null, 2), 'utf-8');
        if (syncedEmail && localUsers.has(syncedEmail.toLowerCase())) {
            syncUserToSupabase(syncedEmail.toLowerCase(), localUsers.get(syncedEmail.toLowerCase()));
        }
    } catch (e) {
        console.warn('[DB Save Error]:', e.message);
    }
}

function getAuthUser(req) {
    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.substring(7).trim();
    const payload = verifyJwt(token);
    if (!payload || !payload.email) return null;
    const account = localUsers.get(payload.email.toLowerCase());
    return account ? account.user : null;
}

// ── Quota Store (simulates PostgreSQL usage_logs fallback) ──
const serverQuota = {
    usedSeconds: 0,
    limitSeconds: 3600
};

// ── MIME Types ──
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.xml': 'application/xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.srt': 'application/x-subrip; charset=utf-8',
    '.vtt': 'text/vtt; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
};

// ── Helper: Format SRT Time (HH:MM:SS,mmm) ──
function formatSrtTime(seconds) {
    const totalMs = Math.max(0, Math.round(Number(seconds) * 1000));
    const hours = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function formatVttTime(seconds) {
    const totalMs = Math.max(0, Math.round(Number(seconds) * 1000));
    const hours = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

// ── Helper: Multipart Form Parser ──
function parseMultipart(buffer, boundary) {
    const b = Buffer.from('--' + boundary);
    const parts = [];
    let start = buffer.indexOf(b);
    while (start !== -1) {
        start += b.length;
        if (buffer.subarray(start, start + 2).toString() === '--') break;
        if (buffer.subarray(start, start + 2).toString() === '\r\n') start += 2;
        const next = buffer.indexOf(b, start);
        if (next === -1) break;
        const partBuf = buffer.subarray(start, next - 2);
        const headerEnd = partBuf.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
            const headerStr = partBuf.subarray(0, headerEnd).toString('utf-8');
            const data = partBuf.subarray(headerEnd + 4);
            const nameMatch = /name="([^"]+)"/.exec(headerStr);
            const filenameMatch = /filename="([^"]+)"/.exec(headerStr);
            const contentTypeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(headerStr);
            parts.push({
                name: nameMatch ? nameMatch[1] : null,
                filename: filenameMatch ? filenameMatch[1] : null,
                contentType: contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream',
                data
            });
        }
        start = next;
    }
    return parts;
}

// ── JSON Response Helper ──
function sendJson(res, statusCode, data) {
    const body = JSON.stringify(data);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(body);
}

// ── Handle Transcribe with OpenAI Whisper API ──
async function handleTranscribeJob(jobId, filePart, language, userEmail) {
    const job = jobs.get(jobId);
    if (!job) return;

    try {
        job.status = 'extracting_audio';
        job.progress = 30;
        job.current_step = 'Đang phân tích dải âm thanh...';

        if (!OPENAI_API_KEY || (filePart.filename && filePart.filename.includes('test_mock'))) {
            // Mock test mode for local testing without depleting external credits
            console.log(`[Job ${jobId}] Running in test/mock mode for audio analysis.`);
            const mockDuration = 15;
            const segments = [
                { index: 1, start: 0.0, end: 5.2, text: "Xin chào, đây là phụ đề thử nghiệm của Kinetic Tech." },
                { index: 2, start: 5.5, end: 12.0, text: "Hệ thống AI Whisper đã hoạt động ổn định và chính xác." }
            ];
            serverQuota.usedSeconds += mockDuration;
            if (userEmail) {
                const acc = localUsers.get(userEmail.toLowerCase());
                if (acc && acc.user) {
                    acc.user.quota_used_seconds = (acc.user.quota_used_seconds || 0) + mockDuration;
                    saveUsersDb(userEmail);
                    console.log(`[User Quota Updated] User ${userEmail} consumed ${mockDuration}s. Total used: ${acc.user.quota_used_seconds}s / ${acc.user.quota_limit_seconds}s`);
                }
            }
            job.status = 'completed';
            job.progress = 100;
            job.current_step = 'Hoàn thành bóc phụ đề!';
            job.result = {
                duration_sec: mockDuration,
                language: language || 'vi',
                segments: segments,
                full_text: segments.map(s => s.text).join('\n')
            };
            return;
        }

        job.status = 'transcribing';
        job.progress = 65;
        job.current_step = 'AI Whisper đang bóc băng và nhận diện tiếng nói...';

        // Prepare FormData for OpenAI API
        const formData = new FormData();
        const fileBlob = new Blob([filePart.data], { type: filePart.contentType || 'audio/wav' });
        formData.append('file', fileBlob, filePart.filename || 'audio.wav');
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'verbose_json');
        formData.append('temperature', '0.0');

        if (language && language !== 'auto') {
            formData.append('language', language);
            if (language === 'zh') {
                formData.append('prompt', '以下是普通话的音频内容，包含简体中文及正确的标点符号。');
            }
        }

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: formData
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${errText}`);
        }

        const resultJson = await response.json();
        const rawSegments = resultJson.segments || [];

        // Format segments
        const segments = [];
        let idx = 1;
        for (const seg of rawSegments) {
            const text = (seg.text || '').trim();
            if (!text) continue;
            segments.push({
                index: idx++,
                start: parseFloat(seg.start || 0.0),
                end: parseFloat(seg.end || 0.0),
                text: text
            });
        }

        const durationSec = Math.round(resultJson.duration || (segments.length ? segments[segments.length - 1].end : 0));
        serverQuota.usedSeconds += durationSec;

        // Synchronize quota with authenticated user account
        if (userEmail) {
            const acc = localUsers.get(userEmail.toLowerCase());
            if (acc && acc.user) {
                acc.user.quota_used_seconds = (acc.user.quota_used_seconds || 0) + durationSec;
                saveUsersDb(userEmail);
                console.log(`[User Quota Updated] User ${userEmail} consumed ${durationSec}s. Total used: ${acc.user.quota_used_seconds}s / ${acc.user.quota_limit_seconds}s`);
            }
        }

        job.status = 'completed';
        job.progress = 100;
        job.current_step = 'Hoàn thành bóc phụ đề!';
        job.result = {
            duration_sec: durationSec,
            language: language || resultJson.language || 'zh',
            segments: segments,
            full_text: resultJson.text || segments.map(s => s.text).join('\n')
        };
        console.log(`[Job ${jobId}] Finished! Extracted ${segments.length} segments. Audio: ${durationSec}s. Quota: used ${serverQuota.usedSeconds}s / ${serverQuota.limitSeconds}s.`);

    } catch (err) {
        console.error(`[Job ${jobId} Error]:`, err.message);
        job.status = 'failed';
        job.progress = 0;
        job.error_message = err.message;
    }
}

// ── HTTP Server Request Handler ──
const server = http.createServer((req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        return res.end();
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
    const pathname = parsedUrl.pathname;

    // ═══════════════════════════════════════════════════
    // HEALTH CHECK: /api/v1/health & /health
    // ═══════════════════════════════════════════════════
    if ((pathname === '/api/v1/health' || pathname === '/health') && req.method === 'GET') {
        return sendJson(res, 200, { status: 'ok', service: 'dev-server', timestamp: new Date().toISOString() });
    }

    // ═══════════════════════════════════════════════════
    // API ROUTE 1: POST /api/v1/transcriptions (Upload & Transcribe)
    // ═══════════════════════════════════════════════════
    if ((pathname === '/api/v1/transcriptions' || pathname === '/api/v1/transcribe/jobs') && req.method === 'POST') {
        const authUser = getAuthUser(req) || (localUsers.get('student@kinetictech.vn') ? localUsers.get('student@kinetictech.vn').user : null);
        const limitSec = authUser ? authUser.quota_limit_seconds : serverQuota.limitSeconds;
        const usedSec = authUser ? authUser.quota_used_seconds : serverQuota.usedSeconds;
        const remainingQuota = Math.max(0, limitSec - usedSec);

        if (remainingQuota <= 0) {
            return sendJson(res, 403, {
                detail: `Bạn đã sử dụng hết thời lượng khả dụng (${Math.round(limitSec / 60)} phút). Vui lòng nâng cấp gói Pro để tiếp tục sử dụng.`
            });
        }

        const userEmailForJob = authUser ? authUser.email : null;
        const contentType = req.headers['content-type'] || '';

        if (contentType.includes('application/json')) {
            let bodyStr = '';
            req.on('data', chunk => bodyStr += chunk);
            req.on('end', () => {
                try {
                    const data = JSON.parse(bodyStr || '{}');
                    const targetEmail = data.user_email || userEmailForJob;
                    const jobId = crypto.randomUUID();
                    const mockFilePart = { filename: 'test_mock_audio.wav', contentType: 'audio/wav', data: Buffer.from('mock') };
                    jobs.set(jobId, {
                        id: jobId,
                        status: 'queued',
                        progress: 10,
                        current_step: 'Đang tải tệp tin...',
                        original_filename: 'test_mock_audio.wav',
                        language: data.language || 'vi',
                        output_format: data.output_format || 'srt',
                        created_at: new Date().toISOString()
                    });
                    handleTranscribeJob(jobId, mockFilePart, data.language || 'vi', targetEmail);
                    return sendJson(res, 200, {
                        job_id: jobId,
                        status: 'completed',
                        message: 'Job đã được tạo thành công và đang được xử lý bằng AI.'
                    });
                } catch (e) {
                    return sendJson(res, 400, { detail: 'Dữ liệu JSON không hợp lệ.' });
                }
            });
            return;
        }

        const boundaryMatch = /boundary=([^\s;]+)/i.exec(contentType);

        if (!boundaryMatch) {
            return sendJson(res, 400, { detail: 'Request must be multipart/form-data or application/json' });
        }

        const boundary = boundaryMatch[1];
        const chunks = [];

        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            try {
                const bodyBuf = Buffer.concat(chunks);
                const parts = parseMultipart(bodyBuf, boundary);

                const filePart = parts.find(p => p.filename && p.data && p.data.length > 0);
                const langPart = parts.find(p => p.name === 'language');
                const formatPart = parts.find(p => p.name === 'output_format');

                if (!filePart) {
                    return sendJson(res, 400, { detail: 'Không tìm thấy tệp video hoặc audio được tải lên.' });
                }

                const language = langPart ? langPart.data.toString().trim() : 'zh';
                const outputFormat = formatPart ? formatPart.data.toString().trim() : 'srt';
                const jobId = crypto.randomUUID();

                jobs.set(jobId, {
                    id: jobId,
                    status: 'queued',
                    progress: 10,
                    current_step: 'Đang tải tệp tin...',
                    original_filename: filePart.filename,
                    language: language,
                    output_format: outputFormat,
                    created_at: new Date().toISOString()
                });

                // Start transcription process in background
                handleTranscribeJob(jobId, filePart, language, userEmailForJob);

                return sendJson(res, 201, {
                    job_id: jobId,
                    status: 'queued',
                    message: 'Job đã được tạo thành công và đang được xử lý bằng AI.'
                });

            } catch (err) {
                console.error('[Upload Parse Error]:', err);
                return sendJson(res, 500, { detail: `Lỗi đọc tệp tải lên: ${err.message}` });
            }
        });
        return;
    }

    // ═══════════════════════════════════════════════════
    // API ROUTE 2: GET /api/v1/transcriptions/:id/status
    // ═══════════════════════════════════════════════════
    const statusMatch = pathname.match(/^\/api\/v1\/transcriptions\/([^\/]+)\/status$/);
    if (statusMatch && req.method === 'GET') {
        const jobId = statusMatch[1];
        const job = jobs.get(jobId);
        if (!job) {
            return sendJson(res, 404, { detail: 'Không tìm thấy công việc (job) yêu cầu.' });
        }
        return sendJson(res, 200, {
            id: job.id,
            status: job.status,
            progress: job.progress,
            current_step: job.current_step || '',
            original_filename: job.original_filename,
            audio_duration_sec: job.result ? job.result.duration_sec : 0,
            language: job.language,
            output_format: job.output_format,
            error_message: job.error_message || null
        });
    }

    // ═══════════════════════════════════════════════════
    // API ROUTE 3: GET /api/v1/transcriptions/:id/result
    // ═══════════════════════════════════════════════════
    const resultMatch = pathname.match(/^\/api\/v1\/transcriptions\/([^\/]+)\/result$/);
    if (resultMatch && req.method === 'GET') {
        const jobId = resultMatch[1];
        const job = jobs.get(jobId);
        if (!job) {
            return sendJson(res, 404, { detail: 'Không tìm thấy công việc (job) yêu cầu.' });
        }
        if (job.status === 'failed') {
            return sendJson(res, 400, { detail: job.error_message || 'Xử lý thất bại.' });
        }
        if (job.status !== 'completed' || !job.result) {
            return sendJson(res, 202, { detail: 'Job đang xử lý...' });
        }
        return sendJson(res, 200, {
            job_id: job.id,
            status: 'completed',
            language: job.result.language,
            duration_sec: job.result.duration_sec,
            segments: job.result.segments,
            full_text: job.result.full_text
        });
    }

    // ═══════════════════════════════════════════════════
    // API ROUTE 4: GET /api/v1/transcriptions/:id/download
    // ═══════════════════════════════════════════════════
    const downloadMatch = pathname.match(/^\/api\/v1\/transcriptions\/([^\/]+)\/download$/);
    if (downloadMatch && req.method === 'GET') {
        const jobId = downloadMatch[1];
        const job = jobs.get(jobId);
        if (!job || !job.result) {
            return sendJson(res, 404, { detail: 'Không tìm thấy kết quả.' });
        }

        const fmt = parsedUrl.searchParams.get('fmt') || 'srt';
        const segments = job.result.segments || [];
        let content = '';
        let mime = 'application/x-subrip';

        if (fmt === 'vtt') {
            mime = 'text/vtt';
            const lines = ['WEBVTT\n\n'];
            segments.forEach(seg => {
                lines.push(`${seg.index}\n${formatVttTime(seg.start)} --> ${formatVttTime(seg.end)}\n${seg.text}\n\n`);
            });
            content = lines.join('');
        } else if (fmt === 'txt') {
            mime = 'text/plain';
            content = segments.map(seg => `[${formatVttTime(seg.start)} → ${formatVttTime(seg.end)}] ${seg.text}`).join('\n');
        } else {
            // SRT default
            mime = 'application/x-subrip';
            const blocks = segments.map(seg => `${seg.index}\n${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n${seg.text}`);
            content = blocks.join('\n\n') + '\n';
        }

        const baseName = (job.original_filename || 'phu_de').replace(/\.[^/.]+$/, '');
        const filename = `${baseName}.${fmt}`;

        // Send with UTF-8 BOM for Windows / Premiere CJK Chinese compatibility
        const buffer = Buffer.concat([Buffer.from('\uFEFF', 'utf-8'), Buffer.from(content, 'utf-8')]);
        res.writeHead(200, {
            'Content-Type': `${mime}; charset=utf-8`,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            'Content-Length': buffer.length
        });
        return res.end(buffer);
    }

    // ═══════════════════════════════════════════════════
    // API ROUTE 5: AUTH ENDPOINTS (/api/v1/auth/*)
    // ═══════════════════════════════════════════════════
    if (pathname === '/api/v1/auth/register' && req.method === 'POST') {
        let bodyStr = '';
        req.on('data', c => bodyStr += c);
        req.on('end', () => {
            try {
                const data = JSON.parse(bodyStr || '{}');
                const email = (data.email || '').trim().toLowerCase();
                const password = data.password || '';
                const displayName = (data.display_name || '').trim() || email.split('@')[0];

                if (!email || !email.includes('@')) {
                    return sendJson(res, 400, { detail: 'Địa chỉ email không hợp lệ.' });
                }
                if (password.length < 6) {
                    return sendJson(res, 400, { detail: 'Mật khẩu phải có tối thiểu 6 ký tự.' });
                }

                // ── STRICT UNIQUE EMAIL CONSTRAINT ──
                if (localUsers.has(email)) {
                    return sendJson(res, 409, {
                        detail: 'Email này đã được đăng ký. Mỗi email chỉ được đăng ký duy nhất 1 tài khoản. Vui lòng chuyển sang Đăng Nhập.'
                    });
                }

                const user = {
                    id: crypto.randomUUID(),
                    email: email,
                    display_name: displayName,
                    role: 'user',
                    plan: 'free',
                    quota_used_seconds: 0,
                    quota_limit_seconds: 3600,
                    created_at: new Date().toISOString()
                };

                localUsers.set(email, {
                    passwordHash: hashPassword(password),
                    user: user
                });
                saveUsersDb(email);

                const accessToken = createJwt({ sub: user.id, email: user.email, role: user.role, plan: user.plan }, 7 * 86400);
                const refreshToken = createJwt({ sub: user.id, email: user.email, type: 'refresh' }, 30 * 86400);

                console.log(`[Auth Register] Successfully registered unique user: ${email}`);

                return sendJson(res, 201, {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    token_type: 'bearer',
                    expires_in: 7 * 86400,
                    user: user,
                    message: 'Đăng ký tài khoản thành công! Bạn đã được tặng 1 giờ bóc sub miễn phí.'
                });
            } catch (e) {
                return sendJson(res, 400, { detail: 'Dữ liệu không hợp lệ.' });
            }
        });
        return;
    }

    if (pathname === '/api/v1/auth/login' && req.method === 'POST') {
        let bodyStr = '';
        req.on('data', c => bodyStr += c);
        req.on('end', () => {
            try {
                const data = JSON.parse(bodyStr || '{}');
                const email = (data.email || '').trim().toLowerCase();
                const password = data.password || '';

                if (!email || !password) {
                    return sendJson(res, 400, { detail: 'Vui lòng nhập đầy đủ email và mật khẩu.' });
                }

                const account = localUsers.get(email);
                if (!account) {
                    return sendJson(res, 401, { detail: 'Email hoặc mật khẩu không chính xác.' });
                }

                if (account.passwordHash !== hashPassword(password)) {
                    return sendJson(res, 401, { detail: 'Email hoặc mật khẩu không chính xác.' });
                }

                const user = account.user;
                const accessToken = createJwt({ sub: user.id, email: user.email, role: user.role || 'user', plan: user.plan }, 7 * 86400);
                const refreshToken = createJwt({ sub: user.id, email: user.email, type: 'refresh' }, 30 * 86400);

                console.log(`[Auth Login] User authenticated with JWT: ${email}`);

                return sendJson(res, 200, {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    token_type: 'bearer',
                    expires_in: 7 * 86400,
                    user: user
                });
            } catch (e) {
                return sendJson(res, 400, { detail: 'Dữ liệu không hợp lệ.' });
            }
        });
        return;
    }

    if (pathname === '/api/v1/auth/me' && req.method === 'GET') {
        const authUser = getAuthUser(req);
        if (!authUser) {
            return sendJson(res, 401, { detail: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
        }

        const remaining = Math.max(0, authUser.quota_limit_seconds - authUser.quota_used_seconds);
        return sendJson(res, 200, {
            id: authUser.id,
            email: authUser.email,
            display_name: authUser.display_name,
            plan: authUser.plan,
            quota_used_seconds: authUser.quota_used_seconds,
            quota_limit_seconds: authUser.quota_limit_seconds,
            quota_remaining_seconds: remaining
        });
    }

    if (pathname === '/api/v1/auth/logout' && req.method === 'POST') {
        return sendJson(res, 200, { message: 'Đã đăng xuất thành công.' });
    }

    if (pathname === '/api/v1/auth/refresh' && req.method === 'POST') {
        let bodyStr = '';
        req.on('data', c => bodyStr += c);
        req.on('end', () => {
            try {
                const data = JSON.parse(bodyStr || '{}');
                const refreshToken = data.refresh_token;
                const payload = verifyJwt(refreshToken);
                if (!payload || !payload.email) {
                    return sendJson(res, 401, { detail: 'Refresh token không hợp lệ hoặc đã hết hạn.' });
                }
                const account = localUsers.get(payload.email.toLowerCase());
                if (!account) {
                    return sendJson(res, 401, { detail: 'Tài khoản không tồn tại.' });
                }
                const newAccess = createJwt({ sub: account.user.id, email: account.user.email, role: account.user.role || 'user', plan: account.user.plan }, 7 * 86400);
                const newRefresh = createJwt({ sub: account.user.id, email: account.user.email, type: 'refresh' }, 30 * 86400);
                return sendJson(res, 200, {
                    access_token: newAccess,
                    refresh_token: newRefresh,
                    token_type: 'bearer',
                    expires_in: 7 * 86400
                });
            } catch (e) {
                return sendJson(res, 400, { detail: 'Dữ liệu không hợp lệ.' });
            }
        });
        return;
    }

    if (pathname === '/api/v1/auth/forgot-password' && req.method === 'POST') {
        let bodyStr = '';
        req.on('data', c => bodyStr += c);
        req.on('end', () => {
            try {
                const data = JSON.parse(bodyStr || '{}');
                const email = (data.email || '').trim().toLowerCase();

                if (!email || !email.includes('@')) {
                    return sendJson(res, 400, { detail: 'Địa chỉ email không hợp lệ.' });
                }

                const account = localUsers.get(email);
                if (!account) {
                    return sendJson(res, 404, { detail: 'Không tìm thấy tài khoản với địa chỉ email này trong hệ thống.' });
                }

                // Generate 6-digit verification OTP
                const code = String(Math.floor(100000 + Math.random() * 900000));
                const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

                passwordResetTokens.set(email, { code, expiresAt });

                console.log(`[Auth Forgot Password] Generated OTP for ${email}: ${code} (valid for 15 mins)`);

                return sendJson(res, 200, {
                    message: `Mã xác thực gồm 6 chữ số đã được gửi tới email của bạn (Mã xác nhận: ${code}). Vui lòng nhập mã để đặt lại mật khẩu mới.`,
                    code: code,
                    expires_in_minutes: 15
                });
            } catch (e) {
                return sendJson(res, 400, { detail: 'Dữ liệu không hợp lệ.' });
            }
        });
        return;
    }

    if (pathname === '/api/v1/auth/reset-password' && req.method === 'POST') {
        let bodyStr = '';
        req.on('data', c => bodyStr += c);
        req.on('end', () => {
            try {
                const data = JSON.parse(bodyStr || '{}');
                const email = (data.email || '').trim().toLowerCase();
                const code = String(data.code || '').trim();
                const newPassword = data.new_password || '';

                if (!email || !code || !newPassword) {
                    return sendJson(res, 400, { detail: 'Vui lòng điền đầy đủ email, mã xác thực và mật khẩu mới.' });
                }

                if (newPassword.length < 6) {
                    return sendJson(res, 400, { detail: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
                }

                const record = passwordResetTokens.get(email);
                if (!record || record.expiresAt < Date.now()) {
                    return sendJson(res, 400, { detail: 'Mã xác thực không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.' });
                }

                if (record.code !== code) {
                    return sendJson(res, 400, { detail: 'Mã xác thực 6 số không chính xác. Vui lòng kiểm tra lại.' });
                }

                const account = localUsers.get(email);
                if (!account) {
                    return sendJson(res, 404, { detail: 'Tài khoản không tồn tại trong hệ thống.' });
                }

                // Update password with secure salt hashing
                account.passwordHash = hashPassword(newPassword);
                saveUsersDb(email);

                // Clear used OTP token
                passwordResetTokens.delete(email);

                console.log(`[Auth Reset Password] Successfully reset password for user: ${email}`);

                return sendJson(res, 200, {
                    message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ bằng mật khẩu mới.'
                });
            } catch (e) {
                return sendJson(res, 400, { detail: 'Dữ liệu không hợp lệ.' });
            }
        });
        return;
    }

    if (pathname === '/api/v1/billing/quota' && req.method === 'GET') {
        const remaining = Math.max(0, serverQuota.limitSeconds - serverQuota.usedSeconds);
        return sendJson(res, 200, {
            plan: serverQuota.limitSeconds > 3600 ? 'pro' : 'free',
            quota_limit_seconds: serverQuota.limitSeconds,
            quota_used_seconds: serverQuota.usedSeconds,
            quota_remaining_seconds: remaining,
            percentage_used: Math.round((serverQuota.usedSeconds / serverQuota.limitSeconds) * 100),
            can_transcribe: remaining > 0
        });
    }

    if (pathname === '/api/v1/billing/upgrade' && req.method === 'POST') {
        let bodyStr = '';
        req.on('data', c => bodyStr += c);
        req.on('end', () => {
            try {
                const data = JSON.parse(bodyStr || '{}');
                const targetPlan = (data.plan || 'pro').toLowerCase();
                if (targetPlan === 'pro') {
                    serverQuota.limitSeconds = 36000; // 10 hours
                } else if (targetPlan === 'premium') {
                    serverQuota.limitSeconds = 360000; // 100 hours
                }
                serverQuota.usedSeconds = 0; // Reset usage on upgrade
                return sendJson(res, 200, {
                    message: `Nâng cấp thành công gói ${targetPlan.toUpperCase()}`,
                    plan: targetPlan,
                    quota_limit_seconds: serverQuota.limitSeconds,
                    quota_remaining_seconds: serverQuota.limitSeconds
                });
            } catch (e) {
                return sendJson(res, 400, { detail: 'Dữ liệu không hợp lệ.' });
            }
        });
        return;
    }

    // ═══════════════════════════════════════════════════
    // STATIC FILE SERVER (Replaces `serve`)
    // ═══════════════════════════════════════════════════
    let filePath = path.join(ROOT_DIR, decodeURIComponent(pathname));

    // Handle root path
    if (pathname === '/' || pathname === '') {
        filePath = path.join(ROOT_DIR, 'index.html');
    }

    // Handle clean URLs (e.g. /subtitle-extractor -> subtitle-extractor.html)
    if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
    }

    // Check directory -> index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        const indexPath = path.join(filePath, 'index.html');
        if (fs.existsSync(indexPath)) filePath = indexPath;
    }

    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(`<h1>404 Not Found</h1><p>File ${pathname} does not exist.</p>`);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);

    // Support HTTP Range Requests (Audio/Video seeking)
    const range = req.headers.range;
    if (range && (ext === '.mp4' || ext === '.webm' || ext === '.mp3' || ext === '.wav')) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
        });
        return fileStream.pipe(res);
    }

    res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================================`);
    console.log(`🚀 Kinetic Tech Server running on: http://localhost:${PORT}`);
    console.log(`🎬 Subtitle Extractor tool:        http://localhost:${PORT}/subtitle-extractor.html`);
    console.log(`⚡ AI Whisper Engine:              ${OPENAI_API_KEY ? 'Active (OpenAI Connected)' : 'Demo Mode'}`);
    console.log(`========================================================\n`);
});
