import 'dotenv/config';
import path from 'path';
import { existsSync } from 'fs';
import { createClient } from '@libsql/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';

console.log('--- Database Revenue & Sync Diagnostic ---');

const hasTursoCredentials = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

console.log(`TIME: ${new Date().toISOString()}`);

// Calculate "This Month" Range dynamically
const now = new Date();
const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

console.log(`Checking Revenue for Range: ${startDate} to ${endDate}`);

const revenueQuery = `
    SELECT 
        COUNT(*) as count, 
        SUM(revenue) as total_revenue,
        SUM(cost) as total_cost
    FROM subscriptions 
    WHERE start_date >= '${startDate}' AND start_date <= '${endDate}'
`;

interface RevenueResult {
    count: number;
    total_revenue: number;
    total_cost: number;
}

async function checkLocal(): Promise<RevenueResult | null> {
    const dbPath = path.join(process.cwd(), 'data', 'tpb-manage.db');
    console.log(`\n[LOCAL DB] Path: ${dbPath}`);
    if (!existsSync(dbPath)) {
        console.log('❌ Local DB file not found.');
        return null;
    }

    try {
        const client = createClient({ url: `file:${dbPath}` });
        const rs = await client.execute(revenueQuery);
        const row = rs.rows[0];

        const result: RevenueResult = {
            count: Number(row.count),
            total_revenue: Number(row.total_revenue) || 0,
            total_cost: Number(row.total_cost) || 0,
        };

        console.log(`   Count: ${result.count}`);
        console.log(`   Revenue: ${result.total_revenue.toLocaleString()} đ`);
        console.log(`   Cost: ${result.total_cost.toLocaleString()} đ`);
        return result;
    } catch (e: any) {
        console.error('   ❌ Check Failed:', e.message);
        return null;
    }
}

async function checkCloud(): Promise<RevenueResult | null> {
    console.log(`\n[CLOUD DB] URL: ${process.env.TURSO_DATABASE_URL}`);
    if (!hasTursoCredentials) {
        console.log('❌ No credentials for Cloud.');
        return null;
    }

    try {
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL!,
            authToken: process.env.TURSO_AUTH_TOKEN!,
        });
        const rs = await client.execute(revenueQuery);
        const row = rs.rows[0];

        const result: RevenueResult = {
            count: Number(row.count),
            total_revenue: Number(row.total_revenue) || 0,
            total_cost: Number(row.total_cost) || 0,
        };

        console.log(`   Count: ${result.count}`);
        console.log(`   Revenue: ${result.total_revenue.toLocaleString()} đ`);
        console.log(`   Cost: ${result.total_cost.toLocaleString()} đ`);
        return result;
    } catch (e: any) {
        console.error('   ❌ Check Failed:', e.message);
        return null;
    }
}

async function run() {
    const local = await checkLocal();
    const cloud = await checkCloud();

    if (local && cloud) {
        console.log('\n--- SYNC STATUS ---');
        const countDiff = local.count - cloud.count;
        const revDiff = local.total_revenue - cloud.total_revenue;

        if (countDiff === 0 && revDiff === 0) {
            console.log('✅ DATASBASES ARE IN SYNC');
        } else {
            console.log('⚠️ DATABASES OUT OF SYNC');
            if (countDiff !== 0) console.log(`   Count Difference: ${countDiff > 0 ? '+' : ''}${countDiff} (Local - Cloud)`);
            if (revDiff !== 0) console.log(`   Revenue Difference: ${revDiff > 0 ? '+' : ''}${revDiff.toLocaleString()} đ (Local - Cloud)`);
        }
    }
}

run();
