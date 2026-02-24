/**
 * IMPORT STOCK API
 * 
 * POST /admin/import-stock
 * Body: { items: [ { sku_code, account_info, secret_key, note }, ... ] }
 * 
 * Logic:
 * 1. Validate sku_code exists in skus table.
 * 2. Check for duplicates (sku_code + account_info).
 * 3. Insert new items.
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Auth check
    const authError = requireAuth(event);
    if (authError) return authError;

    try {
        const db = getDbClient();

        // Ensure unique index exists (DDL runs outside transaction)
        try {
            await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_items_sku_account
                ON stock_items(sku_id, account_info) WHERE status = 'available'`);
        } catch (e) {
            // Partial index WHERE clause may not be supported in all SQLite versions
            // Fall back to a non-partial unique index
            try {
                await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_items_sku_account_available
                    ON stock_items(sku_id, account_info, status)`);
            } catch (e2) { console.log('Notice: Unique index creation skipped', e2.message); }
        }

        const body = JSON.parse(event.body);
        const { items } = body;

        if (!Array.isArray(items) || items.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid input: items array is required' })
            };
        }

        // 1. Fetch valid SKUs map
        const skusResult = await db.execute('SELECT id, sku_code FROM skus');
        const skuMap = new Map(); // code -> id
        skusResult.rows.forEach(row => skuMap.set(row.sku_code, row.id));

        let insertedCount = 0;
        let skippedDuplicateCount = 0;
        const errors = [];

        // Transaction for better performance (if supported) or batch
        // LibSQL HTTP doesn't strictly support interactive transaction over multiple calls easily without state,
        // but batch transaction is supported.

        const tx = await db.transaction('write');

        try {
            for (const item of items) {
                const { sku_code, account_info, secret_key, note } = item;

                // Validate SKU
                const skuId = skuMap.get(sku_code);
                if (!skuId) {
                    errors.push({ sku: sku_code, error: 'SKU not found' });
                    continue;
                }

                if (!account_info) {
                    errors.push({ sku: sku_code, error: 'Missing account info' });
                    continue;
                }

                // Check duplicate (sku + account)
                // Note: This check inside the loop in a transaction is safe for consistency but can be slow if list is huge.
                // Optimally we'd pre-check or use INSERT OR IGNORE with unique constraint.
                // But we don't have a unique constraint on (sku_id, account_info) yet (and maybe shouldn't if we want to allow same account re-sold later? NO, unique usually preferred for inventory).
                // Let's assume we want to avoid duplicate available items.

                const duplicateCheck = await tx.execute({
                    sql: `SELECT id FROM stock_items WHERE sku_id = ? AND account_info = ? AND status = 'available'`,
                    args: [skuId, account_info]
                });

                if (duplicateCheck.rows.length > 0) {
                    skippedDuplicateCount++;
                    continue;
                }

                // Insert
                // Use a random UUID for ID
                const id = crypto.randomUUID();
                await tx.execute({
                    sql: `INSERT INTO stock_items (id, sku_id, account_info, secret_key, note, status) VALUES (?, ?, ?, ?, ?, 'available')`,
                    args: [id, skuId, account_info, secret_key || '', note || '']
                });
                insertedCount++;
            }

            await tx.commit();

        } catch (e) {
            tx.close(); // Attempt rollback/close local state
            throw e;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                inserted: insertedCount,
                skipped_duplicate: skippedDuplicateCount,
                errors: errors.length > 0 ? errors : undefined
            })
        };

    } catch (error) {
        console.error('Import Stock API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Lỗi hệ thống',
            })
        };
    }
};
