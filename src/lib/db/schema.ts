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
    completedAt: text('completed_at'), // Timestamp when order is marked as completed (paid + renewed)
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
    expiresAt: text('expires_at'), // Expiration date
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

// Families table (for tracking family subscriptions like YouTube Family, Spotify Family)
export const families = sqliteTable('families', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(), // e.g., "YouTube Fam 1"
    service: text('service').notNull(), // YouTube, Spotify, Netflix, etc.

    ownerAccount: text('owner_account').notNull(), // Main account email

    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),

    paymentCard: text('payment_card'), // e.g., "visa 8960"
    paymentDay: integer('payment_day'), // Day of month for payment (1-31)

    note: text('note'),
    createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

// Family members table
export const familyMembers = sqliteTable('family_members', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    familyId: integer('family_id').notNull().references(() => families.id),

    slotNumber: integer('slot_number').notNull(), // 1, 2, 3, 4, 5
    memberName: text('member_name'), // Display name
    memberAccount: text('member_account'), // Email/account

    startDate: text('start_date'),
    endDate: text('end_date'),

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

export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;

export type FamilyMember = typeof familyMembers.$inferSelect;
export type NewFamilyMember = typeof familyMembers.$inferInsert;

// Templates table (Quick Reply)
export const templates = sqliteTable('templates', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    service: text('service').notNull(), // General, Netflix, CapCut, etc.
    title: text('title').notNull(),
    content: text('content').notNull(),
    category: text('category').notNull().default('general'), // sale, renewal, support, general
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
