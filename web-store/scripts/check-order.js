
const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@libsql/client');

if (fs.existsSync('web-store/.env')) dotenv.config({ path: 'web-store/.env' });
else if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function checkOrder(code) {
    console.log(`Checking order: ${code}`);
    try {
        const result = await db.execute({
            sql: "SELECT * FROM orders WHERE order_code = ?",
            args: [code]
        });

        if (result.rows.length === 0) {
            console.log("Order NOT FOUND in database.");
        } else {
            console.log("Order Found:", result.rows[0]);
        }
    } catch (e) {
        console.error(e);
    }
}

const code = process.argv[2] || 'TBQ62779108';
checkOrder(code);
