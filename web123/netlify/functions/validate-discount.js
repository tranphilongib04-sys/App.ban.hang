/**
 * VALIDATE DISCOUNT CODE API
 *
 * POST /validate-discount
 * Body: { code: "MYCTV", items: [{ productCode: "chatgpt_plus_cap_tk", quantity: 1 }] }
 *
 * Returns discount eligibility and final total preview.
 * CTV codes: per-code discount_percent from DB (e.g. 15%, 20%)
 * Coupons: percentage-based, single-use
 * Exclusions: ctv_excluded SKUs and products < 20k are not discounted by CTV
 */

const { createClient } = require('@libsql/client/web');
const CTV_PRICE_FLOOR = 20000; // Products below this price are not discounted by CTV

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

        // ── CTV MODE (DB-driven, per-code discount_percent) ──
        const ctvResult = await db.execute({
            sql: `SELECT id, code, discount_percent FROM discount_codes WHERE code = ? AND code_type = 'ctv' AND is_active = 1`,
            args: [codeUpper]
        });

        if (ctvResult.rows.length > 0) {
            const ctvCode = ctvResult.rows[0];
            const CTV_DISCOUNT_PERCENT = ctvCode.discount_percent || 15;
            let publicTotal = 0;
            let discountableTotal = 0;

            for (const item of items) {
                const { productCode, quantity } = item;
                if (!productCode || !quantity) continue;

                const skuResult = await db.execute({
                    sql: `SELECT price, ctv_excluded FROM skus WHERE sku_code = ? AND is_active = 1`,
                    args: [productCode]
                });

                if (skuResult.rows.length === 0) continue;
                const sku = skuResult.rows[0];
                const itemTotal = sku.price * quantity;
                publicTotal += itemTotal;

                // Skip excluded SKUs and products under price floor
                if (!sku.ctv_excluded && sku.price >= CTV_PRICE_FLOOR) {
                    discountableTotal += itemTotal;
                }
            }

            if (publicTotal === 0) {
                return { statusCode: 200, headers, body: JSON.stringify({ valid: false, error: 'Không tìm thấy sản phẩm hợp lệ' }) };
            }

            const discountAmount = Math.round(discountableTotal * CTV_DISCOUNT_PERCENT / 100);
            const finalTotal = Math.max(0, publicTotal - discountAmount);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    valid: true,
                    code: codeUpper,
                    codeType: 'ctv',
                    discountPercent: CTV_DISCOUNT_PERCENT,
                    discountAmount,
                    totalBeforeDiscount: publicTotal,
                    finalTotal,
                    message: `Giảm ${CTV_DISCOUNT_PERCENT}% cho CTV`
                })
            };
        }

        // ── COUPON MODE (percentage-based, single-use) ──
        const couponResult = await db.execute({
            sql: `SELECT id, code, discount_percent, expires_at, max_uses, used_count, is_active, sku_codes FROM coupons WHERE code = ? AND is_active = 1`,
            args: [codeUpper]
        });

        if (couponResult.rows.length > 0) {
            const coupon = couponResult.rows[0];

            // Check expiry
            if (new Date(coupon.expires_at) < new Date()) {
                return { statusCode: 200, headers, body: JSON.stringify({ valid: false, error: 'Mã coupon đã hết hạn' }) };
            }

            // Check usage
            if (coupon.used_count >= coupon.max_uses) {
                return { statusCode: 200, headers, body: JSON.stringify({ valid: false, error: 'Mã coupon đã hết lượt sử dụng' }) };
            }

            // Parse SKU restrictions (null = all products)
            const allowedSkus = coupon.sku_codes ? coupon.sku_codes.split(',').map(s => s.trim()) : null;

            // Calculate totals — only discount matching SKUs
            let totalSubtotal = 0;   // Full cart total
            let discountableTotal = 0; // Total of items matching SKU restrictions

            for (const item of items) {
                const { productCode, quantity } = item;
                if (!productCode || !quantity) continue;
                const skuResult = await db.execute({
                    sql: `SELECT price FROM skus WHERE sku_code = ? AND is_active = 1`,
                    args: [productCode]
                });
                if (skuResult.rows.length === 0) continue;
                const itemTotal = skuResult.rows[0].price * quantity;
                totalSubtotal += itemTotal;

                // If no SKU restriction, or this SKU is in the allowed list
                if (!allowedSkus || allowedSkus.includes(productCode)) {
                    discountableTotal += itemTotal;
                }
            }

            if (totalSubtotal === 0) {
                return { statusCode: 200, headers, body: JSON.stringify({ valid: false, error: 'Không tìm thấy sản phẩm hợp lệ' }) };
            }

            if (discountableTotal === 0 && allowedSkus) {
                return { statusCode: 200, headers, body: JSON.stringify({ valid: false, error: 'Coupon không áp dụng cho sản phẩm trong giỏ hàng' }) };
            }

            const discountAmount = Math.round(discountableTotal * coupon.discount_percent / 100);
            const finalTotal = Math.max(0, totalSubtotal - discountAmount);
            const label = coupon.discount_percent === 100 ? 'MIỄN PHÍ' : `Giảm ${coupon.discount_percent}%`;

            return {
                statusCode: 200, headers,
                body: JSON.stringify({
                    valid: true,
                    code: coupon.code,
                    codeType: 'coupon',
                    discountPercent: coupon.discount_percent,
                    discountAmount,
                    totalBeforeDiscount: totalSubtotal,
                    finalTotal,
                    skuCodes: coupon.sku_codes || null,
                    message: `${label} (-${discountAmount.toLocaleString('vi-VN')}₫)`
                })
            };
        }

        // No valid code found
        return { statusCode: 200, headers, body: JSON.stringify({ valid: false, error: 'Mã giảm giá không hợp lệ' }) };

    } catch (error) {
        console.error('Validate Discount Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ valid: false, error: 'Lỗi hệ thống' }) };
    }
};
