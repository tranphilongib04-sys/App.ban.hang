/**
 * Test script để verify inventory sync hoạt động
 * 
 * Usage: npx tsx scripts/test-inventory-sync.ts
 */

import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';
import { createInventoryItem, getInventoryItems } from '../src/lib/db/queries';
import { triggerSync, initSyncTables } from '../src/lib/sync/loop';

// Use direct client for testing to avoid top-level await issues
function getClient() {
    const localDbPath = path.join(process.cwd(), 'data', 'tpb-manage.db');
    return new Database(localDbPath);
}

async function testInventorySync() {
    console.log('🧪 Testing Inventory Sync...\n');

    try {
        // 1. Initialize database and sync tables
        console.log('1️⃣ Initializing database...');
        await initializeDatabase();
        await initSyncTables();
        console.log('✅ Database initialized\n');

        // 2. Check current inventory count
        console.log('2️⃣ Checking current inventory...');
        const beforeItems = await getInventoryItems({});
        const beforeCount = beforeItems.length;
        console.log(`   Current inventory items: ${beforeCount}\n`);

        // 3. Create a test inventory item
        console.log('3️⃣ Creating test inventory item...');
        const testItem = await createInventoryItem({
            service: 'TestService',
            secretPayload: `test_account_${Date.now()}@test.com|test_password_123`,
            cost: 100000,
            distribution: 'Test Distribution',
            note: 'Test item for sync verification'
        });
        console.log(`✅ Created inventory item with ID: ${testItem.id}`);
        console.log(`   Service: ${testItem.service}`);
        console.log(`   Status: ${testItem.status}\n`);

        // 4. Check if item was enqueued for sync
        console.log('4️⃣ Checking sync queue...');
        const queueCheck = await client.execute(
            'SELECT * FROM local_pending_sync WHERE entity_type = ? AND entity_id = ?',
            ['inventory', testItem.id]
        );
        const queuedItems = queueCheck.rows;
        
        if (queuedItems.length > 0) {
            console.log(`✅ Item is in sync queue!`);
            console.log(`   Queue entry: ${JSON.stringify(queuedItems[0], null, 2)}\n`);
        } else {
            console.log('❌ Item NOT found in sync queue - this is a problem!\n');
            return;
        }

        // 5. Check total pending sync items
        const allPending = await client.execute('SELECT COUNT(*) as count FROM local_pending_sync');
        const pendingCount = (allPending.rows[0] as any)?.count || 0;
        console.log(`   Total pending sync items: ${pendingCount}\n`);

        // 6. Trigger sync manually
        console.log('5️⃣ Triggering sync...');
        console.log('   (This will push to web if DESKTOP_SYNC_TOKEN is configured)');
        const syncResult = await triggerSync();
        console.log(`   Sync result:`);
        console.log(`   - Pulled 2-way: ${syncResult.pulled2Way}`);
        console.log(`   - Pulled readonly: ${syncResult.pulledReadonly}`);
        console.log(`   - Pushed: ${syncResult.pushed}\n`);

        // 7. Check if item was removed from queue (successfully pushed)
        console.log('6️⃣ Verifying sync completion...');
        const afterQueueCheck = await client.execute(
            'SELECT * FROM local_pending_sync WHERE entity_type = ? AND entity_id = ?',
            ['inventory', testItem.id]
        );
        
        if (afterQueueCheck.rows.length === 0 && syncResult.pushed > 0) {
            console.log('✅ Item was successfully pushed and removed from queue!\n');
        } else if (afterQueueCheck.rows.length > 0) {
            console.log('⚠️  Item still in queue - sync may have failed or token not configured');
            console.log('   Check DESKTOP_SYNC_TOKEN environment variable\n');
        }

        // 8. Verify inventory count increased
        const afterItems = await getInventoryItems({});
        const afterCount = afterItems.length;
        console.log(`7️⃣ Final inventory count: ${afterCount} (was ${beforeCount})`);
        if (afterCount > beforeCount) {
            console.log('✅ Inventory count increased - item created successfully!\n');
        }

        // 9. Summary
        console.log('📊 Test Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Database initialized`);
        console.log(`✅ Test item created (ID: ${testItem.id})`);
        console.log(`✅ Item enqueued for sync`);
        console.log(`${syncResult.pushed > 0 ? '✅' : '⚠️ '} Sync triggered (pushed: ${syncResult.pushed})`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (syncResult.pushed === 0) {
            console.log('💡 Note: If sync didn\'t push, check:');
            console.log('   1. DESKTOP_SYNC_TOKEN is set in .env');
            console.log('   2. ADMIN_WEB_URL is correct');
            console.log('   3. Network connection to admin web\n');
        }

        // Cleanup: Optionally delete test item
        console.log('🧹 Cleanup: Test item remains in database for manual verification.');
        console.log(`   To delete: DELETE FROM inventory_items WHERE id = ${testItem.id}\n`);

    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run test
testInventorySync()
    .then(() => {
        console.log('✅ Test completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test error:', error);
        process.exit(1);
    });
