import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Customers table
// System configuration (key-value store)
export const systemConfig = sqliteTable('system_config', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const customers = sqliteTable('customers', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    source: text('source'), // Zalo, Telegram, Facebook, etc.
    contact: text('contact'),
    tags: text('tags'), // JSON array as string
    note: text('note'),
    createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

// Subscriptions table
export const subscriptions = sqliteTable('subscriptions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    customerId: integer('customer_id').notNull().references(() => customers.id),

    service: text('service').notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),

    distribution: text('distribution'), // Distribution channel
    revenue: real('revenue').default(0),
    cost: real('cost').default(0),

    renewalStatus: text('renewal_status', {
        enum: ['pending', 'renewed', 'not_renewing']
    }).notNull().default('pending'),

    paymentStatus: text('payment_status', {
        enum: ['unpaid', 'paid', 'not_paying']
    }).notNull().default('unpaid'),

    lastContactedAt: text('last_contacted_at'),
    reminderDate: text('reminder_date'), // Calculated based on "Remind Later"
    contactCount: integer('contact_count').default(0),
    note: text('note'),
    accountInfo: text('account_info'),
    category: text('category'),
    createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

// Inventory items table (TK/MK/Keys)
export const inventoryItems = sqliteTable('inventory_items', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    service: text('service').notNull(),
    distribution: text('distribution'),

    secretPayload: text('secret_payload').notNull(), // Full TK|MK or key
    secretMasked: text('secret_masked').notNull(), // Masked version for display

    status: text('status', {
        enum: ['available', 'delivered', 'invalid']
    }).notNull().default('available'),

    importBatch: text('import_batch'),
    cost: real('cost').default(0),
    note: text('note'),
    category: text('category'),
    createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

// Deliveries table (log of item deliveries)
export const deliveries = sqliteTable('deliveries', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subscriptionId: integer('subscription_id').notNull().references(() => subscriptions.id),
    inventoryId: integer('inventory_id').notNull().references(() => inventoryItems.id),

    deliveredAt: text('delivered_at').notNull(),
    deliveryNote: text('delivery_note'),
});

// Warranties table
export const warranties = sqliteTable('warranties', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subscriptionId: integer('subscription_id').notNull().references(() => subscriptions.id),

    issueDate: text('issue_date').notNull(),
    issueDescription: text('issue_description'),

    replacementInventoryId: integer('replacement_inventory_id').references(() => inventoryItems.id),
    resolvedDate: text('resolved_date'),
    cost: real('cost').default(0),

    warrantyStatus: text('warranty_status', {
        enum: ['pending', 'resolved', 'rejected']
    }).notNull().default('pending'),

    note: text('note'),
    createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

// Type exports
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;

export type Delivery = typeof deliveries.$inferSelect;
export type NewDelivery = typeof deliveries.$inferInsert;

export type Warranty = typeof warranties.$inferSelect;
export type NewWarranty = typeof warranties.$inferInsert;
