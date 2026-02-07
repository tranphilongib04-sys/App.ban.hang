/**
 * RELEASE EXPIRED RESERVATIONS - Netlify Function (Cron Job)
 *
 * V3 UNIFIED: Operates on stock_items (not stock_units/order_allocations).
 *
 * Can be called manually or scheduled via Netlify Scheduled Functions
 * Runs every 5 minutes to release expired reservations
 *
 * GET /release-expired (optional: ?secret=xxx for security)
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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async function (event, context) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Optional secret check for manual calls
    const secret = process.env.CRON_SECRET;
    if (secret && event.queryStringParameters?.secret !== secret) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }

    try {
        const db = getDbClient();
        const now = new Date().toISOString();

        // Use a write transaction for atomicity
        const tx = await db.transaction('write');

        try {
            // 1. Expire pending orders past their reserved_until
            const expiredOrders = await tx.execute({
                sql: `
                    UPDATE orders
                    SET status = 'expired', updated_at = ?
                    WHERE status = 'pending_payment'
                      AND reserved_until IS NOT NULL
                      AND reserved_until < ?
                `,
                args: [now, now]
            });
            const ordersExpired = expiredOrders.rowsAffected || 0;

            // 2. Release stock_items linked to expired/cancelled orders (V3)
            const releasedItems = await tx.execute({
                sql: `
                    UPDATE stock_items
                    SET status = 'available', order_id = NULL
                    WHERE status = 'reserved'
                      AND order_id IN (
                          SELECT id FROM orders WHERE status IN ('expired', 'cancelled')
                      )
                `,
                args: []
            });
            const itemsReleased = releasedItems.rowsAffected || 0;

            await tx.commit();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    timestamp: now,
                    released: {
                        stockItems: itemsReleased,
                        orders: ordersExpired
                    },
                    message: `Released ${itemsReleased} stock items, expired ${ordersExpired} orders`
                })
            };

        } catch (error) {
            try { tx.close(); } catch { /* rollback */ }
            throw error;
        }

    } catch (error) {
        console.error('Release expired error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
