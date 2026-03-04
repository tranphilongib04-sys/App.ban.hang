/**
 * CHECK EXPIRATIONS - Netlify Scheduled Function
 *
 * Runs daily at 01:00 UTC (08:00 UTC+7) to check for orders expiring tomorrow.
 * Sends Telegram reminder 1 day before expiration.
 *
 * Schedule: "0 1 * * *"
 */

const { createClient } = require('@libsql/client/web');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('Database not configured');
    return createClient({ url, authToken });
}

// Send Telegram notification (reuses pattern from upgrade-request.js)
async function sendTelegramNotification(message) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.warn('[CheckExpirations] Telegram not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing)');
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
            console.error('[CheckExpirations] Telegram API error:', await response.text());
            return false;
        }
        return true;
    } catch (error) {
        console.error('[CheckExpirations] Telegram send error:', error);
        return false;
    }
}

// Format date as DD/MM/YYYY
function formatDateVN(dateStr) {
    try {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return dateStr;
    }
}

exports.handler = async function (event, context) {
    console.log('[CheckExpirations] Starting expiration check...');

    const db = getDbClient();

    try {
        // Ensure columns exist
        try { await db.execute(`ALTER TABLE orders ADD COLUMN expires_at TEXT`); } catch { /* ok */ }
        try { await db.execute(`ALTER TABLE orders ADD COLUMN expiry_reminded INTEGER DEFAULT 0`); } catch { /* ok */ }

        // Calculate tomorrow's date in UTC+7 (Vietnam timezone)
        const now = new Date();
        // Shift to UTC+7
        const utc7Now = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        const tomorrow = new Date(utc7Now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

        const todayStr = utc7Now.toISOString().split('T')[0];

        console.log(`[CheckExpirations] Today (UTC+7): ${todayStr}, checking for expires_at = ${tomorrowStr}`);

        // Find fulfilled orders expiring tomorrow that haven't been reminded
        const expiringOrders = await db.execute({
            sql: `SELECT o.id, o.order_code, o.customer_name, o.customer_phone, o.customer_email, 
                         o.customer_note, o.expires_at,
                         GROUP_CONCAT(ol.product_name, ', ') as product_names
                  FROM orders o
                  LEFT JOIN order_lines ol ON o.id = ol.order_id
                  WHERE o.status = 'fulfilled'
                    AND o.expires_at = ?
                    AND (o.expiry_reminded IS NULL OR o.expiry_reminded = 0)
                  GROUP BY o.id`,
            args: [tomorrowStr]
        });

        console.log(`[CheckExpirations] Found ${expiringOrders.rows.length} orders expiring on ${tomorrowStr}`);

        let sentCount = 0;
        let failedCount = 0;

        for (const order of expiringOrders.rows) {
            // Calculate days remaining
            const expiresDate = new Date(order.expires_at);
            const diffMs = expiresDate.getTime() - utc7Now.getTime();
            const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            // Build Telegram message per user's requested format
            const message = `<b>⏰ Nhắc gia hạn: ${order.product_names || 'N/A'}</b>

<b>Tên:</b> ${order.customer_name || 'N/A'}
<b>SĐT:</b> ${order.customer_phone || 'N/A'}
<b>Email:</b> ${order.customer_email || 'N/A'}
<b>Hạn sử dụng:</b> ${formatDateVN(order.expires_at)}
<b>Còn lại:</b> ${daysRemaining} ngày
<b>Mã đơn:</b> ${order.order_code}${order.customer_note ? `\n<b>Note:</b> ${order.customer_note}` : ''}`;

            const sent = await sendTelegramNotification(message);

            if (sent) {
                // Mark as reminded to prevent duplicate notifications
                await db.execute({
                    sql: `UPDATE orders SET expiry_reminded = 1 WHERE id = ?`,
                    args: [order.id]
                });
                sentCount++;
                console.log(`[CheckExpirations] Sent reminder for order ${order.order_code}`);
            } else {
                failedCount++;
                console.log(`[CheckExpirations] Failed to send for order ${order.order_code}`);
            }
        }

        // Also check for already-expired orders (today) that haven't been reminded
        const expiredToday = await db.execute({
            sql: `SELECT o.id, o.order_code, o.customer_name, o.customer_phone, o.customer_email, 
                         o.customer_note, o.expires_at,
                         GROUP_CONCAT(ol.product_name, ', ') as product_names
                  FROM orders o
                  LEFT JOIN order_lines ol ON o.id = ol.order_id
                  WHERE o.status = 'fulfilled'
                    AND o.expires_at = ?
                    AND (o.expiry_reminded IS NULL OR o.expiry_reminded = 0)
                  GROUP BY o.id`,
            args: [todayStr]
        });

        for (const order of expiredToday.rows) {
            const message = `<b>🚨 HẾT HẠN HÔM NAY: ${order.product_names || 'N/A'}</b>

<b>Tên:</b> ${order.customer_name || 'N/A'}
<b>SĐT:</b> ${order.customer_phone || 'N/A'}
<b>Email:</b> ${order.customer_email || 'N/A'}
<b>Hạn sử dụng:</b> ${formatDateVN(order.expires_at)}
<b>Còn lại:</b> 0 ngày (hết hạn hôm nay)
<b>Mã đơn:</b> ${order.order_code}${order.customer_note ? `\n<b>Note:</b> ${order.customer_note}` : ''}`;

            const sent = await sendTelegramNotification(message);
            if (sent) {
                await db.execute({
                    sql: `UPDATE orders SET expiry_reminded = 1 WHERE id = ?`,
                    args: [order.id]
                });
                sentCount++;
            } else {
                failedCount++;
            }
        }

        const resultMsg = `Expiration check complete: ${sentCount} reminders sent, ${failedCount} failed`;
        console.log(`[CheckExpirations] ${resultMsg}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: resultMsg,
                checked_date: tomorrowStr,
                reminders_sent: sentCount,
                failed: failedCount
            })
        };

    } catch (error) {
        console.error('[CheckExpirations] Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
