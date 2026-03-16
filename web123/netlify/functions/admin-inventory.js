/**
 * ADMIN INVENTORY API
 * 
 * GET  /admin-inventory                    - SKU summary with stock counts
 * GET  /admin-inventory?action=items       - All stock items list
 * GET  /admin-inventory?action=sku_details - Stock items for a specific SKU
 * POST /admin-inventory  action=delete_item  - Delete a stock item
 * POST /admin-inventory  action=update_item  - Update stock item fields
 * POST /admin-inventory  action=create_sku   - Create new SKU
 * POST /admin-inventory  action=update_sku   - Update SKU fields
 * POST /admin-inventory  action=delete_sku   - Delete/deactivate SKU
 */

const { createClient } = require('@libsql/client/web');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        throw new Error('TURSO_DATABASE_URL not configured');
    }

    return createClient({ url, authToken });
}

// SECURITY: Restrict CORS for admin APIs
function getAdminHeaders(event) {
    const allowed = process.env.ALLOWED_ADMIN_ORIGIN || '';
    const reqOrigin = (event && event.headers) ? (event.headers.origin || event.headers.Origin || '') : '';
    const origin = (allowed && reqOrigin === allowed) ? allowed : (allowed ? 'null' : '*');
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };
}

function requireAuth(event) {
    const token = (event.headers['authorization'] || '').replace('Bearer ', '');
    const expected = process.env.ADMIN_API_TOKEN;
    if (!expected) {
        console.error('[SECURITY] ADMIN_API_TOKEN not set! Blocking all admin requests.');
        return { statusCode: 503, headers, body: JSON.stringify({ error: 'Admin API not configured' }) };
    }
    if (token !== expected) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    return null;
}

