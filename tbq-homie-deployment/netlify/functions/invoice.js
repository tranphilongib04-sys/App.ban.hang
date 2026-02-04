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
    const secret = process.env.DELIVERY_SECRET || 'default-secret-change-me';
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

        // Generate HTML invoice
        const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hóa đơn ${orderData.invoice_number || order}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
            color: #1d1d1f;
            padding: 40px;
            background: #f5f5f7;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 60px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #d2d2d7;
        }
        .company-info h1 {
            font-size: 32px;
            color: #0066cc;
            margin-bottom: 10px;
        }
        .company-info p {
            color: #6e6e73;
            font-size: 14px;
            line-height: 1.6;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-info h2 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .invoice-info p {
            color: #6e6e73;
            font-size: 14px;
        }
        .customer-info {
            margin-bottom: 40px;
        }
        .customer-info h3 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #1d1d1f;
        }
        .customer-info p {
            color: #6e6e73;
            font-size: 14px;
            margin-bottom: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        thead {
            background: #f5f5f7;
        }
        th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #1d1d1f;
            border-bottom: 2px solid #d2d2d7;
        }
        td {
            padding: 15px;
            border-bottom: 1px solid #e5e5e7;
            color: #1d1d1f;
        }
        .text-right {
            text-align: right;
        }
        .total-section {
            margin-top: 20px;
            text-align: right;
        }
        .total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
        }
        .total-label {
            width: 200px;
            text-align: right;
            padding-right: 20px;
            color: #6e6e73;
        }
        .total-value {
            width: 150px;
            text-align: right;
            font-weight: 600;
            color: #1d1d1f;
        }
        .total-final {
            font-size: 20px;
            color: #0066cc;
            padding-top: 10px;
            border-top: 2px solid #d2d2d7;
        }
        .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #d2d2d7;
            text-align: center;
            color: #6e6e73;
            font-size: 14px;
        }
        .print-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #0066cc;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
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
                <p>Tiệm Bản Quyền</p>
                <p>Email: tranphilongib04@gmail.com</p>
                <p>Zalo: 0988428496</p>
            </div>
            <div class="invoice-info">
                <h2>HÓA ĐƠN</h2>
                <p><strong>Số:</strong> ${orderData.invoice_number || order}</p>
                <p><strong>Ngày:</strong> ${formattedDate}</p>
                <p><strong>Mã đơn:</strong> ${order}</p>
            </div>
        </div>

        <div class="customer-info">
            <h3>Thông tin khách hàng</h3>
            <p><strong>Tên:</strong> ${orderData.customer_name || 'N/A'}</p>
            <p><strong>Email:</strong> ${orderData.customer_email}</p>
            ${orderData.customer_phone ? `<p><strong>Điện thoại:</strong> ${orderData.customer_phone}</p>` : ''}
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
                <div class="total-label">Tổng cộng:</div>
                <div class="total-value total-final">${formatPrice(orderData.amount_total)}</div>
            </div>
        </div>

        <div class="footer">
            <p><strong>Phương thức thanh toán:</strong> Chuyển khoản ngân hàng (Sepay)</p>
            <p style="margin-top: 10px;">Cảm ơn bạn đã sử dụng dịch vụ của TBQ Homie!</p>
            <p style="margin-top: 10px; font-size: 12px;">Hóa đơn này được tạo tự động và có giá trị pháp lý.</p>
        </div>
    </div>

    <button class="print-btn no-print" onclick="window.print()">🖨️ In hóa đơn</button>
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
