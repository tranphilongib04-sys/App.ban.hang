/**
 * CREATE ORDER API - Netlify Function (V3 - Single Source of Truth)
 *
 * POST /create-order
 * Body: { customerName, items: [{ productCode, quantity, ... }] }
 *
 * Logic chung: Sản phẩm GIAO SAU (5-10 phút, delivery_type=owner_upgrade) KHÔNG cần tồn kho.
 * Chỉ sản phẩm GIAO LIỀN (delivery_type=auto) mới check & reserve stock_items.
 *
 * Logic:
 * 1. Validate SKUs from `skus` table.
 * 2. Create Order (status='pending_payment').
 * 3. Reserve Stock CHỈ cho `auto` items. owner_upgrade không đụng stock.
 * 4. Create Order Lines.
 */

const { createClient } = require('@libsql/client/web');
const crypto = require('crypto');
const CTV_CODES = new Set(['CTV2026', 'CTV01', 'CTV02', 'CTV03', 'CTV04', 'CTV05']);

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('TURSO_DATABASE_URL not configured');
    return createClient({ url, authToken });
}

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function generateOrderCode() {
    // Crypto-safe: TBQ + 9 random digits (1 billion+ combinations)
    // Digits only – avoids regex/banking issues with hex letters (A-F)
    const num = crypto.randomInt(100000000, 999999999);
    return 'TBQ' + num.toString();
}

