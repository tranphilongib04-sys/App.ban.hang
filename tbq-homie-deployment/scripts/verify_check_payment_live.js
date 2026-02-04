const fetch = require('node-fetch');

const BASE_URL = 'https://tbq-homie-1770017860.netlify.app';
const ORDER_CODE = 'TBQ88176676';
const AMOUNT = 2000;

async function run() {
    const url = `${BASE_URL}/.netlify/functions/check-payment?orderCode=${ORDER_CODE}&amount=${AMOUNT}`;
    console.log(`Fetching: ${url}`);

    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status} ${res.statusText}`);

        try {
            const text = await res.text();
            console.log('Body:', text.substring(0, 1000));
        } catch (e) {
            console.log('Could not read body:', e.message);
        }
    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

run();
