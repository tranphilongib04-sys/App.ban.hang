/**
 * TELEGRAM BOT WEBHOOK - Netlify Function
 *
 * POST /api/telegram-bot  — Receives Telegram updates (messages)
 *
 * Interactive commands:
 *   /tongdon [days]   — Order summary (today or N days)
 *   /don <code>       — Order detail
 *   /suadon <code> <field>=<value>  — Edit order
 *   /kho             — Stock overview
 *   /khach           — Top customers
 *   /timdon <keyword> — Search orders
 *   /done <code>     — Mark upgrade request done
 *   /baocao          — Trigger daily report now
 *   /help            — Show all commands
 *
 * Security: only responds to TELEGRAM_CHAT_ID
 */

const { createClient } = require('@libsql/client/web');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('Database not configured');
    return createClient({ url, authToken });
}

// ── Telegram helpers ────────────────────────────────────────────────────────
async function reply(chatId, text) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return;

    // Telegram limits message to 4096 chars
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

function getTodayVN() {
    const now = new Date();
    const utc7 = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return utc7.toISOString().split('T')[0];
}

function getDateNDaysAgoVN(n) {
    const now = new Date();
    const utc7 = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    utc7.setDate(utc7.getDate() - n);
    return utc7.toISOString().split('T')[0];
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

// /tongdon [days] — Order summary
async function handleTongDon(db, args) {
    const days = parseInt(args[0]) || 0; // 0 = today only
    const label = days > 0 ? `${days} ngày qua` : 'hôm nay';

    let dateFilter;
    if (days > 0) {
        dateFilter = getDateNDaysAgoVN(days);
    } else {
        dateFilter = getTodayVN();
    }

    // Fulfilled orders
    const revenue = await db.execute({
        sql: `SELECT COUNT(*) as cnt, COALESCE(SUM(amount_total),0) as total
              FROM orders WHERE status = 'fulfilled' AND DATE(updated_at) >= ?`,
        args: [dateFilter]
    });

    // All orders created (for conversion)
    const allOrders = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM orders WHERE DATE(created_at) >= ?`,
        args: [dateFilter]
    });

    // Pending
    const pending = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM orders WHERE status = 'pending_payment' AND DATE(created_at) >= ?`,
        args: [dateFilter]
    });

    // Expired
    const expired = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM orders WHERE status = 'expired' AND DATE(created_at) >= ?`,
        args: [dateFilter]
    });

    // Top products
    const products = await db.execute({
        sql: `SELECT ol.product_name, SUM(ol.quantity) as qty, SUM(ol.subtotal) as amt
              FROM order_lines ol JOIN orders o ON ol.order_id = o.id
              WHERE o.status = 'fulfilled' AND DATE(o.updated_at) >= ?
              GROUP BY ol.product_name ORDER BY amt DESC LIMIT 5`,
        args: [dateFilter]
    });

    const fulfilled = Number(revenue.rows[0].cnt);
    const totalRev = Number(revenue.rows[0].total);
    const total = Number(allOrders.rows[0].cnt);
    const rate = total > 0 ? ((fulfilled / total) * 100).toFixed(1) : 0;

    let msg = `<b>📊 TỔNG ĐƠN — ${label}</b>\n`;
    msg += `\n<b>💰 Doanh thu:</b> ${formatVND(totalRev)}`;
    msg += `\n<b>✅ Thành công:</b> ${fulfilled} đơn`;
    if (Number(pending.rows[0].cnt) > 0) msg += `\n<b>⏳ Chờ TT:</b> ${pending.rows[0].cnt}`;
    if (Number(expired.rows[0].cnt) > 0) msg += `\n<b>❌ Hết hạn:</b> ${expired.rows[0].cnt}`;
    if (total > 0) msg += `\n<b>📈 Tỉ lệ:</b> ${rate}% (${fulfilled}/${total})`;

    if (products.rows.length > 0) {
        msg += `\n\n<b>🏆 Sản phẩm:</b>`;
        for (const p of products.rows) {
            msg += `\n  • ${p.product_name} x${p.qty} — ${formatVND(p.amt)}`;
        }
    }

    if (fulfilled === 0 && total === 0) {
        msg += `\n\n<i>Chưa có đơn hàng nào.</i>`;
    }

    return msg;
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

// /kho — Stock overview
async function handleKho(db) {
    const result = await db.execute(`
        SELECT
            s.name,
            s.delivery_type,
            SUM(CASE WHEN si.status='available' THEN 1 ELSE 0 END) AS available,
            SUM(CASE WHEN si.status='reserved' THEN 1 ELSE 0 END) AS reserved,
            SUM(CASE WHEN si.status='sold' THEN 1 ELSE 0 END) AS sold
        FROM skus s
        LEFT JOIN stock_items si ON si.sku_id = s.id
        WHERE s.is_active = 1
        GROUP BY s.id, s.name, s.delivery_type
        ORDER BY s.category, s.name
    `);

    if (result.rows.length === 0) return '📦 Chưa có sản phẩm nào trong kho.';

    let msg = '<b>📦 KHO HÀNG</b>\n';
    for (const r of result.rows) {
        const isPreorder = ['owner_upgrade', 'preorder'].includes(r.delivery_type || 'auto');
        const avail = isPreorder ? '∞' : Number(r.available || 0);
        const reservedCount = Number(r.reserved || 0);
        const soldCount = Number(r.sold || 0);

        const stockEmoji = isPreorder ? '🔧' : (avail > 0 ? '🟢' : '🔴');
        msg += `\n${stockEmoji} <b>${r.name}</b>`;
        msg += `\n   Còn: ${avail}`;
        if (reservedCount > 0) msg += ` | Giữ: ${reservedCount}`;
        msg += ` | Đã bán: ${soldCount}`;
    }

    return msg;
}

// /khach — Top customers
async function handleKhach(db) {
    const result = await db.execute(`
        SELECT
            customer_name as name,
            customer_phone as phone,
            customer_email as email,
            COUNT(*) as total_orders,
            SUM(CASE WHEN status = 'fulfilled' THEN amount_total ELSE 0 END) as total_spent,
            MAX(created_at) as last_order
        FROM orders
        WHERE customer_email IS NOT NULL AND customer_email != ''
        GROUP BY customer_email
        ORDER BY total_spent DESC
        LIMIT 10
    `);

    if (result.rows.length === 0) return '👥 Chưa có khách hàng nào.';

    let msg = '<b>👥 TOP KHÁCH HÀNG</b>\n';
    let i = 1;
    for (const r of result.rows) {
        const medal = i <= 3 ? ['🥇', '🥈', '🥉'][i - 1] : `${i}.`;
        msg += `\n${medal} <b>${r.name || 'N/A'}</b>`;
        msg += `\n   ${formatVND(r.total_spent)} — ${r.total_orders} đơn`;
        if (r.phone) msg += ` | ${r.phone}`;
        i++;
    }

    return msg;
}

// /timdon <keyword> — Search orders
async function handleTimDon(db, args) {
    const keyword = args.join(' ').trim();
    if (!keyword) return '⚠️ Cần từ khoá. Ví dụ: /timdon 0988428496';

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

// /done <code> — Mark upgrade request as done
async function handleDone(db, args) {
    const code = args[0];
    if (!code) return '⚠️ Cần mã đơn. Ví dụ: /done TBQ387522373';

    const now = new Date().toISOString();

    // Check if upgrade request exists
    const reqRes = await db.execute({
        sql: `SELECT id, status FROM upgrade_requests WHERE order_code = ? LIMIT 1`,
        args: [code.toUpperCase()]
    });

    if (!reqRes.rows[0]) {
        return `❌ Không tìm thấy yêu cầu upgrade cho đơn <b>${code}</b>`;
    }

    if (reqRes.rows[0].status === 'done') {
        return `ℹ️ Đơn <b>${code}</b> đã được hoàn tất trước đó.`;
    }

    await db.execute({
        sql: `UPDATE upgrade_requests SET status = 'done', completed_at = ?, updated_at = ? WHERE order_code = ?`,
        args: [now, now, code.toUpperCase()]
    });

    return `✅ Đã hoàn tất upgrade đơn <b>${code}</b>`;
}

// /baocao — Trigger daily report now
async function handleBaoCao(db) {
    const todayStr = getTodayVN();

    // Revenue & fulfilled
    const rev = await db.execute({
        sql: `SELECT COUNT(*) as cnt, COALESCE(SUM(amount_total),0) as total
              FROM orders WHERE status = 'fulfilled' AND DATE(updated_at) = ?`,
        args: [todayStr]
    });

    // Products sold
    const products = await db.execute({
        sql: `SELECT ol.product_name, SUM(ol.quantity) as qty, SUM(ol.subtotal) as amt
              FROM order_lines ol JOIN orders o ON ol.order_id = o.id
              WHERE o.status = 'fulfilled' AND DATE(o.updated_at) = ?
              GROUP BY ol.product_name ORDER BY amt DESC`,
        args: [todayStr]
    });

    // Pending & expired
    const pe = await db.execute({
        sql: `SELECT
                SUM(CASE WHEN status = 'pending_payment' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired
              FROM orders WHERE DATE(created_at) = ?`,
        args: [todayStr]
    });

    // Total
    const tot = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM orders WHERE DATE(created_at) = ?`,
        args: [todayStr]
    });

    const fulfilled = Number(rev.rows[0].cnt);
    const totalRev = Number(rev.rows[0].total);
    const totalOrders = Number(tot.rows[0].cnt);
    const pendingCount = Number(pe.rows[0]?.pending || 0);
    const expiredCount = Number(pe.rows[0]?.expired || 0);
    const rate = totalOrders > 0 ? ((fulfilled / totalOrders) * 100).toFixed(1) : 0;

    const now = new Date();
    const utc7 = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const dateLabel = formatDateVN(utc7.toISOString());

    let msg = `<b>📊 BÁO CÁO — ${dateLabel}</b>\n`;
    msg += `\n<b>💰 Doanh thu:</b> ${formatVND(totalRev)}`;
    msg += `\n<b>📦 Đơn thành công:</b> ${fulfilled}`;
    if (expiredCount > 0) msg += `\n<b>❌ Đơn hết hạn:</b> ${expiredCount}`;
    if (pendingCount > 0) msg += `\n<b>⏳ Đơn đang chờ:</b> ${pendingCount}`;

    if (products.rows.length > 0) {
        msg += `\n\n<b>🏆 Sản phẩm đã bán:</b>`;
        for (const r of products.rows) {
            msg += `\n  • ${r.product_name} x${r.qty} — ${formatVND(r.amt)}`;
        }
    }

    if (totalOrders > 0) {
        msg += `\n\n<b>📈 Tỉ lệ chuyển đổi:</b> ${rate}% (${fulfilled}/${totalOrders})`;
    }

    if (fulfilled === 0 && totalOrders === 0) {
        msg += `\n\n<i>Không có đơn hàng nào hôm nay.</i>`;
    }

    return msg;
}

