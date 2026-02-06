const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Try loading from web-store/.env FIRST (likely production/correct)
if (fs.existsSync('web-store/.env')) {
    console.log('Loading web-store/.env');
    dotenv.config({ path: 'web-store/.env' });
}

// Try loading from .env.local in root
if (fs.existsSync('.env.local')) {
    console.log('Loading .env.local from root');
    dotenv.config({ path: '.env.local' });
}

// Try loading from .env in root
if (fs.existsSync('.env')) {
    console.log('Loading .env from root');
    dotenv.config({ path: '.env' });
}
const { createClient } = require('@libsql/client');

// Configuration matching the real functions
const SEPAY_ENDPOINT = 'https://my.sepay.vn/userapi/transactions/list';
const SEPAY_LIST_LIMIT = 50; // Check last 50 transactions
const AMOUNT_TOLERANCE = 0.95;
const LOOKBACK_MINUTES = 2880; // 48 hours for debugging

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

const apiToken = process.env.SEPAY_API_TOKEN;

async function debugPayments(specificOrderCode = null) {
    console.log("--- STARTING PAYMENT DEBUG ANALYSIS ---");
    console.log(`Time: ${new Date().toISOString()}`);

    if (!process.env.TURSO_DATABASE_URL) {
        console.error("Error: TURSO_DATABASE_URL not found in env.");
        return;
    }
    if (!apiToken) {
        console.error("Error: SEPAY_API_TOKEN not found in env.");
        return;
    }

    try {
        // 1. Fetch Recent Orders (Pending OR Expired)
        // We look at everything created recently to catch cases where order expired before payment arrived
        const ordersResult = await db.execute({
            sql: `SELECT * FROM orders 
                   WHERE (status = 'pending_payment' OR status = 'expired')
                   AND created_at > datetime('now', '-2 days')
                   ORDER BY created_at DESC LIMIT 10`,
            args: []
        });
        const orders = ordersResult.rows;

        console.log(`\nFound ${orders.length} recent orders (pending/expired) to check.`);
        orders.forEach(o => console.log(` - ${o.order_code} (${o.status}) Created: ${o.created_at}`));

        if (orders.length === 0) {
            console.log("No recent orders found.");
        }

        // 2. Fetch SePay Transactions
        console.log(`\nFetching last 10 transactions from SePay...`);
        const response = await fetch(`${SEPAY_ENDPOINT}?limit=10`, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`SePay API Error: ${await response.text()}`);
            return;
        }

        const data = await response.json();
        const transactions = data.transactions || [];
        console.log(`Fetched ${transactions.length} transactions.`);

        // Log the Latest Transactions to verify freshness
        console.log("\n--- LATEST 5 SEPAY TRANSACTIONS ---");
        transactions.slice(0, 5).forEach(t => {
            console.log(`[${t.transaction_date}] ${t.amount_in} - ${t.transaction_content}`);
        });
        console.log("-----------------------------------\n");

        // 3. Analyze Matches
        for (const order of orders) {
            console.log(`\n---------------------------------------------------`);
            console.log(`ANALYZING ORDER: ${order.order_code}`);
            console.log(`Amount Expected: ${order.amount_total}`);
            console.log(`Created At:      ${order.created_at}`);
            console.log(`---------------------------------------------------`);

            const orderCode = order.order_code;
            const orderAmount = order.amount_total;
            const code = orderCode.toUpperCase();

            // Regex from the fix
            const orderCodeNumber = code.replace(/^TBQ\s*/i, '');
            const normalizedCode = code.toUpperCase();

            let foundMatch = false;

            transactions.forEach((t, idx) => {
                const content = (t.transaction_content || t.content || t.description || '').toUpperCase();
                const amount = parseFloat(t.amount_in || t.amount || t.amountIn || 0);
                const txDateRaw = t.transaction_date || t.transactionDate || t.date || t.created_at;

                // --- DEBUG LOGIC ---
                // We print details only if there is ANY semblance of a match (amount or partial content)
                // to avoid spamming 50 lines per order.

                const amountDiff = Math.abs(amount - orderAmount);
                const isAmountSimilar = amount >= (orderAmount * 0.9); // Within 10%
                const isContentPartial = content.includes('TBQ') || content.includes(orderCodeNumber);

                if (isAmountSimilar || isContentPartial) {
                    console.log(`\n  Checking Transaction #${t.id} (${txDateRaw})`);
                    console.log(`  Content: "${content}"`);
                    console.log(`  Amount:  ${amount} (Diff: ${amount - orderAmount})`);

                    // 1. Content Check
                    const normalizedContent = content.replace(/\s+/g, '');
                    const contentMatch =
                        new RegExp(`TBQ\\s*${orderCodeNumber}`, 'i').test(content) ||
                        normalizedContent.includes(normalizedCode) ||
                        (orderCodeNumber.length >= 6 && content.includes(orderCodeNumber));

                    console.log(`  [Check 1] Content Match: ${contentMatch ? 'PASS' : 'FAIL'}`);

                    if (!contentMatch) {
                        console.log(`     -> Expected "TBQ${orderCodeNumber}" or similar in "${content}"`);
                        console.log(`     -> Regex test: ${new RegExp(`TBQ\\s*${orderCodeNumber}`, 'i')}`);
                    }

                    // 2. Amount Check
                    const amountMatch = amount >= (orderAmount * AMOUNT_TOLERANCE);
                    console.log(`  [Check 2] Amount Match:  ${amountMatch ? 'PASS' : 'FAIL'} (Tolerance ${AMOUNT_TOLERANCE})`);

                    // 3. Time Check
                    let dateOk = false;
                    try {
                        const txTime = new Date(txDateRaw);
                        const diffMins = (Date.now() - txTime.getTime()) / 60000;
                        // Debug script uses wider lookback
                        dateOk = diffMins >= -60 && diffMins <= LOOKBACK_MINUTES;
                        console.log(`  [Check 3] Time Match:    ${dateOk ? 'PASS' : 'FAIL'} (${diffMins.toFixed(1)} mins ago)`);
                    } catch (e) {
                        console.log(`  [Check 3] Time Match:    ERROR (${e.message})`);
                    }

                    if (contentMatch && amountMatch && dateOk) {
                        console.log(`  >>> FULL MATCH FOUND! <<<`);
                        foundMatch = true;
                    }
                }
            });

            if (!foundMatch) {
                console.log(`\n=> RESULT: NO MATCH FOUND for ${order.order_code}`);
            }
        }

    } catch (e) {
        console.error("FATAL ERROR:", e);
    }
}

// Allow running with a specific order code arg
const specificArg = process.argv[2];
debugPayments(specificArg);
