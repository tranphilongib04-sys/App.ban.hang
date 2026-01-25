import { db } from '../src/lib/db';
import { customers, subscriptions, inventoryItems, warranties, deliveries } from '../src/lib/db/schema';
import exceljs from 'exceljs';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Path to Desktop folder
const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const DATA_FOLDER = path.join(DESKTOP_PATH, 'Dữ lIệu lớn-TBQ');

async function migrate() {
    console.log(`Starting migration to ${DATA_FOLDER}...`);

    if (!fs.existsSync(DATA_FOLDER)) {
        fs.mkdirSync(DATA_FOLDER, { recursive: true });
    }

    // 1. Export Inventory -> Kho.xlsx
    console.log('Exporting Inventory...');
    const allInventory = await db.select().from(inventoryItems);
    const inventoryWorkbook = new exceljs.Workbook();
    const inventorySheet = inventoryWorkbook.addWorksheet('Kho');

    inventorySheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Service', key: 'service', width: 20 },
        { header: 'Payload', key: 'secretPayload', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Import Date', key: 'createdAt', width: 20 },
        { header: 'Cost', key: 'cost', width: 15 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Distribution', key: 'distribution', width: 15 },
        { header: 'Note', key: 'note', width: 30 },
    ];

    allInventory.forEach((item: any) => {
        inventorySheet.addRow({
            id: item.id,
            service: item.service,
            secretPayload: item.secretPayload,
            status: item.status,
            createdAt: item.createdAt,
            cost: item.cost,
            category: item.category,
            distribution: item.distribution,
            note: item.note,
        });
    });

    await inventoryWorkbook.xlsx.writeFile(path.join(DATA_FOLDER, 'Kho.xlsx'));


    // 2. Export Orders (Subscriptions + Customer info) -> DonHang.xlsx
    console.log('Exporting Orders...');
    // We need to join subscriptions with customers
    const allSubs = await db.select({
        id: subscriptions.id,
        // Customer Info
        customerId: subscriptions.customerId,
        // Subscription Info
        service: subscriptions.service,
        accountInfo: subscriptions.accountInfo,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        revenue: subscriptions.revenue,
        cost: subscriptions.cost,
        renewalStatus: subscriptions.renewalStatus,
        paymentStatus: subscriptions.paymentStatus,
        lastContactedAt: subscriptions.lastContactedAt,
        contactCount: subscriptions.contactCount,
        note: subscriptions.note,
        category: subscriptions.category,
        createdAt: subscriptions.createdAt,
    }).from(subscriptions);

    // Fetch all customers for mapping
    const allCustomers = await db.select().from(customers);
    const customerMap = new Map(allCustomers.map(c => [c.id, c]));

    const ordersWorkbook = new exceljs.Workbook();
    const ordersSheet = ordersWorkbook.addWorksheet('DonHang');

    ordersSheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Customer Name', key: 'customerName', width: 25 },
        { header: 'Contact', key: 'contact', width: 20 },
        { header: 'Source', key: 'source', width: 15 },
        { header: 'Service', key: 'service', width: 20 },
        { header: 'Account Info', key: 'accountInfo', width: 30 },
        { header: 'Start Date', key: 'startDate', width: 15 },
        { header: 'End Date', key: 'endDate', width: 15 },
        { header: 'Price', key: 'revenue', width: 15 },
        { header: 'Cost', key: 'cost', width: 15 },
        { header: 'Status', key: 'renewalStatus', width: 15 },
        { header: 'Payment', key: 'paymentStatus', width: 15 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Note', key: 'note', width: 30 },
        { header: 'CustomerID', key: 'customerId', width: 10 }, // Keep for ref
        { header: 'CustomerTags', key: 'customerTags', width: 20 },
    ];

    allSubs.forEach(sub => {
        const char = customerMap.get(sub.customerId);
        ordersSheet.addRow({
            id: sub.id,
            customerName: char?.name || 'Unknown',
            contact: char?.contact || '',
            source: char?.source || '',
            service: sub.service,
            accountInfo: sub.accountInfo,
            startDate: sub.startDate,
            endDate: sub.endDate,
            revenue: sub.revenue,
            cost: sub.cost,
            renewalStatus: sub.renewalStatus,
            paymentStatus: sub.paymentStatus,
            category: sub.category,
            note: sub.note,
            customerId: sub.customerId,
            customerTags: char?.tags || '',
        });
    });

    await ordersWorkbook.xlsx.writeFile(path.join(DATA_FOLDER, 'DonHang.xlsx'));


    // 3. Export Warranties -> BaoHanh.xlsx
    console.log('Exporting Warranties...');
    const allWarranties = await db.select().from(warranties);
    // Find customer name for each warranty via subscription
    const subMap = new Map(allSubs.map(s => [s.id, s]));

    const warrantyWorkbook = new exceljs.Workbook();
    const warrantySheet = warrantyWorkbook.addWorksheet('BaoHanh');

    warrantySheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'OrderID', key: 'subscriptionId', width: 10 }, // Link to DonHang
        { header: 'Customer Name', key: 'customerName', width: 25 },
        { header: 'Service', key: 'service', width: 20 },
        { header: 'Issue Date', key: 'issueDate', width: 15 },
        { header: 'Issue Description', key: 'issueDescription', width: 40 },
        { header: 'Status', key: 'warrantyStatus', width: 15 },
        { header: 'Resolved Date', key: 'resolvedDate', width: 15 },
        { header: 'Cost', key: 'cost', width: 15 },
        { header: 'New Account Info', key: 'note', width: 30 }, // Using note for new info if not structured
    ];

    allWarranties.forEach(war => {
        const sub = subMap.get(war.subscriptionId);
        const char = sub ? customerMap.get(sub.customerId) : null;

        warrantySheet.addRow({
            id: war.id,
            subscriptionId: war.subscriptionId,
            customerName: char?.name || 'Unknown',
            service: sub?.service || 'Unknown',
            issueDate: war.issueDate,
            issueDescription: war.issueDescription,
            warrantyStatus: war.warrantyStatus,
            resolvedDate: war.resolvedDate,
            cost: war.cost,
            note: war.note,
        });
    });

    await warrantyWorkbook.xlsx.writeFile(path.join(DATA_FOLDER, 'BaoHanh.xlsx'));

    console.log('Migration completed successfully!');
}

migrate().catch(console.error);
