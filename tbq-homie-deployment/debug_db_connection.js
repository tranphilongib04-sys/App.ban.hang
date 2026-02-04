require('dotenv').config();
const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('Testing DB Connection...');
console.log('URL:', url);
console.log('Token Length:', authToken ? authToken.length : 0);

const client = createClient({
    url: url,
    authToken: authToken,
});

async function run() {
    try {
        const res = await client.execute('SELECT 1 as result');
        console.log('✅ Connection Successful!');
        console.log('Result:', res);
    } catch (e) {
        console.log('❌ Connection Failed:', e.message);
    }
}
run();
