
import { db, initializeDatabase } from '../src/lib/db';
import { customers, subscriptions, inventoryItems, warranties, systemConfig } from '../src/lib/db/schema';
import { getWorkbook, FILES } from '../src/lib/excel/client';
import { eq } from 'drizzle-orm';

async function migrate() {
    console.log('Starting migration...');

    // Ensure DB tables exist
    initializeDatabase();

    // 1. Migrate Inventory
    console.log('Migrating Inventory...');
    const inventoryWorkbook = await getWorkbook(FILES.INVENTORY);
    const inventorySheet = inventoryWorkbook.getWorksheet('Kho');

    const inventoryMap = new Map<number, number>(); // Old ID -> New ID

    if (inventorySheet) {
        const rows: any[] = [];
        inventorySheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            // Excel cols: 1:ID, 2:Service, 3:Payload, 4:Status, 5:Date, 6:Cost, 7:Cat, 8:Dist, 9:Note
            const oldId = Number(row.getCell(1).value);
            rows.push({
                oldId,
                service: String(row.getCell(2).value || ''),
                secretPayload: String(row.getCell(3).value || ''),
                secretMasked: '***',
                status: String(row.getCell(4).value || 'available') as any,
                createdAt: String(row.getCell(5).value || new Date().toISOString()),
                cost: Number(row.getCell(6).value) || 0,
                category: String(row.getCell(7).value || '') || null,
                distribution: String(row.getCell(8).value || '') || null,
                note: String(row.getCell(9).value || '') || null,
            });
        });

        for (const row of rows) {
            try {
                const result = await db.insert(inventoryItems).values({
                    service: row.service,
                    secretPayload: row.secretPayload,
                    secretMasked: row.secretMasked,
                    status: row.status,
                    cost: row.cost,
                    category: row.category,
                    distribution: row.distribution,
                    note: row.note,
                    createdAt: row.createdAt
                }).returning({ id: inventoryItems.id });

                inventoryMap.set(row.oldId, result[0].id);
            } catch (e) {
                console.error(`Error inserting inventory ${row.oldId}:`, e);
            }
        }
    }

    // 2. Migrate Orders (Customers & Subscriptions)
    console.log('Migrating Orders...');
    const ordersWorkbook = await getWorkbook(FILES.ORDERS);
    const ordersSheet = ordersWorkbook.getWorksheet('DonHang');
    const statusSheet = ordersWorkbook.getWorksheet('TrangThai'); // Need status for renewal/payment

    const statusMap = new Map<number, any>();
    if (statusSheet) {
        statusSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const id = Number(row.getCell(1).value);
            statusMap.set(id, {
                renewalStatus: String(row.getCell(2).value || 'pending'),
                paymentStatus: String(row.getCell(3).value || 'unpaid'),
                contactCount: Number(row.getCell(4).value || 0),
                reminderDate: String(row.getCell(7).value || '') || null
            });
        });
    }

    const customerMap = new Map<string, number>(); // Name -> ID
    const subscriptionMap = new Map<number, number>(); // Old Sub ID -> New Sub ID

    if (ordersSheet) {
        ordersSheet.eachRow(async (row, rowNumber) => {
            if (rowNumber === 1) return;

            // Excel mapping based on saved file
            // 1: Source, 2: Customer, 3: Account, 4: Service, 5: Start, 6: End, 7: Dist, 8: Rev, 9: Cost
            // 11: Contact, 12: ID, 14: Note, 15: CustomerID (Validation)

            const oldId = Number(row.getCell(12).value);
            if (!oldId) return;

            const customerName = String(row.getCell(2).value || '').trim();
            if (!customerName) return;

            // Create/Get Customer
            let customerId = customerMap.get(customerName);
            if (!customerId) {
                // Check DB first to avoid duplicates
                const existing = await db.select().from(customers).where(eq(customers.name, customerName)).get();
                if (existing) {
                    customerId = existing.id;
                } else {
                    const newCust = await db.insert(customers).values({
                        name: customerName,
                        source: String(row.getCell(1).value || '') || null,
                        contact: String(row.getCell(11).value || '') || null,
                        note: '', // Notes are on subscription usually
                        createdAt: new Date().toISOString()
                    }).returning({ id: customers.id });
                    customerId = newCust[0].id;
                }
                customerMap.set(customerName, customerId!);
            }

            // Create Subscription
            const status = statusMap.get(oldId) || { renewalStatus: 'pending', paymentStatus: 'unpaid', contactCount: 0 };

            const note = String(row.getCell(14).value || '');
            const accountInfo = String(row.getCell(3).value || '');

            try {
                const newSub = await db.insert(subscriptions).values({
                    customerId: customerId,
                    service: String(row.getCell(4).value || ''),
                    startDate: String(row.getCell(5).value || ''),
                    endDate: String(row.getCell(6).value || ''),
                    distribution: String(row.getCell(7).value || '') || null,
                    revenue: Number(row.getCell(8).value) || 0,
                    cost: Number(row.getCell(9).value) || 0,
                    renewalStatus: status.renewalStatus as any,
                    paymentStatus: status.paymentStatus as any,
                    contactCount: status.contactCount,
                    reminderDate: status.reminderDate,
                    note: note || null,
                    accountInfo: accountInfo || null,
                    createdAt: new Date().toISOString()
                }).returning({ id: subscriptions.id });

                subscriptionMap.set(oldId, newSub[0].id);
            } catch (e) {
                console.error(`Error inserting subscription ${oldId}:`, e);
            }
        });
    }

    // 3. Migrate Warranties
    console.log('Migrating Warranties...');
    const warrantyWorkbook = await getWorkbook(FILES.WARRANTY);
    const warrantySheet = warrantyWorkbook.getWorksheet('BaoHanh');

    if (warrantySheet) {
        warrantySheet.eachRow(async (row, rowNumber) => {
            if (rowNumber === 1) return;

            const oldId = Number(row.getCell(1).value);
            const oldSubId = Number(row.getCell(2).value);

            const newSubId = subscriptionMap.get(oldSubId);
            if (!newSubId) {
                console.warn(`Skipping warranty ${oldId}: Subscription ${oldSubId} not found`);
                return;
            }

            // 1:ID, 2:SubID, 3:Name, 4:Service, 5:IssueDate, 6:Desc, 7:Status, 8:Resolved, 9:Cost, 10:Note
            try {
                await db.insert(warranties).values({
                    subscriptionId: newSubId,
                    issueDate: String(row.getCell(5).value || new Date().toISOString()),
                    issueDescription: String(row.getCell(6).value || '') || null,
                    warrantyStatus: String(row.getCell(7).value || 'pending') as any,
                    resolvedDate: String(row.getCell(8).value || '') || null,
                    cost: Number(row.getCell(9).value) || 0,
                    note: String(row.getCell(10).value || '') || null,
                    createdAt: new Date().toISOString()
                });
            } catch (e) {
                console.error(`Error inserting warranty ${oldId}:`, e);
            }
        });
    }

    console.log('Migration completed successfully!');
}

migrate().catch(console.error);
