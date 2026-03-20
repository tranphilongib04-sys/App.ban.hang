/**
 * Telegram notification helpers for web store functions.
 * Sends admin notifications via Bot 1 (TELEGRAM_BOT1_TOKEN).
 */

/**
 * Send a text message to admin chat via Bot 1.
 */
async function sendTelegramMessage(text) {
    const botToken = process.env.TELEGRAM_BOT1_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) return;

    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true })
        });
    } catch (e) {
        console.warn('[Telegram] sendMessage error:', e.message);
    }
}

/**
 * Delete a message from admin chat.
 */
async function deleteTelegramMessage(messageId) {
    const botToken = process.env.TELEGRAM_BOT1_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId || !messageId) return;

    try {
        await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message_id: messageId })
        });
    } catch (e) {
        console.warn('[Telegram] deleteMessage error:', e.message);
    }
}

/**
 * Notify admin that a payment was confirmed and order fulfilled.
 * Also deletes the QR message if it exists.
 */
async function notifyPaymentConfirmed(db, order, source) {
    const orderCode = order.order_code;
    const amount = order.amount_total;

    // Delete QR message if exists
    if (order.telegram_qr_msg_id) {
        await deleteTelegramMessage(order.telegram_qr_msg_id);
        console.log(`[Telegram] Deleted QR message ${order.telegram_qr_msg_id} for ${orderCode}`);
    }

    // Send confirmation message
    const emoji = source === 'webhook' ? '⚡' : '✅';
    const sourceLabel = source === 'webhook' ? 'SePay Webhook' : source === 'check-payment' ? 'Polling' : source;

    const msg = `${emoji} <b>THANH TOÁN THÀNH CÔNG</b>\n\n` +
        `<b>Mã đơn:</b> ${orderCode}\n` +
        `<b>Khách:</b> ${order.customer_name || 'N/A'}\n` +
        `<b>SĐT:</b> ${order.customer_phone || 'N/A'}\n` +
        `<b>Tổng:</b> ${Number(amount).toLocaleString('vi-VN')}đ\n` +
        `<b>Nguồn:</b> ${sourceLabel}\n\n` +
        `/don ${orderCode}`;

    await sendTelegramMessage(msg);
    console.log(`[Telegram] Sent payment confirmation for ${orderCode} (${source})`);
}

module.exports = { sendTelegramMessage, deleteTelegramMessage, notifyPaymentConfirmed };
