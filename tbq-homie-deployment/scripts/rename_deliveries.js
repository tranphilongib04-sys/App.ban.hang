const { createClient } = require('@libsql/client/web');

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        console.log('Backing up deliveries table...');
        await client.execute("ALTER TABLE deliveries RENAME TO deliveries_backup_legacy");
        console.log('✅ Renamed deliveries to deliveries_backup_legacy');
    } catch (e) {
        if (e.message.includes('no such table')) {
            console.log('Table already renamed or missing, proceeding.');
        } else {
            console.error(e);
        }
    }
}
run();
