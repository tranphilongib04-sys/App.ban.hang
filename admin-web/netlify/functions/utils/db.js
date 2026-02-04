/**
 * Shared Turso DB client for admin-web functions.
 * Singleton per cold-start (Netlify keeps the module alive within one invocation).
 */
const { createClient } = require('@libsql/client/web');

let _client = null;

function getDb() {
    if (_client) return _client;

    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        throw new Error('TURSO_DATABASE_URL not configured');
    }

    _client = createClient({ url, authToken });
    return _client;
}

module.exports = { getDb };
