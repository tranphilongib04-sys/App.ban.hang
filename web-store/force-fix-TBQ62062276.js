const { createClient } = require('@libsql/client/web');
const { finalizeOrder } = require('./netlify/functions/utils/fulfillment');
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

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient({ url, authToken });

async function forceFulfill() {
    const orderCode = 'TBQ62062276';
    console.log(`Force fulfilling order ${orderCode}...`);

    try {
        const orderRes = await client.execute({
            sql: "SELECT * FROM orders WHERE order_code = ?",
            args: [orderCode]
        });

        if (orderRes.rows.length === 0) {
            console.log("Order not found");
            return;
        }

        const order = orderRes.rows[0];
        console.log(`Order status: ${order.status}`);

        if (order.status === 'fulfilled') {
            console.log("Order is already fulfilled!");
            return;
        }

        // Mock Transaction
        const transaction = {
            id: 'FORCE_FIX_' + Date.now(),
            reference_number: 'FORCE_FIX_' + Date.now(),
            amount_in: order.amount_total,
            transaction_date: new Date().toISOString()
        };

        const tx = await client.transaction('write');
        try {
            const result = await finalizeOrder(tx, order, transaction, 'force-fix-script');
            await tx.commit();
            console.log("SUCCESS! Order fulfilled.");
            console.log("Delivery Token:", result.deliveryToken);
        } catch (err) {
            console.error("Error during finalize:", err);
            await tx.rollback();
        }

    } catch (e) {
        console.error("Script error:", e);
    }
}

forceFulfill();
