/**
 * User Management API
 *
 * GET    /api/admin/users       — list all users
 * POST   /api/admin/users       — create user { email, password, role }
 * PATCH  /api/admin/users/:id   — update { role?, is_active? }
 *
 * Auth: ADMIN only
 */
const bcrypt = require('bcryptjs');
const { getDb } = require('../../utils/db');
const { requireRole } = require('../../utils/rbac');

exports.handler = requireRole(['ADMIN'], async (event, context, actor) => {
    const db = getDb();
    const { httpMethod, path: reqPath } = event;

    if (httpMethod === 'GET') {
        const rows = await db.execute('SELECT id, email, role, is_active, created_at FROM users ORDER BY created_at ASC');
        return { statusCode: 200, body: JSON.stringify({ data: rows.rows }) };
    }

    if (httpMethod === 'POST') {
        return handleCreate(db, event, actor);
    }

    if (httpMethod === 'PATCH') {
        const id = extractId(reqPath);
        if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing user ID' }) };
        return handleUpdate(db, event, actor, id);
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
});

async function handleCreate(db, event, actor) {
    const body = JSON.parse(event.body || '{}');
    const { email, password, role } = body;

    if (!email || !password || password.length < 8) {
        return { statusCode: 400, body: JSON.stringify({ error: 'email + password (min 8 chars) required' }) };
    }
    if (!['ADMIN', 'OPS', 'ACCOUNTANT'].includes(role)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'role must be ADMIN | OPS | ACCOUNTANT' }) };
    }

    const hash = await bcrypt.hash(password, 12);
    try {
        await db.execute({
            sql: 'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
            args: [email.toLowerCase().trim(), hash, role]
        });
    } catch (err) {
        if (err.message?.includes('UNIQUE')) {
            return { statusCode: 409, body: JSON.stringify({ error: 'Email already exists' }) };
        }
        throw err;
    }

    await db.execute({
        sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?,?,?,?,?,?)`,
        args: ['USER_CREATED', 'user', null, actor.email, 'admin-web', JSON.stringify({ new_email: email, role })]
    }).catch(() => {});

    return { statusCode: 201, body: JSON.stringify({ email: email.toLowerCase().trim(), role }) };
}

async function handleUpdate(db, event, actor, id) {
    const body = JSON.parse(event.body || '{}');
    const { role, is_active } = body;

    // Guard: cannot deactivate yourself
    const current = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
    if (!current.rows.length) {
        return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    }

    if (current.rows[0].email === actor.email && is_active === 0) {
        return { statusCode: 409, body: JSON.stringify({ error: 'Cannot deactivate your own account' }) };
    }

    const updates = [];
    const args  = [];

    if (role !== undefined) {
        if (!['ADMIN', 'OPS', 'ACCOUNTANT'].includes(role)) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid role' }) };
        }
        updates.push('role = ?'); args.push(role);
    }
    if (is_active !== undefined) { updates.push('is_active = ?'); args.push(is_active ? 1 : 0); }

    if (!updates.length) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Nothing to update' }) };
    }

    args.push(id);
    await db.execute({ sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, args });

    await db.execute({
        sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?,?,?,?,?,?)`,
        args: ['USER_UPDATED', 'user', id, actor.email, 'admin-web', JSON.stringify({ role, is_active })]
    }).catch(() => {});

    return { statusCode: 200, body: JSON.stringify({ id, role, is_active }) };
}

function extractId(path) {
    const parts = path.split('/');
    const last = parts[parts.length - 1];
    const num = parseInt(last);
    return isNaN(num) ? null : num;
}
