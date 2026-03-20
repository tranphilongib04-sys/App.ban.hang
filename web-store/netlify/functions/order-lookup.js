/**
 * ORDER LOOKUP — Tra cứu đơn hàng bằng SĐT (+ Email tuỳ chọn)
 *
 * POST /.netlify/functions/order-lookup
 * Body: { phone: "0988428496", email: "customer@example.com" }
 *
 * Returns list of orders for that phone number.
 * When email is provided and matches, credentials are included inline.
 */

const { createClient } = require('@libsql/client/web');
const crypto = require('crypto');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('TURSO_DATABASE_URL not configured');
    return createClient({ url, authToken });
}

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

// DB-based rate limiting (survives cold starts unlike in-memory Map)
async function rateLimited(db, ip) {
    if (!db) return false;
    const key = ip || 'unknown';
    const now = new Date();
    const windowMs = 60000; // 1 minute
    const maxRequests = 5;
    try {
        const result = await db.execute({
            sql: 'SELECT count, reset_at FROM rate_limits WHERE ip = ?',
            args: [key]
        });
        let count = 0;
        let resetAt = new Date(now.getTime() + windowMs);
        if (result.rows.length > 0) {
            const row = result.rows[0];
            const rowResetAt = new Date(row.reset_at);
            if (now > rowResetAt) {
                count = 1;
            } else {
                count = row.count + 1;
                resetAt = rowResetAt;
            }
        } else {
            count = 1;
        }
        await db.execute({
            sql: `INSERT INTO rate_limits (ip, count, reset_at) VALUES (?, ?, ?)
                  ON CONFLICT(ip) DO UPDATE SET count = ?, reset_at = ?`,
            args: [key, count, resetAt.toISOString(), count, resetAt.toISOString()]
        });
        return count > maxRequests;
    } catch (e) {
        // Table might not exist — allow request through
        return false;
    }
}

function normalizePhone(raw) {
    let p = (raw || '').replace(/[\s\-().]/g, '');
    if (p.startsWith('+84')) p = '0' + p.slice(3);
    if (p.startsWith('84') && p.length === 11) p = '0' + p.slice(2);
    return p;
}

function generateDeliveryToken(orderId, email) {
    const secret = process.env.DELIVERY_SECRET;
    if (!secret) throw new Error('DELIVERY_SECRET not configured');
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const data = `${orderId}|${email}|${day}`;
    return crypto.createHash('sha256').update(secret + data).digest('hex').substring(0, 32);
}

const statusLabels = {
    pending_payment: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    fulfilled: 'Đã giao',
    failed: 'Thất bại',
    refunded: 'Hoàn tiền',
    expired: 'Hết hạn'
};

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Rate limit (DB-based)
    const ip = (event.headers['x-forwarded-for'] || event.headers['client-ip'] || '').split(',')[0].trim();
    let db;
    try {
        db = getDbClient();
    } catch (e) {
        console.error('[order-lookup] DB init error:', e.message);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Lỗi hệ thống' }) };
    }

    if (await rateLimited(db, ip)) {
        return { statusCode: 429, headers, body: JSON.stringify({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.' }) };
    }

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
    }

    const phone = normalizePhone(body.phone);
    const email = (body.email || '').trim().toLowerCase();
    if (!phone || phone.length < 9) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Vui lòng nhập số điện thoại hợp lệ' }) };
    }

    try {
        // db already initialized above for rate limiting

        // Get orders for this phone
        const ordersResult = await db.execute({
            sql: `SELECT o.id, o.order_code, o.status, o.amount_total, o.discount_code,
                         o.discount_amount, o.customer_name, o.customer_email, o.created_at
                  FROM orders o
                  WHERE o.customer_phone = ?
                  ORDER BY o.created_at DESC
                  LIMIT 50`,
            args: [phone]
        });

        if (ordersResult.rows.length === 0) {
            return {
                statusCode: 200, headers,
                body: JSON.stringify({ success: true, orders: [], message: 'Không tìm thấy đơn hàng nào với số điện thoại này' })
            };
        }

        // Get order lines for all found orders
        const orderIds = ordersResult.rows.map(o => o.id);
        const placeholders = orderIds.map(() => '?').join(',');

        const linesResult = await db.execute({
            sql: `SELECT ol.order_id, ol.product_name, ol.quantity, ol.unit_price, ol.subtotal, ol.fulfillment_type
                  FROM order_lines ol
                  WHERE ol.order_id IN (${placeholders})
                  ORDER BY ol.id`,
            args: orderIds
        });

        // Group lines by order_id
        const linesByOrder = {};
        for (const line of linesResult.rows) {
            const oid = line.order_id;
            if (!linesByOrder[oid]) linesByOrder[oid] = [];
            linesByOrder[oid].push({
                name: line.product_name,
                quantity: line.quantity,
                unitPrice: line.unit_price,
                subtotal: line.subtotal,
                type: line.fulfillment_type
            });
        }

        // If email provided, verify it matches and fetch credentials
        const emailVerified = email && ordersResult.rows.some(o =>
            (o.customer_email || '').toLowerCase() === email
        );

        // If email verified, batch-fetch all credentials for fulfilled/paid orders
        let credentialsByOrder = {};
        if (emailVerified) {
            const credOrderIds = ordersResult.rows
                .filter(o => o.status === 'fulfilled' || o.status === 'paid')
                .map(o => o.id);
            if (credOrderIds.length > 0) {
                const credPlaceholders = credOrderIds.map(() => '?').join(',');
                const credResult = await db.execute({
                    sql: `SELECT si.order_id, si.account_info, si.secret_key, si.note,
                                 s.sku_code, s.name as sku_name
                          FROM stock_items si
                          JOIN skus s ON si.sku_id = s.id
                          WHERE si.order_id IN (${credPlaceholders}) AND si.status = 'sold'
                          ORDER BY si.id ASC`,
                    args: credOrderIds
                });
                for (const item of credResult.rows) {
                    const oid = item.order_id;
                    if (!credentialsByOrder[oid]) credentialsByOrder[oid] = [];
                    const code = (item.sku_code || '').toLowerCase();
                    const isLink = code.includes('chatgpt_code') || code.includes('_code_');
                    credentialsByOrder[oid].push({
                        username: item.account_info || '',
                        password: item.secret_key || '',
                        extraInfo: item.note || '',
                        skuName: item.sku_name || '',
                        isLink: isLink
                    });
                }
            }
        }

        // Build response
        const orders = ordersResult.rows.map(o => {
            const result = {
                orderCode: o.order_code,
                status: o.status,
                statusLabel: statusLabels[o.status] || o.status,
                total: o.amount_total,
                discountCode: o.discount_code || null,
                discountAmount: o.discount_amount || 0,
                customerName: o.customer_name,
                createdAt: o.created_at,
                items: linesByOrder[o.id] || []
            };

            // SECURITY: Delivery URLs removed from order-lookup to prevent credential leakage via phone only.
            // Users should use their original delivery link or email-verified credentials instead.

            // Include credentials inline when email verified
            if (emailVerified && credentialsByOrder[o.id]) {
                result.credentials = credentialsByOrder[o.id];
            }

            return result;
        });

        return {
            statusCode: 200, headers,
            body: JSON.stringify({ success: true, orders, phone, emailVerified: !!emailVerified })
        };

    } catch (err) {
        console.error('[order-lookup] Error:', err.message);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Lỗi hệ thống. Vui lòng thử lại sau.' }) };
    }
};
