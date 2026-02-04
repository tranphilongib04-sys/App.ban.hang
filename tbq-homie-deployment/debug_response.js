const fetch = require('node-fetch');
const BASE_URL = 'https://tbq-homie-1770017860.netlify.app/.netlify/functions';

async function run() {
    console.log('Debugging API Response...');
    const body = JSON.stringify({
        customerName: 'Debug Test',
        customerEmail: 'debug@test.com',
        customerPhone: '000',
        items: [{ productCode: 'netflix_1m', quantity: 1, price: 1000 }]
    });

    try {
        const res = await fetch(`${BASE_URL}/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
        });
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Raw Response:', text);
    } catch (e) {
        console.log('Error:', e.message);
    }
}
run();