// Reuse rate limit logic
async function checkRateLimit(db, ip) {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS rate_limits (
                ip TEXT PRIMARY KEY,
                count INTEGER DEFAULT 0,
                reset_at DATETIME
            )
        `);
        const now = new Date();
        const result = await db.execute({ sql: 'SELECT count, reset_at FROM rate_limits WHERE ip = ?', args: [ip] });
        let count = 0;
        let resetAt = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS);

        if (result.rows.length > 0) {
            const row = result.rows[0];
            if (now > new Date(row.reset_at)) {
                count = 1;
            } else {
                count = row.count + 1;
                resetAt = new Date(row.reset_at);
            }
        } else {
            count = 1;
        }

        await db.execute({
            sql: `INSERT INTO rate_limits (ip, count, reset_at) VALUES (?, ?, ?) ON CONFLICT(ip) DO UPDATE SET count = ?, reset_at = ?`,
            args: [ip, count, resetAt.toISOString(), count, resetAt.toISOString()]
        });
        return count <= RATE_LIMIT_MAX_REQUESTS;
    } catch (e) {
        console.error("Rate limit error", e);
        return true;
    }
}

exports.handler = async function (event, context) {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    let tx = null;
    const db = getDbClient();

    async function hasCtvPriceColumn(conn) {
        try {
            const res = await conn.execute(`PRAGMA table_info(skus)`);
            return res.rows.some(r => r.name === 'ctv_price');
        } catch {
            return false;
        }
    }

    try {
        await db.execute(`ALTER TABLE order_lines ADD COLUMN sku_id TEXT`);
    } catch (e) { console.log('Notice: sku_id column add skipped', e.message); }

    try {
        const body = JSON.parse(event.body);
        let { customerName, customerEmail, customerPhone, customerNote, items, discountCode } = body;
        const codeUpper = (discountCode || '').trim().toUpperCase();
        const isCtvCode = CTV_CODES.has(codeUpper);

        // Backward compatibility
        if (!items && body.productCode) {
            items = [{ productCode: body.productCode, quantity: body.quantity || 1, price: body.price }];
        }

        const ipAddress = (event.headers['client-ip'] || 'unknown').split(',')[0].trim();
        if (!(await checkRateLimit(db, ipAddress))) {
            return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too many requests' }) };
        }

        if (!customerName || !items || items.length === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
        }

        const orderCode = generateOrderCode();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30m
        const deliveryToken = crypto.randomUUID();

        // Cleanup expired
        await cleanupExpired(db, now.toISOString());

        // Helper to get legacy product ID for FK constraints
        let legacyProductId = 0;
        try {
            const legRes = await db.execute("SELECT id FROM products WHERE code = 'V3_LEGACY_PLACEHOLDER'");
            if (legRes.rows.length > 0) {
                legacyProductId = legRes.rows[0].id;
            } else {
                const ins = await db.execute("INSERT INTO products (code, name, base_price) VALUES ('V3_LEGACY_PLACEHOLDER', 'V3 Legacy Item', 0) RETURNING id");
                legacyProductId = ins.rows[0].id;
            }
        } catch (e) {
            console.log('Notice: Failed to create legacy placeholder', e.message);
        }

        // --- TRANSACTION START ---
        tx = await db.transaction('write');
        const hasCtv = await hasCtvPriceColumn(tx);

        let totalAmount = 0;
        let publicTotal = 0;
        let ctvTotal = 0;
        const finalItems = [];

        // 1. Validation & Pre-calculation
        for (const item of items) {
            const { productCode, quantity } = item; // productCode maps to sku_code

            // Find SKU
            const skus = await tx.execute({
                sql: hasCtv
                    ? `SELECT id, name, price, COALESCE(ctv_price, price) as ctv_price, delivery_type, duration_days FROM skus WHERE sku_code = ? AND is_active = 1`
                    : `SELECT id, name, price, price as ctv_price, delivery_type, duration_days FROM skus WHERE sku_code = ? AND is_active = 1`,
                args: [productCode]
            });

            if (skus.rows.length === 0) {
                // Fallback: Try old dictionary mapping if sku not found? 
                // Or assumed user is using new codes.
                tx.close();
                return { statusCode: 404, headers, body: JSON.stringify({ error: `Product not found: ${productCode}` }) };
            }
            const sku = skus.rows[0];

            // Chỉ sản phẩm GIAO LIỀN (auto) cần tồn kho. Giao sau 5-10' (owner_upgrade) KHÔNG cần stock.
            if (sku.delivery_type === 'auto') {
                const stock = await tx.execute({
                    sql: `SELECT COUNT(*) as count FROM stock_items WHERE sku_id = ? AND status = 'available'`,
                    args: [sku.id]
                });
                const available = stock.rows[0].count;
                if (available < quantity) {
                    tx.close();
                    return { statusCode: 409, headers, body: JSON.stringify({ error: 'INSUFFICIENT_STOCK', product: sku.name, available }) };
                }
            }

            // SECURITY: Always use DB price. Never trust client-submitted price.
            const unitPrice = isCtvCode ? sku.ctv_price : sku.price;
            if (!unitPrice || unitPrice <= 0) {
                tx.close();
                return { statusCode: 400, headers, body: JSON.stringify({ error: `SKU ${productCode} has no valid price configured` }) };
            }

            finalItems.push({
                skuId: sku.id,
                skuName: sku.name,
                deliveryType: sku.delivery_type,
                durationDays: sku.duration_days || 30,
                quantity,
                unitPrice,
                subtotal: unitPrice * quantity,
                legacyProductId // Pass it down
            });
            publicTotal += (sku.price * quantity);
            ctvTotal += (sku.ctv_price * quantity);
            totalAmount += (unitPrice * quantity);
        }

        // ── DISCOUNT CODE PROCESSING ──
        let discountAmount = 0;
        let appliedDiscountCode = null;
        let appliedCouponCode = null;
        let appliedCouponPercent = 0;

        if (isCtvCode) {
            appliedDiscountCode = codeUpper;
            discountAmount = Math.max(0, publicTotal - ctvTotal);
            totalAmount = Math.max(0, ctvTotal);
        } else if (discountCode && discountCode.trim()) {
            const codeUpper = discountCode.trim().toUpperCase();

            // ── Check coupons table first (percentage-based) ──
            const couponResult = await tx.execute({
                sql: `SELECT id, code, discount_percent, expires_at, max_uses, used_count, sku_codes FROM coupons WHERE code = ? AND is_active = 1`,
                args: [codeUpper]
            });

            if (couponResult.rows.length > 0) {
                const coupon = couponResult.rows[0];

                // Validate expiry
                if (new Date(coupon.expires_at) < new Date()) {
                    tx.close();
                    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Mã coupon đã hết hạn' }) };
                }

                // Validate usage
                if (coupon.used_count >= coupon.max_uses) {
                    tx.close();
                    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Mã coupon đã hết lượt sử dụng' }) };
                }

                // Parse SKU restrictions
                const allowedSkus = coupon.sku_codes ? coupon.sku_codes.split(',').map(s => s.trim()) : null;

                // Calculate discount only on matching SKUs
                let discountableTotal = 0;
                for (const item of finalItems) {
                    // Find sku_code for this item
                    const skuCodeResult = await tx.execute({
                        sql: `SELECT sku_code FROM skus WHERE id = ?`,
                        args: [item.skuId]
                    });
                    const skuCode = skuCodeResult.rows.length > 0 ? skuCodeResult.rows[0].sku_code : null;

                    if (!allowedSkus || (skuCode && allowedSkus.includes(skuCode))) {
                        discountableTotal += item.subtotal;
                    }
                }

                discountAmount = Math.round(discountableTotal * coupon.discount_percent / 100);
                totalAmount = Math.max(0, totalAmount - discountAmount);
                appliedCouponCode = codeUpper;
                appliedCouponPercent = coupon.discount_percent;

                // Mark coupon as used (increment counter)
                await tx.execute({
                    sql: `UPDATE coupons SET used_count = used_count + 1 WHERE id = ?`,
                    args: [coupon.id]
                });
            } else {
                // ── Fall back to discount_codes (CTV fixed-amount) ──
                const codeResult = await tx.execute({
                    sql: `SELECT id, code, discount_amount FROM discount_codes WHERE code = ? AND is_active = 1`,
                    args: [codeUpper]
                });

                if (codeResult.rows.length === 0) {
                    tx.close();
                    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Mã giảm giá không hợp lệ' }) };
                }

                const discountRow = codeResult.rows[0];
                const fullDiscount = discountRow.discount_amount;
                const halfDiscount = Math.floor(fullDiscount / 2);

                let hasLongTerm = false;
                for (const item of finalItems) {
                    if (item.durationDays >= 30) { hasLongTerm = true; break; }
                }

                if (hasLongTerm) {
                    discountAmount = Math.min(fullDiscount, totalAmount);
                } else {
                    discountAmount = Math.min(halfDiscount, totalAmount);
                }

                appliedDiscountCode = codeUpper;
                totalAmount = Math.max(0, totalAmount - discountAmount);
            }
        }

        // 2. Create Order
        const orderRes = await tx.execute({
            sql: `INSERT INTO orders (order_code, customer_email, customer_name, customer_phone, customer_note, status, amount_total, discount_code, discount_amount, coupon_code, coupon_discount_percent, payment_method, reserved_until, delivery_token, ip_address, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, 'pending_payment', ?, ?, ?, ?, ?, 'sepay', ?, ?, ?, ?, ?) RETURNING id`,
            args: [orderCode, customerEmail, customerName, customerPhone, customerNote || null, totalAmount, appliedDiscountCode || appliedCouponCode, discountAmount, appliedCouponCode, appliedCouponPercent, expiresAt.toISOString(), deliveryToken, ipAddress || null, now.toISOString(), now.toISOString()]
        });
        const orderId = orderRes.rows[0].id;

        // 3. Process Items (Reserve Stock & Create Lines)
        for (const item of finalItems) {
            // Create Line
            // note: product_id uses legacy placeholder for FK constraint
            const lineRes = await tx.execute({
                sql: `INSERT INTO order_lines (order_id, sku_id, product_id, product_name, quantity, unit_price, subtotal, fulfillment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
                args: [orderId, item.skuId, item.legacyProductId, item.skuName, item.quantity, item.unitPrice, item.subtotal, item.deliveryType]
            });
            const lineId = lineRes.rows[0].id;

            // Chỉ reserve stock cho giao liền. Giao sau (owner_upgrade) không dùng stock_items.
            if (item.deliveryType === 'auto') {
                // UPDATE LIMIT syntax is tricky in standard SQL/LibSQL.
                // Using nested SELECT for ID list.

                // Select IDs to reserve
                const idsRes = await tx.execute({
                    sql: `SELECT id FROM stock_items WHERE sku_id = ? AND status = 'available' LIMIT ?`,
                    args: [item.skuId, item.quantity]
                });

                if (idsRes.rows.length < item.quantity) {
                    throw new Error('Race condition: Stock unavailable during booking');
                }

                const ids = idsRes.rows.map(r => r.id);
                // Update specific IDs
                for (const stockId of ids) {
                    await tx.execute({
                        sql: `UPDATE stock_items SET status = 'reserved', order_id = ? WHERE id = ?`,
                        args: [orderId, stockId]
                    });

                    // Link allocation (optional but good for tracking)
                    // We might need an order_allocations table? Or just stick to stock_items.order_id
                    // Legacy system used order_allocations. Let's create it for consistency.
                    // But schema V2 used `stock_units`. Now `stock_items`.
                    // Does `order_allocations` table reference `stock_items`?
                    // Previous schema: `order_allocations(unit_id)` -> `stock_units`.
                    // Mixing IDs might be messy if tables different.
                    // stock_items ID is UUID (TEXT), stock_units was INT.
                    // check order_allocations table definition.
                    // If `unit_id` is INTEGER, we can't put UUID there.
                    // SKIPPING `order_allocations` for now as `stock_items.order_id` is sufficient link.
                }
            }
        }

        // 4. Create Payment Record
        await tx.execute({
            sql: `INSERT INTO payments (order_id, provider, amount, status, created_at) VALUES (?, 'sepay', ?, 'initiated', ?)`,
            args: [orderId, totalAmount, now.toISOString()]
        });

        await tx.commit();

        const hasPreorderItems = finalItems.some(item => item.deliveryType !== 'auto');

        // ── FREE ORDER (100% discount): auto-fulfill immediately ──
        if (totalAmount === 0) {
            try {
                const { finalizeOrder, ensurePaymentSchema } = require('./utils/fulfillment');
                await ensurePaymentSchema(db);
                const tx2 = await db.transaction('write');

                // Synthetic transaction for free order
                const freeTransaction = {
                    id: 'FREE-' + orderCode,
                    reference_number: 'FREE-' + orderCode,
                    amount: 0
                };

                const orderForFulfill = {
                    id: orderId,
                    order_code: orderCode,
                    customer_email: customerEmail || '',
                    customer_name: customerName,
                    amount_total: 0,
                    status: 'pending_payment'
                };

                const result = await finalizeOrder(tx2, orderForFulfill, freeTransaction, 'free-order');
                await tx2.commit();

                const allPreorder = finalItems.every(item => item.deliveryType !== 'auto');

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        freeOrder: true,
                        orderCode,
                        orderId,
                        amount: 0,
                        discountCode: appliedDiscountCode || appliedCouponCode,
                        discountAmount: discountAmount,
                        hasPreorderItems,
                        deliveryToken: allPreorder ? null : result.deliveryToken,
                        invoiceNumber: result.invoiceNumber,
                        fulfillmentType: allPreorder ? 'owner_upgrade' : 'auto',
                        message: 'Đơn hàng miễn phí đã được xử lý thành công!'
                    })
                };
            } catch (freeErr) {
                console.error('Free order fulfillment error:', freeErr.message);
                // Fall through to normal response — order is created, just not auto-fulfilled
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                orderCode,
                orderId,
                amount: totalAmount,
                discountCode: appliedDiscountCode,
                discountAmount: discountAmount,
                expiresAt: expiresAt.toISOString(),
                hasPreorderItems,
                message: 'Order created',
                paymentInfo: {
                    bankName: process.env.BANK_NAME || 'TP Bank',
                    accountNumber: process.env.BANK_ACCOUNT_NUMBER || '***',
                    accountName: process.env.BANK_ACCOUNT_NAME || '***',
                    amount: totalAmount,
                    content: orderCode
                }
            })
        };

    } catch (e) {
        if (tx) tx.close();
        console.error('Create Order Error:', e.message);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Lỗi hệ thống' }) };
    }
};

async function cleanupExpired(db, now) {
    try {
        await db.execute({
            sql: `UPDATE orders SET status = 'expired' WHERE status = 'pending_payment' AND reserved_until < ?`,
            args: [now]
        });
        // Release stock linked to expired orders
        await db.execute({
            sql: `UPDATE stock_items SET status = 'available', order_id = NULL WHERE status = 'reserved' AND order_id IN (SELECT id FROM orders WHERE status IN ('expired', 'cancelled'))`,
            args: []
        });
    } catch (e) { console.error('Cleanup error', e); }
}
