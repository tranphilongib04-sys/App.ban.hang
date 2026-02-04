/**
 * STOCK UNITS API - Netlify Function
 *
 * Endpoints:
 * - GET /stock-units?status=all - Get stock units (with filter)
 * - POST /stock-units - Add single stock unit
 * - POST /stock-units/bulk - Bulk import stock units
 * - DELETE /stock-units/:id - Delete stock unit
 *
 * Auth: Bearer token
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
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
};

function checkAuth(event) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const adminToken = process.env.ADMIN_API_TOKEN;

    if (!adminToken) return true;
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

        // GET /stock-units - List stock units
        if (event.httpMethod === 'GET') {
            const { status = 'all', limit = 1000 } = event.queryStringParameters || {};

            let sql = `
                SELECT
                    s.id,
                    s.product_id,
                    p.code as product_code,
                    p.name as product_name,
                    s.secret,
                    s.status,
                    s.reserved_until,
                    s.created_at
                FROM stock_units s
                LEFT JOIN products p ON s.product_id = p.id
            `;

            const args = [];

            if (status !== 'all') {
                sql += ' WHERE s.status = ?';
                args.push(status);
            }

            sql += ' ORDER BY s.created_at DESC LIMIT ?';
            args.push(parseInt(limit));

            const result = await db.execute({ sql, args });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    stock: result.rows
                })
            };
        }

        // POST /stock-units - Add single stock unit
        if (event.httpMethod === 'POST' && !event.path.includes('/bulk')) {
            const body = JSON.parse(event.body);
            const { product_code, secret } = body;

            if (!product_code || !secret) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing product_code or secret' })
                };
            }

            // Get product_id from code
            const productResult = await db.execute({
                sql: 'SELECT id FROM products WHERE code = ?',
                args: [product_code]
            });

            if (productResult.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Product not found' })
                };
            }

            const product_id = productResult.rows[0].id;
            const now = new Date().toISOString();

            await db.execute({
                sql: `
                    INSERT INTO stock_units (product_id, secret, status, created_at)
                    VALUES (?, ?, 'available', ?)
                `,
                args: [product_id, secret, now]
            });

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({ success: true, message: 'Stock unit added' })
            };
        }

        // POST /stock-units/bulk - Bulk import
        if (event.httpMethod === 'POST' && event.path.includes('/bulk')) {
            const body = JSON.parse(event.body);
            const { stock } = body; // Array of { product_code, secret }

            if (!Array.isArray(stock) || stock.length === 0) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid stock array' })
                };
            }

            // Get product_id map
            const productCodes = [...new Set(stock.map(s => s.product_code))];
            const productMap = {};

            for (const code of productCodes) {
                const result = await db.execute({
                    sql: 'SELECT id FROM products WHERE code = ?',
                    args: [code]
                });
                if (result.rows.length > 0) {
                    productMap[code] = result.rows[0].id;
                }
            }

            // Insert stock units
            const now = new Date().toISOString();
            let count = 0;

            for (const item of stock) {
                const product_id = productMap[item.product_code];
                if (!product_id) continue;

                await db.execute({
                    sql: `
                        INSERT INTO stock_units (product_id, secret, status, created_at)
                        VALUES (?, ?, 'available', ?)
                    `,
                    args: [product_id, item.secret, now]
                });

                count++;
            }

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: `Imported ${count} stock units`,
                    count
                })
            };
        }

        // DELETE /stock-units/:id - Delete stock unit
        if (event.httpMethod === 'DELETE') {
            const path = event.path.split('/');
            const stockId = path[path.length - 1];

            await db.execute({
                sql: 'DELETE FROM stock_units WHERE id = ?',
                args: [stockId]
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Stock unit deleted' })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Stock units API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
