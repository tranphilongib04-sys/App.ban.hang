import 'dotenv/config';
import path from 'path';
import { existsSync } from 'fs';
import { createClient } from '@libsql/client';

console.log('--- Database Revenue & Sync Diagnostic ---');

const hasTursoCredentials = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

console.log(`TIME: ${new Date().toISOString()}`);

// Calculate "This Month" Range (Feb 2026 based on user context)
// User context says 2026-02-02.
const startOfMonth = '2026-02-01';
const endOfMonth = '2026-02-28'; // Simple approx
console.log(`Checking Revenue for Range: ${startOfMonth} to ${endOfMonth}`);

const revenueQuery = `
    SELECT 
        COUNT(*) as count, 
        SUM(revenue) as total_revenue,
        SUM(cost) as total_cost
    FROM subscriptions 
    WHERE start_date >= '${startOfMonth}' AND start_date <= '${endOfMonth}'
`;

async function checkLocal() {
    const dbPath = path.join(process.cwd(), 'data', 'tpb-manage.db');
    console.log(`\n[LOCAL DB] Path: ${dbPath}`);
    if (!existsSync(dbPath)) {
        console.log('❌ Local DB file not found.');
        return;
    }

    try {
        const client = createClient({ url: `file:${dbPath}` });
        const rs = await client.execute(revenueQuery);
        const row = rs.rows[0];
        console.log(`   Count: ${row.count}`);
        console.log(`   Revenue: ${row.total_revenue?.toLocaleString()} đ`);
        console.log(`   Cost: ${row.total_cost?.toLocaleString()} đ`);
    } catch (e: any) {
        console.error('   ❌ Check Failed:', e.message);
    }
}

async function checkCloud() {
    console.log(`\n[CLOUD DB] URL: ${process.env.TURSO_DATABASE_URL}`);
    if (!hasTursoCredentials) {
        console.log('❌ No credentials for Cloud.');
        return;
    }

    try {
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL!,
            authToken: process.env.TURSO_AUTH_TOKEN!,
        });
        const rs = await client.execute(revenueQuery);
        const row = rs.rows[0];
        console.log(`   Count: ${row.count}`);
        console.log(`   Revenue: ${row.total_revenue?.toLocaleString()} đ`);
        console.log(`   Cost: ${row.total_cost?.toLocaleString()} đ`);
    } catch (e: any) {
        console.error('   ❌ Check Failed:', e.message);
    }
}

async function run() {
    await checkLocal();
    await checkCloud();
}

run();
