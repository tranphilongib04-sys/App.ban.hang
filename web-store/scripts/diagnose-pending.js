
const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@libsql/client');

// Load env
if (fs.existsSync('web-store/.env')) dotenv.config({ path: 'web-store/.env' });
else if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

const SEPAY_TOKEN = process.env.SEPAY_API_TOKEN;

async function diagnose() {
    console.log("--- DIAGNOSTIC START ---");

    // 1. Check Env
    if (!SEPAY_TOKEN) {
        console.error("CRITICAL: SEPAY_API_TOKEN is missing in local environment!");
    } else {
        console.log("SEPAY_API_TOKEN is present.");
    }

    // 2. Fetch Pending Orders (Last 24h)
    const orders = await db.execute({
        sql: "SELECT * FROM orders WHERE status = 'pending_payment' AND created_at > datetime('now', '-1 day') ORDER BY created_at DESC"
    });

    if (orders.rows.length === 0) {
        console.log("No pending orders found in the last 24 hours.");
        return;
    }

    console.log(`Found ${orders.rows.length} pending orders. Fetching SePay transactions...`);

    // 3. Fetch SePay Data (once)
    let transactions = [];
    try {
        const res = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=100', {
            headers: { 'Authorization': `Bearer ${SEPAY_TOKEN}` }
        });
        const data = await res.json();
        transactions = data.transactions || [];
        console.log(`Fetched ${transactions.length} transactions from SePay.`);
    } catch (e) {
        console.error("Failed to fetch SePay:", e.message);
        return;
    }

    // 4. Analyze Each Order
    for (const order of orders.rows) {
        console.log(`\nChecking Order ${order.order_code} (${order.amount_total} VND) - ${order.created_at}`);

        const orderCodeNumber = order.order_code.replace(/^TBQ\s*/i, '');

        // Find candidates
        const candidates = transactions.filter(t => {
            const content = (t.transaction_content || t.content || '').toUpperCase();
            // Loose check for numeric part
            return content.includes(orderCodeNumber);
        });

        if (candidates.length === 0) {
            console.log("  => result: NO TRANSACTIONS FOUND containing logic code " + orderCodeNumber);
            continue;
        }

        // Detailed check on candidates
        candidates.forEach(t => {
            const content = (t.transaction_content || t.content || '').toUpperCase();
            const amount = parseFloat(t.amount_in || t.amount || 0);
            const date = t.transaction_date || t.created_at;

            console.log(`  Candidate Tx: ${content} | ${amount} VND | ${date}`);

            // Logic Check
            const contentMatch = new RegExp(`TBQ\\s*${orderCodeNumber}`, 'i').test(content) ||
                content.replace(/\s+/g, '').includes(`TBQ${orderCodeNumber}`) ||
                (orderCodeNumber.length >= 6 && content.includes(orderCodeNumber));

            const amountMatch = amount >= order.amount_total * 0.95;

            // Time Check (Simulating the FIX)
            const txTime = new Date(date);
            const diffMins = (Date.now() - txTime.getTime()) / 60000;
            // The fix was: diffMins > -1440
            const timeMatch = diffMins < 10080 && diffMins > -1440;

            if (!contentMatch) console.log(`     -> Rejected by Regex/Content ContentMatch=${contentMatch}`);
            if (!amountMatch) console.log(`     -> Rejected by Amount (${amount} < ${order.amount_total})`);
            if (!timeMatch) console.log(`     -> Rejected by Time (Diff: ${diffMins.toFixed(1)} mins)`);

            if (contentMatch && amountMatch && timeMatch) {
                console.log("     => SUCCESS! This pending order SHOULD be paid. If it is not, the system is not polling or webhook is failing.");
            }
        });
    }
    console.log("\n--- DIAGNOSTIC END ---");
}

diagnose();
