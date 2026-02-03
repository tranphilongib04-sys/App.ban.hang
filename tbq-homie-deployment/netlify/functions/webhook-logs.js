/**
 * WEBHOOK LOGS API - Netlify Function
 *
 * GET /webhook-logs?limit=50 - Get recent webhook logs
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
        const { limit = 50 } = event.queryStringParameters || {};

        // Try to get from webhook_logs table (if exists)
        try {
            const result = await db.execute({
                sql: `
                    SELECT * FROM webhook_logs
                    ORDER BY created_at DESC
                    LIMIT ?
                `,
                args: [parseInt(limit)]
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    logs: result.rows
                })
            };
        } catch (tableError) {
            // Table doesn't exist, return empty
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    logs: [],
                    note: 'webhook_logs table not yet created'
                })
            };
        }

    } catch (error) {
        console.error('Webhook logs API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
