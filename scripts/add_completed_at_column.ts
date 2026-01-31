/**
 * Migration script: Add completedAt column to subscriptions table
 * Run this script to update existing database schema
 */

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('🔄 Adding completedAt column to subscriptions table...');

    try {
        // Add the new column (SQLite)
        await db.run(sql`ALTER TABLE subscriptions ADD COLUMN completed_at TEXT`);
        console.log('✅ Column added successfully!');

        // Optional: Backfill existing completed orders
        // Set completedAt for orders that are already paid AND renewed
        const todayStr = new Date().toISOString();
        await db.run(sql`
            UPDATE subscriptions 
            SET completed_at = ${todayStr}
            WHERE payment_status = 'paid' 
            AND renewal_status = 'renewed'
            AND completed_at IS NULL
        `);
        console.log('✅ Backfilled existing completed orders');

    } catch (error: any) {
        if (error.message?.includes('duplicate column name')) {
            console.log('ℹ️ Column already exists, skipping...');
        } else {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        }
    }

    console.log('🎉 Migration completed!');
    process.exit(0);
}

migrate();
