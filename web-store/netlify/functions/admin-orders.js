/**
 * @deprecated Use admin-web /api/admin/orders instead.
 * Kept alive for backward compat until PR 10 cleanup.
 *
 * ADMIN ORDERS API - Netlify Function
 *
 * GET /admin-orders - Get all public orders (requires auth)
 * POST /admin-orders - Manual delivery or status update
 *
 * Auth: Bearer token from ADMIN_API_TOKEN env
 */

const { createClient } = require('@libsql/client/web');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('Database not configured');
    return createClient({ url, authToken });
}

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
};

// Simple auth check
function checkAuth(event) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const adminToken = process.env.ADMIN_API_TOKEN;

    if (!adminToken) return true; // No auth configured = open
    if (!authHeader) return false;

    const token = authHeader.replace('Bearer ', '');
    return token === adminToken;
}

exports.handler = async function (event, context) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (!checkAuth(event)) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }

    try {
        const db = getDbClient();

        if (event.httpMethod === 'GET') {
            // Get orders with optional filters
            const { status, limit = 50 } = event.queryStringParameters || {};

            let sql = `
                SELECT
                    o.*,
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
                    const allocResult = await db.execute({
                        sql: `SELECT oa.unit_id FROM order_allocations oa
                              JOIN order_lines ol ON ol.id = oa.order_line_id
                              WHERE ol.order_id = ?`,
                        args: [orderId]
                    });

                    for (const alloc of allocResult.rows) {
                        await db.execute({
                            sql: `
                                UPDATE inventory_items
                                SET status = 'available',
                                    reserved_by = NULL,
                                    reserved_at = NULL,
                                    reservation_expires = NULL
                                WHERE id = ? AND status = 'reserved'
                            `,
                            args: [alloc.unit_id]
                        });
                    }

                    // Clear allocation status
                    await db.execute({
                        sql: `UPDATE order_allocations SET status = 'released'
                              WHERE order_line_id IN (SELECT id FROM order_lines WHERE order_id = ?)`,
                        args: [orderId]
                    });
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
        console.error('Admin orders error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
