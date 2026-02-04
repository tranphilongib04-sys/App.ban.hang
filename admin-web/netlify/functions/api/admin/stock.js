/**
 * Stock Management API
 *
 * POST   /api/admin/stock          — add single unit
 * POST   /api/admin/stock/bulk     — bulk add
 * GET    /api/admin/stock          — list (with filters)
 * PATCH  /api/admin/stock/:id      — update status / fields
 *
 * Auth: ADMIN only
 */
const { getDb } = require('../../utils/db');
const { requireRole } = require('../../utils/rbac');
const { parseBodySafe } = require('../../utils/parseBody');

exports.handler = requireRole(['ADMIN'], async (event, context, actor) => {
    const db = getDb();
    const { httpMethod, path: reqPath, queryStringParameters: qs } = event;

    // ── route: POST /api/admin/stock/bulk ──
    if (httpMethod === 'POST' && reqPath.endsWith('/bulk')) {
        return handleBulkAdd(db, event, actor);
    }

    // ── route: PATCH /api/admin/stock/:id ──
    if (httpMethod === 'PATCH') {
        const id = extractId(reqPath);
        if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing stock unit ID in path' }) };
        return handlePatch(db, event, actor, id);
    }

    // ── route: POST /api/admin/stock ──
    if (httpMethod === 'POST') {
        return handleAdd(db, event, actor);
    }

    // ── route: GET /api/admin/stock ──
    if (httpMethod === 'GET') {
        return handleList(db, qs);
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
});

// ──────────────────────────────────
// GET  /api/admin/stock?product_id=&status=available&page=1&limit=50
// ──────────────────────────────────
async function handleList(db, qs = {}) {
    const { product_id, status, page = '1', limit = '50' } = qs;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    let args = [];

    if (product_id) { whereClauses.push('product_id = ?'); args.push(parseInt(product_id)); }
    if (status)     { whereClauses.push('status = ?');     args.push(status); }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // count
    const countRow = await db.execute({
        sql: `SELECT COUNT(*) as total FROM stock_units ${whereSQL}`,
        args
    });
    const total = countRow.rows[0]?.total || 0;

    // data
    const rows = await db.execute({
        sql: `SELECT su.*, p.name as product_name, p.code as product_code
              FROM stock_units su
              LEFT JOIN products p ON su.product_id = p.id
              ${whereSQL}
              ORDER BY su.created_at DESC
              LIMIT ? OFFSET ?`,
        args: [...args, limitNum, offset]
    });

    return {
        statusCode: 200,
        body: JSON.stringify({
            data: rows.rows.map(sanitizeStockUnit),
            total,
            page: pageNum,
            limit: limitNum
        })
    };
}

// ──────────────────────────────────
// POST /api/admin/stock
// Body: { product_id, username, password, extra_info?, cost_price? }
// ──────────────────────────────────
async function handleAdd(db, event, actor) {
    const body = parseBodySafe(event);
    const { product_id, username, password, extra_info, cost_price } = body;

    if (!product_id || !username || !password) {
        return { statusCode: 400, body: JSON.stringify({ error: 'product_id, username, password required' }) };
    }

    // Verify product exists
    const prod = await db.execute({ sql: 'SELECT id FROM products WHERE id = ?', args: [product_id] });
    if (!prod.rows.length) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Product not found' }) };
    }

    const passwordEncrypted = Buffer.from(password).toString('base64');
    const passwordIv = Buffer.from('admin-insert').toString('base64');

    const result = await db.execute({
        sql: `INSERT INTO stock_units (product_id, username, password_encrypted, password_iv, extra_info, status, cost_price, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, 'available', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [product_id, username, passwordEncrypted, passwordIv, extra_info || null, cost_price || 0]
    });

    const unitId = result.lastInsertRowid || result.rows?.[0]?.id;

    // Audit
    await db.execute({
        sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?,?,?,?,?,?)`,
        args: ['STOCK_ADDED', 'stock_unit', unitId, actor.email, 'admin-web',
               JSON.stringify({ product_id, username })]
    }).catch(() => {});

    return { statusCode: 201, body: JSON.stringify({ id: unitId, status: 'available' }) };
}

