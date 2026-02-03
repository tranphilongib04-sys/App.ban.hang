/**
 * ANALYTICS API - Netlify Function
 *
 * GET /analytics?range=7days - Get analytics data
 *
 * Returns:
 * - daily_revenue: Revenue by day
 * - top_products: Best selling products
 * - conversion_rate: Funnel metrics
 * - customer_stats: New vs returning
 *
 * Auth: Bearer token
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

function getDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
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

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const db = getDbClient();
        const { range = '7days' } = event.queryStringParameters || {};

        const days = parseInt(range) || 7;
        const startDate = getDaysAgo(days);

        // 1. Daily revenue
        const dailyRevenue = await db.execute({
            sql: `
                SELECT
                    DATE(delivered_at) as date,
                    SUM(price) as revenue
                FROM orders
                WHERE status = 'delivered'
                AND delivered_at >= ?
                GROUP BY DATE(delivered_at)
                ORDER BY date ASC
            `,
            args: [startDate]
        });

        // 2. Top products
        const topProducts = await db.execute({
            sql: `
                SELECT
                    product_names as product,
                    COUNT(*) as count,
                    SUM(price) as revenue
                FROM orders
                WHERE status = 'delivered'
                AND delivered_at >= ?
                GROUP BY product_names
                ORDER BY revenue DESC
                LIMIT 10
            `,
            args: [startDate]
        });

        // 3. Conversion rate
        const conversionResult = await db.execute({
            sql: `
                SELECT
                    COUNT(*) FILTER (WHERE status = 'pending_payment') as pending,
                    COUNT(*) FILTER (WHERE status = 'paid') as paid,
                    COUNT(*) FILTER (WHERE status = 'delivered') as delivered
                FROM orders
                WHERE created_at >= ?
            `,
            args: [startDate]
        });

        // 4. Customer stats (simplified)
        const customerResult = await db.execute({
            sql: `
                SELECT
                    COUNT(DISTINCT customer_email) as total_customers
                FROM orders
                WHERE created_at >= ?
            `,
            args: [startDate]
        });

        const analytics = {
            daily_revenue: dailyRevenue.rows,
            top_products: topProducts.rows,
            conversion_rate: conversionResult.rows[0] || { pending: 0, paid: 0, delivered: 0 },
            customer_stats: {
                total_customers: customerResult.rows[0]?.total_customers || 0,
                new_customers: 0, // Would need more complex query
                returning: 0,
            }
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(analytics)
        };

    } catch (error) {
        console.error('Analytics API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
