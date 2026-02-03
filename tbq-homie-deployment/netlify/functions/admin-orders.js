/**
 * ADMIN ORDERS API - Netlify Function
 *
 * GET /admin-orders - Get all public orders (requires auth)
 * POST /admin-orders - Manual delivery or status update
 *
 * Auth: Bearer token from ADMIN_API_TOKEN env
 */

const { createClient } = require('@libsql/client');

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

exports.handler = async function(event, context) {
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
                    po.*,
                    ii.secret_masked,
                    ii.status as inventory_status
                FROM public_orders po
                LEFT JOIN inventory_items ii ON po.inventory_id = ii.id
            `;

            const args = [];
            if (status) {
                sql += ' WHERE po.status = ?';
                args.push(status);
            }

            sql += ' ORDER BY po.created_at DESC LIMIT ?';
            args.push(parseInt(limit));

            const result = await db.execute({ sql, args });

            // Get stats
            const statsResult = await db.execute(`
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'pending') as pending,
                    COUNT(*) FILTER (WHERE status = 'paid') as paid,
                    COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
                    COUNT(*) FILTER (WHERE status = 'expired') as expired,
                    SUM(CASE WHEN status = 'delivered' THEN price ELSE 0 END) as total_revenue
                FROM public_orders
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

                await db.execute({
                    sql: `
                        UPDATE public_orders
                        SET status = 'delivered',
                            delivered_at = ?,
                            delivery_content = ?
                        WHERE order_code = ?
                    `,
                    args: [now, deliveryContent, orderCode]
                });

                // Mark inventory as sold if linked
                const orderResult = await db.execute({
                    sql: 'SELECT inventory_id FROM public_orders WHERE order_code = ?',
                    args: [orderCode]
                });

                if (orderResult.rows[0]?.inventory_id) {
                    await db.execute({
                        sql: `UPDATE inventory_items SET status = 'sold', sold_at = ? WHERE id = ?`,
                        args: [now, orderResult.rows[0].inventory_id]
                    });
                }

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, message: 'Order delivered' })
                };
            }

            if (action === 'update_status') {
                await db.execute({
                    sql: 'UPDATE public_orders SET status = ? WHERE order_code = ?',
                    args: [newStatus, orderCode]
                });

                // If cancelled/expired, release inventory
                if (['cancelled', 'expired'].includes(newStatus)) {
                    const orderResult = await db.execute({
                        sql: 'SELECT inventory_id FROM public_orders WHERE order_code = ?',
                        args: [orderCode]
                    });

                    if (orderResult.rows[0]?.inventory_id) {
                        await db.execute({
                            sql: `
                                UPDATE inventory_items
                                SET status = 'available',
                                    reserved_by = NULL,
                                    reserved_at = NULL,
                                    reservation_expires = NULL
                                WHERE id = ? AND status = 'reserved'
                            `,
                            args: [orderResult.rows[0].inventory_id]
                        });
                    }
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
