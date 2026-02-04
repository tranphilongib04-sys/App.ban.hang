const fetch = require('node-fetch');
const BASE_URL = process.env.BASE_URL || 'http://localhost:9999/.netlify/functions';

async function run() {
    console.log('Testing Double Payment Check...');

    // 1. Create an order
    const createRes = await fetch(`${BASE_URL}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customerName: 'Double Test',
            customerEmail: 'double@test.com',
            customerPhone: '000',
            productCode: 'netflix_1m',
            price: 70000
        })
    });
    const order = await createRes.json();
    if (!order.success) {
        console.log('❌ Setup failed: Could not create order', order);
        return;
    }
    console.log('Order created:', order.orderCode);

    // 2. Simulate Payment Check #1 (Should succeed if we could force it, but check-payment checks SePay).
    // Implementation Detail: We can't mock SePay here easily without mocking fetch in the backend.
    // BUT, we can check the LOGIC trace.
    // Wait... `check-payment` calls SePay. If SePay says "no transaction", we can't test "Paid".
    // 
    // CRITICAL: We cannot fully test Double Payment AUTOMATICALLY without a mock SePay or a real transaction.
    // However, we can verify that calling check-payment multiple times doesn't error out.

    console.log('Calling check-payment 2 times concurrently...');

    const req1 = fetch(`${BASE_URL}/check-payment?orderCode=${order.orderCode}&amount=70000`);
    const req2 = fetch(`${BASE_URL}/check-payment?orderCode=${order.orderCode}&amount=70000`);

    const [res1, res2] = await Promise.all([req1, req2]);
    const d1 = await res1.json();
    const d2 = await res2.json();

    console.log('Result 1:', d1.status);
    console.log('Result 2:', d2.status);

    if (d1.status === d2.status) {
        console.log('✅ Idempotent READ (Both returned pending/paid same status)');
    } else {
        console.log('❓ Race condition in status check?');
    }
}
run();
