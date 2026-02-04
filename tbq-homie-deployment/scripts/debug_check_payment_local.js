require('dotenv').config();
const { createClient } = require('@libsql/client/web');
const fetch = require('node-fetch');

const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        console.log('--- Debugging Check Payment ---');

        // 1. Fetch recent Sepay transactions
        console.log('Fetching SePay transactions...');
        const response = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=10', {
            headers: {
                'Authorization': `Bearer ${SEPAY_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('SePay API Error:', response.status);
            return;
        }

        const data = await response.json();
        const transactions = data.transactions || [];
        console.log(`Found ${transactions.length} recent transactions.`);

        // 2. Look for any transaction matching "Test Payment" amount (2000)
        const matches = transactions.filter(t => parseInt(t.amount_in) === 2000);
        console.log('Transactions with 2000 VND:', matches);

        if (matches.length > 0) {
            console.log('--- Analyzing Matches ---');
            matches.forEach(t => {
                console.log(`Tx Content: ${t.transaction_content}`);
                // Try to find order code in content?
                // Does content contain "TBQ..."?
            });
        }

        // 3. Check Orders in DB
        const pendingOrders = await client.execute("SELECT * FROM orders WHERE id = 8");
        console.log('\n--- Order 8 ---');
        console.table(pendingOrders.rows);

        if (pendingOrders.rows.length > 0) {
            const orderId = pendingOrders.rows[0].id;

            const lines = await client.execute({
                sql: "SELECT * FROM order_lines WHERE order_id = ?",
                args: [orderId]
            });
            console.log('\n--- Order Lines ---');
            console.table(lines.rows);

            const allocations = await client.execute({
                sql: "SELECT * FROM order_allocations WHERE order_line_id IN (SELECT id FROM order_lines WHERE order_id = ?)",
                args: [orderId]
            });
            console.log('\n--- Allocations ---');
            console.table(allocations.rows);
        }

    } catch (e) {
        console.error(e);
    }
}

run();