exports.handler = async function (event, context) {
    const headers = getAdminHeaders(event);
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Auth check
    const authError = requireAuth(event);
    if (authError) return authError;

    try {
        const db = getDbClient();

        // ══════════════════════════════════════════════════════════
        // GET endpoints
        // ══════════════════════════════════════════════════════════
        if (event.httpMethod === 'GET') {
            const { action } = event.queryStringParameters || {};

            if (action === 'items') {
                const result = await db.execute(`
                    SELECT si.id, si.sku_id, si.account_info, si.secret_key, si.status, si.created_at, si.sold_at, s.sku_code, s.name as service, s.price as cost
                    FROM stock_items si
                    LEFT JOIN skus s ON si.sku_id = s.id
                    ORDER BY si.created_at DESC
                `);
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, items: result.rows }) };
            }

            if (action === 'sku_details') {
                const { sku } = event.queryStringParameters || {};
                if (!sku) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing sku parameter' }) };

                const result = await db.execute({
                    sql: `
                        SELECT si.id, si.account_info, si.secret_key, si.note, si.status, si.created_at, si.order_id, o.order_code
                        FROM stock_items si
                        JOIN skus s ON si.sku_id = s.id
                        LEFT JOIN orders o ON si.order_id = o.id
                        WHERE s.sku_code = ?
                        ORDER BY CASE WHEN si.status = 'available' THEN 1 ELSE 2 END, si.created_at DESC
                    `,
                    args: [sku]
                });
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, items: result.rows }) };
            }

            // List all SKUs (for product management page)
            if (action === 'list_skus') {
                const result = await db.execute(`
                    SELECT s.id, s.sku_code, s.name, s.category, s.price, s.delivery_type, s.duration_days, s.is_active, s.created_at,
                           COUNT(CASE WHEN si.status='available' THEN 1 END) AS available,
                           COUNT(CASE WHEN si.status='sold' THEN 1 END) AS sold,
                           COUNT(si.id) AS total
                    FROM skus s
                    LEFT JOIN stock_items si ON si.sku_id = s.id
                    GROUP BY s.id
                    ORDER BY s.category, s.name
                `);
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, skus: result.rows }) };
            }

            // Default: SKU summary (include price for admin table)
            const result = await db.execute(`
                SELECT s.id, s.sku_code, s.name, s.category, s.price, s.delivery_type,
                    SUM(CASE WHEN si.status='available' THEN 1 ELSE 0 END) AS available,
                    SUM(CASE WHEN si.status='reserved' THEN 1 ELSE 0 END) AS reserved,
                    SUM(CASE WHEN si.status='sold' THEN 1 ELSE 0 END) AS sold,
                    COUNT(si.id) AS total
                FROM skus s
                LEFT JOIN stock_items si ON si.sku_id = s.id
                GROUP BY s.id, s.sku_code, s.name, s.category, s.price, s.delivery_type
                ORDER BY s.category, s.name;
            `);

            const inventory = result.rows.map(row => ({
                ...row,
                available: Number(row.available || 0),
                reserved: Number(row.reserved || 0),
                sold: Number(row.sold || 0),
                total: Number(row.total || 0)
            }));

            return { statusCode: 200, headers, body: JSON.stringify({ success: true, inventory }) };
        }

        // ══════════════════════════════════════════════════════════
        // POST endpoints
        // ══════════════════════════════════════════════════════════
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const action = body.action || (event.queryStringParameters || {}).action;

            // ── Delete stock item ──
            if (action === 'delete_item') {
                const { id } = body;
                if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing item id' }) };

                const check = await db.execute({ sql: `SELECT status FROM stock_items WHERE id = ?`, args: [id] });
                if (check.rows.length === 0) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Item not found' }) };
                if (check.rows[0].status !== 'available') return { statusCode: 400, headers, body: JSON.stringify({ error: 'Only available items can be deleted' }) };

                await db.execute({ sql: `DELETE FROM stock_items WHERE id = ?`, args: [id] });
                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }

            // ── Update stock item ──
            if (action === 'update_item') {
                const { id, account_info, secret_key, note } = body;
                if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing item id' }) };

                const check = await db.execute({ sql: `SELECT status FROM stock_items WHERE id = ?`, args: [id] });
                if (check.rows.length === 0) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Item not found' }) };

                const sets = [];
                const args = [];
                if (account_info !== undefined) { sets.push('account_info = ?'); args.push(account_info); }
                if (secret_key !== undefined) { sets.push('secret_key = ?'); args.push(secret_key); }
                if (note !== undefined) { sets.push('note = ?'); args.push(note); }

                if (sets.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields to update' }) };
                args.push(id);

                await db.execute({ sql: `UPDATE stock_items SET ${sets.join(', ')} WHERE id = ?`, args });
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Đã cập nhật' }) };
            }

            // ── Create SKU ──
            if (action === 'create_sku') {
                const { sku_code, name, category, price, delivery_type, duration_days } = body;
                if (!sku_code || !name) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Thiếu mã SKU hoặc tên' }) };

                const existing = await db.execute({ sql: `SELECT id FROM skus WHERE sku_code = ?`, args: [sku_code] });
                if (existing.rows.length > 0) return { statusCode: 409, headers, body: JSON.stringify({ error: 'SKU đã tồn tại: ' + sku_code }) };

                await db.execute({
                    sql: `INSERT INTO skus (sku_code, name, category, price, delivery_type, duration_days, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
                    args: [sku_code, name, category || '', parseInt(price) || 0, delivery_type || 'auto', parseInt(duration_days) || 30]
                });
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Đã tạo SKU: ' + sku_code }) };
            }

            // ── Update SKU ──
            if (action === 'update_sku') {
                const { id, name, category, price, delivery_type, duration_days, is_active } = body;
                if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing SKU id' }) };

                const sets = [];
                const args = [];
                if (name !== undefined) { sets.push('name = ?'); args.push(name); }
                if (category !== undefined) { sets.push('category = ?'); args.push(category); }
                if (price !== undefined) { sets.push('price = ?'); args.push(parseInt(price)); }
                if (delivery_type !== undefined) { sets.push('delivery_type = ?'); args.push(delivery_type); }
                if (duration_days !== undefined) { sets.push('duration_days = ?'); args.push(parseInt(duration_days)); }
                if (is_active !== undefined) { sets.push('is_active = ?'); args.push(is_active ? 1 : 0); }

                if (sets.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields to update' }) };
                args.push(id);

                await db.execute({ sql: `UPDATE skus SET ${sets.join(', ')} WHERE id = ?`, args });
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Đã cập nhật SKU' }) };
            }

            // ── Delete SKU ──
            if (action === 'delete_sku') {
                const { id } = body;
                if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing SKU id' }) };

                // Check if stock items reference this SKU
                const stockCheck = await db.execute({ sql: `SELECT COUNT(*) as cnt FROM stock_items WHERE sku_id = ?`, args: [id] });
                if (stockCheck.rows[0].cnt > 0) {
                    // Soft delete: deactivate instead
                    await db.execute({ sql: `UPDATE skus SET is_active = 0 WHERE id = ?`, args: [id] });
                    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'SKU đã được tắt (có stock liên quan, không thể xoá cứng)' }) };
                }

                await db.execute({ sql: `DELETE FROM skus WHERE id = ?`, args: [id] });
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Đã xoá SKU' }) };
            }

            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    } catch (error) {
        console.error('Admin Inventory API Error:', error.message);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Lỗi hệ thống' }) };
    }
};

