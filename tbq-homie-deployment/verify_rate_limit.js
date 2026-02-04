const fetch = require('node-fetch');
const BASE_URL = process.env.BASE_URL || 'https://tbq-homie-1770017860.netlify.app/.netlify/functions';

async function run() {
    console.log('Testing Rate Limit...');

    const body = JSON.stringify({
        customerName: 'Rate Test',
        customerEmail: 'rate@test.com',
        customerPhone: '123',
        productCode: 'dummy',
        price: 100
    });

    for (let i = 1; i <= 7; i++) {
        try {
            const res = await fetch(`${BASE_URL}/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });
            // Result doesn't matter much (400, 404, 200), we care about 429
            console.log(`Request ${i}: Status ${res.status}`);

            if (i > 5 && res.status === 429) {
                console.log('✅ PASSED: Got 429 on request', i);
            }
            if (i <= 5 && res.status === 429) {
                console.log('❌ FAILED: Premature 429 on request', i);
            }
        } catch (e) {
            console.log('Error:', e.message);
        }
    }
}
run();
