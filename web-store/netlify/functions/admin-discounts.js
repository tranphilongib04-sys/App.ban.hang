/**
 * ADMIN DISCOUNTS API
 *
 * GET  ?action=list   → List all discount codes with usage stats
 * POST action=create  → Create new discount code
 * POST action=toggle  → Enable/disable discount code
 * POST action=delete  → Delete discount code
 */

const { createClient } = require('@libsql/client/web');
const ALLOWED_CODES = new Set(['CTV01', 'CTV02', 'CTV03', 'CTV04', 'CTV05']);

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) return null;
    return createClient({ url, authToken });
}

// SECURITY: Restrict CORS for admin APIs
function getAdminHeaders(event) {
    const allowed = process.env.ALLOWED_ADMIN_ORIGIN || '';
    const reqOrigin = (event && event.headers) ? (event.headers.origin || event.headers.Origin || '') : '';
    const origin = (allowed && reqOrigin === allowed) ? allowed : (allowed ? 'null' : '*');
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };
}

function checkAuth(event) {
    const token = process.env.ADMIN_API_TOKEN;
    if (!token) return false;
    const auth = event.headers['authorization'] || '';
    return auth === `Bearer ${token}`;
}

exports.handler = async function (event) {
    const headers = getAdminHeaders(event);
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    if (!checkAuth(event)) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const db = getDbClient();
    if (!db) return { statusCode: 500, headers, body: JSON.stringify({ error: 'DB not configured' }) };

    try {
        // ── GET: List codes ──
        if (event.httpMethod === 'GET') {
            const { action } = event.queryStringParameters || {};

            if (action === 'list') {
                const result = await db.execute(`
                    SELECT
                        dc.id,
                        dc.code,
                        dc.discount_amount,
                        dc.description,
                        dc.owner_name,
                        dc.owner_contact,
                        dc.is_active,
                        dc.created_at,
                        COUNT(CASE WHEN o.status NOT IN ('expired', 'cancelled') THEN o.id END) as usage_count,
                        COALESCE(SUM(CASE WHEN o.status NOT IN ('expired', 'cancelled') THEN o.discount_amount ELSE 0 END), 0) as total_discount_given,
                        MAX(o.created_at) as last_used_at
                    FROM discount_codes dc
                    LEFT JOIN orders o ON o.discount_code = dc.code
                    GROUP BY dc.id, dc.code, dc.discount_amount, dc.description, dc.owner_name, dc.owner_contact, dc.is_active, dc.created_at
                    ORDER BY dc.created_at DESC
                `);

                return {
                    statusCode: 200, headers,
                    body: JSON.stringify({ success: true, codes: result.rows })
                };
            }

            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing action parameter' }) };
        }

        // ── POST: Create / Toggle / Delete ──
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            const { action } = body;

            if (action === 'create') {
                const { code, discountAmount, description, ownerName, ownerContact } = body;
                if (!code) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code' }) };

                const crypto = require('crypto');
                const id = crypto.randomUUID();
                const amount = discountAmount || 10000;
                const codeUpper = code.trim().toUpperCase();
                if (!ALLOWED_CODES.has(codeUpper)) {
                    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Chỉ hỗ trợ CTV01–CTV05' }) };
                }

                await db.execute({
                    sql: `
                        INSERT INTO discount_codes (id, code, discount_amount, description, owner_name, owner_contact)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON CONFLICT(code) DO UPDATE SET
                          discount_amount = excluded.discount_amount,
                          description = excluded.description,
                          owner_name = excluded.owner_name,
                          owner_contact = excluded.owner_contact,
                          updated_at = CURRENT_TIMESTAMP
                    `,
                    args: [id, codeUpper, amount, description || '', ownerName || '', ownerContact || '']
                });

                return {
                    statusCode: 200, headers,
                    body: JSON.stringify({ success: true, message: `Upserted code: ${codeUpper}`, id })
                };
            }

            if (action === 'toggle') {
                const { id } = body;
                if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };

                await db.execute({
                    sql: `UPDATE discount_codes SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    args: [id]
                });

                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Toggled' }) };
            }

            if (action === 'delete') {
                const { id } = body;
                if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };

                await db.execute({
                    sql: `DELETE FROM discount_codes WHERE id = ?`,
                    args: [id]
                });

                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Deleted' }) };
            }

            if (action === 'usage') {
                const { code, limit = 50 } = body;
                if (!code) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code' }) };

                const res = await db.execute({
                    sql: `
                        SELECT order_code, customer_name, customer_email, customer_phone,
                               amount_total, discount_amount, created_at, status
                        FROM orders
                        WHERE discount_code = ?
                        ORDER BY created_at DESC
                        LIMIT ?
                    `,
                    args: [code.trim().toUpperCase(), Number(limit) || 50]
                });

                return {
                    statusCode: 200, headers,
                    body: JSON.stringify({ success: true, orders: res.rows })
                };
            }

            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    } catch (error) {
        console.error('Admin Discounts Error:', error.message);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Lỗi hệ thống' }) };
    }
};
