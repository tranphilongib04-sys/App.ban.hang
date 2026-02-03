#!/usr/bin/env node

/**
 * Generate Admin API Token for Web Admin
 *
 * Usage: node scripts/generate-admin-token.js
 */

const crypto = require('crypto');

function generateToken() {
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const token = `tbq_admin_${randomBytes}`;
    return token;
}

console.log('\n🔐 Admin API Token Generator\n');
console.log('Generated Token:');
console.log('─'.repeat(80));
console.log(generateToken());
console.log('─'.repeat(80));
console.log('\n📋 Next Steps:');
console.log('1. Copy the token above');
console.log('2. Go to Netlify Dashboard → Site settings → Environment variables');
console.log('3. Add: ADMIN_API_TOKEN = <paste token>');
console.log('4. Deploy site');
console.log('5. Use same token in Web Admin settings tab\n');
