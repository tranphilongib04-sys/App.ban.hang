/**
 * PARSE STOCK API — Nhập kho siêu nhanh
 *
 * POST /parse-stock
 * Body: { raw: string, last_used_sku?: string, profile_sku?: string }
 *
 * - Chuẩn hoá: tách tk|mk|2fa (hoặc tk:mk, tk\tmk, tk mk)
 * - Validate từng dòng, fingerprint (chống trùng gợi ý)
 * - Đề xuất SKU: last_used + profile + keyword rules → top 3
 * - Trả về rows để client hiển thị preview table và gửi sang import-stock
 */

const { createClient } = require('@libsql/client/web');
const crypto = require('crypto');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) return null;
    return createClient({ url, authToken });
}

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

function requireAuth(event) {
    const token = (event.headers['authorization'] || '').replace('Bearer ', '');
    const expected = process.env.ADMIN_API_TOKEN;
    if (!expected) return { statusCode: 503, headers, body: JSON.stringify({ error: 'Admin API not configured' }) };
    if (token !== expected) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    return null;
}

/** Extract date/expiry patterns from text: (Date 29.04), [HSD: 29/04/2026], exp 2026-04-29, etc. */
const DATE_PATTERNS = [
    /\(Date\s+(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)\)/i,
    /\[HSD[:\s]*(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)\]/i,
    /\bHSD[:\s]+(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)/i,
    /\bexp(?:iry)?[:\s]+(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)/i,
    /\bdate[:\s]+(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)/i,
    /\((\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\)/,
];

function extractDate(text) {
    if (!text) return { cleaned: text, date: '' };
    for (const pat of DATE_PATTERNS) {
        const m = text.match(pat);
        if (m) {
            return {
                cleaned: text.replace(m[0], '').trim(),
                date: m[1].trim()
            };
        }
    }
    return { cleaned: text, date: '' };
}

/** Tách 1 dòng: hỗ trợ tk|mk|2fa, tk:mk, tk\tmk, tk mk (khoảng trắng) */
function parseLine(line) {
    const raw = (line || '').trim();
    if (!raw) return null;

    // First, extract date from the whole line
    const { cleaned: lineNoDate, date: lineDate } = extractDate(raw);
    const workLine = lineNoDate;

    let parts;
    if (workLine.includes('|')) parts = workLine.split('|').map(s => s.trim());
    else if (workLine.includes(':')) parts = workLine.split(':').map(s => s.trim());
    else if (workLine.includes('\t')) parts = workLine.split('\t').map(s => s.trim());
    else if (/\s+/.test(workLine)) parts = workLine.split(/\s+/).map(s => s.trim());
    else return { account: workLine, password: '', twofa: '', notes: '', date: lineDate };

    // Also check individual fields for embedded dates
    let account = (parts[0] || '').trim();
    let password = (parts[1] || '').trim();
    let twofa = (parts[2] || '').trim();
    let notes = (parts[3] || '').trim();
    let date = lineDate;

    if (!date) {
        // Try extracting from password field
        const fromPw = extractDate(password);
        if (fromPw.date) { password = fromPw.cleaned; date = fromPw.date; }
    }
    if (!date) {
        // Try extracting from notes field
        const fromNotes = extractDate(notes);
        if (fromNotes.date) { notes = fromNotes.cleaned; date = fromNotes.date; }
    }

    return { account, password, twofa, notes, date };
}

function fingerprint(account, password) {
    const n = (account || '').toLowerCase().trim() + '|' + (password || '').trim();
    return crypto.createHash('sha256').update(n).digest('hex').slice(0, 24);
}

/** Rule engine đơn giản: keyword/domain → gợi ý SKU (điểm cộng) */
const KEYWORD_RULES = [
    { pattern: /@edu\.|\.edu\b/i, sku: 'canva_pro_1y', score: 15 },
    { pattern: /canva/i, sku: 'canva_pro_1y', score: 10 },
    { pattern: /chatgpt|openai/i, sku: 'chatgpt_plus_1m', score: 15 },
    { pattern: /grok/i, sku: 'grok_7d', score: 15 },
    { pattern: /spotify/i, sku: 'spotify_premium_1m', score: 15 },
    { pattern: /netflix/i, sku: 'netflix_1m', score: 15 },
    { pattern: /youtube|yt\./i, sku: 'youtube_premium_1m', score: 12 },
    { pattern: /capcut|cap cut/i, sku: 'capcut_pro_1y', score: 12 },
    { pattern: /adobe/i, sku: 'adobe_1m', score: 12 },
    { pattern: /microsoft|365|outlook/i, sku: 'microsoft365_1y', score: 12 },
    { pattern: /otpauth:\/\//i, sku: 'chatgpt_plus_1m', score: 5 }
];

function suggestSkus(account, twofa, skuCodes, lastUsedSku, profileSku) {
    const scores = {};
    skuCodes.forEach(code => { scores[code] = 0; });
    if (lastUsedSku && scores[lastUsedSku] !== undefined) scores[lastUsedSku] += 30;
    if (profileSku && scores[profileSku] !== undefined) scores[profileSku] += 20;
    const text = (account || '') + ' ' + (twofa || '');
    KEYWORD_RULES.forEach(({ pattern, sku, score }) => {
        if (pattern.test(text) && scores[sku] !== undefined) scores[sku] += score;
    });
    const sorted = Object.entries(scores)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    const maxScore = Math.max(30 + 20, ...Object.values(scores), 1);
    return sorted.map(([sku_code, score]) => ({
        sku_code,
        confidence: Math.min(100, Math.round((score / maxScore) * 100))
    }));
}

exports.handler = async function (event, context) {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    const authError = requireAuth(event);
    if (authError) return authError;

    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const raw = (body.raw || '').trim();
        const lastUsedSku = (body.last_used_sku || '').trim() || null;
        const profileSku = (body.profile_sku || '').trim() || null;

        let skuCodes = body.sku_list && Array.isArray(body.sku_list)
            ? body.sku_list.map(s => s.sku_code || s).filter(Boolean)
            : [];

        if (skuCodes.length === 0) {
            const db = getDbClient();
            if (db) {
                const res = await db.execute("SELECT sku_code FROM skus WHERE is_active = 1 AND delivery_type = 'auto' ORDER BY sku_code");
                skuCodes = res.rows.map(r => r.sku_code);
            }
            if (skuCodes.length === 0) skuCodes = ['chatgpt_plus_1m', 'grok_7d', 'netflix_1m', 'spotify_premium_1m', 'canva_pro_1y', 'capcut_pro_1y'];
        }

        const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        const rows = [];
        let validCount = 0;
        let errorCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const parsed = parseLine(lines[i]);
            if (!parsed) continue;
            const { account, password, twofa, notes, date } = parsed;
            const hasAccount = account.length > 0;
            const status = hasAccount ? 'valid' : 'error';
            if (status === 'valid') validCount++; else errorCount++;
            const fp = hasAccount ? fingerprint(account, password) : '';
            const suggested_skus = suggestSkus(account, twofa, skuCodes, lastUsedSku, profileSku);
            if (suggested_skus.length === 0 && skuCodes.length > 0) {
                suggested_skus.push({ sku_code: lastUsedSku || profileSku || skuCodes[0], confidence: 50 });
            }
            rows.push({
                rowIndex: i + 1,
                account: account,
                password: password,
                twofa: twofa,
                notes: notes,
                date: date || '',
                fingerprint: fp,
                status,
                error: hasAccount ? null : 'Thiếu tài khoản',
                suggested_skus: suggested_skus.length ? suggested_skus : [{ sku_code: skuCodes[0] || 'chatgpt_plus_1m', confidence: 50 }]
            });
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                rows,
                summary: { valid: validCount, error: errorCount, total: rows.length }
            })
        };
    } catch (err) {
        console.error('Parse Stock Error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: err.message })
        };
    }
};