// /help — Show all commands
function handleHelp() {
    return `<b>📋 DANH SÁCH LỆNH</b>

<b>/tongdon</b> [số ngày]
  Tổng hợp đơn hàng hôm nay
  VD: /tongdon hoặc /tongdon 7

<b>/don</b> &lt;mã đơn&gt;
  Xem chi tiết đơn hàng
  VD: /don TBQ841830508

<b>/suadon</b> &lt;mã&gt; &lt;field=value&gt;
  Sửa thông tin đơn
  VD: /suadon TBQ841 name=Nguyễn Văn A
  Fields: name, phone, email, note, status

<b>/kho</b>
  Xem tồn kho tất cả sản phẩm

<b>/khach</b>
  Top 10 khách hàng (theo chi tiêu)

<b>/timdon</b> &lt;từ khoá&gt;
  Tìm đơn theo tên/SĐT/email/mã
  VD: /timdon 0988428496

<b>/done</b> &lt;mã đơn&gt;
  Hoàn tất yêu cầu nâng cấp
  VD: /done TBQ387522373

<b>/baocao</b>
  Xem báo cáo ngay (giống cuối ngày)

<b>/help</b>
  Hiển thị tin nhắn này`;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════════════════════
exports.handler = async function (event) {
    // Only accept POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 200, body: 'OK' };
    }

    try {
        const update = JSON.parse(event.body || '{}');
        const message = update.message;

        // No message or no text → ignore
        if (!message || !message.text) {
            return { statusCode: 200, body: 'OK' };
        }

        const chatId = String(message.chat.id);
        const allowedChatId = process.env.TELEGRAM_CHAT_ID;

        // Security: only respond to admin chat
        if (allowedChatId && chatId !== allowedChatId) {
            console.log(`[TelegramBot] Rejected message from chat ${chatId} (allowed: ${allowedChatId})`);
            return { statusCode: 200, body: 'OK' };
        }

        const text = message.text.trim();

        // Only handle commands (starting with /)
        if (!text.startsWith('/')) {
            return { statusCode: 200, body: 'OK' };
        }

        // Parse command — handle @botname suffix (e.g. /help@MyBot)
        const parts = text.split(/\s+/);
        const cmd = parts[0].split('@')[0].toLowerCase();
        const args = parts.slice(1);

        console.log(`[TelegramBot] Command: ${cmd}, args: ${args.join(' ')}`);

        const db = getDbClient();
        let response;

        switch (cmd) {
            case '/tongdon':
                response = await handleTongDon(db, args);
                break;
            case '/don':
                response = await handleDon(db, args);
                break;
            case '/suadon':
                response = await handleSuaDon(db, args);
                break;
            case '/kho':
                response = await handleKho(db);
                break;
            case '/khach':
                response = await handleKhach(db);
                break;
            case '/timdon':
                response = await handleTimDon(db, args);
                break;
            case '/done':
                response = await handleDone(db, args);
                break;
            case '/baocao':
                response = await handleBaoCao(db);
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
        console.error('[TelegramBot] Error:', error);

        // Try to send error message back
        try {
            const update = JSON.parse(event.body || '{}');
            if (update.message?.chat?.id) {
                await reply(String(update.message.chat.id), `❌ Lỗi: ${error.message}`);
            }
        } catch { /* ignore */ }

        // Always return 200 to Telegram (avoid retries)
        return { statusCode: 200, body: 'OK' };
    }
};
