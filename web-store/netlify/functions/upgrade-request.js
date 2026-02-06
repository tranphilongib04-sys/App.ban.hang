/**
 * UPGRADE REQUEST API - For "Nâng chính chủ" fulfillment type
 *
 * POST /upgrade-request - Submit upgrade request with customer credentials
 * GET /upgrade-request?order=TBQxxxx - Get upgrade request status
 *
 * Flow:
 * 1. Customer pays for "upgrade" variant
 * 2. After payment confirmed, customer submits their existing account credentials
 * 3. System creates upgrade_request record and sends Telegram notification
 * 4. Admin processes and marks as done
 * 5. Customer sees status update on confirmation page
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
};

// Send Telegram notification
async function sendTelegramNotification(message) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.warn('[UpgradeRequest] Telegram not configured');
        return false;
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        if (!response.ok) {
            console.error('[UpgradeRequest] Telegram API error:', await response.text());
            return false;
        }
        return true;
    } catch (error) {
        console.error('[UpgradeRequest] Telegram send error:', error);
        return false;
    }
}

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const db = getDbClient();
    if (!db) {
        return { statusCode: 503, headers, body: JSON.stringify({ error: 'Database not configured' }) };
    }

    try {
        // Ensure upgrade_requests table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS upgrade_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                order_code TEXT NOT NULL,
                product_name TEXT,
                variant_name TEXT,
                customer_username TEXT NOT NULL,
                customer_password TEXT NOT NULL,
                customer_note TEXT,
                status TEXT NOT NULL DEFAULT 'submitted',
                admin_note TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                FOREIGN KEY (order_id) REFERENCES orders(id)
            )
        `);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_upgrade_order ON upgrade_requests(order_code)`);

        // GET - Check upgrade request status
        if (event.httpMethod === 'GET') {
            const { order } = event.queryStringParameters || {};

            if (!order) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing order code' }) };
            }

            const result = await db.execute({
                sql: `SELECT * FROM upgrade_requests WHERE order_code = ? ORDER BY created_at DESC LIMIT 1`,
                args: [order]
            });

            if (result.rows.length === 0) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        exists: false,
                        message: 'No upgrade request found for this order'
                    })
                };
            }

            const req = result.rows[0];
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    exists: true,
                    status: req.status, // submitted | processing | done | rejected
                    statusText: getStatusText(req.status),
                    createdAt: req.created_at,
                    updatedAt: req.updated_at,
                    completedAt: req.completed_at,
                    adminNote: req.admin_note
                })
            };
        }

        // POST - Submit upgrade request
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const { orderCode, username, password, note } = body;

            if (!orderCode || !username || !password) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing required fields: orderCode, username, password' })
                };
            }

            // Verify order exists and is fulfilled
            const orderResult = await db.execute({
                sql: `SELECT id, status, customer_email, customer_phone FROM orders WHERE order_code = ?`,
                args: [orderCode]
            });

            if (orderResult.rows.length === 0) {
                return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) };
            }

            const order = orderResult.rows[0];

            if (order.status !== 'fulfilled') {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Order must be paid before submitting upgrade request' })
                };
            }

            // Check if upgrade request already exists
            const existingResult = await db.execute({
                sql: `SELECT id FROM upgrade_requests WHERE order_code = ?`,
                args: [orderCode]
            });

            if (existingResult.rows.length > 0) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Upgrade request already submitted for this order' })
                };
            }

            // Get order details
            const detailsResult = await db.execute({
                sql: `
                    SELECT ol.product_name, ol.variant_name
                    FROM order_lines ol
                    WHERE ol.order_id = ?
                    LIMIT 1
                `,
                args: [order.id]
            });

            const productName = detailsResult.rows[0]?.product_name || 'Unknown';
            const variantName = detailsResult.rows[0]?.variant_name || 'Unknown';

            // Insert upgrade request
            const now = new Date().toISOString();
            await db.execute({
                sql: `
                    INSERT INTO upgrade_requests
                    (order_id, order_code, product_name, variant_name, customer_username, customer_password, customer_note, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)
                `,
                args: [order.id, orderCode, productName, variantName, username, password, note || '', now, now]
            });

            // Send Telegram notification
            const telegramMessage = `
<b>🔔 YÊU CẦU NÂNG CẤP MỚI</b>

<b>Mã đơn:</b> ${orderCode}
<b>Dịch vụ:</b> ${productName}
<b>Gói:</b> ${variantName}
<b>SĐT:</b> ${order.customer_phone || 'N/A'}

<b>Thông tin TK khách:</b>
<code>${username}</code>
<code>${password}</code>
${note ? `\n<b>Ghi chú:</b> ${note}` : ''}

<i>Trả lời: /done ${orderCode} để hoàn tất</i>
`;

            const telegramSent = await sendTelegramNotification(telegramMessage);

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Upgrade request submitted successfully',
                    telegramNotified: telegramSent,
                    status: 'submitted'
                })
            };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    } catch (error) {
        console.error('[UpgradeRequest] Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
        };
    }
};

function getStatusText(status) {
    const texts = {
        submitted: 'Đã gửi yêu cầu - Chờ xử lý',
        processing: 'Đang xử lý',
        done: 'Hoàn tất',
        rejected: 'Từ chối'
    };
    return texts[status] || status;
}
