#!/usr/bin/env node
/**
 * CRITICAL TEST SUITE — TBQ Homie Payment System
 * 
 * Tests:
 * - REL-007: Oversell prevention (concurrent orders with limited stock)
 * - PAY-002: Webhook independence (simulates user closing tab)
 * - PAY-007: Double payment prevention
 * - REL-009: Webhook + Polling collision
 * 
 * Usage:
 *   node critical-tests.js [test-name]
 *   node critical-tests.js all
 */

const { createClient } = require('@libsql/client/web');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:9999/.netlify/functions';
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;

function getDb() {
    return createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });
}

// ═══════════════════════════════════════════════════════════════════
// TEST REL-007: OVERSELL PREVENTION
// ═══════════════════════════════════════════════════════════════════
async function testOversellPrevention() {
    console.log('\n🔬 TEST REL-007: Oversell Prevention (Concurrent Orders)');
    console.log('═'.repeat(60));

    const db = getDb();

    try {
        // 1. Setup: Create test product with EXACTLY 1 stock unit
        console.log('📦 Setup: Creating test product with 1 stock unit...');

        const testProductCode = `TEST_OVERSELL_${Date.now()}`;

        // Check if product exists, create if not
        await db.execute({
            sql: `INSERT INTO products (code, name, is_active, created_at) 
                  VALUES (?, 'Test Oversell Product', 1, CURRENT_TIMESTAMP)
                  ON CONFLICT(code) DO UPDATE SET is_active = 1`,
            args: [testProductCode]
        });

        const productResult = await db.execute({
            sql: 'SELECT id FROM products WHERE code = ?',
            args: [testProductCode]
        });
        const productId = productResult.rows[0].id;

        // Clear existing stock for this product
        await db.execute({
            sql: 'DELETE FROM stock_units WHERE product_id = ?',
            args: [productId]
        });

        // Add EXACTLY 1 stock unit
        await db.execute({
            sql: `INSERT INTO stock_units (product_id, content, password_encrypted, status, created_at)
                  VALUES (?, 'test@example.com', 'cGFzc3dvcmQxMjM=', 'available', CURRENT_TIMESTAMP)`,
            args: [productId]
        });

        console.log(`✅ Product created: ${testProductCode}, Stock: 1 unit`);

        // 2. Fire 5 concurrent order requests
        console.log('\n🚀 Firing 5 concurrent order requests...');

        const requests = [];
        for (let i = 0; i < 5; i++) {
            const payload = {
                customerName: `Concurrent User ${i + 1}`,
                customerEmail: `concurrent${i + 1}@test.com`,
                customerPhone: `09${i}${i}${i}${i}${i}${i}${i}${i}${i}`,
                items: [{
                    productCode: testProductCode,
                    quantity: 1,
                    price: 70000
                }]
            };

            requests.push(
                fetch(`${BASE_URL}/create-order`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                    .then(r => r.json())
                    .then(d => ({ index: i + 1, ...d }))
            );
        }

        const results = await Promise.all(requests);

        // 3. Analyze results
        const successes = results.filter(r => r.success);
        const failures = results.filter(r => !r.success);
        const insufficientStock = failures.filter(r => r.error === 'INSUFFICIENT_STOCK');
        const reserveFailed = failures.filter(r => r.error === 'RESERVE_FAILED');

        console.log('\n📊 Results:');
        console.log(`   Total requests: 5`);
        console.log(`   ✅ Successes: ${successes.length}`);
        console.log(`   ❌ Failures: ${failures.length}`);
        console.log(`      - INSUFFICIENT_STOCK: ${insufficientStock.length}`);
        console.log(`      - RESERVE_FAILED: ${reserveFailed.length}`);

        // 4. Verify stock in DB
        const stockCheck = await db.execute({
            sql: `SELECT status, COUNT(*) as count FROM stock_units 
                  WHERE product_id = ? GROUP BY status`,
            args: [productId]
        });

        console.log('\n📦 Stock status after test:');
        stockCheck.rows.forEach(row => {
            console.log(`   ${row.status}: ${row.count}`);
        });

        // 5. Verdict
        console.log('\n🎯 VERDICT:');
        if (successes.length === 1 && failures.length === 4) {
            console.log('   ✅ PASS: Exactly 1 order succeeded, 4 failed (oversell prevented)');
            return true;
        } else {
            console.log(`   ❌ FAIL: Expected 1 success, got ${successes.length}`);
            console.log('   ⚠️  OVERSELL VULNERABILITY DETECTED!');
            return false;
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════
// TEST PAY-002: WEBHOOK INDEPENDENCE (User closes tab)
// ═══════════════════════════════════════════════════════════════════
async function testWebhookIndependence() {
    console.log('\n🔬 TEST PAY-002: Webhook Independence (User Closes Tab)');
    console.log('═'.repeat(60));

    const db = getDb();

    try {
        // 1. Create order (simulate user creates order then closes tab)
        console.log('📝 Creating order...');
        const orderResponse = await fetch(`${BASE_URL}/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: 'Close Tab User',
                customerEmail: 'closetab@test.com',
                customerPhone: '0999999999',
                items: [{
                    productCode: 'netflix_1m',
                    quantity: 1,
                    price: 70000
                }]
            })
        });

        const order = await orderResponse.json();
        if (!order.success) {
            console.log('❌ Setup failed: Could not create order');
            return false;
        }

        console.log(`✅ Order created: ${order.orderCode}`);
        console.log('   💡 Simulating: User closes browser immediately after order creation');

        // 2. Verify order is pending_payment
        const orderCheck1 = await db.execute({
            sql: 'SELECT status FROM orders WHERE order_code = ?',
            args: [order.orderCode]
        });
        console.log(`   Order status: ${orderCheck1.rows[0]?.status}`);

        // 3. Simulate webhook (this is what happens when SePay sends payment notification)
        console.log('\n🔔 Simulating webhook arrival (user still offline)...');

        const webhookPayload = {
            id: `TX_${Date.now()}`,
            transactionDate: new Date().toISOString(),
            amountIn: order.amount,
            content: `IBFT ${order.orderCode}`,
            referenceCode: `REF_${Date.now()}`
        };

        const webhookResponse = await fetch(`${BASE_URL}/webhook-sepay`, {
            method: 'POST',
            headers: {
                'Authorization': `Apikey ${SEPAY_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookPayload)
        });

        const webhookResult = await webhookResponse.json();
        console.log(`   Webhook response:`, webhookResult);

        // 4. Check if order was fulfilled (independent of client)
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for DB update

        const orderCheck2 = await db.execute({
            sql: 'SELECT status FROM orders WHERE order_code = ?',
            args: [order.orderCode]
        });

        const finalStatus = orderCheck2.rows[0]?.status;
        console.log(`\n📊 Final order status: ${finalStatus}`);

        // 5. Verdict
        console.log('\n🎯 VERDICT:');
        if (finalStatus === 'fulfilled') {
            console.log('   ✅ PASS: Webhook fulfilled order independently (user did not need to be online)');
            return true;
        } else {
            console.log(`   ❌ FAIL: Order status is ${finalStatus}, expected 'fulfilled'`);
            console.log('   ⚠️  WEBHOOK NOT WORKING INDEPENDENTLY!');
            return false;
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════
// TEST PAY-007: DOUBLE PAYMENT PREVENTION
// ═══════════════════════════════════════════════════════════════════
async function testDoublePaymentPrevention() {
    console.log('\n🔬 TEST PAY-007: Double Payment Prevention');
    console.log('═'.repeat(60));

    const db = getDb();

    try {
        // 1. Create order
        console.log('📝 Creating order...');
        const orderResponse = await fetch(`${BASE_URL}/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: 'Double Pay User',
                customerEmail: 'doublepay@test.com',
                customerPhone: '0888888888',
                items: [{
                    productCode: 'netflix_1m',
                    quantity: 1,
                    price: 70000
                }]
            })
        });

        const order = await orderResponse.json();
        if (!order.success) {
            console.log('❌ Setup failed');
            return false;
        }

        console.log(`✅ Order created: ${order.orderCode}`);

        // 2. Send same webhook twice (simulate duplicate transaction notification)
        console.log('\n🔔 Sending SAME webhook payload TWICE...');

        const transactionId = `DUP_TX_${Date.now()}`;
        const webhookPayload = {
            id: transactionId,  // SAME transaction ID
            transactionDate: new Date().toISOString(),
            amountIn: order.amount,
            content: `IBFT ${order.orderCode}`,
            referenceCode: `REF_${Date.now()}`
        };

        const webhook1 = fetch(`${BASE_URL}/webhook-sepay`, {
            method: 'POST',
            headers: {
                'Authorization': `Apikey ${SEPAY_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookPayload)
        });

        const webhook2 = fetch(`${BASE_URL}/webhook-sepay`, {
            method: 'POST',
            headers: {
                'Authorization': `Apikey ${SEPAY_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookPayload)  // SAME payload
        });

        const [result1, result2] = await Promise.all([webhook1, webhook2]);
        const data1 = await result1.json();
        const data2 = await result2.json();

        console.log('   Webhook 1 result:', data1);
        console.log('   Webhook 2 result:', data2);

        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. Check database for duplicates
        const paymentCount = await db.execute({
            sql: 'SELECT COUNT(*) as count FROM payments WHERE transaction_id = ?',
            args: [transactionId]
        });

        const deliveryCount = await db.execute({
            sql: 'SELECT COUNT(*) as count FROM deliveries WHERE order_id IN (SELECT id FROM orders WHERE order_code = ?)',
            args: [order.orderCode]
        });

        console.log(`\n📊 Database checks:`);
        console.log(`   Payments with transaction_id "${transactionId}": ${paymentCount.rows[0].count}`);
        console.log(`   Deliveries for order: ${deliveryCount.rows[0].count}`);

        // 4. Verdict
        console.log('\n🎯 VERDICT:');
        if (paymentCount.rows[0].count === 1 && deliveryCount.rows[0].count >= 1) {
            console.log('   ✅ PASS: Only 1 payment record, idempotency working');
            return true;
        } else {
            console.log(`   ❌ FAIL: Found ${paymentCount.rows[0].count} payment records, expected 1`);
            console.log('   ⚠️  DOUBLE PAYMENT VULNERABILITY!');
            return false;
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════
// TEST REL-009: WEBHOOK + POLLING COLLISION
// ═══════════════════════════════════════════════════════════════════
async function testWebhookPollingCollision() {
    console.log('\n🔬 TEST REL-009: Webhook + Polling Collision');
    console.log('═'.repeat(60));

    const db = getDb();

    try {
        // 1. Create order
        console.log('📝 Creating order...');
        const orderResponse = await fetch(`${BASE_URL}/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: 'Collision User',
                customerEmail: 'collision@test.com',
                customerPhone: '0777777777',
                items: [{
                    productCode: 'netflix_1m',
                    quantity: 1,
                    price: 70000
                }]
            })
        });

        const order = await orderResponse.json();
        if (!order.success) {
            console.log('❌ Setup failed');
            return false;
        }

        console.log(`✅ Order created: ${order.orderCode}`);

        // 2. Trigger webhook AND check-payment simultaneously
        console.log('\n⚡ Triggering webhook AND check-payment at SAME TIME...');

        const transactionId = `COL_TX_${Date.now()}`;
        const webhookPayload = {
            id: transactionId,
            transactionDate: new Date().toISOString(),
            amountIn: order.amount,
            content: `IBFT ${order.orderCode}`,
            referenceCode: `REF_${Date.now()}`
        };

        // Note: check-payment won't actually find this transaction in SePay since we're mocking
        // But it will attempt to fulfill if the transaction exists
        const webhookCall = fetch(`${BASE_URL}/webhook-sepay`, {
            method: 'POST',
            headers: {
                'Authorization': `Apikey ${SEPAY_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookPayload)
        });

        const checkPaymentCall = fetch(`${BASE_URL}/check-payment?orderCode=${order.orderCode}&amount=${order.amount}`);

        const [webhookRes, checkRes] = await Promise.all([webhookCall, checkPaymentCall]);
        const webhookData = await webhookRes.json();
        const checkData = await checkRes.json();

        console.log('   Webhook result:', webhookData);
        console.log('   Check-payment result:', checkData);

        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. Verify no duplicates
        const paymentCount = await db.execute({
            sql: 'SELECT COUNT(*) as count FROM payments WHERE order_id IN (SELECT id FROM orders WHERE order_code = ?)',
            args: [order.orderCode]
        });

        const deliveryCount = await db.execute({
            sql: 'SELECT COUNT(*) as count FROM deliveries WHERE order_id IN (SELECT id FROM orders WHERE order_code = ?)',
            args: [order.orderCode]
        });

        const orderStatus = await db.execute({
            sql: 'SELECT status FROM orders WHERE order_code = ?',
            args: [order.orderCode]
        });

        console.log(`\n📊 Results:`);
        console.log(`   Payment records: ${paymentCount.rows[0].count}`);
        console.log(`   Delivery records: ${deliveryCount.rows[0].count}`);
        console.log(`   Order status: ${orderStatus.rows[0]?.status}`);

        // 4. Verdict
        console.log('\n🎯 VERDICT:');
        if (paymentCount.rows[0].count === 1 && deliveryCount.rows[0].count >= 1) {
            console.log('   ✅ PASS: Single fulfillment despite concurrent webhook + polling');
            return true;
        } else {
            console.log(`   ❌ FAIL: Found ${paymentCount.rows[0].count} payments / ${deliveryCount.rows[0].count} deliveries`);
            console.log('   ⚠️  RACE CONDITION DETECTED!');
            return false;
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN RUNNER
// ═══════════════════════════════════════════════════════════════════
async function main() {
    const testName = process.argv[2] || 'all';

    console.log('\n' + '═'.repeat(60));
    console.log('🧪 TBQ HOMIE CRITICAL TEST SUITE');
    console.log('═'.repeat(60));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Database: ${TURSO_DATABASE_URL ? 'Connected' : 'Not configured'}`);
    console.log('═'.repeat(60));

    const results = {};

    if (testName === 'all' || testName === 'oversell') {
        results.oversell = await testOversellPrevention();
    }

    if (testName === 'all' || testName === 'webhook') {
        results.webhook = await testWebhookIndependence();
    }

    if (testName === 'all' || testName === 'double') {
        results.double = await testDoublePaymentPrevention();
    }

    if (testName === 'all' || testName === 'collision') {
        results.collision = await testWebhookPollingCollision();
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));

    Object.entries(results).forEach(([name, passed]) => {
        const emoji = passed ? '✅' : '❌';
        console.log(`${emoji} ${name.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    const allPassed = Object.values(results).every(r => r === true);
    const passCount = Object.values(results).filter(r => r === true).length;
    const totalCount = Object.values(results).length;

    console.log('═'.repeat(60));
    console.log(`Result: ${passCount}/${totalCount} tests passed`);

    if (allPassed) {
        console.log('🎉 ALL CRITICAL TESTS PASSED!');
        process.exit(0);
    } else {
        console.log('⚠️  SOME TESTS FAILED - REQUIRES ATTENTION');
        process.exit(1);
    }
}

main().catch(console.error);
