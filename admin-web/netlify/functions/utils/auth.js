/**
 * JWT auth utilities for admin-web serverless functions.
 *
 * Flow:
 *   POST /api/auth/login  → issues JWT { sub, email, role, iat, exp }
 *   All other /api/*      → extractRole(event) validates and returns { userId, email, role }
 *
 * Secret: AUTH_JWT_SECRET env var.  Expires: 24 h by default.
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = () => process.env.AUTH_JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES = '24h';

function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET(), { expiresIn: JWT_EXPIRES });
}

/**
 * Extract + verify JWT from event.headers.authorization.
 * Returns { userId, email, role } or null.
 */
function extractRole(event) {
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET());
        return {
            userId: decoded.sub,
            email: decoded.email,
            role: decoded.role   // 'ADMIN' | 'OPS' | 'ACCOUNTANT'
        };
    } catch {
        return null;
    }
}

module.exports = { signToken, extractRole, JWT_SECRET };
