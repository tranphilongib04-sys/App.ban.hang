/**
 * TELEGRAM BOT 1 — ĐƠN HÀNG (Order Intake)
 *
 * POST /api/telegram-bot-orders  — Webhook for Bot 1
 *
 * Commands:
 *   /xacnhan <code>     — Xác nhận thanh toán thủ công → trigger fulfillment
 *   /don <code>          — Xem chi tiết đơn
 *   /timdon <keyword>    — Tìm đơn
 *   /suadon <code> <f>=<v> — Sửa đơn
 *   /help                — Danh sách lệnh
 *
 * Security: only responds to TELEGRAM_CHAT_ID
 */

const { createClient } = require('@libsql/client/web');
const { finalizeOrder, ensurePaymentSchema } = require('./utils/fulfillment');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('Database not configured');
    return createClient({ url, authToken });
}

// ── Telegram helpers ────────────────────────────────────────────────────────
function getBotToken() {
    return process.env.TELEGRAM_BOT1_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
}

async function reply(chatId, text) {
    const botToken = getBotToken();
    if (!botToken) return;

    const chunks = [];
    let remaining = text;
    while (remaining.length > 0) {
        chunks.push(remaining.substring(0, 4000));
        remaining = remaining.substring(4000);
    }

    for (const chunk of chunks) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: chunk,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });
    }
}

function formatVND(amount) {
    return Number(amount || 0).toLocaleString('vi-VN') + 'đ';
}

function formatDateVN(dateStr) {
    try {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch { return dateStr || 'N/A'; }
}

const STATUS_EMOJI = {
    fulfilled: '✅',
    pending_payment: '⏳',
    paid: '💳',
    expired: '❌',
    cancelled: '🚫',
    failed: '💥',
    refunded: '↩️'
};

// ══════════════════════════════════════════════════════════════════════════════
// COMMAND HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

// /xacnhan <code> — Manual payment confirmation → triggers fulfillment (Bot 2)
async function handleXacNhan(db, args, chatId) {
    const code = args[0];
    if (!code) return '⚠️ Cần mã đơn. Ví dụ: /xacnhan TBQ841830508';

    const orderRes = await db.execute({
        sql: 'SELECT * FROM orders WHERE order_code = ? LIMIT 1',
        args: [code.toUpperCase()]
    });
    if (!orderRes.rows[0]) return `❌ Không tìm thấy đơn <b>${code}</b>`;

    const order = orderRes.rows[0];

    // Check if already fulfilled
    if (order.status === 'fulfilled') {
        return `ℹ️ Đơn <b>${code}</b> đã được thanh toán và giao hàng trước đó.`;
    }

    // Check if valid status for payment confirmation
    if (!['pending_payment', 'expired'].includes(order.status)) {
        return `⚠️ Đơn <b>${code}</b> đang ở trạng thái <b>${order.status}</b>, không thể xác nhận thanh toán.`;
    }

    // Ensure payment schema
    await ensurePaymentSchema(db);

    // Fulfill inside write transaction
    const tx = await db.transaction('write');
    try {
        const transaction = {
            id: `MANUAL-${order.order_code}-${Date.now()}`,
            reference_number: `MANUAL-${order.order_code}`
        };

        const result = await finalizeOrder(tx, order, transaction, 'telegram-manual');
        await tx.commit();

        if (result.alreadyFulfilled) {
            return `ℹ️ Đơn <b>${code}</b> đã được xử lý trước đó.`;
        }

        // Delete the QR photo message from chat
        if (order.telegram_qr_msg_id) {
            try {
                const botToken = getBotToken();
                await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        message_id: order.telegram_qr_msg_id
                    })
                });
                console.log(`[Bot1] Deleted QR message ${order.telegram_qr_msg_id} for ${code}`);
            } catch (e) {
                console.warn('[Bot1] Could not delete QR message:', e.message);
            }
        }

        let msg = `✅ <b>ĐÃ XÁC NHẬN THANH TOÁN</b>\n\n`;
        msg += `<b>Mã đơn:</b> ${order.order_code}\n`;
        msg += `<b>Khách:</b> ${order.customer_name || 'N/A'}\n`;
        msg += `<b>Tổng:</b> ${formatVND(order.amount_total)}\n`;
        msg += `\n<i>→ Bot 2 đang gửi thông tin đăng nhập...</i>`;

        return msg;
    } catch (err) {
        try { tx.close(); } catch { /* ignore */ }
        console.error('[Bot1] Manual fulfillment error:', err.message);
        return `❌ Lỗi xác nhận: ${err.message}`;
    }
}

