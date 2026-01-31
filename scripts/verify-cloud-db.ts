
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function verifyCloudConnection() {
    console.log('🔍 Testing Cloud Database Connection...');

    const url = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;

    if (!url || !token) {
        console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env');
        process.exit(1);
    }

    console.log(`   URL: ${url}`);

    try {
        const client = createClient({
            url: url,
            authToken: token,
        });

        console.log('✅ Client created. Executing query...');

        const startTime = Date.now();
        const result = await client.execute('SELECT count(*) as count FROM customers');
        const duration = Date.now() - startTime;

        console.log(`✅ Query successful in ${duration}ms`);
        console.log('📊 Result:', result.rows);
        console.log('🎉 Cloud Database is REACHABLE and READY.');
        console.log('   Any change made on Vercel will be saved here immediately.');

    } catch (error: any) {
        console.error('❌ Connection failed:', error.message);
        process.exit(1);
    }
}

verifyCloudConnection();
