const fetch = require('node-fetch');
const BASE_URL = process.env.BASE_URL || 'http://localhost:9999/.netlify/functions';

async function run() {
    console.log('Testing SePay Webhook...');

    // 1. Create a dummy order first to have something to PAY
    console.log('Creating Order...');
    const createRes = await fetch(`${BASE_URL}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customerName: 'Webhook User',
            customerEmail: 'webhook@test.com',
            customerPhone: '0999888777',
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

    // 2. Simulate Webhook
    console.log('Sending Webhook Payload...');

    const webhookPayload = {
        id: `TX-${Date.now()}`,
        transactionDate: new Date().toISOString(),
        amountIn: 70000,
        transactionContent: `PAY FOR ${order.orderCode} THANK YOU`,
        referenceCode: `REF-${Date.now()}`,
        gateway: 'MBBank'
    };

    const webhookRes = await fetch(`${BASE_URL}/webhook-sepay`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test_token'
        },
        body: JSON.stringify(webhookPayload)
    });

    const result = await webhookRes.json();
    console.log('Webhook Response:', result);

    if (result.success) {
        console.log('✅ Webhook processed successfully');
    } else {
        console.log('❌ Webhook failed');
    }

    // 3. Verify Idempotence (Double Webhook)
    console.log('Sending Duplicate Webhook...');
    const webhookRes2 = await fetch(`${BASE_URL}/webhook-sepay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
    });
    const result2 = await webhookRes2.json();
    console.log('Duplicate Webhook Response:', result2);

    if (result2.success && result2.message === 'Already fulfilled') {
        console.log('✅ Idempotency Check Passed');
    } else {
        console.log('⚠️ Idempotency Suspicious', result2);
    }
}
run();
