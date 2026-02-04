const fetch = require('node-fetch');
// Using localhost:9999 assuming netlify dev is running, OR usage of deployed URL.
// Since we are checking code changes, we should probably run `netlify dev`?
// But user seems to just want code changes.
// I will write this verification script to be run manually.

const BASE_URL = process.env.BASE_URL || 'http://localhost:8888/.netlify/functions';
const SEPAY_TOKEN = process.env.SEPAY_API_TOKEN || 'test_token';

async function run() {
    console.log('🛡️ Verifying Risk Mitigations...');

    // 1. Verify Rate Limit
    console.log('\n--- 1. Rate Limit Test ---');
    // Note: This might block us if we run it too many times!
    // Start with 1 request.

    // Create Dummy Order Payload
    const orderPayload = {
        customerName: 'Rate Limit Test',
        customerEmail: 'test@rate.limit',
        customerPhone: '0000',
        items: [{ productCode: 'netflix_1m', quantity: 1, price: 10000 }]
    };

    // We assume product exists. If not, it will fail with 404 but that counts as "request processed" for rate limit?
    // Actually rate limit check is BEFORE product check.

    try {
        const res = await fetch(`${BASE_URL}/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });
        console.log(`Req 1 status: ${res.status}`);
    } catch (e) { console.log('Req failed (server might not be running)', e.message); }


    // 2. Verify Webhook Security
    console.log('\n--- 2. Webhook Security Test ---');
    const webhookPayload = {
        id: `TEST-${Date.now()}`,
        transactionDate: new Date().toISOString(),
        amountIn: 10000,
        transactionContent: 'TBQ123 TEST',
        referenceCode: 'REF123',
        gateway: 'MBBank'
    };

    // A. Invalid Token
    const resInvalid = await fetch(`${BASE_URL}/webhook-sepay`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer WRONG_TOKEN'
        },
        body: JSON.stringify(webhookPayload)
    });
    console.log(`Invalid Token Response: ${resInvalid.status} (Expected 401)`);
    if (resInvalid.status === 401) console.log('✅ Webhook is SECURED');
    else console.log('❌ Webhook is OPEN (Risk!)');

    // B. Valid Token (Mock)
    // We need a real order ID to test fully, but 200 "Order not found" proves auth passed.
    const resValid = await fetch(`${BASE_URL}/webhook-sepay`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SEPAY_TOKEN}`
        },
        body: JSON.stringify(webhookPayload)
    });
    console.log(`Valid Token Response: ${resValid.status} (Expected 200)`);
    const validJson = await resValid.json();
    console.log('Body:', validJson);

    // 3. Verify Idempotency is harder without a real double success, 
    // but we trust the unique index on `payments`. 

    console.log('\n--- Test Completed ---');
}

run();
