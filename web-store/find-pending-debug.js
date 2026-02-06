const { createClient } = require('@libsql/client/web');
const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
} catch (e) {
    console.error("Could not read .env file:", e);
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient({ url, authToken });

async function findPending() {
    try {
        console.log("Searching for latest pending orders...");
        const result = await client.execute({
            sql: `SELECT id, order_code, amount_total, status, created_at, customer_email 
                  FROM orders 
                  WHERE status = 'pending_payment' 
                  ORDER BY created_at DESC 
                  LIMIT 1`,
            args: []
        });

        if (result.rows.length === 0) {
            console.log("No pending orders found.");
        } else {
            console.log("Latest Pending Order:");
            console.table(result.rows);
        }
    } catch (e) {
        console.error("DB Error:", e);
    }
}

findPending();
