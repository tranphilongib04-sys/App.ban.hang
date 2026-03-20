/**
 * DELIVERY PAGE - Netlify Function (V2)
 *
 * GET /delivery?token=xxx&order=TBQ12345678
 *
 * Returns HTML page with credentials (password hidden by default, reveal on click)
 * + Invoice download button
 */

const { createClient } = require('@libsql/client/web');
const crypto = require('crypto');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('Database not configured');
    return createClient({ url, authToken });
}

// Verify delivery token
function verifyDeliveryToken(token, orderId, email) {
    const secret = process.env.DELIVERY_SECRET;
    if (!secret) throw new Error('DELIVERY_SECRET not configured');
    // Token is valid for 7 days
    const validTokens = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const data = `${orderId}|${email}|${Math.floor(date.getTime() / (1000 * 60 * 60 * 24))}`;
        const hash = crypto.createHash('sha256').update(secret + data).digest('hex').substring(0, 32);
        validTokens.push(hash);
    }
    return validTokens.includes(token);
}

// Escape for HTML attribute (prevents XSS and broken onclick when cred contains ' or ")
function escapeAttr(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Reusable preorder HTML (BE-4: extracted from duplicate blocks)
function renderPreorderHtml(orderCode) {
    return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nhận hàng - TBQ Homie</title>
<style>body{font-family:-apple-system,sans-serif;background:#f5f5f7;color:#1d1d1f;padding:20px;text-align:center;}
.container{max-width:500px;margin:0 auto;background:white;border-radius:16px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.1);}
.success-icon{font-size:48px;margin-bottom:16px;} h1{font-size:24px;margin-bottom:8px;}
.order-code{color:#6e6e73;margin-bottom:24px;} .steps{text-align:left;margin:24px 0;}
.step{margin:12px 0;display:flex;align-items:center;gap:12px;}
.zalo-btn{display:inline-block;background:#0068FF;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;margin-top:16px;}
.zalo-btn:hover{background:#0052cc;}</style></head>
<body><div class="container">
<div class="success-icon">&#128337;</div>
<h1>Đơn hàng đặt trước</h1>
<p class="order-code">Mã đơn: <strong>${orderCode}</strong></p>
<p>Đơn hàng của bạn sẽ được giao qua Zalo trong 5-10 phút.</p>
<div class="steps">
<div class="step"><span>1.</span> Chụp màn hình hóa đơn / xác nhận thanh toán</div>
<div class="step"><span>2.</span> Gửi qua Zalo để nhận tài khoản</div>
<div class="step"><span>3.</span> Nhận tài khoản trong 5-10 phút</div>
</div>
<a href="https://zalo.me/0988428496" target="_blank" class="zalo-btn">Chat Zalo - 0988 428 496</a>
</div></body></html>`;
}

exports.handler = async function (event, context) {
    const { token, order, format } = event.queryStringParameters || {};
    const wantsJson = format === 'json';

    if (!token || !order) {
        if (wantsJson) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: false, error: 'Missing token or order' })
            };
        }
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'text/html' },
            body: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Lỗi - TBQ Homie</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 50px; }
                        .error { color: #ff3b30; }
                    </style>
                </head>
                <body>
                    <h1 class="error">❌ Thiếu thông tin</h1>
                    <p>Vui lòng truy cập qua link được gửi trong email hoặc liên hệ hỗ trợ.</p>
                </body>
                </html>
            `
        };
    }

    try {
        const db = getDbClient();

        // Get order — accept both paid and fulfilled
        const orderResult = await db.execute({
            sql: `
                SELECT o.*, i.invoice_number
                FROM orders o
                LEFT JOIN invoices i ON o.id = i.order_id
                WHERE o.order_code = ? AND o.status IN ('fulfilled', 'paid')
            `,
            args: [order]
        });

        if (orderResult.rows.length === 0) {
            if (wantsJson) {
                return {
                    statusCode: 404,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({ success: false, error: 'Order not found' })
                };
            }
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'text/html' },
                body: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Không tìm thấy - TBQ Homie</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 50px; }
                            .error { color: #ff3b30; }
                        </style>
                    </head>
                    <body>
                        <h1 class="error">❌ Đơn hàng không tồn tại</h1>
                        <p>Vui lòng kiểm tra lại mã đơn hàng hoặc liên hệ hỗ trợ.</p>
                    </body>
                    </html>
                `
            };
        }

        const orderData = orderResult.rows[0];

        // Verify token
        if (!verifyDeliveryToken(token, orderData.id, orderData.customer_email)) {
            if (wantsJson) {
                return {
                    statusCode: 403,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({ success: false, error: 'Invalid or expired token' })
                };
            }
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'text/html' },
                body: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Không có quyền - TBQ Homie</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 50px; }
                            .error { color: #ff3b30; }
                        </style>
                    </head>
                    <body>
                        <h1 class="error">🔒 Không có quyền truy cập</h1>
                        <p>Link này đã hết hạn hoặc không hợp lệ. Vui lòng liên hệ hỗ trợ.</p>
                    </body>
                    </html>
                `
            };
        }

        // ── CRITICAL: Check fulfillment_type BEFORE querying stock_items ──
        // Preorder (owner_upgrade) orders must NEVER show credentials.
        const lineCheckResult = await db.execute({
            sql: `SELECT fulfillment_type FROM order_lines WHERE order_id = ?`,
            args: [orderData.id]
        });
        const allPreorder = lineCheckResult.rows.length > 0 &&
            lineCheckResult.rows.every(r => (r.fulfillment_type || 'auto') === 'owner_upgrade');

        if (allPreorder) {
            const zaloHtml = renderPreorderHtml(order);
            if (wantsJson) {
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({
                        success: true,
                        orderCode: order,
                        fulfillmentType: 'owner_upgrade',
                        message: 'Đơn hàng sẽ được giao qua Zalo. Gửi bill để nhận tài khoản.'
                    })
                };
            }
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
                body: zaloHtml
            };
        }

        // Get credentials from stock_items (V3 unified)
        // Only fetch items from 'auto' delivery SKUs — never show owner_upgrade credentials
        const stockItemsResult = await db.execute({
            sql: `
                SELECT si.account_info, si.secret_key, si.note, s.sku_code, s.name as sku_name
                FROM stock_items si
                JOIN skus s ON si.sku_id = s.id
                WHERE si.order_id = ? AND si.status = 'sold'
                  AND s.delivery_type != 'owner_upgrade'
                ORDER BY si.id ASC
            `,
            args: [orderData.id]
        });

        const credentials = [];
        let hasChatGPTPro = false;
        let hasChatGPTPlus = false;
        let hasChatGPTGo = false;
        for (const item of stockItemsResult.rows) {
            const code = (item.sku_code || '').toLowerCase();
            const isLinkDelivery = code.includes('chatgpt_code') || code.includes('_code_');
            credentials.push({
                username: item.account_info || '',
                password: item.secret_key || '',
                extraInfo: item.note || '',
                isLink: isLinkDelivery
            });
            const codeForFlags = code;
            const name = (item.sku_name || '').toLowerCase();
            if (codeForFlags.includes('chatgpt_pro') || name.includes('chatgpt pro')) {
                hasChatGPTPro = true;
            }
            if (codeForFlags.includes('chatgpt_plus') || name.includes('chatgpt plus')) {
                hasChatGPTPlus = true;
            }
            if (codeForFlags.includes('chatgpt_go') || name.includes('chatgpt go')) {
                hasChatGPTGo = true;
            }
        }
        const hasChatGPTWith2FA = hasChatGPTPlus || hasChatGPTGo;

        // Pre-order order: no stock_items, show Zalo instructions
        if (credentials.length === 0) {
            const lineCheck = await db.execute({
                sql: `SELECT fulfillment_type FROM order_lines WHERE order_id = ? LIMIT 1`,
                args: [orderData.id]
            });
            const ft = lineCheck.rows[0]?.fulfillment_type;
            if (ft === 'owner_upgrade') {
                const zaloHtml = renderPreorderHtml(order);
                if (wantsJson) {
                    return {
                        statusCode: 200,
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify({
                            success: true,
                            orderCode: order,
                            fulfillmentType: 'owner_upgrade',
                            message: 'Đơn hàng sẽ được giao qua Zalo. Gửi bill để nhận tài khoản.'
                        })
                    };
                }
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                    body: zaloHtml
                };
            }
        }

        // Get expiration info for this order
        let expiresAt = orderData.expires_at || null;
        if (!expiresAt) {
            // Try from order_lines
            try {
                const expiryResult = await db.execute({
                    sql: `SELECT MAX(expires_at) as max_expires FROM order_lines WHERE order_id = ? AND expires_at IS NOT NULL`,
                    args: [orderData.id]
                });
                if (expiryResult.rows[0]?.max_expires) {
                    expiresAt = expiryResult.rows[0].max_expires;
                }
            } catch { /* ok */ }
        }

        // If JSON format requested, return JSON response
        if (wantsJson) {
            // Check for preorder items in this order (giao sau qua Zalo)
            const preorderLines = await db.execute({
                sql: `SELECT ol.product_name, ol.quantity, s.sku_code 
                      FROM order_lines ol 
                      LEFT JOIN skus s ON ol.sku_id = s.id
                      WHERE ol.order_id = ? AND ol.fulfillment_type = 'owner_upgrade'`,
                args: [orderData.id]
            });
            const preorderItems = preorderLines.rows.map(r => ({
                name: r.product_name,
                quantity: r.quantity,
                skuCode: r.sku_code
            }));

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({
                    success: true,
                    orderCode: order,
                    invoiceNumber: orderData.invoice_number,
                    credentials: credentials,
                    hasChatGPTPro: hasChatGPTPro,
                    hasPreorderItems: preorderItems.length > 0,
                    preorderItems: preorderItems,
                    customerName: orderData.customer_name || '',
                    customerPhone: orderData.customer_phone || '',
                    expiresAt: expiresAt
                })
            };
        }

        // Generate HTML
        const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nhận hàng - TBQ Homie</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
            background: #f5f5f7;
            color: #1d1d1f;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .success-icon {
            width: 80px;
            height: 80px;
            background: #34c759;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px;
            color: white;
        }
        h1 { text-align: center; margin-bottom: 10px; font-size: 28px; }
        .order-info {
            text-align: center;
            color: #6e6e73;
            margin-bottom: 30px;
        }
        .credential-card {
            background: #f5f5f7;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #d2d2d7;
        }
        .credential-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .credential-title {
            font-weight: 600;
            font-size: 18px;
        }
        .credential-field {
            margin-bottom: 12px;
        }
        .credential-label {
            font-size: 14px;
            color: #6e6e73;
            margin-bottom: 4px;
        }
        .credential-value {
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 16px;
            background: white;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #d2d2d7;
            word-break: break-all;
        }
        .password-hidden {
            filter: blur(8px);
            user-select: none;
        }
        .reveal-btn, .copy-btn {
            background: #0066cc;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }
        .reveal-btn:hover, .copy-btn:hover {
            background: #0052a3;
        }
        .copy-all-btn {
            background: #34c759;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            width: 100%;
            margin-top: 20px;
        }
        .invoice-section {
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid #d2d2d7;
            text-align: center;
        }
        .invoice-btn {
            background: #1d1d1f;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            text-decoration: none;
            display: inline-block;
        }
        .guide {
            background: #f0fdf4;
            border: 1px solid #4ade80;
            border-radius: 12px;
            padding: 20px;
            margin-top: 30px;
        }
        .guide h3 {
            color: #15803d;
            margin-bottom: 10px;
        }
        .guide ul {
            margin-left: 20px;
            color: #166534;
        }
        .toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1d1d1f;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✓</div>
        <h1>Đơn hàng của bạn đã sẵn sàng!</h1>
        <div class="order-info">
            Mã đơn: <strong>${order}</strong><br>
            ${orderData.invoice_number ? `Hóa đơn: <strong>${orderData.invoice_number}</strong><br>` : ''}
            ${expiresAt ? `<span style="color: #f59e0b;">📅 Hạn sử dụng: <strong>${(() => { try { const d = new Date(expiresAt); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(); } catch { return expiresAt; } })()}</strong></span>` : ''}
        </div>

        ${credentials.map((cred, idx) => {
            const safeUser = escapeAttr(cred.username);
            const safePass = escapeAttr(cred.password);
            const safeExtra = escapeAttr(cred.extraInfo);
            const isLink = cred.isLink === true;
            const isUrl = cred.username && /^https?:\/\//i.test(cred.username);
            if (isLink) {
                return `
            <div class="credential-card">
                <div class="credential-header">
                    <div class="credential-title">Code / Link ${idx + 1}</div>
                </div>
                <div class="credential-field">
                    <div class="credential-label">Link kích hoạt</div>
                    <div class="credential-value">
                        ${isUrl ? `<a href="${escapeAttr(cred.username)}" target="_blank" rel="noopener" style="color: #0066cc; word-break: break-all;">${escapeAttr(cred.username)}</a>` : escapeAttr(cred.username)}
                        <button class="copy-btn" onclick="copyToClipboard(this.dataset.value)" data-value="${safeUser}" style="margin-left: 10px;">Copy</button>
                    </div>
                </div>
                ${cred.extraInfo ? `
                    <div class="credential-field">
                        <div class="credential-label">Hướng dẫn &amp; lưu ý</div>
                        <div class="credential-value" style="white-space: pre-wrap;">${safeExtra}</div>
                    </div>
                ` : ''}
            </div>
        `;
            }
            return `
            <div class="credential-card">
                <div class="credential-header">
                    <div class="credential-title">Tài khoản ${idx + 1}</div>
                </div>
                <div class="credential-field">
                    <div class="credential-label">Username</div>
                    <div class="credential-value">
                        ${escapeAttr(cred.username)}
                        <button class="copy-btn" onclick="copyToClipboard(this.dataset.value)" data-value="${safeUser}" style="margin-left: 10px;">Copy</button>
                    </div>
                </div>
                <div class="credential-field">
                    <div class="credential-label">Password</div>
                    <div class="credential-value" id="password-${idx}">
                        <span class="password-hidden" id="password-hidden-${idx}">••••••••</span>
                        <span id="password-revealed-${idx}" style="display: none;">${safePass}</span>
                        <button class="reveal-btn" onclick="revealPassword(${idx})" id="reveal-btn-${idx}">Hiện</button>
                        <button class="copy-btn" onclick="copyToClipboard(this.dataset.value)" id="copy-password-btn-${idx}" data-value="${safePass}" style="display: none; margin-left: 10px;">Copy</button>
                    </div>
                </div>
                ${cred.extraInfo ? `
                    <div class="credential-field">
                        <div class="credential-label">${hasChatGPTWith2FA ? 'Mã 2FA (dùng trên 2fa.live)' : 'Ghi chú'}</div>
                        <div class="credential-value">${safeExtra}</div>
                    </div>
                ` : ''}
            </div>
        `;
        }).join('')}

        <button class="copy-all-btn" onclick="copyAllCredentials()">📋 Copy tất cả thông tin</button>

        ${hasChatGPTWith2FA ? `
        <div class="guide" style="margin-top: 20px;">
            <h3>🔐 Hướng dẫn đăng nhập ${hasChatGPTPlus && hasChatGPTGo ? 'ChatGPT Plus / ChatGPT Go' : hasChatGPTGo ? 'ChatGPT Go' : 'ChatGPT Plus'}</h3>
            <p style="margin-bottom: 10px; color: #374151;">Thông tin gồm: <strong>Tài khoản | Mật khẩu | Mã 2FA</strong>.</p>
            <ol style="margin-left: 20px; color: #166534; line-height: 1.7;">
                <li>Đăng nhập bằng <strong>Tài khoản</strong> và <strong>Mật khẩu</strong> vào trang chính thức.</li>
                <li>Khi trang yêu cầu mã 2FA: copy <strong>Mã 2FA</strong> (ô bên trên) → mở <a href="https://2fa.live" target="_blank" rel="noopener">2fa.live</a> → dán mã vào ô → bấm <strong>Submit</strong> → lấy mã 6 số và nhập vào trang đăng nhập.</li>
            </ol>
        </div>
        ` : ''}

        ${hasChatGPTPro ? `
        <div class="guide" style="margin-top: 20px;">
            <h3>📩 Đăng nhập (gửi sau khi mua)</h3>
            <ul>
                <li>Mở email đã đăng ký</li>
                <li>Tìm thư mời workspace → <strong>Join workspace</strong></li>
                <li>Đăng nhập và dùng</li>
            </ul>
            <p style="margin: 12px 0 0; padding: 10px; background: #fef3c7; border-radius: 8px; border-left: 3px solid #f59e0b; font-size: 13px; color: #92400e;">⚠️ Không chỉnh sửa cài đặt workspace và không tự ý thêm thành viên. Có lỗi thì nhắn Zalo gửi Gmail.</p>
        </div>
        ` : ''}

        <div class="guide">
            <h3>📝 Hướng dẫn sử dụng</h3>
            <ul>
                <li>Lưu lại thông tin tài khoản ngay lập tức</li>
                <li>Đổi mật khẩu sau khi đăng nhập (nếu có thể)</li>
                <li>Không chia sẻ thông tin tài khoản với người khác</li>
                <li>Nếu gặp vấn đề, liên hệ hỗ trợ: Zalo 0988428496</li>
            </ul>
        </div>

        <div class="invoice-section">
            <h3>Hóa đơn</h3>
            <p style="color: #6e6e73; margin-bottom: 15px;">Tải xuống hóa đơn cho đơn hàng này</p>
            <a href="/.netlify/functions/invoice?order=${order}&token=${token}" class="invoice-btn" target="_blank">
                📄 Tải hóa đơn PDF
            </a>
        </div>
    </div>

    <div class="toast" id="toast">Đã sao chép!</div>

    <script>
        function revealPassword(idx) {
            const hidden = document.getElementById('password-hidden-' + idx);
            const revealed = document.getElementById('password-revealed-' + idx);
            const revealBtn = document.getElementById('reveal-btn-' + idx);
            const copyBtn = document.getElementById('copy-password-btn-' + idx);
            
            hidden.style.display = 'none';
            revealed.style.display = 'inline';
            revealBtn.style.display = 'none';
            copyBtn.style.display = 'inline-block';
        }

        function copyToClipboard(textOrEl) {
            const text = typeof textOrEl === 'string' ? textOrEl : (textOrEl && textOrEl.dataset && textOrEl.dataset.value ? textOrEl.dataset.value : '');
            navigator.clipboard.writeText(text).then(() => {
                showToast('Đã sao chép!');
            }).catch(() => {
                showToast('Không thể sao chép');
            });
        }

        function copyAllCredentials() {
            const allText = ${JSON.stringify(credentials.map((c, i) =>
            `Tài khoản ${i + 1}:\\nUsername: ${c.username}\\nPassword: ${c.password}${c.extraInfo ? '\\n' + c.extraInfo : ''}`
        ).join('\\n\\n---\\n\\n')).replace(/<\//g, '<\\/')};
            copyToClipboard(allText);
        }

        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.style.display = 'block';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 2000);
        }
    </script>
</body>
</html>
        `;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: html
        };

    } catch (error) {
        console.error('Delivery error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/html' },
            body: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Lỗi - TBQ Homie</title>
                </head>
                <body>
                    <h1>❌ Có lỗi xảy ra</h1>
                    <p>Vui lòng liên hệ hỗ trợ: Zalo 0988428496</p>
                </body>
                </html>
            `
        };
    }
};
