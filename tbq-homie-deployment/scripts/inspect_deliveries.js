const { createClient } = require('@libsql/client/web');

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        console.log('Inspecting deliveries table...');
        const res = await client.execute("PRAGMA table_info(deliveries)");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
}
run();