// /don <code> — Order detail
async function handleDon(db, args) {
    const code = args[0];
    if (!code) return '⚠️ Cần mã đơn. Ví dụ: /don TBQ841830508';

    const orderRes = await db.execute({
        sql: 'SELECT * FROM orders WHERE order_code = ? LIMIT 1',
        args: [code.toUpperCase()]
    });
    if (!orderRes.rows[0]) return `❌ Không tìm thấy đơn <b>${code}</b>`;

    const o = orderRes.rows[0];
    const lines = await db.execute({
        sql: `SELECT ol.product_name, ol.quantity, ol.subtotal, ol.expires_at, s.delivery_type
              FROM order_lines ol LEFT JOIN skus s ON ol.sku_id = s.id
              WHERE ol.order_id = ?`,
        args: [o.id]
    });

    const emoji = STATUS_EMOJI[o.status] || '📦';
    let msg = `${emoji} <b>ĐƠN ${o.order_code}</b>\n`;
    msg += `\n<b>Trạng thái:</b> ${o.status}`;
    msg += `\n<b>Tên:</b> ${o.customer_name || 'N/A'}`;
    msg += `\n<b>SĐT:</b> ${o.customer_phone || 'N/A'}`;
    msg += `\n<b>Email:</b> ${o.customer_email || 'N/A'}`;
    msg += `\n<b>Tổng:</b> ${formatVND(o.amount_total)}`;
    msg += `\n<b>Tạo lúc:</b> ${formatDateVN(o.created_at)}`;
    if (o.customer_note) msg += `\n<b>Ghi chú:</b> ${o.customer_note}`;
    if (o.expires_at) msg += `\n<b>Hạn SD:</b> ${formatDateVN(o.expires_at)}`;

    if (lines.rows.length > 0) {
        msg += `\n\n<b>📦 Sản phẩm:</b>`;
        for (const l of lines.rows) {
            const dt = l.delivery_type === 'owner_upgrade' ? ' 🔧' : '';
            const exp = l.expires_at ? ` (hạn ${formatDateVN(l.expires_at)})` : '';
            msg += `\n  • ${l.product_name} x${l.quantity} — ${formatVND(l.subtotal)}${dt}${exp}`;
        }
    }

    // Credentials (only for fulfilled auto-delivery)
    if (o.status === 'fulfilled') {
        const creds = await db.execute({
            sql: `SELECT si.account_info, si.secret_key, si.note
                  FROM stock_items si WHERE si.order_id = ? AND si.status = 'sold'
                  ORDER BY si.id ASC`,
            args: [o.id]
        });
        if (creds.rows.length > 0) {
            msg += `\n\n<b>🔑 Tài khoản:</b>`;
            for (const c of creds.rows) {
                msg += `\n  <code>${c.account_info || ''}</code>`;
                if (c.secret_key) msg += ` | <code>${c.secret_key}</code>`;
                if (c.note) msg += ` (${c.note})`;
            }
        }
    }

    return msg;
}

