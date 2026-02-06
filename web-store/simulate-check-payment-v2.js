const { createClient } = require('@libsql/client/web');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Load Env
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

const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;
const SEPAY_LIST_LIMIT = 200;
const AMOUNT_TOLERANCE = 0.95;
const LOOKBACK_MINUTES = 180;

const orderCode = 'TBQ62062276';
const expectedAmount = 2000;

async function run() {
    console.log(`Simulating check-payment for ${orderCode}...`);
    console.log(`Current Server Time (Local): ${new Date().toISOString()}`);

    try {
        const response = await fetch(`https://my.sepay.vn/userapi/transactions/list?limit=${SEPAY_LIST_LIMIT}`, {
            headers: {
                'Authorization': `Bearer ${SEPAY_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        const transactions = data.transactions || [];
        console.log(`Fetched ${transactions.length} transactions.`);

        const paidTransaction = transactions.find(t => {
            const content = (t.transaction_content || t.content || t.description || '').toUpperCase();
            const code = orderCode.toUpperCase();
            const orderCodeNumber = code.replace('TBQ', '');

            const isContentMatch = content.includes(code) ||
                (orderCodeNumber.length >= 8 && content.includes(orderCodeNumber));

            const txAmount = parseFloat(t.amount_in || t.amount || t.amountIn || 0);
            const isAmountMatch = txAmount >= expectedAmount * AMOUNT_TOLERANCE;

            let isRecentTx = false;
            let diffMins = 0;
            let txTime = null;
            try {
                txTime = new Date(t.transaction_date || t.transactionDate || t.date || t.created_at);
                diffMins = (Date.now() - txTime.getTime()) / 60000;
                isRecentTx = diffMins < LOOKBACK_MINUTES && diffMins > -10;
            } catch (e) {
                isRecentTx = true;
            }

            if (isContentMatch) {
                console.log(`[MATCH CANDIDATE] TX ${t.id}:`);
                console.log(`  Content: ${content}`);
                console.log(`  Amount: ${txAmount} (Expected >= ${expectedAmount * AMOUNT_TOLERANCE})`);
                console.log(`  Time: ${txTime ? txTime.toISOString() : 'N/A'}`);
                console.log(`  Diff: ${diffMins.toFixed(2)} mins`);
                console.log(`  isAmountMatch: ${isAmountMatch}`);
                console.log(`  isRecentTx: ${isRecentTx}`);
            }

            return isContentMatch && isAmountMatch && isRecentTx;
        });

        if (paidTransaction) {
            console.log("SUCCESS: Found matching transaction!", paidTransaction.id);
        } else {
            console.log("FAILURE: No matching transaction found.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
