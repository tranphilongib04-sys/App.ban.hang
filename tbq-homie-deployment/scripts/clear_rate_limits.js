require('dotenv').config();
const { createClient } = require('@libsql/client/web');

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        console.log('Clearing rate limits...');
        await client.execute("DELETE FROM rate_limits");
        console.log('✅ Rate limits cleared.');
    } catch (e) {
        console.error(e);
    }
}
run();
