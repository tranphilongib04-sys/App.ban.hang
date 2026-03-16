/**
 * @deprecated Use admin-web /api/admin/stock instead.
 * Kept alive for backward compat until PR 10 cleanup.
 *
 * PRODUCTS API - Netlify Function
 *
 * Endpoints:
 * - GET /products - Get all products
 * - POST /products - Create new product
 * - PUT /products/:id - Update product
 * - DELETE /products/:id - Delete product
 * - PATCH /products/:id/toggle - Toggle active status
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Content-Type': 'application/json'
};

function checkAuth(event) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const adminToken = process.env.ADMIN_API_TOKEN;

    if (!adminToken) return false;
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
        const path = event.path.split('/');
        const productId = path[path.length - 2] === 'products' ? path[path.length - 1] : null;

        // GET /products - List all products
        if (event.httpMethod === 'GET') {
            const result = await db.execute(`
                SELECT * FROM products
                ORDER BY created_at DESC
            `);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    products: result.rows
                })
            };
        }

        // POST /products - Create new product
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            const { code, name, category, description, image_url, featured, active } = body;

            if (!code || !name) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing required fields: code, name' })
                };
            }

            const now = new Date().toISOString();

            await db.execute({
                sql: `
                    INSERT INTO products (code, name, category, description, image_url, featured, active, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                args: [
                    code,
                    name,
                    category || '',
                    description || '',
                    image_url || '',
                    featured ? 1 : 0,
                    active !== false ? 1 : 0,
                    now
                ]
            });

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({ success: true, message: 'Product created' })
            };
        }

        // PUT /products/:id - Update product
        if (event.httpMethod === 'PUT' && productId) {
            const body = JSON.parse(event.body);
            const { name, category, description, image_url, featured, active } = body;

            await db.execute({
                sql: `
                    UPDATE products
                    SET name = ?, category = ?, description = ?, image_url = ?, featured = ?, active = ?
                    WHERE id = ?
                `,
                args: [
                    name,
                    category,
                    description,
                    image_url,
                    featured ? 1 : 0,
                    active ? 1 : 0,
                    productId
                ]
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Product updated' })
            };
        }

        // DELETE /products/:id - Delete product
        if (event.httpMethod === 'DELETE' && productId) {
            await db.execute({
                sql: 'DELETE FROM products WHERE id = ?',
                args: [productId]
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Product deleted' })
            };
        }

        // PATCH /products/:id/toggle - Toggle active status
        if (event.httpMethod === 'PATCH' && event.path.includes('/toggle')) {
            const body = JSON.parse(event.body);
            const { active } = body;

            await db.execute({
                sql: 'UPDATE products SET active = ? WHERE id = ?',
                args: [active ? 1 : 0, productId]
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Status updated' })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Products API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