// ──────────────────────────────────
// POST /api/admin/stock/bulk
// Body: { product_id, items: [{ username, password, extra_info?, cost_price? }] }
// ──────────────────────────────────
async function handleBulkAdd(db, event, actor) {
    const body = parseBodySafe(event);
    const { product_id, items } = body;

    if (!product_id || !Array.isArray(items) || items.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'product_id + items[] required' }) };
    }
    if (items.length > 500) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Max 500 items per bulk request' }) };
    }

    const prod = await db.execute({ sql: 'SELECT id FROM products WHERE id = ?', args: [product_id] });
    if (!prod.rows.length) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Product not found' }) };
    }

    let added = 0;
    const errors = [];
    const batchId = `bulk-${Date.now()}`;

    for (const item of items) {
        if (!item.username || !item.password) {
            errors.push({ username: item.username || '(empty)', error: 'username + password required' });
            continue;
        }
        try {
            const enc = Buffer.from(item.password).toString('base64');
            const iv  = Buffer.from('bulk-insert').toString('base64');
            await db.execute({
                sql: `INSERT INTO stock_units (product_id, username, password_encrypted, password_iv, extra_info, status, cost_price, import_batch, created_at, updated_at)
                      VALUES (?, ?, ?, ?, ?, 'available', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                args: [product_id, item.username, enc, iv, item.extra_info || null, item.cost_price || 0, batchId]
            });
            added++;
        } catch (err) {
            errors.push({ username: item.username, error: err.message });
        }
    }

    // Audit
    await db.execute({
        sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?,?,?,?,?,?)`,
        args: ['STOCK_BULK_ADDED', 'stock_unit', null, actor.email, 'admin-web',
               JSON.stringify({ product_id, added, errors: errors.length, batch_id: batchId })]
    }).catch(() => {});

    return { statusCode: 200, body: JSON.stringify({ added, errors, batch_id: batchId }) };
}

// ──────────────────────────────────
// PATCH /api/admin/stock/:id
// Body: { status?: 'available'|'disabled'|'warranty_hold', note? }
// Cannot transition FROM 'sold' (immutable after sale)
// ──────────────────────────────────
async function handlePatch(db, event, actor, id) {
    const body = parseBodySafe(event);
    const { status, note } = body;

    // Fetch current
    const current = await db.execute({ sql: 'SELECT * FROM stock_units WHERE id = ?', args: [id] });
    if (!current.rows.length) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Stock unit not found' }) };
    }

    const unit = current.rows[0];

    // Guard: sold is terminal
    if (unit.status === 'sold') {
        return { statusCode: 409, body: JSON.stringify({ error: 'Cannot modify a sold stock unit' }) };
    }

    // Guard: only allow safe transitions
    const ALLOWED_TRANSITIONS = {
        'available':      ['disabled', 'warranty_hold'],
        'reserved':       ['disabled', 'warranty_hold'],  // admin override
        'warranty_hold':  ['available', 'disabled'],
        'disabled':       ['available', 'warranty_hold']
    };

    if (status && !ALLOWED_TRANSITIONS[unit.status]?.includes(status)) {
        return { statusCode: 409, body: JSON.stringify({ error: `Cannot transition from ${unit.status} to ${status}` }) };
    }

    const updates = [];
    const args  = [];

    if (status) { updates.push('status = ?');  args.push(status); }
    if (note !== undefined) { updates.push('note = ?'); args.push(note); }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    args.push(id);

    await db.execute({
        sql: `UPDATE stock_units SET ${updates.join(', ')} WHERE id = ?`,
        args
    });

    // Audit
    const eventType = status === 'disabled' ? 'STOCK_DISABLED' : status === 'available' ? 'STOCK_REACTIVATED' : 'STOCK_STATUS_CHANGED';
    await db.execute({
        sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?,?,?,?,?,?)`,
        args: [eventType, 'stock_unit', id, actor.email, 'admin-web',
               JSON.stringify({ old_status: unit.status, new_status: status || unit.status })]
    }).catch(() => {});

    return { statusCode: 200, body: JSON.stringify({ id, status: status || unit.status }) };
}

// ──────────────────────────────────
// Helpers
// ──────────────────────────────────
function extractId(path) {
    // path like /.netlify/functions/api/admin/stock/42
    const parts = path.split('/');
    const last = parts[parts.length - 1];
    const num = parseInt(last);
    return isNaN(num) ? null : num;
}

function sanitizeStockUnit(row) {
    // Never return raw password to API consumer
    return {
        id: row.id,
        product_id: row.product_id,
        product_name: row.product_name,
        product_code: row.product_code,
        username: row.username,
        password_masked: row.username?.replace(/(.{3}).*(@.*)/, '$1***$2') || '***',
        extra_info: row.extra_info,
        status: row.status,
        reserved_until: row.reserved_until,
        reserved_order_id: row.reserved_order_id,
        sold_order_id: row.sold_order_id,
        sold_at: row.sold_at,
        cost_price: row.cost_price,
        expires_at: row.expires_at,
        import_batch: row.import_batch,
        note: row.note,
        created_at: row.created_at,
        updated_at: row.updated_at
    };
}
