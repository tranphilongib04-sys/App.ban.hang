/**
 * CUSTOMERS API - Netlify Function
 *
 * GET /customers - Get customer list with aggregated stats
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const db = getDbClient();

        // Aggregate customer stats from orders
        const result = await db.execute(`
            SELECT
                customer_email as email,
                customer_name as name,
                customer_phone as phone,
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'delivered' THEN price ELSE 0 END) as total_spent,
                MAX(created_at) as last_order_date
            FROM orders
            GROUP BY customer_email
            ORDER BY total_spent DESC, total_orders DESC
        `);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                customers: result.rows
            })
        };

    } catch (error) {
        console.error('Customers API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
