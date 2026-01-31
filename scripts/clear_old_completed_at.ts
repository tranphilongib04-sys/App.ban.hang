/**
 * Script: Clear completedAt for old orders
 * Only NEW orders should have completedAt set going forward
 */

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function clearOldCompletedAt() {
    console.log('🔄 Clearing completedAt for orders created before today...');

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    console.log(`Today: ${todayStr}`);

    try {
        // Clear completedAt for orders NOT created today
        // This ensures only orders processed TODAY will show in "Hoàn tất hôm nay"
        const result = await db.run(sql`
            UPDATE subscriptions 
            SET completed_at = NULL
            WHERE start_date < ${todayStr}
        `);

        console.log('✅ Cleared completedAt for old orders');
        console.log(`   Affected rows: ${result.rowsAffected || 'unknown'}`);

    } catch (error: any) {
        console.error('❌ Error:', error);
        process.exit(1);
    }

    console.log('🎉 Done!');
    process.exit(0);
}

clearOldCompletedAt();
