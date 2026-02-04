#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load from parent directory env
require('dotenv').config({ path: path.join(__dirname, '../tbq-homie-deployment/.env') });

// Load bcryptjs from admin-web's node_modules
const bcrypt = require('bcryptjs');
const { createClient } = require('@libsql/client/web');

async function setup() {
    console.log('🔧 Setting up admin-web...\n');

    // 1. Generate secrets
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    const syncToken = crypto.randomBytes(32).toString('hex');

    console.log('✅ Generated AUTH_JWT_SECRET');
    console.log('✅ Generated DESKTOP_SYNC_TOKEN');

    // 2. Create admin-web/.env
    const envContent = `TURSO_DATABASE_URL=${process.env.TURSO_DATABASE_URL}
TURSO_AUTH_TOKEN=${process.env.TURSO_AUTH_TOKEN}
AUTH_JWT_SECRET=${jwtSecret}
DESKTOP_SYNC_TOKEN=${syncToken}
`;

    fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    console.log('✅ Created admin-web/.env\n');

    // 3. Create admin user
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const email = 'admin@homie.local';
    const password = 'admin123';
    const passwordHash = bcrypt.hashSync(password, 10);

    try {
        await client.execute({
            sql: "INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'ADMIN')",
            args: [email, passwordHash]
        });
        console.log(`✅ Created admin user:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}\n`);
    } catch (e) {
        if (e.message.includes('UNIQUE')) {
            console.log('ℹ️  Admin user already exists\n');
        } else {
            throw e;
        }
    }

    // 4. Update desktop .env with sync token
    const desktopEnvPath = path.join(__dirname, '../.env');
    let desktopEnv = '';
    if (fs.existsSync(desktopEnvPath)) {
        desktopEnv = fs.readFileSync(desktopEnvPath, 'utf8');
    }

    if (!desktopEnv.includes('DESKTOP_SYNC_TOKEN')) {
        desktopEnv += `\nDESKTOP_SYNC_TOKEN=${syncToken}\n`;
        fs.writeFileSync(desktopEnvPath, desktopEnv);
        console.log('✅ Added DESKTOP_SYNC_TOKEN to desktop .env\n');
    } else {
        console.log('ℹ️  DESKTOP_SYNC_TOKEN already in desktop .env\n');
    }

    console.log('🎉 Setup complete!\n');
    console.log('Next steps:');
    console.log('1. Deploy admin-web to Netlify');
    console.log('2. Login at /admin with credentials above');
    console.log('3. Test desktop sync with the shared token');
}

setup().catch(err => {
    console.error('❌ Setup failed:', err);
    process.exit(1);
});
