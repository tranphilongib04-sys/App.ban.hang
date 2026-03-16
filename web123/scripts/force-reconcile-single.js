
const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@libsql/client');
const { finalizeOrder, ensurePaymentSchema } = require('../netlify/functions/utils/fulfillment');

if (fs.existsSync('web-store/.env')) dotenv.config({ path: 'web-store/.env' });
else if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });

// Config
const SEPAY_ENDPOINT = 'https://my.sepay.vn/userapi/transactions/list';
const SEPAY_LIST_LIMIT = 200;
const LOOKBACK_MINUTES = 2880 // 48 hours
const AMOUNT_TOLERANCE = 0.95;

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});
const apiToken = process.env.SEPAY_API_TOKEN;

async function forceReconcile(targetOrderCode) {
    console.log(`Force reconciling order: ${targetOrderCode}`);

    // 1. Get Order
    const orderResult = await db.execute({
        sql: "SELECT * FROM orders WHERE order_code = ?",
        args: [targetOrderCode]
    });
    const order = orderResult.rows[0];
    if (!order) {
        console.error("Order not found");
        return;
    }
    console.log(`Order status: ${order.status}, Amount: ${order.amount_total}`);

    // 2. Fetch Transactions
    const response = await fetch(`${SEPAY_ENDPOINT}?limit=${SEPAY_LIST_LIMIT}`, {
        headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    const transactions = data.transactions || [];
    console.log(`Fetched ${transactions.length} transactions`);

    function isTxWithinLookback(txDateRaw) {
        try {
            const txTime = new Date(txDateRaw);
            const diffMins = (Date.now() - txTime.getTime()) / 60000;
            // console.log(`Tx ${txDateRaw}: ${diffMins.toFixed(1)} mins ago`);
            return diffMins >= -60 && diffMins <= LOOKBACK_MINUTES; // Relaxed window
        } catch { return true; }
    }

    // 3. Match
    const orderCode = order.order_code;
    const orderAmount = order.amount_total;

    const match = transactions.find(t => {
        const content = (t.transaction_content || t.content || t.description || '').toUpperCase();
        const amount = parseFloat(t.amount_in || t.amount || t.amountIn || 0);
        const dateOk = isTxWithinLookback(t.transaction_date || t.created_at);

        const code = orderCode.toUpperCase();
        const orderCodeNumber = code.replace(/^TBQ\s*/i, '');
        const normalizedContent = content.replace(/\s+/g, '');
        const normalizedCode = code.toUpperCase();

        const contentMatch =
            new RegExp(`TBQ\\s*${orderCodeNumber}`, 'i').test(content) ||
            normalizedContent.includes(normalizedCode) ||
            (orderCodeNumber.length >= 6 && content.includes(orderCodeNumber));

        const amountMatch = amount >= (orderAmount * AMOUNT_TOLERANCE);

        if (contentMatch) {
            console.log(`Found content candidate: ${content}`);
            console.log(` - DateOK: ${dateOk}`);
            console.log(` - AmountOK: ${amountMatch} (${amount} vs ${orderAmount})`);
        }

        return dateOk && contentMatch && amountMatch;
    });

    if (match) {
        console.log(`MATCH FOUND! Tx ID: ${match.id}`);
        // EXECUTE FULFILLMENT
        const tx = await db.transaction('write');
        try {
            console.log("Starting fulfillment transaction...");
            await ensurePaymentSchema(db); // Ensure schema
            const transactionData = {
                id: match.id || match.transaction_id,
                reference_number: match.reference_number || match.id
            };
            const result = await finalizeOrder(tx, order, transactionData, 'force-reconcile');
            await tx.commit();
            console.log("Transaction Committed!");
            console.log("Result:", result);
        } catch (e) {
            console.error("Fulfillment Error:", e);
            try { tx.close(); } catch { }
        }
    } else {
        console.log("NO MATCH FOUND.");
    }
}

const arg = process.argv[2] || 'TBQ62779108';
forceReconcile(arg);
