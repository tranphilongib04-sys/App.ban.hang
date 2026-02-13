/**
 * ADMIN COUPONS API
 *
 * GET  ?action=list      → List all coupons with status
 * POST action=generate   → Auto-generate batch of coupons
 * POST action=toggle     → Enable/disable coupon
 * POST action=delete     → Delete coupon
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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
};

function checkAuth(event) {
    const token = process.env.ADMIN_API_TOKEN;
    if (!token) return false;
    const auth = event.headers['authorization'] || '';
    return auth === `Bearer ${token}`;
}

/**
 * Generate a random coupon code like TBQ-XKRN-7M2P
 */
function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
    let code = 'TBQ-';
    for (let i = 0; i < 4; i++) {
        code += chars[crypto.randomInt(chars.length)];
    }
    code += '-';
    for (let i = 0; i < 4; i++) {
        code += chars[crypto.randomInt(chars.length)];
    }
    return code;
}

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    if (!checkAuth(event)) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const db = getDbClient();
    if (!db) return { statusCode: 500, headers, body: JSON.stringify({ error: 'DB not configured' }) };

    try {
        // ── GET: List coupons ──
        if (event.httpMethod === 'GET') {
            const { action } = event.queryStringParameters || {};

            if (action === 'list') {
                const result = await db.execute(`
                    SELECT
                        c.id,
                        c.code,
                        c.discount_percent,
                        c.description,
                        c.sku_codes,
                        c.expires_at,
                        c.max_uses,
                        c.used_count,
                        c.is_active,
                        c.created_at
                    FROM coupons c
                    ORDER BY c.created_at DESC
                `);

                return {
                    statusCode: 200, headers,
                    body: JSON.stringify({ success: true, coupons: result.rows })
                };
            }

            if (action === 'skus') {
                const result = await db.execute(`
                    SELECT sku_code, name, category, price, delivery_type
                    FROM skus
                    WHERE is_active = 1
                    ORDER BY category, name
                `);

                return {
                    statusCode: 200, headers,
                    body: JSON.stringify({ success: true, skus: result.rows })
                };
            }

            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing action parameter' }) };
        }

        // ── POST: Generate / Toggle / Delete ──
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            const { action } = body;

            if (action === 'generate') {
                const { discountPercent, quantity, expiresAt, description, skuCodes } = body;

                // Validate discount percent (must be multiple of 5, 5-100)
                const pct = parseInt(discountPercent);
                if (!pct || pct < 5 || pct > 100 || pct % 5 !== 0) {
                    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Giảm giá phải là bội số 5 (5-100%)' }) };
                }

                const qty = Math.min(parseInt(quantity) || 1, 50); // max 50 at once
                if (!expiresAt) {
                    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Thiếu ngày hết hạn' }) };
                }

                const generated = [];
                // Store SKU codes as comma-separated string (null = all products)
                const skuCodesStr = (skuCodes && skuCodes.length > 0) ? skuCodes.join(',') : null;
                for (let i = 0; i < qty; i++) {
                    const id = crypto.randomUUID();
                    const code = generateCode();

                    try {
                        await db.execute({
                            sql: `INSERT INTO coupons (id, code, discount_percent, description, expires_at, max_uses, used_count, is_active, sku_codes)
                                  VALUES (?, ?, ?, ?, ?, 1, 0, 1, ?)`,
                            args: [id, code, pct, description || `Giảm ${pct}%`, expiresAt, skuCodesStr]
                        });
                        generated.push({ id, code, discountPercent: pct, expiresAt, skuCodes: skuCodesStr });
                    } catch (e) {
                        // Code collision (extremely unlikely), retry once
                        const retryCode = generateCode();
                        const retryId = crypto.randomUUID();
                        await db.execute({
                            sql: `INSERT INTO coupons (id, code, discount_percent, description, expires_at, max_uses, used_count, is_active, sku_codes)
                                  VALUES (?, ?, ?, ?, ?, 1, 0, 1, ?)`,
                            args: [retryId, retryCode, pct, description || `Giảm ${pct}%`, expiresAt, skuCodesStr]
                        });
                        generated.push({ id: retryId, code: retryCode, discountPercent: pct, expiresAt, skuCodes: skuCodesStr });
                    }
                }

                return {
                    statusCode: 200, headers,
                    body: JSON.stringify({
                        success: true,
                        message: `Đã tạo ${generated.length} coupon giảm ${pct}%`,
                        coupons: generated
                    })
                };
            }

            if (action === 'toggle') {
                const { id } = body;
                if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };

                await db.execute({
                    sql: `UPDATE coupons SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?`,
                    args: [id]
                });

                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Toggled' }) };
            }

            if (action === 'delete') {
                const { id } = body;
                if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };

                await db.execute({
                    sql: `DELETE FROM coupons WHERE id = ?`,
                    args: [id]
                });

                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Deleted' }) };
            }

            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    } catch (error) {
        console.error('Admin Coupons Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
