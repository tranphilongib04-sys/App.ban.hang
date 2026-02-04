/**
 * INVENTORY API - Netlify Function (V2 - New Schema)
 *
 * Endpoints:
 * - GET /inventory?service=chatgpt&variant=... - Get available stock count
 * - GET /inventory/all - Get all products with stock counts
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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async function (event, context) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const db = getDbClient();
        const { service, variant, action } = event.queryStringParameters || {};

        // Clean up expired reservations first
        const now = new Date().toISOString();
        await cleanupExpired(db, now);

        if (action === 'all') {
            // Get all products with stock counts from VIEW
            const result = await db.execute(`SELECT * FROM stock_summary`);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    inventory: result.rows
                })
            };
        }

        if (service) { // Legacy param map 'service' -> product code component if loose match
            // But simplest is to match 'productCode' or 'service' against p.code
            // The old 'service' + 'variant' logic was fuzzy. 
            // New schema uses 'code' like 'chatgpt_plus_1m'.
            // Let's try to map "service" if it doesn't look like a full code.

            let searchCode = service;
            if (variant) {
                // Try to construct code or search loosely?
                // Current test sends service='chatgpt', variant='plus-1m'.
                // Seeded data is 'chatgpt_plus_1m'.
                // So we can try `LIKE` match?
                // Or just assume `chatgpt` is prefix.
            }

            // We can check if stock exists for this "product category" or specific variant
            // Let's implement a smart search

            let query = `
                SELECT COUNT(s.id) as count
                FROM stock_units s
                JOIN products p ON s.product_id = p.id
                WHERE s.status = 'available'
             `;
            const params = [];

            if (variant) {
                // Exactish match attempt: service + "_" + variant (normalized)
                // e.g. chatgpt_plus_1m
                const possibleCode = `${service}_${variant.replace(/-/g, '_')}`;
                query += " AND (p.code = ? OR p.code LIKE ?)";
                params.push(possibleCode, `${service}%${variant}%`);
            } else {
                // Category search 'chatgpt'
                query += " AND p.code LIKE ?";
                params.push(`${service}%`);
            }

            const result = await db.execute({ sql: query, args: params });
            const count = result.rows[0]?.count || 0;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    service,
                    variant: variant || 'all',
                    available: count,
                    inStock: count > 0
                })
            };
        }

        // Default summary joined from VIEW
        const result = await db.execute(`SELECT code, available_units as available FROM stock_summary`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                summary: result.rows
            })
        };

    } catch (error) {
        console.error('Inventory API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

async function cleanupExpired(db, now) {
    try {
        // Release reserved stock units
        await db.execute({
            sql: `
                UPDATE stock_units
                SET status = 'available',
                reserved_until = NULL,
                reserved_order_id = NULL
                WHERE status = 'reserved'
                AND reserved_until < ?
            `,
            args: [now]
        });

        // Cancel pending orders that expired
        await db.execute({
            sql: `
                UPDATE orders
                SET status = 'cancelled'
                WHERE status = 'pending_payment'
                AND reserved_until < ?
            `,
            args: [now]
        });
    } catch (e) {
        console.error('Cleanup failed:', e);
    }
}
