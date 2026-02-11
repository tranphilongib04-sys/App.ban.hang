/**
 * ADMIN INVENTORY API
 * 
 * GET /admin/inventory
 * Returns consolidated list of SKUs with stock counts.
 */

const { createClient } = require('@libsql/client/web');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        throw new Error('TURSO_DATABASE_URL not configured');
    }

    return createClient({ url, authToken });
}

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
};

function requireAuth(event) {
    const token = (event.headers['authorization'] || '').replace('Bearer ', '');
    const expected = process.env.ADMIN_API_TOKEN;
    if (!expected) {
        console.error('[SECURITY] ADMIN_API_TOKEN not set! Blocking all admin requests.');
        return { statusCode: 503, headers, body: JSON.stringify({ error: 'Admin API not configured' }) };
    }
    if (token !== expected) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    return null;
}

exports.handler = async function (event, context) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Auth check
    const authError = requireAuth(event);
    if (authError) return authError;

    try {
        const { action } = event.queryStringParameters || {};
        const db = getDbClient();

        if (action === 'items') {
            const result = await db.execute(`
                SELECT si.id, si.sku_id, si.account_info, si.secret_key, si.status, si.created_at, si.sold_at, s.sku_code, s.name as service, s.price as cost
                FROM stock_items si
                LEFT JOIN skus s ON si.sku_id = s.id
                ORDER BY si.created_at DESC
            `);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    items: result.rows
                })
            };
        }

        if (action === 'sku_details') {
            const { sku } = event.queryStringParameters || {};
            if (!sku) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing sku parameter' }) };
            }

            const sql = `
                SELECT 
                    si.id, 
                    si.account_info, 
                    si.secret_key, 
                    si.note, 
                    si.status, 
                    si.created_at, 
                    si.order_id,
                    o.order_code
                FROM stock_items si
                JOIN skus s ON si.sku_id = s.id
                LEFT JOIN orders o ON si.order_id = o.id
                WHERE s.sku_code = ?
                ORDER BY 
                    CASE WHEN si.status = 'available' THEN 1 ELSE 2 END,
                    si.created_at DESC
            `;

            const result = await db.execute({ sql, args: [sku] });
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    items: result.rows
                })
            };
        }

        if (action === 'delete_item') {
            if (event.httpMethod !== 'POST') {
                return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
            }
            const body = JSON.parse(event.body || '{}');
            const { id } = body;

            if (!id) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing item id' }) };
            }

            // Check if item is available before deleting
            const check = await db.execute({
                sql: `SELECT status FROM stock_items WHERE id = ?`,
                args: [id]
            });

            if (check.rows.length === 0) {
                return { statusCode: 404, headers, body: JSON.stringify({ error: 'Item not found' }) };
            }

            if (check.rows[0].status !== 'available') {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Only available items can be deleted' }) };
            }

            await db.execute({
                sql: `DELETE FROM stock_items WHERE id = ?`,
                args: [id]
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true })
            };
        }

        // Check if skus table exists first (sanity check)

        const sql = `
            SELECT
                s.id,
                s.sku_code,
                s.name,
                s.category,
                s.delivery_type,
                SUM(CASE WHEN si.status='available' THEN 1 ELSE 0 END) AS available,
                SUM(CASE WHEN si.status='reserved' THEN 1 ELSE 0 END) AS reserved,
                SUM(CASE WHEN si.status='sold' THEN 1 ELSE 0 END) AS sold,
                COUNT(si.id) AS total
            FROM skus s
            LEFT JOIN stock_items si ON si.sku_id = s.id
            GROUP BY s.id, s.sku_code, s.name, s.category, s.delivery_type
            ORDER BY s.category, s.name;
        `;

        const result = await db.execute(sql);

        // Ensure numbers are numbers, not serialized strings if platform quirks exist 
        // (LibSQL over HTTP usually returns numbers fine, but safe to cast)
        const inventory = result.rows.map(row => ({
            ...row,
            available: Number(row.available || 0),
            reserved: Number(row.reserved || 0),
            sold: Number(row.sold || 0),
            total: Number(row.total || 0)
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                inventory
            })
        };

    } catch (error) {
        console.error('Admin Inventory API Error:', error);
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
