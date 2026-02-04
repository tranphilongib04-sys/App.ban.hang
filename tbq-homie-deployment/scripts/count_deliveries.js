const { createClient } = require('@libsql/client/web');

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        const res = await client.execute("SELECT count(*) as count FROM deliveries");
        console.log('Deliveries count:', res.rows[0].count);
    } catch (e) {
        console.error(e);
    }
}
run();
