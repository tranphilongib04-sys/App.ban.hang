
import 'dotenv/config';
import { db } from '@/lib/db';
import { customers, subscriptions, warranties, inventoryItems, deliveries } from '@/lib/db/schema';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

async function exportBackup() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const destDir = path.join(os.homedir(), 'Desktop/Dữ lIệu lớn-TBQ/Backups');

        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        const filePath = path.join(destDir, `backup_${timestamp}.json`);

        console.log('Fetching data for backup...');
        const [cust, subs, warr, inv, del] = await Promise.all([
            db.select().from(customers),
            db.select().from(subscriptions),
            db.select().from(warranties),
            db.select().from(inventoryItems),
            db.select().from(deliveries)
        ]);

        const data = {
            timestamp: new Date().toISOString(),
            stats: {
                customers: cust.length,
                subscriptions: subs.length,
                warranties: warr.length,
                inventoryItems: inv.length,
                deliveries: del.length
            },
            data: {
                customers: cust,
                subscriptions: subs,
                warranties: warr,
                inventoryItems: inv,
                deliveries: del
            }
        };

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ Backup created successfully:`);
        console.log(`   📂 Path: ${filePath}`);
        console.log(`   📊 Customers: ${cust.length}, Subscriptions: ${subs.length}`);

    } catch (error) {
        console.error('❌ Backup failed:', error);
        // Don't exit 1, so App can still start even if backup fails backup?
        // User asked for backup to be sure. But blocking app start is annoying.
        // We log error.
    }
}

exportBackup();
