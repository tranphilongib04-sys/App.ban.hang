/**
 * Script to mark ALL pending subscriptions as "renewed + paid"
 * This will clear out all tabs: Cần nhắc, Đã liên hệ, Chờ thanh toán
 * 
 * Run with: npx tsx scripts/clear_all_pending.ts
 */

import { db } from '../src/lib/db';
import { subscriptions } from '../src/lib/db/schema';
import { eq, or, ne } from 'drizzle-orm';

async function clearAllPending() {
    console.log('🔍 Tìm tất cả subscriptions chưa hoàn thành...\n');

    // Find all subscriptions that are NOT renewed or have unpaid status
    const pendingSubs = await db.select()
        .from(subscriptions)
        .where(
            or(
                ne(subscriptions.renewalStatus, 'renewed'),
                eq(subscriptions.paymentStatus, 'unpaid')
            )
        );

    // Filter to only include items that need updating (not already renewed+paid)
    const needsUpdate = pendingSubs.filter(s =>
        s.renewalStatus !== 'renewed' || s.paymentStatus !== 'paid'
    );

    console.log(`📊 Tìm thấy ${needsUpdate.length} subscriptions cần đánh dấu hoàn thành:\n`);

    if (needsUpdate.length === 0) {
        console.log('✅ Không có subscriptions nào cần xử lý!');
        return;
    }

    // Group by status for display
    const byStatus = {
        pending: needsUpdate.filter(s => s.renewalStatus === 'pending'),
        unpaid: needsUpdate.filter(s => s.paymentStatus === 'unpaid'),
    };

    console.log(`  - Chưa gia hạn (pending): ${byStatus.pending.length}`);
    console.log(`  - Chưa thanh toán (unpaid): ${byStatus.unpaid.length}`);

    // Show first 10 items
    console.log('\n📝 Một vài ví dụ:');
    for (const sub of needsUpdate.slice(0, 10)) {
        console.log(`  - ID ${sub.id}: ${sub.service} | renewal: ${sub.renewalStatus} | payment: ${sub.paymentStatus}`);
    }
    if (needsUpdate.length > 10) {
        console.log(`  ... và ${needsUpdate.length - 10} items khác`);
    }

    // Update all to renewed + paid
    console.log(`\n⏳ Đang đánh dấu ${needsUpdate.length} subscriptions thành "renewed + paid"...`);

    let updatedCount = 0;
    for (const sub of needsUpdate) {
        await db.update(subscriptions)
            .set({
                renewalStatus: 'renewed',
                paymentStatus: 'paid',
            })
            .where(eq(subscriptions.id, sub.id));
        updatedCount++;

        // Progress indicator
        if (updatedCount % 10 === 0) {
            process.stdout.write(`\r  Đã xử lý: ${updatedCount}/${needsUpdate.length}`);
        }
    }

    console.log(`\n\n✅ Đã đánh dấu hoàn thành ${updatedCount} subscriptions!`);
    console.log('🎉 Refresh trang để xem kết quả - tất cả các tab sẽ về 0.');
}

clearAllPending()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Lỗi:', err);
        process.exit(1);
    });
