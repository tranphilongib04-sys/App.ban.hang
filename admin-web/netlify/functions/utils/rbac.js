/**
 * RBAC guard wrapper for Netlify functions.
 *
 * Usage:
 *   const { requireRole } = require('../utils/rbac');
 *
 *   exports.handler = requireRole(['ADMIN', 'OPS'], async (event, context, actor) => {
 *       // actor = { userId, email, role }
 *       // ... your logic
 *   });
 *
 * Returns 401 if no valid token, 403 if role not in allowed list.
 */
const { extractRole } = require('./auth');

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Content-Type': 'application/json'
};

function requireRole(allowedRoles, handler) {
    return async function (event, context) {
        // CORS preflight
        if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers: CORS, body: '' };
        }

        const actor = extractRole(event);

        if (!actor) {
            return {
                statusCode: 401,
                headers: CORS,
                body: JSON.stringify({ error: 'Unauthorized', message: 'Missing or invalid token' })
            };
        }

        if (!allowedRoles.includes(actor.role)) {
            return {
                statusCode: 403,
                headers: CORS,
                body: JSON.stringify({ error: 'Forbidden', message: `Role ${actor.role} not allowed. Required: ${allowedRoles.join(' | ')}` })
            };
        }

        // Attach CORS headers to whatever the handler returns
        try {
            const result = await handler(event, context, actor);
            result.headers = { ...CORS, ...(result.headers || {}) };
            return result;
        } catch (err) {
            console.error('[RBAC] Handler error:', err);
            return {
                statusCode: 500,
                headers: CORS,
                body: JSON.stringify({ error: 'Internal server error', message: err.message })
            };
        }
    };
}

module.exports = { requireRole, CORS };
