
const { handler: inventoryHandler } = require('./netlify/functions/inventory');
const { handler: orderHandler } = require('./netlify/functions/create-order');

async function test() {
    try {
        console.log("--- Test 1. Check Stock ---");
        const invRes1 = await inventoryHandler({
            httpMethod: 'GET',
            queryStringParameters: { service: 'chatgpt', variant: 'plus-1m' }
        });
        const inv1 = JSON.parse(invRes1.body);
        console.log("Stock:", inv1.available);

        if (inv1.available < 1) {
            console.error("Not enough stock to test order");
            return;
        }

        console.log("\n--- Test 2. Create Order ---");
        const orderRes = await orderHandler({
            httpMethod: 'POST',
            headers: { 'client-ip': '127.0.0.1' },
            body: JSON.stringify({
                customerName: 'Test Buyer',
                customerEmail: 'buyer@test.com',
                customerPhone: '0909090909',
                items: [
                    { productCode: 'chatgpt_plus_1m', quantity: 1 }
                ]
            })
        });
        const order = JSON.parse(orderRes.body);
        console.log("Order Response:", order);

        if (!order.success) {
            console.error("Order failed:", order.error);
            return;
        }

        console.log("\n--- Test 3. Check Stock Again ---");
        const invRes2 = await inventoryHandler({
            httpMethod: 'GET',
            queryStringParameters: { service: 'chatgpt', variant: 'plus-1m' }
        });
        const inv2 = JSON.parse(invRes2.body);
        console.log("Stock After:", inv2.available);

        if (inv2.available === inv1.available - 1) {
            console.log("✅ SUCCESS: Stock decremented correctly.");
        } else {
            console.error("❌ FAIL: Stock count mismatch.");
        }

    } catch (e) {
        console.error("Test Failed", e);
    }
}

test();
