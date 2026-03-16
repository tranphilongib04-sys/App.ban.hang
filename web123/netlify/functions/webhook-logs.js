/**
 * WEBHOOK LOGS API - Netlify Function
 *
 * GET  /webhook-logs?limit=50   - Get recent webhook logs
 * POST /webhook-logs action=clear_all  - Delete all logs
 * POST /webhook-logs action=delete_one - Delete single log
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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    try {
        const db = getDbClient();

        // ── GET: List logs ──
        if (event.httpMethod === 'GET') {
            const { limit = 50 } = event.queryStringParameters || {};

            try {
                const result = await db.execute({
                    sql: `SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT ?`,
                    args: [parseInt(limit)]
                });
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, logs: result.rows }) };
            } catch (tableError) {
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, logs: [], note: 'webhook_logs table not yet created' }) };
            }
        }

        // ── POST: Clear / Delete ──
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const { action } = body;

            if (action === 'clear_all') {
                try {
                    await db.execute(`DELETE FROM webhook_logs`);
                    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Đã xoá tất cả nhật ký' }) };
                } catch (e) {
                    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Bảng chưa tồn tại' }) };
                }
            }

            if (action === 'delete_one') {
                const { id } = body;
                if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing log id' }) };

                await db.execute({ sql: `DELETE FROM webhook_logs WHERE id = ?`, args: [id] });
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Đã xoá' }) };
            }

            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    } catch (error) {
        console.error('Webhook logs API error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};

