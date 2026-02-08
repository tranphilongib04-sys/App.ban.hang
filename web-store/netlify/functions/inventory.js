/**
 * INVENTORY API (V3 - Database Centric)
 *
 * Endpoints:
 * - GET /inventory?service=chatgpt&variant=plus-1m  -> Checks availability
 * - GET /inventory?action=all -> Returns all SKUs with available counts
 */

const { createClient } = require('@libsql/client/web');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) return null;
    return createClient({ url, authToken });
}

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async function (event, context) {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        const db = getDbClient();
        if (!db) throw new Error('Database not configured');

        // Cleanup expired reservations
        await cleanupExpired(db);

        const { service, variant, action } = event.queryStringParameters || {};

        // 1. Get All Inventory (Public Summary)
        if (action === 'all') {
            const sql = `
                SELECT
                    s.sku_code,
                    s.name,
                    s.price,
                    s.delivery_type,
                    SUM(CASE WHEN si.status='available' THEN 1 ELSE 0 END) AS available,
                    COUNT(si.id) AS total
                FROM skus s
                LEFT JOIN stock_items si ON si.sku_id = s.id
                WHERE s.is_active = 1
                GROUP BY s.id, s.sku_code, s.name, s.price, s.delivery_type
                ORDER BY s.category, s.name
            `;
            const result = await db.execute(sql);
            // Giao sau 5-10' (owner_upgrade) không cần tồn kho → luôn coi là còn hàng.
            const inventory = result.rows.map(row => {
                const isPreorder = (row.delivery_type || 'auto') === 'owner_upgrade';
                return {
                    sku: row.sku_code,
                    product_code: row.sku_code,
                    name: row.name,
                    price: row.price,
                    delivery_type: row.delivery_type,
                    available: isPreorder ? 999 : Number(row.available || 0),
                    total: Number(row.total || 0),
                    inStock: isPreorder ? true : Number(row.available || 0) > 0
                };
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, source: 'database', inventory })
            };
        }

        // 2. Check Specific Availability
        if (service) {
            // Construct SKU Code: service + "_" + variant
            // e.g. service="chatgpt", variant="plus-1m" -> "chatgpt_plus_1m"
            // e.g. service="chatgpt_plus_1m", variant=null -> "chatgpt_plus_1m"

            let skuCode = service;
            if (variant) {
                skuCode = `${service}_${variant.replace(/-/g, '_')}`;
            }

            // Fuzzy match or exact? New system prefers exact.
            // Try exact first.
            let sql = `
                SELECT COUNT(*) as count 
                FROM stock_items si
                JOIN skus s ON si.sku_id = s.id
                WHERE s.sku_code = ? AND si.status = 'available'
            `;
            let result = await db.execute({ sql, args: [skuCode] });
            let count = Number(result.rows[0]?.count || 0);

            // If 0, maybe partial match or category search? (Old logic supported this)
            // If they searched just 'chatgpt', result should sum up all chatgpt?
            if (count === 0 && !variant) {
                sql = `
                    SELECT COUNT(*) as count 
                    FROM stock_items si
                    JOIN skus s ON si.sku_id = s.id
                    WHERE s.sku_code LIKE ? AND si.status = 'available'
                `;
                result = await db.execute({ sql, args: [`${skuCode}%`] });
                count = Number(result.rows[0]?.count || 0);
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    source: 'database',
                    service,
                    variant: variant || 'all',
                    product_code: skuCode,
                    available: count,
                    inStock: count > 0
                })
            };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing parameters' }) };

    } catch (error) {
        console.error('Inventory API Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
    }
};

async function cleanupExpired(db) {
    try {
        const now = new Date().toISOString();

        // 1. Mark Orders as Expired
        await db.execute({
            sql: `UPDATE orders SET status = 'expired' WHERE status = 'pending_payment' AND reserved_until < ?`,
            args: [now]
        });

        // 2. Release Stock Items linked to Expired/Cancelled orders
        await db.execute({
            sql: `
                UPDATE stock_items 
                SET status = 'available', order_id = NULL 
                WHERE status = 'reserved' 
                AND order_id IN (SELECT id FROM orders WHERE status IN ('expired', 'cancelled'))
            `,
            args: []
        });

    } catch (e) {
        console.error('Cleanup failed:', e);
    }
}