// /suadon <code> <field>=<value> — Edit order
async function handleSuaDon(db, args) {
    if (args.length < 2) {
        return `⚠️ Cách dùng: /suadon TBQxxx field=value\n\nCác field:\n• name=Tên mới\n• phone=0123456789\n• email=abc@gmail.com\n• note=Ghi chú\n• status=fulfilled|cancelled|expired`;
    }

    const code = args[0].toUpperCase();
    const orderRes = await db.execute({
        sql: 'SELECT id FROM orders WHERE order_code = ? LIMIT 1',
        args: [code]
    });
    if (!orderRes.rows[0]) return `❌ Không tìm thấy đơn <b>${code}</b>`;

    const orderId = orderRes.rows[0].id;
    const fieldMap = {
        name: 'customer_name',
        phone: 'customer_phone',
        email: 'customer_email',
        note: 'customer_note',
        status: 'status'
    };

    const updates = [];
    const updArgs = [];
    const changes = [];

    for (let i = 1; i < args.length; i++) {
        const eqIdx = args[i].indexOf('=');
        if (eqIdx === -1) continue;
        const key = args[i].substring(0, eqIdx).toLowerCase();
        const val = args[i].substring(eqIdx + 1);
        const col = fieldMap[key];
        if (!col) continue;

        updates.push(`${col} = ?`);
        updArgs.push(val);
        changes.push(`${key} → ${val}`);
    }

    if (updates.length === 0) {
        return '⚠️ Không có field hợp lệ. Dùng: name, phone, email, note, status';
    }

    updates.push('updated_at = ?');
    updArgs.push(new Date().toISOString());
    updArgs.push(orderId);

    await db.execute({
        sql: `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
        args: updArgs
    });

    // If status changed to cancelled/expired, release stock
    const statusChange = changes.find(c => c.startsWith('status'));
    if (statusChange) {
        const newStatus = statusChange.split(' → ')[1];
        if (['cancelled', 'expired'].includes(newStatus)) {
            await db.execute({
                sql: `UPDATE stock_items SET status = 'available', order_id = NULL WHERE order_id = ? AND status = 'reserved'`,
                args: [orderId]
            });
        }
    }

    return `✅ Đã cập nhật đơn <b>${code}</b>:\n${changes.map(c => `  • ${c}`).join('\n')}`;
}

// /timdon <keyword> — Search orders
async function handleTimDon(db, args) {
    const keyword = args.join(' ').trim();
    if (!keyword) return '⚠️ Cần từ khoá. Ví dụ: /timdon 0123456789';

    const like = `%${keyword}%`;
    const result = await db.execute({
        sql: `SELECT order_code, customer_name, customer_phone, status, amount_total, created_at
              FROM orders
              WHERE customer_name LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ? OR order_code LIKE ?
              ORDER BY created_at DESC LIMIT 10`,
        args: [like, like, like, like]
    });

    if (result.rows.length === 0) return `🔍 Không tìm thấy đơn nào cho "<b>${keyword}</b>"`;

    let msg = `<b>🔍 Kết quả: "${keyword}"</b> (${result.rows.length} đơn)\n`;
    for (const r of result.rows) {
        const emoji = STATUS_EMOJI[r.status] || '📦';
        msg += `\n${emoji} <b>${r.order_code}</b> — ${r.customer_name || 'N/A'}`;
        msg += `\n   ${r.customer_phone || ''} | ${formatVND(r.amount_total)} | ${formatDateVN(r.created_at)}`;
    }

    return msg;
}

// /help — Show all commands
function handleHelp() {
    return `<b>🛒 BOT 1 — ĐƠN HÀNG</b>

<b>/xacnhan</b> &lt;mã đơn&gt;
  Xác nhận thanh toán thủ công
  VD: /xacnhan TBQ841830508

<b>/don</b> &lt;mã đơn&gt;
  Xem chi tiết đơn hàng
  VD: /don TBQ841830508

<b>/suadon</b> &lt;mã&gt; &lt;field=value&gt;
  Sửa thông tin đơn
  VD: /suadon TBQ841 name=Nguyễn Văn A
  Fields: name, phone, email, note, status

<b>/timdon</b> &lt;từ khoá&gt;
  Tìm đơn theo tên/SĐT/email/mã
  VD: /timdon 0123456789

<b>/help</b>
  Hiển thị tin nhắn này`;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════════════════════
exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 200, body: 'OK' };
    }

    try {
        const update = JSON.parse(event.body || '{}');
        const message = update.message;

        if (!message || !message.text) {
            return { statusCode: 200, body: 'OK' };
        }

        const chatId = String(message.chat.id);
        const allowedChatId = process.env.TELEGRAM_CHAT_ID;

        if (allowedChatId && chatId !== allowedChatId) {
            console.log(`[Bot1] Rejected message from chat ${chatId}`);
            return { statusCode: 200, body: 'OK' };
        }

        const text = message.text.trim();
        if (!text.startsWith('/')) {
            return { statusCode: 200, body: 'OK' };
        }

        const parts = text.split(/\s+/);
        const cmd = parts[0].split('@')[0].toLowerCase();
        const args = parts.slice(1);

        console.log(`[Bot1] Command: ${cmd}, args: ${args.join(' ')}`);

        const db = getDbClient();
        let response;

        switch (cmd) {
            case '/xacnhan':
                response = await handleXacNhan(db, args, chatId);
                break;
            case '/don':
                response = await handleDon(db, args);
                break;
            case '/suadon':
                response = await handleSuaDon(db, args);
                break;
            case '/timdon':
                response = await handleTimDon(db, args);
                break;
            case '/help':
            case '/start':
                response = handleHelp();
                break;
            default:
                response = `❓ Lệnh không hợp lệ: <b>${cmd}</b>\nGõ /help để xem danh sách lệnh.`;
        }

        await reply(chatId, response);

        return { statusCode: 200, body: 'OK' };

    } catch (error) {
        console.error('[Bot1] Error:', error);

        try {
            const update = JSON.parse(event.body || '{}');
            if (update.message?.chat?.id) {
                await reply(String(update.message.chat.id), `❌ Lỗi: ${error.message}`);
            }
        } catch { /* ignore */ }

        return { statusCode: 200, body: 'OK' };
    }
};
