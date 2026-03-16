const crypto = require('crypto');

const args = process.argv.slice(2);
const command = args[0];

if (command === 'generate-secret') {
    const secret = crypto.randomBytes(32).toString('hex');
    console.log('\n✅ Generated DELIVERY_SECRET:');
    console.log(secret);
    console.log('\nCopy this to your .env file and Netlify Dashboard.\n');
} else {
    console.log('Usage: node scripts/setup-helper.js generate-secret');
}
