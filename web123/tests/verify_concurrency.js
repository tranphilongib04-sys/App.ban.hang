const fetch = require('node-fetch');
const BASE_URL = process.env.BASE_URL || 'http://localhost:9999/.netlify/functions';

async function run() {
    console.log('Testing Concurrency (Race Condition)...');

    // 1. Setup: Pick a product and maybe we should assume one exists or use a dummy one.
    // Ideally we'd reset stock here but we don't have a reset API. 
    // We'll rely on the fact that if we spam 5 requests, and only have X stock, Y should fail.
    // For this test, we'll try to buy 'netflix_1m' which likely has stock. 
    // A true test requires setting stock to 1. Since we can't easily do that without an admin API, 
    // we will rely on the "RESERVE" logic locking rows. 
    // Actually, we can check stock first.

    const productCode = 'netflix_1m';
    const payload = JSON.stringify({
        customerName: 'Race User',
        customerEmail: 'race@test.com',
        customerPhone: '111222333',
        productCode,
        price: 70000
    });

    console.log('Spamming 10 simultaneous requests...');
    const requests = [];
    for (let i = 0; i < 10; i++) {
        requests.push(fetch(`${BASE_URL}/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
        }).then(r => r.json()).then(d => ({ index: i, ...d })));
    }

    const results = await Promise.all(requests);

    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);

    console.log(`Total Requests: 10`);
    console.log(`Successes: ${successes.length}`);
    console.log(`Failures: ${failures.length}`);

    // If we have infinite stock, this proves transaction isolation (no DB locks errors).
    // If we had 1 stock, we'd see 1 success.
    // For now, seeing NO internal server errors (500) and atomic responses is key.

    const concurrencyErrors = failures.filter(f => f.error && f.error.includes('RESERVE_FAILED'));
    const stockErrors = failures.filter(f => f.error === 'INSUFFICIENT_STOCK');

    if (concurrencyErrors.length > 0) console.log('⚠️  Concurrency locks hit (Expected under high load if rows locked)');
    if (stockErrors.length > 0) console.log('ℹ️  Stock limits hit');

    // Check for duplicate Order Codes? Unlikely with timestamp+random, but good to check uniqueness if we could.
}
run();
