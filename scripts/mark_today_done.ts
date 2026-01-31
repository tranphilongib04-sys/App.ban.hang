/**
 * Script to mark all subscriptions due today as "renewed"
 * This will hide them from "Cần xử lý" view
 * 
 * Run with: npx tsx scripts/mark_today_done.ts
 */

import { db } from '../src/lib/db';
import { subscriptions } from '../src/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

async function markTodayAsDone() {
    // Get today's date boundaries (use local timezone)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStart = `${year}-${month}-${day}`;
    const todayEnd = todayStart + 'T23:59:59';

    console.log(`📅 Tìm subscriptions hết hạn hôm nay (${todayStart})...`);

    // Find all subscriptions ending today that are not yet renewed
    const todaySubs = await db.select()
        .from(subscriptions)
        .where(
            and(
                gte(subscriptions.endDate, todayStart),
                lte(subscriptions.endDate, todayEnd + '.999Z'),
                eq(subscriptions.renewalStatus, 'pending')
            )
        );

    console.log(`\n🔍 Tìm thấy ${todaySubs.length} subscriptions cần xử lý:\n`);

    if (todaySubs.length === 0) {
        console.log('✅ Không có subscriptions nào cần đánh dấu!');
        return;
    }

    // Show what will be updated
    for (const sub of todaySubs) {
        console.log(`  - ID ${sub.id}: ${sub.service} (endDate: ${sub.endDate})`);
    }

    // Update all to renewed + paid
    console.log(`\n⏳ Đang đánh dấu ${todaySubs.length} subscriptions thành "renewed + paid"...`);

    let updatedCount = 0;
    for (const sub of todaySubs) {
        await db.update(subscriptions)
            .set({
                renewalStatus: 'renewed',
                paymentStatus: 'paid',
                contactCount: 1, // Mark as contacted
            })
            .where(eq(subscriptions.id, sub.id));
        updatedCount++;
    }

    console.log(`\n✅ Đã đánh dấu hoàn thành ${updatedCount} subscriptions!`);
    console.log('🎉 Refresh trang để xem kết quả.');
}

markTodayAsDone()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Lỗi:', err);
        process.exit(1);
    });
