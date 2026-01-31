
import { db } from '@/lib/db';
import { customers, subscriptions, inventoryItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import path from 'path';
import os from 'os';
import * as fs from 'fs';

const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const DATA_FOLDER = path.join(DESKTOP_PATH, 'Dữ lIệu lớn-TBQ');
const BACKUP_FILE = path.join(DATA_FOLDER, 'full_orders_backup.json');

// Interface for Backup Structure (based on backup_full.ts)
interface BackupOrder {
    id: number;
    source: string;
    customer: string; // Name
    account: string;  // Likely Account Info / Contact? Check usage. Usually Account Info in column 3.
    service: string;
    start: string;
    end: string;
    dist: string;
    rev: number;
    cost: number;
    profit: number;
    contact: string; // Contact Info (Phone/Email)
    status: {
        renewalStatus: string;
        paymentStatus: string;
        contactCount: number;
        lastUpdated: string;
        matchKey: string;
    };
}

async function restore() {
    if (!fs.existsSync(BACKUP_FILE)) {
        console.error('Backup file not found at:', BACKUP_FILE);
        return;
    }

    const rawData = fs.readFileSync(BACKUP_FILE, 'utf-8');
    const orders: BackupOrder[] = JSON.parse(rawData);

    console.log(`Found ${orders.length} orders to restore.`);

    let successCount = 0;
    let failCount = 0;

    // Cache existing Customers to avoid too many DB calls
    const existingCustomersMap = new Map<string, number>(); // Key: 'Name|Source' -> ID

    const allCustomers = await db.select().from(customers);
    for (const c of allCustomers) {
        existingCustomersMap.set(`${c.name.trim().toLowerCase()}|${(c.source || '').trim().toLowerCase()}`, c.id);
    }

    for (const order of orders) {
        try {
            // 1. Resolve Customer
            const safeTrim = (val: any) => String(val || '').trim();

            const customerName = safeTrim(order.customer || 'Unknown');
            const customerSource = safeTrim(order.source);
            const customerContact = safeTrim(order.contact); // From col 11 (Contact)

            const customerKey = `${customerName.toLowerCase()}|${customerSource.toLowerCase()}`;
            let customerId = existingCustomersMap.get(customerKey);

            if (!customerId) {
                // Create Customer
                const newCustomer = await db.insert(customers).values({
                    name: customerName,
                    source: customerSource,
                    contact: customerContact,
                    note: 'Restored from Backup',
                }).returning({ id: customers.id });

                customerId = newCustomer[0].id;
                existingCustomersMap.set(customerKey, customerId);
                console.log(`Created new customer: ${customerName} (ID: ${customerId})`);
            }

            // 2. Prepare Subscription Data
            // Map JSON fields to DB Schema
            // Backup 'account' field often maps to 'Account Info' in DB (username/pass)
            // backup 'contact' field maps to Customer Contact.

            const accountInfo = order.account || '';

            // Clean dates
            let startDate = order.start;
            let endDate = order.end;

            // Ensure dates are string YYYY-MM-DD
            if (startDate instanceof Date) startDate = (startDate as Date).toISOString().split('T')[0];
            if (endDate instanceof Date) endDate = (endDate as Date).toISOString().split('T')[0];

            // If date is Excel serial or weird format, we might need parsing, but JSON backup likely has strings if from exceljs reading value.
            // Let's assume strings for now, validation later.

            // 3. Upsert Subscription? Or Insert?
            // Since user did a hard delete, we likely want to just Insert.
            // But verify duplicate check (Strict) just in case.

            // Strict Check: Name + Service + Account + Start + End
            // Actually DB doesn't have unique constraints, so app logic handles it.
            // We will perform a check to see if this EXACT order exists.

            const existingSub = await db.query.subscriptions.findFirst({
                where: and(
                    eq(subscriptions.customerId, customerId),
                    eq(subscriptions.service, order.service),
                    eq(subscriptions.startDate, String(startDate)),
                    eq(subscriptions.endDate, String(endDate)),
                    // Account info might be null in DB but string in backup
                    // We skip strict account info check for now to avoid misses on slight variations, 
                    // relying on the main fields.
                )
            });

            if (existingSub) {
                console.log(`Skipping duplicate: ${order.id} - ${customerName} - ${order.service}`);
                continue;
            }

            // 4. Insert
            await db.insert(subscriptions).values({
                customerId: customerId,
                service: order.service,
                startDate: String(startDate),
                endDate: String(endDate),
                distribution: order.dist,
                revenue: Number(order.rev) || 0,
                cost: Number(order.cost) || 0,
                renewalStatus: (order.status?.renewalStatus as any) || 'pending',
                paymentStatus: (order.status?.paymentStatus as any) || 'unpaid',
                contactCount: Number(order.status?.contactCount) || 0,
                accountInfo: accountInfo,
                note: `Restored order ${order.id}`,
                createdAt: order.status?.lastUpdated ? new Date(order.status.lastUpdated).toISOString() : new Date().toISOString(),
            });

            successCount++;
        } catch (e) {
            console.error(`Error restoring order ${order.id}:`, e);
            failCount++;
        }
    }

    console.log(`\nRestore Complete.`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Total Scanned: ${orders.length}`);
}

restore().catch(console.error);
