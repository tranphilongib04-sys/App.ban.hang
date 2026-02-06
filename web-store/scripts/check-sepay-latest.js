
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables correctly
if (fs.existsSync('web-store/.env')) dotenv.config({ path: 'web-store/.env' });
else if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });

const SEPAY_ENDPOINT = 'https://my.sepay.vn/userapi/transactions/list';
const apiToken = process.env.SEPAY_API_TOKEN;

async function checkLatest() {
    if (!apiToken) {
        console.error("Missing SEPAY_API_TOKEN");
        return;
    }

    console.log("Fetching latest 5 transactions from SePay...");
    try {
        const response = await fetch(`${SEPAY_ENDPOINT}?limit=5`, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${await response.text()}`);
            return;
        }

        const data = await response.json();
        const transactions = data.transactions || []; // SePay API structure might vary

        if (transactions.length === 0) {
            console.log("No transactions found.");
            return;
        }

        console.log("\n--- LATEST TRANSACTIONS ---");
        transactions.forEach(t => {
            const date = t.transaction_date || t.date || t.created_at;
            const content = t.transaction_content || t.content;
            const amount = t.amount_in || t.amount;
            console.log(`[${date}] ${amount} VND - ${content}`);
        });
        console.log("---------------------------\n");

    } catch (e) {
        console.error("Exception:", e.message);
    }
}

checkLatest();
