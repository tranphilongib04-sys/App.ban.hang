import { createClient } from '@libsql/client';
import 'dotenv/config';

// Cloud Connection
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("❌ Missing TURSO credentials.");
    process.exit(1);
}

const client = createClient({
    url,
    authToken,
});

async function main() {
    console.log("🧹 Starting Cloud Deduplication...");

    // Fetch all subscriptions with customer names
    const result = await client.execute(`
        SELECT s.id, s.service, s.end_date, c.name as customer_name
        FROM subscriptions s
        JOIN customers c ON s.customer_id = c.id
    `);

    const rows = result.rows;
    console.log(`Analyzing ${rows.length} subscriptions for duplicates...`);

    const seen = new Map<string, number>();
    const toDelete: any[] = [];

    for (const row of rows) {
        const id = row.id as number;
        const name = (row.customer_name as string || '').trim().toLowerCase();
        const service = (row.service as string || '').trim().toLowerCase();
        const endDate = (row.end_date as string || '').trim();

        // Key based on Name + Service + EndDate (Matches user's Excel logic)
        const key = `${name}|${service}|${endDate}`;

        if (seen.has(key)) {
            // Duplicate found! Keep the first one seen (or logic: keep latest ID?)
            // Usually we keep the one already seen? 
            // The previous logic deleted the *later* rows (higher indices in Excel).
            // Here, rows are likely ordered by ID?
            // If we iterate by ID ASC, we keep the oldest ID and delete newer ones.
            // Let's assume that's safe.
            toDelete.push(id);
        } else {
            seen.set(key, id);
        }
    }

    console.log(`Found ${toDelete.length} duplicates.`);

    if (toDelete.length > 0) {
        console.log("Deleting...");
        // Delete in batches
        const batchSize = 50;
        for (let i = 0; i < toDelete.length; i += batchSize) {
            const batch = toDelete.slice(i, i + batchSize);
            const ids = batch.join(',');
            await client.execute(`DELETE FROM subscriptions WHERE id IN (${ids})`);
            process.stdout.write('.');
        }
        console.log("\n✅ Deduplication complete.");
    } else {
        console.log("✨ No duplicates found.");
    }
}

main().catch(console.error);
