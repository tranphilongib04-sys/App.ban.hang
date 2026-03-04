/**
 * DAILY REPORT - Netlify Scheduled Function
 *
 * Runs daily at 16:30 UTC (23:30 UTC+7) to send a daily financial summary
 * via Telegram. Reports revenue, orders fulfilled, products sold, and
 * conversion rate for the day.
 *
 * Schedule: "30 16 * * *"
 */

const { createClient } = require('@libsql/client/web');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('Database not configured');
    return createClient({ url, authToken });
}

// Send Telegram notification
async function sendTelegramNotification(message) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.warn('[DailyReport] Telegram not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing)');
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
            console.error('[DailyReport] Telegram API error:', await response.text());
            return false;
        }
        return true;
    } catch (error) {
        console.error('[DailyReport] Telegram send error:', error);
        return false;
    }
}

function formatVND(amount) {
    return Number(amount || 0).toLocaleString('vi-VN') + 'đ';
}

// Format date as DD/MM/YYYY
function formatDateVN(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

exports.handler = async function (event, context) {
    console.log('[DailyReport] Starting daily report generation...');

    const db = getDbClient();

    try {
        // Calculate today's date in UTC+7 (Vietnam timezone)
        const now = new Date();
        const utc7Now = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        const todayStr = utc7Now.toISOString().split('T')[0]; // YYYY-MM-DD

        console.log(`[DailyReport] Generating report for: ${todayStr}`);

        // ── 1. Revenue & fulfilled orders today ──
        const revenueResult = await db.execute({
            sql: `
                SELECT
                    COUNT(*) as order_count,
                    COALESCE(SUM(amount_total), 0) as total_revenue
                FROM orders
                WHERE status = 'fulfilled'
                AND DATE(updated_at) = ?
            `,
            args: [todayStr]
        });

        const { order_count: fulfilledCount, total_revenue: totalRevenue } = revenueResult.rows[0];

        // ── 2. Products sold today (from order_lines) ──
        const productsResult = await db.execute({
            sql: `
                SELECT
                    ol.product_name,
                    SUM(ol.quantity) as total_qty,
                    SUM(ol.subtotal) as total_amount
                FROM order_lines ol
                JOIN orders o ON ol.order_id = o.id
                WHERE o.status = 'fulfilled'
                AND DATE(o.updated_at) = ?
                GROUP BY ol.product_name
                ORDER BY total_amount DESC
            `,
            args: [todayStr]
        });

        // ── 3. Pending & expired orders today ──
        const pendingResult = await db.execute({
            sql: `
                SELECT
                    COUNT(*) FILTER (WHERE status = 'pending_payment') as pending_count,
                    COUNT(*) FILTER (WHERE status = 'expired') as expired_count
                FROM orders
                WHERE DATE(created_at) = ?
            `,
            args: [todayStr]
        });

        const { pending_count: pendingCount, expired_count: expiredCount } = pendingResult.rows[0];

        // ── 4. Total orders created today (for conversion rate) ──
        const totalOrdersResult = await db.execute({
            sql: `
                SELECT COUNT(*) as total
                FROM orders
                WHERE DATE(created_at) = ?
            `,
            args: [todayStr]
        });

        const totalOrders = totalOrdersResult.rows[0].total;
        const conversionRate = totalOrders > 0
            ? ((fulfilledCount / totalOrders) * 100).toFixed(1)
            : 0;

        // ── 5. Build Telegram message ──
        let message = `<b>📊 BÁO CÁO CUỐI NGÀY — ${formatDateVN(utc7Now)}</b>\n`;

        message += `\n<b>💰 Doanh thu:</b> ${formatVND(totalRevenue)}`;
        message += `\n<b>📦 Đơn thành công:</b> ${fulfilledCount}`;

        if (expiredCount > 0) {
            message += `\n<b>❌ Đơn hết hạn:</b> ${expiredCount}`;
        }
        if (pendingCount > 0) {
            message += `\n<b>⏳ Đơn đang chờ:</b> ${pendingCount}`;
        }

        // Product breakdown
        if (productsResult.rows.length > 0) {
            message += `\n\n<b>🏆 Sản phẩm đã bán:</b>`;
            for (const row of productsResult.rows) {
                message += `\n  • ${row.product_name} x${row.total_qty} — ${formatVND(row.total_amount)}`;
            }
        }

        // Conversion rate
        if (totalOrders > 0) {
            message += `\n\n<b>📈 Tỉ lệ chuyển đổi:</b> ${conversionRate}% (${fulfilledCount}/${totalOrders})`;
        }

        // No orders at all
        if (fulfilledCount === 0 && totalOrders === 0) {
            message += `\n\n<i>Không có đơn hàng nào hôm nay.</i>`;
        }

        console.log(`[DailyReport] Report ready: ${fulfilledCount} orders, ${formatVND(totalRevenue)} revenue`);

        // ── 6. Send via Telegram ──
        const sent = await sendTelegramNotification(message);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                sent,
                date: todayStr,
                summary: {
                    revenue: totalRevenue,
                    fulfilled: fulfilledCount,
                    expired: expiredCount,
                    pending: pendingCount,
                    total_orders: totalOrders,
                    conversion_rate: conversionRate + '%',
                    products_sold: productsResult.rows.length
                }
            })
        };

    } catch (error) {
        console.error('[DailyReport] Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
