/**
 * ADMIN ORDERS API - Netlify Function
 *
 * GET  /admin-orders                    - Get all public orders (requires auth)
 * GET  /admin-orders?action=order_detail - Get order detail with credentials
 * POST /admin-orders  action=deliver     - Manual delivery
 * POST /admin-orders  action=update_status - Update order status
 * POST /admin-orders  action=create_manual - Create manual order (admin)
 * POST /admin-orders  action=update_full   - Full update order fields
 * POST /admin-orders  action=delete        - Delete order
 *
 * Auth: Bearer token from ADMIN_API_TOKEN env
 */

const { createClient } = require('@libsql/client/web');
const crypto = require('crypto');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('Database not configured');
    return createClient({ url, authToken });
}

// SECURITY: Restrict CORS for admin APIs
function getAdminHeaders(event) {
    const allowed = process.env.ALLOWED_ADMIN_ORIGIN || '';
    const reqOrigin = event.headers.origin || event.headers.Origin || '';
    const origin = (allowed && reqOrigin === allowed) ? allowed : (allowed ? 'null' : '*');
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };
}

// SECURITY: Brute-force protection for admin login
const _loginAttempts = new Map();
function checkBruteForce(ip) {
    const now = Date.now();
    const entry = _loginAttempts.get(ip);
    if (entry && now < entry.lockedUntil) return false; // locked out
    return true;
}
function recordFailedLogin(ip) {
    const now = Date.now();
    const entry = _loginAttempts.get(ip) || { count: 0, resetAt: now + 300000, lockedUntil: 0 };
    if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 300000; }
    entry.count++;
    if (entry.count >= 5) { entry.lockedUntil = now + 900000; } // lock 15 min after 5 fails
    _loginAttempts.set(ip, entry);
    if (_loginAttempts.size > 1000) {
        for (const [k, v] of _loginAttempts) { if (now > v.resetAt && now > v.lockedUntil) _loginAttempts.delete(k); }
    }
}

// Simple auth check
function checkAuth(event) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const adminToken = process.env.ADMIN_API_TOKEN;

    if (!adminToken) return false;
    if (!authHeader) return false;

    const token = authHeader.replace('Bearer ', '');
    return token === adminToken;
}

