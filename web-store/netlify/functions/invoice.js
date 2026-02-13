/**
 * INVOICE GENERATOR - Netlify Function (V2)
 *
 * GET /invoice?order=TBQ12345678&token=xxx
 *
 * Returns HTML invoice (can be printed as PDF)
 */

const { createClient } = require('@libsql/client/web');
const crypto = require('crypto');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('Database not configured');
    return createClient({ url, authToken });
}

// Verify delivery token (same as delivery.js)
function verifyDeliveryToken(token, orderId, email) {
    const secret = process.env.DELIVERY_SECRET;
    if (!secret) throw new Error('DELIVERY_SECRET not configured');
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

exports.handler = async function (event, context) {
    const { order, token } = event.queryStringParameters || {};

    if (!order || !token) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'text/html' },
            body: '<h1>Missing parameters</h1>'
        };
    }

    try {
        const db = getDbClient();

        // Get order with lines and invoice
        const orderResult = await db.execute({
            sql: `
                SELECT 
                    o.*,
                    i.invoice_number,
                    GROUP_CONCAT(ol.id) as line_ids,
                    GROUP_CONCAT(ol.product_id) as product_ids,
                    GROUP_CONCAT(ol.quantity) as quantities,
                    GROUP_CONCAT(ol.unit_price) as unit_prices,
                    GROUP_CONCAT(ol.subtotal) as subtotals
                FROM orders o
                LEFT JOIN invoices i ON o.id = i.order_id
                LEFT JOIN order_lines ol ON o.id = ol.order_id
                WHERE o.order_code = ? AND o.status = 'fulfilled'
                GROUP BY o.id
            `,
            args: [order]
        });

        if (orderResult.rows.length === 0) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'text/html' },
                body: '<h1>Order not found</h1>'
            };
        }

        const orderData = orderResult.rows[0];

        // Verify token
        if (!verifyDeliveryToken(token, orderData.id, orderData.customer_email)) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'text/html' },
                body: '<h1>Unauthorized</h1>'
            };
        }

        // Get product names
        const productIds = (orderData.product_ids || '').split(',').filter(Boolean);
        const products = {};
        if (productIds.length > 0) {
            const productResult = await db.execute({
                sql: `SELECT id, name, variant FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
                args: productIds
            });
            for (const p of productResult.rows) {
                products[p.id] = p.name + (p.variant ? ` - ${p.variant}` : '');
            }
        }

        // Parse order lines
        const quantities = (orderData.quantities || '').split(',').filter(Boolean);
        const unitPrices = (orderData.unit_prices || '').split(',').filter(Boolean);
        const subtotals = (orderData.subtotals || '').split(',').filter(Boolean);
        const pIds = productIds;

        const lines = [];
        for (let i = 0; i < quantities.length; i++) {
            lines.push({
                productName: products[pIds[i]] || 'Sản phẩm',
                quantity: parseInt(quantities[i]) || 1,
                unitPrice: parseInt(unitPrices[i]) || 0,
                subtotal: parseInt(subtotals[i]) || 0
            });
        }

        // Format date
        const issuedDate = new Date(orderData.created_at);
        const formattedDate = issuedDate.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Format price
        function formatPrice(price) {
            return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
        }

        // Generate HTML invoice (professional typography, Vietnamese-friendly font)
        const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hóa đơn ${orderData.invoice_number || order}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @media print {
            body { margin: 0; padding: 0; background: #fff; }
            .no-print { display: none !important; }
            .invoice-container { box-shadow: none; }
        }
        body {
            font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #1a1a1a;
            padding: 40px 20px;
            background: #f5f5f7;
            font-size: 15px;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
        }
        .invoice-container {
            max-width: 720px;
            margin: 0 auto;
            background: #fff;
            padding: 48px 56px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 36px;
            padding-bottom: 24px;
            border-bottom: 2px solid #e8e8e8;
        }
        .company-info h1 {
            font-size: 28px;
            font-weight: 700;
            color: #0066cc;
            margin-bottom: 6px;
            letter-spacing: -0.02em;
        }
        .company-info .tagline {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 12px;
        }
        .company-info p {
            color: #6b7280;
            font-size: 13px;
            line-height: 1.6;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-info .doc-title {
            font-size: 22px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 12px;
            letter-spacing: 0.02em;
        }
        .invoice-info p {
            color: #6b7280;
            font-size: 13px;
            margin-bottom: 4px;
        }
        .invoice-info .invoice-number {
            font-size: 15px;
            font-weight: 600;
            color: #0066cc;
        }
        .customer-info {
            margin-bottom: 32px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 10px;
        }
        .customer-info h3 {
            font-size: 13px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
        }
        .customer-info p {
            color: #1a1a1a;
            font-size: 14px;
            margin-bottom: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }
        thead {
            background: #f9fafb;
        }
        th {
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
        }
        th.text-right { text-align: right; }
        td {
            padding: 14px 16px;
            border-bottom: 1px solid #f3f4f6;
            color: #1a1a1a;
            font-size: 14px;
        }
        .text-right {
            text-align: right;
        }
        .total-section {
            margin-top: 8px;
            text-align: right;
        }
        .total-row {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 24px;
        }
        .total-label {
            font-size: 15px;
            color: #6b7280;
        }
        .total-value {
            font-weight: 600;
            color: #1a1a1a;
            min-width: 140px;
            text-align: right;
        }
        .total-final {
            font-size: 20px;
            font-weight: 700;
            color: #0066cc;
        }
        .total-section .total-row {
            padding-top: 16px;
            border-top: 2px solid #e5e7eb;
        }
        .footer {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
        }
        .footer p { margin-bottom: 6px; }
        .footer .thanks {
            font-weight: 500;
            color: #374151;
        }
        .print-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #0066cc;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 500;
            font-family: inherit;
            box-shadow: 0 4px 14px rgba(0, 102, 204, 0.35);
        }
        .print-btn:hover {
            background: #0052a3;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="company-info">
                <h1>TBQ Homie</h1>
                <p class="tagline">Tiệm Bản Quyền</p>
                <p>Email: tranphilongib04@gmail.com</p>
                <p>Zalo: 0988428496</p>
            </div>
            <div class="invoice-info">
                <div class="doc-title">HÓA ĐƠN</div>
                <p><span class="invoice-number">${orderData.invoice_number || order}</span></p>
                <p>Ngày: ${formattedDate}</p>
                <p>Mã đơn: ${order}</p>
            </div>
        </div>

        <div class="customer-info">
            <h3>Thông tin khách hàng</h3>
            <p><strong>${orderData.customer_name || 'N/A'}</strong></p>
            ${orderData.customer_phone ? `<p>SĐT: ${orderData.customer_phone}</p>` : ''}
            ${orderData.customer_email ? `<p>Email: ${orderData.customer_email}</p>` : ''}
        </div>

        <table>
            <thead>
                <tr>
                    <th>STT</th>
                    <th>Sản phẩm</th>
                    <th class="text-right">Số lượng</th>
                    <th class="text-right">Đơn giá</th>
                    <th class="text-right">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                ${lines.map((line, idx) => `
                    <tr>
                        <td>${idx + 1}</td>
                        <td>${line.productName}</td>
                        <td class="text-right">${line.quantity}</td>
                        <td class="text-right">${formatPrice(line.unitPrice)}</td>
                        <td class="text-right">${formatPrice(line.subtotal)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-row">
                <span class="total-label">Tổng cộng</span>
                <span class="total-value total-final">${formatPrice(orderData.amount_total)}</span>
            </div>
        </div>

        <div class="footer">
            <p>Phương thức thanh toán: Chuyển khoản ngân hàng (Sepay)</p>
            <p class="thanks">Cảm ơn bạn đã sử dụng dịch vụ TBQ Homie!</p>
            <p style="font-size: 12px; margin-top: 8px;">Hóa đơn điện tử — có giá trị pháp lý.</p>
        </div>
    </div>

    <button class="print-btn no-print" onclick="window.print()">In hóa đơn</button>
</body>
</html>
        `;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: html
        };

    } catch (error) {
        console.error('Invoice error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/html' },
            body: '<h1>Error generating invoice</h1>'
        };
    }
};
