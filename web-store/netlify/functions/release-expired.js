/**
 * RELEASE EXPIRED RESERVATIONS - Netlify Function (Cron Job)
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

        await db.execute('BEGIN IMMEDIATE');

        try {
            // 1. Release expired stock units
            const releasedUnits = await db.execute({
                sql: `
                    UPDATE stock_units
                    SET status = 'available',
                        reserved_order_id = NULL,
                        reserved_until = NULL,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE status = 'reserved'
                      AND reserved_until IS NOT NULL
                      AND reserved_until < ?
                `,
                args: [now]
            });

            const unitsReleased = releasedUnits.rowsAffected || 0;

            // 2. Expire pending orders
            const expiredOrders = await db.execute({
                sql: `
                    UPDATE orders
                    SET status = 'expired', updated_at = CURRENT_TIMESTAMP
                    WHERE status = 'pending_payment'
                      AND reserved_until IS NOT NULL
                      AND reserved_until < ?
                `,
                args: [now]
            });

            const ordersExpired = expiredOrders.rowsAffected || 0;

            // 3. Release allocations for expired orders (allocations may not have reserved_until set)
            const releasedAllocations = await db.execute({
                sql: `
                    UPDATE order_allocations
                    SET status = 'released', reserved_until = NULL
                    WHERE status = 'reserved'
                      AND order_line_id IN (
                          SELECT id FROM order_lines WHERE order_id IN (
                              SELECT id FROM orders WHERE status = 'expired'
                          )
                      )
                `,
                args: []
            });

            const allocationsReleased = releasedAllocations.rowsAffected || 0;

            await db.execute('COMMIT');

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    timestamp: now,
                    released: {
                        stockUnits: unitsReleased,
                        orders: ordersExpired,
                        allocations: allocationsReleased
                    },
                    message: `Released ${unitsReleased} stock units, expired ${ordersExpired} orders`
                })
            };

        } catch (error) {
            await db.execute('ROLLBACK');
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
