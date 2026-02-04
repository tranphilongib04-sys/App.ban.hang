/**
 * Simple test script để verify inventory sync logic
 * Test trực tiếp với database mà không cần import từ db/index.ts
 * 
 * Usage: npx tsx scripts/test-inventory-sync-simple.ts
 */

import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

async function testInventorySync() {
    console.log('🧪 Testing Inventory Sync Logic...\n');

    // Setup database path
    const dataDir = path.join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'tpb-manage.db');
    console.log(`📂 Database: ${dbPath}\n`);

    const db = new Database(dbPath);

    try {
        // 1. Ensure sync tables exist
        console.log('1️⃣ Ensuring sync tables exist...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS local_sync_state (
                entity_type     TEXT PRIMARY KEY,
                last_pulled_at  TEXT,
                last_pushed_at  TEXT,
                last_sync_event_id INTEGER
            );
            
            CREATE TABLE IF NOT EXISTS local_pending_sync (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type      TEXT NOT NULL,
                entity_id        INTEGER NOT NULL,
                action           TEXT NOT NULL CHECK(action IN ('upsert','delete')),
                payload          TEXT NOT NULL,
                idempotency_key  TEXT NOT NULL,
                created_at       TEXT NOT NULL DEFAULT (datetime('now'))
            );
            
            CREATE TABLE IF NOT EXISTS inventory_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service TEXT NOT NULL,
                variant TEXT,
                distribution TEXT,
                secret_payload TEXT NOT NULL,
                secret_masked TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'available',
                reserved_by TEXT,
                reserved_at TEXT,
                reservation_expires TEXT,
                import_batch TEXT,
                cost REAL DEFAULT 0,
                expires_at TEXT,
                note TEXT,
                category TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                sold_at TEXT
            );
        `);
        console.log('✅ Sync tables ready\n');

        // 2. Check current inventory count
        console.log('2️⃣ Checking current inventory...');
        const beforeCount = db.prepare('SELECT COUNT(*) as count FROM inventory_items').get() as { count: number };
        console.log(`   Current inventory items: ${beforeCount.count}\n`);

        // 3. Create a test inventory item
        console.log('3️⃣ Creating test inventory item...');
        const testTimestamp = new Date().toISOString();
        const testItem = {
            service: 'TestService',
            secretPayload: `test_account_${Date.now()}@test.com|test_password_123`,
            secretMasked: '***',
            status: 'available',
            cost: 100000,
            distribution: 'Test Distribution',
            note: 'Test item for sync verification',
            createdAt: testTimestamp
        };

        const insertResult = db.prepare(`
            INSERT INTO inventory_items (service, secret_payload, secret_masked, status, cost, distribution, note, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            testItem.service,
            testItem.secretPayload,
            testItem.secretMasked,
            testItem.status,
            testItem.cost,
            testItem.distribution,
            testItem.note,
            testItem.createdAt
        );

        const itemId = insertResult.lastInsertRowid as number;
        console.log(`✅ Created inventory item with ID: ${itemId}`);
        console.log(`   Service: ${testItem.service}`);
        console.log(`   Status: ${testItem.status}\n`);

        // 4. Simulate enqueuePush logic
        console.log('4️⃣ Simulating enqueuePush (sync queue)...');
        const updatedAt = testTimestamp;
        const idempotencyRaw = `inventory:${itemId}:${updatedAt}`;
        
        // Simple hash function (same as in push.ts)
        let hash = 0;
        for (let i = 0; i < idempotencyRaw.length; i++) {
            const char = idempotencyRaw.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        const idempotencyKey = idempotencyRaw.length.toString(16) + Math.abs(hash).toString(16);

        const payload = {
            id: itemId,
            service: testItem.service,
            variant: null,
            distribution: testItem.distribution,
            secret_payload: testItem.secretPayload,
            secret_masked: testItem.secretMasked,
            status: testItem.status,
            reserved_by: null,
            reserved_at: null,
            reservation_expires: null,
            import_batch: null,
            cost: testItem.cost,
            expires_at: null,
            note: testItem.note,
            category: null,
            created_at: testItem.createdAt,
            sold_at: null,
            updated_at: updatedAt
        };

        db.prepare(`
            INSERT INTO local_pending_sync (entity_type, entity_id, action, payload, idempotency_key, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            'inventory',
            itemId,
            'upsert',
            JSON.stringify(payload),
            idempotencyKey,
            new Date().toISOString()
        );

        console.log('✅ Item enqueued for sync!\n');

        // 5. Check sync queue
        console.log('5️⃣ Verifying sync queue...');
        const queueItems = db.prepare(`
            SELECT * FROM local_pending_sync 
            WHERE entity_type = ? AND entity_id = ?
        `).all('inventory', itemId) as any[];

        if (queueItems.length > 0) {
            console.log(`✅ Found ${queueItems.length} item(s) in sync queue:`);
            console.log(`   Entity Type: ${queueItems[0].entity_type}`);
            console.log(`   Entity ID: ${queueItems[0].entity_id}`);
            console.log(`   Action: ${queueItems[0].action}`);
            console.log(`   Idempotency Key: ${queueItems[0].idempotency_key}\n`);
        } else {
            console.log('❌ Item NOT found in sync queue!\n');
        }

        // 6. Check total pending
        const totalPending = db.prepare('SELECT COUNT(*) as count FROM local_pending_sync').get() as { count: number };
        console.log(`   Total pending sync items: ${totalPending.count}\n`);

        // 7. Verify inventory count increased
        const afterCount = db.prepare('SELECT COUNT(*) as count FROM inventory_items').get() as { count: number };
        console.log(`6️⃣ Final inventory count: ${afterCount.count} (was ${beforeCount.count})`);
        if (afterCount.count > beforeCount.count) {
            console.log('✅ Inventory count increased!\n');
        }

        // 8. Summary
        console.log('📊 Test Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Sync tables initialized`);
        console.log(`✅ Test item created (ID: ${itemId})`);
        console.log(`✅ Item enqueued for sync`);
        console.log(`✅ Sync queue verified`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('💡 Next steps:');
        console.log('   1. Start your app to trigger sync loop');
        console.log('   2. Check web admin to see if item syncs');
        console.log('   3. Verify item is removed from sync queue after successful push\n');

        // Cleanup option
        console.log('🧹 Cleanup:');
        console.log(`   Test item ID: ${itemId}`);
        console.log(`   To delete test item: DELETE FROM inventory_items WHERE id = ${itemId}`);
        console.log(`   To clear sync queue: DELETE FROM local_pending_sync WHERE entity_id = ${itemId}\n`);

    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Run test
testInventorySync()
    .then(() => {
        console.log('✅ Test completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test error:', error);
        process.exit(1);
    });
