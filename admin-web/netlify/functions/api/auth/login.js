/**
 * POST /api/auth/login
 *
 * Body: { email: string, password: string }
 * Response: { token: string, role: string, email: string }
 *
 * Checks users table in Turso. password_hash is bcrypt.
 */
const bcrypt = require('bcryptjs');
const { getDb } = require('../../utils/db');
const { signToken } = require('../../utils/auth');
const { CORS } = require('../../utils/rbac');

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: CORS, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    const { email, password } = body || {};

    if (!email || !password) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing email or password' }) };
    }

    try {
        const db = getDb();

        const result = await db.execute({
            sql: 'SELECT id, email, password_hash, role, is_active FROM users WHERE email = ?',
            args: [email.toLowerCase().trim()]
        });

        const user = result.rows[0];

        if (!user || !user.is_active) {
            return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid credentials' }) };
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid credentials' }) };
        }

        // Audit: login
        await db.execute({
            sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source) VALUES (?, ?, ?, ?, ?)`,
            args: ['USER_LOGIN', 'user', user.id, user.email, 'admin-web']
        }).catch(() => {}); // non-blocking — audit_logs may not exist yet

        const token = signToken({
            sub: user.id,
            email: user.email,
            role: user.role
        });

        return {
            statusCode: 200,
            headers: CORS,
            body: JSON.stringify({ token, role: user.role, email: user.email })
        };

    } catch (err) {
        console.error('[Login] Error:', err);
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Server error' }) };
    }
};