exports.handler = async function (event, context) {
    const headers = getAdminHeaders(event);
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const ip = (event.headers['x-forwarded-for'] || event.headers['client-ip'] || '').split(',')[0].trim();
    if (!checkBruteForce(ip)) {
        return { statusCode: 429, headers, body: JSON.stringify({ error: 'Quá nhiều lần thử. Vui lòng đợi 15 phút.' }) };
    }

    if (!checkAuth(event)) {
        recordFailedLogin(ip);
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }

    try {
        const db = getDbClient();

        if (event.httpMethod === 'GET') {
            const { status, limit = 50, action, order_code } = event.queryStringParameters || {};

            // Order detail with credentials
            if (action === 'order_detail' && order_code) {
                const orderRes = await db.execute({
                    sql: 'SELECT * FROM orders WHERE order_code = ?',
                    args: [order_code]
                });
                if (!orderRes.rows[0]) {
                    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) };
                }
                const ord = orderRes.rows[0];
                const linesRes = await db.execute({
                    sql: `SELECT ol.*, s.sku_code, s.name as sku_name, s.delivery_type
                          FROM order_lines ol
                          LEFT JOIN skus s ON ol.sku_id = s.id
                          WHERE ol.order_id = ?`,
                    args: [ord.id]
                });
                const credsRes = await db.execute({
                    sql: `SELECT si.account_info, si.secret_key, si.note, si.status as stock_status,
                                 s.sku_code, s.name as sku_name
                          FROM stock_items si
                          JOIN skus s ON si.sku_id = s.id
                          WHERE si.order_id = ?
                          ORDER BY si.id ASC`,
                    args: [ord.id]
                });
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        order: ord,
                        lines: linesRes.rows,
                        credentials: credsRes.rows
                    })
                };
            }

            // List SKUs for dropdowns
            if (action === 'list_skus') {
                const skuRes = await db.execute(`SELECT id, sku_code, name, price, delivery_type FROM skus WHERE is_active = 1 ORDER BY category, name`);
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, skus: skuRes.rows }) };
            }

            // Get orders with optional filters
            let sql = `
                SELECT
                    o.*,
                    ol.product_name,
                    ii.secret_masked,
                    ii.status as inventory_status
                FROM orders o
                LEFT JOIN order_lines ol ON ol.order_id = o.id
                LEFT JOIN order_allocations oa ON oa.order_line_id = ol.id
                LEFT JOIN inventory_items ii ON ii.id = oa.unit_id
            `;

            const args = [];
            if (status) {
                sql += ' WHERE o.status = ?';
                args.push(status);
            }

            sql += ' ORDER BY o.created_at DESC LIMIT ?';
            args.push(parseInt(limit));

            const result = await db.execute({ sql, args });

            // Get stats (SQLite-compatible: no FILTER clause)
            const statsResult = await db.execute(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending_payment' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
                    SUM(CASE WHEN status = 'fulfilled' THEN 1 ELSE 0 END) as delivered,
                    SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
                    SUM(CASE WHEN status IN ('failed','cancelled','refunded') THEN 1 ELSE 0 END) as error_count,
                    SUM(CASE WHEN status = 'fulfilled' THEN amount_total ELSE 0 END) as total_revenue
                FROM orders
            `);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    orders: result.rows,
                    stats: statsResult.rows[0]
                })
            };
        }

        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            const { action, orderCode, deliveryContent, newStatus } = body;

            // ── CREATE MANUAL ORDER ──
            if (action === 'create_manual') {
                const { customerName, customerEmail, customerPhone, customerNote, skuCode, quantity, price } = body;
                if (!customerName) {
                    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Thiếu tên khách hàng' }) };
                }

                const now = new Date().toISOString();
                const ordCode = 'TBQ' + crypto.randomBytes(4).toString('hex').toUpperCase();
                const deliveryToken = crypto.randomUUID();

                // Determine amount
                let amountTotal = parseInt(price) || 0;
                let skuId = null;
                let skuName = 'Đơn thủ công';

                if (skuCode) {
                    const skuRes = await db.execute({ sql: `SELECT id, name, price FROM skus WHERE sku_code = ?`, args: [skuCode] });
                    if (skuRes.rows.length > 0) {
                        skuId = skuRes.rows[0].id;
                        skuName = skuRes.rows[0].name;
                        if (!amountTotal) amountTotal = skuRes.rows[0].price * (parseInt(quantity) || 1);
                    }
                }

                // Insert order as fulfilled (manual = already done)
                const orderRes = await db.execute({
                    sql: `INSERT INTO orders (order_code, customer_email, customer_name, customer_phone, customer_note, status, amount_total, payment_method, delivery_token, created_at, updated_at)
                          VALUES (?, ?, ?, ?, ?, 'fulfilled', ?, 'manual', ?, ?, ?) RETURNING id`,
                    args: [ordCode, customerEmail, customerName, customerPhone || null, customerNote || null, amountTotal, deliveryToken, now, now]
                });
                const orderId = orderRes.rows[0].id;

                // Get legacy product placeholder
                let legacyProductId = 0;
                try {
                    const legRes = await db.execute("SELECT id FROM products WHERE code = 'V3_LEGACY_PLACEHOLDER'");
                    if (legRes.rows.length > 0) legacyProductId = legRes.rows[0].id;
                } catch (e) { /* ignore */ }

                // Insert order line
                if (skuId) {
                    await db.execute({
                        sql: `INSERT INTO order_lines (order_id, sku_id, product_id, product_name, quantity, unit_price, subtotal, fulfillment_type) VALUES (?, ?, ?, ?, ?, ?, ?, 'manual')`,
                        args: [orderId, skuId, legacyProductId, skuName, parseInt(quantity) || 1, amountTotal / (parseInt(quantity) || 1), amountTotal]
                    });
                }

                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Đã tạo đơn ' + ordCode, orderCode: ordCode }) };
            }

            // ── UPDATE FULL ORDER ──
            if (action === 'update_full') {
                const { customerName, customerEmail, customerPhone, customerNote, status: newSt, amountTotal } = body;
                if (!orderCode) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing orderCode' }) };

                const now = new Date().toISOString();
                const orderResult = await db.execute({ sql: 'SELECT id FROM orders WHERE order_code = ?', args: [orderCode] });
                if (!orderResult.rows[0]) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) };
                const orderId = orderResult.rows[0].id;

                // Build dynamic update
                const sets = [];
                const updArgs = [];
                if (customerName !== undefined) { sets.push('customer_name = ?'); updArgs.push(customerName); }
                if (customerEmail !== undefined) { sets.push('customer_email = ?'); updArgs.push(customerEmail); }
                if (customerPhone !== undefined) { sets.push('customer_phone = ?'); updArgs.push(customerPhone); }
                if (customerNote !== undefined) { sets.push('customer_note = ?'); updArgs.push(customerNote); }
                if (newSt !== undefined) { sets.push('status = ?'); updArgs.push(newSt); }
                if (amountTotal !== undefined) { sets.push('amount_total = ?'); updArgs.push(parseInt(amountTotal)); }
                sets.push('updated_at = ?'); updArgs.push(now);
                updArgs.push(orderId);

                await db.execute({ sql: `UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, args: updArgs });

                // If cancelled/expired, release stock
                if (newSt && ['cancelled', 'expired'].includes(newSt)) {
                    await db.execute({ sql: `UPDATE stock_items SET status = 'available', order_id = NULL WHERE order_id = ? AND status = 'reserved'`, args: [orderId] });
                }

                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Đã cập nhật đơn ' + orderCode }) };
            }

            // ── DELETE ORDER ──
            if (action === 'delete') {
                if (!orderCode) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing orderCode' }) };

                const orderResult = await db.execute({ sql: 'SELECT id FROM orders WHERE order_code = ?', args: [orderCode] });
                if (!orderResult.rows[0]) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) };
                const orderId = orderResult.rows[0].id;

                // Release reserved stock
                await db.execute({ sql: `UPDATE stock_items SET status = 'available', order_id = NULL WHERE order_id = ? AND status = 'reserved'`, args: [orderId] });

                // Delete related records (order_lines, payments, deliveries, order_allocations)
                try { await db.execute({ sql: `DELETE FROM order_allocations WHERE order_line_id IN (SELECT id FROM order_lines WHERE order_id = ?)`, args: [orderId] }); } catch (e) { /* table may not exist */ }
                try { await db.execute({ sql: `DELETE FROM deliveries WHERE order_id = ?`, args: [orderId] }); } catch (e) { /* ignore */ }
                try { await db.execute({ sql: `DELETE FROM payments WHERE order_id = ?`, args: [orderId] }); } catch (e) { /* ignore */ }
                await db.execute({ sql: `DELETE FROM order_lines WHERE order_id = ?`, args: [orderId] });
                await db.execute({ sql: `DELETE FROM orders WHERE id = ?`, args: [orderId] });

                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Đã xoá đơn ' + orderCode }) };
            }

            if (action === 'deliver') {
                // Manual delivery
                const now = new Date().toISOString();

                // Look up order id
                const orderResult = await db.execute({
                    sql: 'SELECT id FROM orders WHERE order_code = ?',
                    args: [orderCode]
                });
                if (!orderResult.rows[0]) {
                    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) };
                }
                const orderId = orderResult.rows[0].id;

                // Update order status to fulfilled
                await db.execute({
                    sql: `UPDATE orders SET status = 'fulfilled', updated_at = ? WHERE id = ?`,
                    args: [now, orderId]
                });

                // Find allocated unit(s) for this order
                const allocResult = await db.execute({
                    sql: `SELECT oa.unit_id FROM order_allocations oa
                          JOIN order_lines ol ON ol.id = oa.order_line_id
                          WHERE ol.order_id = ?`,
                    args: [orderId]
                });

                for (const alloc of allocResult.rows) {
                    // Record delivery
                    await db.execute({
                        sql: `INSERT OR IGNORE INTO deliveries (order_id, unit_id, delivery_token, delivered_at, delivery_note)
                              VALUES (?, ?, ?, ?, ?)`,
                        args: [orderId, alloc.unit_id, '', now, deliveryContent || '']
                    });
                    // Mark inventory as sold
                    await db.execute({
                        sql: `UPDATE inventory_items SET status = 'sold' WHERE id = ? AND status = 'reserved'`,
                        args: [alloc.unit_id]
                    });
                }

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, message: 'Order delivered' })
                };
            }

            if (action === 'update_status') {
                const now = new Date().toISOString();

                // Look up order id
                const orderResult = await db.execute({
                    sql: 'SELECT id FROM orders WHERE order_code = ?',
                    args: [orderCode]
                });
                if (!orderResult.rows[0]) {
                    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) };
                }
                const orderId = orderResult.rows[0].id;

                await db.execute({
                    sql: 'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?',
                    args: [newStatus, now, orderId]
                });

                // If cancelled/expired, release allocated inventory
                if (['cancelled', 'expired'].includes(newStatus)) {
                    // Release stock_items (V3 schema)
                    await db.execute({
                        sql: `UPDATE stock_items SET status = 'available', order_id = NULL WHERE order_id = ? AND status = 'reserved'`,
                        args: [orderId]
                    });

                    // Also try legacy tables
                    try {
                        const allocResult = await db.execute({
                            sql: `SELECT oa.unit_id FROM order_allocations oa
                                  JOIN order_lines ol ON ol.id = oa.order_line_id
                                  WHERE ol.order_id = ?`,
                            args: [orderId]
                        });

                        for (const alloc of allocResult.rows) {
                            await db.execute({
                                sql: `UPDATE inventory_items SET status = 'available', reserved_by = NULL, reserved_at = NULL, reservation_expires = NULL WHERE id = ? AND status = 'reserved'`,
                                args: [alloc.unit_id]
                            });
                        }

                        await db.execute({
                            sql: `UPDATE order_allocations SET status = 'released' WHERE order_line_id IN (SELECT id FROM order_lines WHERE order_id = ?)`,
                            args: [orderId]
                        });
                    } catch (e) { /* legacy tables may not exist */ }
                }

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, message: 'Status updated' })
                };
            }

            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid action' })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Admin orders error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Lỗi hệ thống' })
        };
    }
};
