/**
 * Safely parse the Netlify function event body.
 * Netlify sometimes base64-encodes the body — this handles both cases.
 *
 * @param {object} event  Netlify function event
 * @returns {object}      Parsed body (empty object if no body)
 */
function parseBody(event) {
    let raw = event.body || '';
    if (event.isBase64Encoded) {
        raw = Buffer.from(raw, 'base64').toString('utf8');
    }
    return JSON.parse(raw);
}

/**
 * Same as parseBody but returns {} on any parse failure.
 * Use for endpoints where an empty body is acceptable.
 */
function parseBodySafe(event) {
    try { return parseBody(event); } catch { return {}; }
}

module.exports = { parseBody, parseBodySafe };
