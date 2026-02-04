/**
 * POST /api/auth/setup-first-admin
 *
 * One-time bootstrap: creates the first ADMIN user if users table is empty.
 * After first user exists, this endpoint is a no-op (returns 409).
 *
 * Body: { email: string, password: string }
 *
 * This replaces manual DB seeding. Call once after first deploy.
 */
const bcrypt = require('bcryptjs');
const { getDb } = require('../../utils/db');
const { CORS } = require('../../utils/rbac');

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: CORS, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    let body;
    try { body = JSON.parse(event.body); } catch {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    const { email, password } = body || {};
    if (!email || !password || password.length < 8) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'email + password (min 8 chars) required' }) };
    }

    try {
        const db = getDb();

        // Ensure users table exists (safe on fresh DB)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                email         TEXT    NOT NULL UNIQUE,
                password_hash TEXT    NOT NULL,
                role          TEXT    NOT NULL DEFAULT 'OPS' CHECK(role IN ('ADMIN','OPS','ACCOUNTANT')),
                is_active     INTEGER NOT NULL DEFAULT 1,
                created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if any user already exists
        const countRow = await db.execute('SELECT COUNT(*) as cnt FROM users');
        if ((countRow.rows[0]?.cnt || 0) > 0) {
            return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'Users already exist. Use /api/admin/users to add more.' }) };
        }

        const hash = await bcrypt.hash(password, 12);
        await db.execute({
            sql: 'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
            args: [email.toLowerCase().trim(), hash, 'ADMIN']
        });

        return { statusCode: 201, headers: CORS, body: JSON.stringify({ message: 'First ADMIN created', email: email.toLowerCase().trim() }) };

    } catch (err) {
        console.error('[SetupAdmin] Error:', err);
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
    }
};
