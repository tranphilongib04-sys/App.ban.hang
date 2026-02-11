/**
 * VALIDATE DISCOUNT CODE API
 *
 * POST /validate-discount
 * Body: { code: "CTV01", items: [{ productCode: "chatgpt_plus_cap_tk", quantity: 1 }] }
 *
 * Returns discount eligibility and final total preview.
 * >= 30 days: full discount (e.g. 10k). < 30 days: half discount (e.g. 5k).
 */

const { createClient } = require('@libsql/client/web');
const CTV_CODE = 'CTV2026';

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) return null;
    return createClient({ url, authToken });
}

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        const db = getDbClient();
        if (!db) throw new Error('Database not configured');

        async function hasCtvPriceColumn() {
            try {
                const res = await db.execute(`PRAGMA table_info(skus)`);
                return res.rows.some(r => r.name === 'ctv_price');
            } catch {
                return false;
            }
        }

        const body = JSON.parse(event.body);
        const { code, items } = body;

        if (!code || !items || items.length === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ valid: false, error: 'Thiếu mã giảm giá hoặc sản phẩm' }) };
        }

        // 1. Lookup discount code
        const codeUpper = code.trim().toUpperCase();

        // ── CTV MODE ──
        if (codeUpper === CTV_CODE) {
            const hasCtv = await hasCtvPriceColumn();
            let publicTotal = 0;
            let ctvTotal = 0;

            for (const item of items) {
                const { productCode, quantity } = item;
                if (!productCode || !quantity) continue;

                const skuResult = await db.execute({
                    sql: hasCtv
                        ? `SELECT price, COALESCE(ctv_price, price) as ctv_price FROM skus WHERE sku_code = ? AND is_active = 1`
                        : `SELECT price, price as ctv_price FROM skus WHERE sku_code = ? AND is_active = 1`,
                    args: [productCode]
                });

                if (skuResult.rows.length === 0) continue;

                const sku = skuResult.rows[0];
                publicTotal += (sku.price * quantity);
                ctvTotal += (sku.ctv_price * quantity);
            }

            if (publicTotal === 0) {
                return { statusCode: 200, headers, body: JSON.stringify({ valid: false, error: 'Không tìm thấy sản phẩm hợp lệ' }) };
            }

            const discountAmount = Math.max(0, publicTotal - ctvTotal);
            const finalTotal = Math.max(0, ctvTotal);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    valid: true,
                    code: CTV_CODE,
                    codeType: 'ctv',
                    discountAmount,
                    totalBeforeDiscount: publicTotal,
                    finalTotal,
                    message: 'Đã áp giá CTV'
                })
            };
        }
        const codeResult = await db.execute({
            sql: `SELECT id, code, discount_amount FROM discount_codes WHERE code = ? AND is_active = 1`,
            args: [codeUpper]
        });

        if (codeResult.rows.length === 0) {
            return { statusCode: 200, headers, body: JSON.stringify({ valid: false, error: 'Mã giảm giá không hợp lệ' }) };
        }

        const discountRow = codeResult.rows[0];
        const fullDiscount = discountRow.discount_amount;    // e.g. 10000
        const halfDiscount = Math.floor(fullDiscount / 2);   // e.g. 5000

        // 2. Categorize items: >= 30 days (full discount) vs < 30 days (half discount)
        let longTermSubtotal = 0;   // >= 30 days
        let shortTermSubtotal = 0;  // < 30 days
        let totalSubtotal = 0;
        let hasLongTerm = false;
        let hasShortTerm = false;

        for (const item of items) {
            const { productCode, quantity } = item;
            if (!productCode || !quantity) continue;

            const skuResult = await db.execute({
                sql: `SELECT price, duration_days FROM skus WHERE sku_code = ? AND is_active = 1`,
                args: [productCode]
            });

            if (skuResult.rows.length === 0) continue;

            const sku = skuResult.rows[0];
            const itemTotal = sku.price * quantity;
            totalSubtotal += itemTotal;

            if ((sku.duration_days || 30) >= 30) {
                longTermSubtotal += itemTotal;
                hasLongTerm = true;
            } else {
                shortTermSubtotal += itemTotal;
                hasShortTerm = true;
            }
        }

        if (totalSubtotal === 0) {
            return { statusCode: 200, headers, body: JSON.stringify({ valid: false, error: 'Không tìm thấy sản phẩm hợp lệ' }) };
        }

        // 3. Calculate discount:
        //    - >= 30 days: full discount (e.g. 10k), capped at longTermSubtotal
        //    - < 30 days only: half discount (e.g. 5k), capped at shortTermSubtotal
        //    - Mixed cart: full discount applies (best for customer)
        let discountApplied = 0;
        let message = '';

        if (hasLongTerm) {
            // Cart has items >= 30 days → full discount
            discountApplied = Math.min(fullDiscount, totalSubtotal);
            message = `Giảm ${discountApplied.toLocaleString('vi-VN')}₫ cho đơn hàng`;
        } else {
            // Cart only has items < 30 days → half discount
            discountApplied = Math.min(halfDiscount, shortTermSubtotal);
            message = `Giảm ${discountApplied.toLocaleString('vi-VN')}₫ (SP dưới 1 tháng giảm ${halfDiscount.toLocaleString('vi-VN')}₫)`;
        }

        const finalTotal = Math.max(0, totalSubtotal - discountApplied);

        return {
            statusCode: 200, headers,
            body: JSON.stringify({
                valid: true,
                code: discountRow.code,
                discountAmount: discountApplied,
                longTermSubtotal,
                shortTermSubtotal,
                totalBeforeDiscount: totalSubtotal,
                finalTotal,
                message
            })
        };

    } catch (error) {
        console.error('Validate Discount Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ valid: false, error: 'Lỗi hệ thống' }) };
    }
};
