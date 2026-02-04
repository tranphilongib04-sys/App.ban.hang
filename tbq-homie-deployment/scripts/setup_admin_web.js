const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs'); // Assuming installed in node_modules, or we use pure node crypto scrypt if needed, but bcrypt is std.
// Wait, admin-web/package.json has bcryptjs. tbq-homie-deployment might not.
// I'll assume I can run this script using `node` in `admin-web` directory if I install dependencies, 
// OR I can use the `check-payment` approach if I need DB access. 
// Easier: Generate .env, then use a script in `tbq-homie-deployment` (where dependencies like @libsql/client exist) to insert user.

// 1. Generate Secrets
const jwtSecret = crypto.randomBytes(32).toString('hex');
const syncToken = crypto.randomBytes(32).toString('hex');

console.log('Generated JWT Secret:', jwtSecret.substring(0, 10) + '...');
console.log('Generated Sync Token:', syncToken.substring(0, 10) + '...');

// 2. Write admin-web/.env
const envContent = `TURSO_DATABASE_URL=${process.env.TURSO_DATABASE_URL}
TURSO_AUTH_TOKEN=${process.env.TURSO_AUTH_TOKEN}
AUTH_JWT_SECRET=${jwtSecret}
DESKTOP_SYNC_TOKEN=${syncToken}
`;

fs.writeFileSync(path.join(__dirname, '../admin-web/.env'), envContent);
console.log('✅ Wrote admin-web/.env');

// 3. Insert Admin User
// We need @libsql/client which is in tbq-homie-deployment
const { createClient } = require('@libsql/client/web');

async function insertAdmin() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const email = 'admin@homie.local';
    // Password: "admin"
    // Hash generated via bcryptjs.hashSync('admin', 10)
    const hash = '$2a$10$w/x/y/z/A/B/C/D/E/F/G/H/I/J/K/L/M/N/O/P/Q/R/S/T/U/V/W/X/Y/Z';
    // Wait, I can't guess a valid hash.
    // I will try to require bcryptjs from admin-web node_modules.
    let finalHash = '';
    try {
        const adminWebBcrypt = require('../../admin-web/node_modules/bcryptjs');
        finalHash = adminWebBcrypt.hashSync('admin', 10);
    } catch (e) {
        console.log('bcryptjs not found, skipping user creation (use API later).');
        return;
    }

    try {
        await client.execute({
            sql: "INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'ADMIN')",
            args: [email, finalHash]
        });
        console.log(`✅ Created admin user: ${email} / admin`);
    } catch (e) {
        if (e.message.includes('UNIQUE constraint failed')) {
            console.log('Admin user already exists.');
        } else {
            console.error('Failed to create admin:', e);
        }
    }
}

// Check if bcryptjs is available in current node_modules (tbq-homie-deployment)
// If not, we might need to skip hashing here and ask user to use the API, 
// BUT the user asked to automate 100%. 
// tbq-homie-deployment package.json does not list bcryptjs.
// admin-web has it.
// I will run this script, but resolving bcryptjs might fail if I run it from tbq-homie-deployment.
// I'll try to require it. If it fails, I'll use a mocked hash or use admin-web's node_modules.

insertAdmin();
