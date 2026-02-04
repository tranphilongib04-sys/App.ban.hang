
import { db } from '@/lib/db';
import { customers, subscriptions, inventoryItems, warranties, deliveries, systemConfig, families, familyMembers, templates, Customer, Subscription, NewSubscription, InventoryItem, Warranty, Delivery, Family, FamilyMember, Template, NewTemplate } from '@/lib/db/schema';
import { eq, and, or, like, desc, sql, gte, lte } from 'drizzle-orm';
import { SubscriptionWithCustomer, CustomerWithStats, WarrantyWithDetails } from '@/types';
import { format, addMonths } from 'date-fns';

// ==================== TEMPLATES ====================

export async function getTemplates(): Promise<Template[]> {
    return db.select().from(templates).orderBy(desc(templates.createdAt));
}

export async function createTemplate(data: NewTemplate): Promise<Template> {
    const result = await db.insert(templates).values(data).returning();
    return result[0];
}

export async function updateTemplate(id: number, data: Partial<Template>): Promise<void> {
    await db.update(templates).set(data).where(eq(templates.id, id));
}

export async function deleteTemplate(id: number): Promise<void> {
    await db.delete(templates).where(eq(templates.id, id));
}

// ==================== INVENTORY ====================

export async function getInventoryItems(filter?: { service?: string; status?: string }): Promise<InventoryItem[]> {
    let query = db.select().from(inventoryItems);

    // We can't use dynamic filters easily with simple select().from() in one go if conditional
    // So we fetch all and filter or construct dynamic query
    // Drizzle dynamic query construction:

    const conditions = [];
    if (filter?.service) conditions.push(eq(inventoryItems.service, filter.service));
    if (filter?.status) conditions.push(eq(inventoryItems.status, filter.status as any));

    if (conditions.length > 0) {
        return db.select().from(inventoryItems).where(and(...conditions)).orderBy(desc(inventoryItems.createdAt));
    }

    return db.select().from(inventoryItems).orderBy(desc(inventoryItems.createdAt));
}

// ==================== SUBSCRIPTIONS / ORDERS ====================

export async function getSubscriptions(): Promise<SubscriptionWithCustomer[]> {
    // Join subscriptions with customers
    const result = await db.select({
        sub: subscriptions,
        cust: customers
    })
        .from(subscriptions)
        .innerJoin(customers, eq(subscriptions.customerId, customers.id))
        .orderBy(desc(subscriptions.endDate));

    return result.map(({ sub, cust }: { sub: Subscription, cust: Customer }) => ({
        ...sub,
        customerName: cust.name,
        customerContact: cust.contact,
        customerSource: cust.source,
        // Calculate fields that might be missing or need runtime calc
        daysUntilEnd: calculateDaysUntilEnd(sub.endDate),
        overallStatus: calculateOverallStatus(sub.startDate, sub.endDate, sub.renewalStatus as any, sub.paymentStatus as any, sub.contactCount || 0, sub.reminderDate),
        hasWarranty: false // We can fetch this separately or join if needed, keeping simple for now
    }));
}

export async function getCustomersWithStats(): Promise<CustomerWithStats[]> {
    // Optimized: Use SQL JOIN and aggregation instead of fetching all and filtering in JS
    const result = await db.select({
        customer: customers,
        totalOrders: sql<number>`COUNT(${subscriptions.id})`.as('totalOrders'),
        totalRevenue: sql<number>`COALESCE(SUM(${subscriptions.revenue}), 0)`.as('totalRevenue'),
        totalCost: sql<number>`COALESCE(SUM(${subscriptions.cost}), 0)`.as('totalCost'),
    })
        .from(customers)
        .leftJoin(subscriptions, eq(customers.id, subscriptions.customerId))
        .groupBy(customers.id)
        .orderBy(desc(sql`totalRevenue`));

    return result.map(({ customer, totalOrders, totalRevenue, totalCost }) => {
        // Calculate segment (same logic as before)
        let segment: 'new' | 'regular' | 'priority' | 'vip' = 'new';
        if (totalRevenue > 1000000) segment = 'vip';
        else if (totalOrders > 5) segment = 'priority';
        else if (totalOrders > 1) segment = 'regular';

        return {
            ...customer,
            totalOrders: totalOrders || 0,
            totalRevenue: totalRevenue || 0,
            totalProfit: (totalRevenue || 0) - (totalCost || 0),
            segment,
            accountInfo: null, // Not available in aggregated query
        };
    });
}

export async function getCustomers(): Promise<Customer[]> {
    return db.select().from(customers);
}

// ==================== WARRANTIES ====================

export async function getWarranties(filter?: { status?: string }): Promise<WarrantyWithDetails[]> {
    let query = db.select({
        warranty: warranties,
        sub: subscriptions,
        cust: customers
    })
        .from(warranties)
        .innerJoin(subscriptions, eq(warranties.subscriptionId, subscriptions.id))
        .innerJoin(customers, eq(subscriptions.customerId, customers.id));

    if (filter?.status) {
        // @ts-ignore
        query = query.where(eq(warranties.warrantyStatus, filter.status));
    }

    // @ts-ignore
    const result = await query.orderBy(desc(warranties.createdAt));

    return result.map(({ warranty, sub, cust }: { warranty: Warranty, sub: Subscription, cust: Customer }) => ({
        id: warranty.id,
        subscriptionId: sub.id,
        customerName: cust.name,
        service: sub.service,
        issueDate: warranty.issueDate,
        issueDescription: warranty.issueDescription,
        warrantyStatus: warranty.warrantyStatus as any,
        resolvedDate: warranty.resolvedDate,
        replacementInventoryId: warranty.replacementInventoryId,
        cost: warranty.cost,
        note: warranty.note,
        accountInfo: sub.accountInfo // approximation
    }));
}

// ==================== HELPERS ====================

function calculateDaysUntilEnd(endDateStr: string): number {
    if (!endDateStr) return 0;

    // Calculate based on Vietnam Timezone
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    // Create Date objects from the strings (treated as UTC YYYY-MM-DD)
    // This allows exact date comparison without time interference
    const end = new Date(endDateStr);
    const today = new Date(todayStr);

    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateOverallStatus(
    startDateStr: string,
    endDateStr: string,
    renewal: 'pending' | 'renewed' | 'not_renewing',
    payment: 'unpaid' | 'paid' | 'not_paying',
    contactCount: number,
    reminderDate?: string | null
): any {
    if (renewal === 'not_renewing') return 'closed';
    if (renewal === 'renewed' && payment === 'paid') return 'completed';
    if (payment === 'not_paying') return 'closed';

    const days = calculateDaysUntilEnd(endDateStr);

    // 1. Overdue (Prioritized)
    if (days < 0 && renewal === 'pending') return 'overdue';

    // 2. Needs Reminder (Prioritized)
    // Logic: 0-3 days left & pending
    if (days >= 0 && days <= 3 && renewal === 'pending') return 'needs_reminder';

    // Explicit reminder date logic
    if (reminderDate) {
        const now = new Date();
        const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
        if (reminderDate <= today) {
            return 'needs_reminder';
        }
    }

    // 3. Awaiting Payment
    if (payment === 'unpaid') {
        const now = new Date();
        const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

        // Strict: Only awaiting payment if explicitly renewed, contacted, or it is a fresh order (today/future)
        if (renewal === 'renewed') return 'awaiting_payment';
        if (contactCount > 0) return 'awaiting_payment';
        // Note: New orders (startDate >= today) should be awaiting payment
        if (startDateStr >= today) return 'awaiting_payment';

        // Otherwise, if it's old and unpaid but not expiring (handled above), it's active-with-debt
        return 'active';
    }

    return 'active';
}

// ==================== WRITE OPERATIONS ====================

export async function findCustomerByNameAndContact(name: string, contact?: string): Promise<Customer | null> {
    const result = await db.select().from(customers).where(eq(customers.name, name)).limit(1);
    if (result.length > 0) return result[0];
    return null;
    // Simplified: Ignore contact strict check for now or add 'and' condition
}

export async function createCustomer(data: { name: string; source?: string; contact?: string; tags?: string; note?: string }): Promise<Customer> {
    const existing = await findCustomerByNameAndContact(data.name, data.contact);
    if (existing) return existing;

    const result = await db.insert(customers).values({
        name: data.name,
        source: data.source,
        contact: data.contact,
        tags: data.tags,
        note: data.note,
        createdAt: new Date().toISOString()
    }).returning();

    return result[0];
}

export async function updateCustomer(id: number, data: any) {
    await db.update(customers).set(data).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number) {
    // Should transactionally delete related data
    await db.delete(warranties).where(
        sql`subscription_id IN (SELECT id FROM subscriptions WHERE customer_id = ${id})`
    );
    await db.delete(deliveries).where(
        sql`subscription_id IN (SELECT id FROM subscriptions WHERE customer_id = ${id})`
    );
    await db.delete(subscriptions).where(eq(subscriptions.customerId, id));
    await db.delete(customers).where(eq(customers.id, id));
}

export async function deleteSubscription(id: number) {
    await db.delete(warranties).where(eq(warranties.subscriptionId, id));
    await db.delete(deliveries).where(eq(deliveries.subscriptionId, id));
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
}

export async function createSubscription(data: any): Promise<Subscription> {
    const values: NewSubscription = {
        customerId: data.customerId,
        service: data.service,
        startDate: data.startDate,
        endDate: data.endDate,
        distribution: data.distribution || data.category,
        revenue: data.revenue,
        cost: data.cost,
        renewalStatus: data.renewalStatus || 'pending',
        paymentStatus: data.paymentStatus || 'unpaid',
        note: data.note,
        accountInfo: data.accountInfo,
        completedAt: data.completedAt, // Support immediate completion
        createdAt: new Date().toISOString()
    };
    const result = await db.insert(subscriptions).values(values).returning();
    return result[0];
}

export async function updateSubscription(id: number, data: any) {
    // Handle cost operation logic if needed (simplified here to direct set)
    const updateData = { ...data };

    if (data.cost && typeof data.cost === 'object' && data.cost.operation) {
        // We'd need to fetch current cost first
        const current = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).get();
        if (current) {
            if (data.cost.operation === 'add') {
                updateData.cost = (current.cost || 0) + (data.cost.value || 0);
            } else if (data.cost.operation === 'subtract') {
                updateData.cost = Math.max(0, (current.cost || 0) - (data.cost.value || 0));
            }
        }
    }

    if (data.note && data.note !== undefined) {
        // Append note logic
        const current = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).get();
        if (current && current.note) {
            updateData.note = current.note + ' ' + data.note;
        }
    }

    await db.update(subscriptions).set(updateData).where(eq(subscriptions.id, id));
}

export async function createInventoryItem(data: any) {
    await db.insert(inventoryItems).values({
        service: data.service,
        secretPayload: data.secretPayload,
        secretMasked: '***',
        status: 'available',
        cost: data.cost,
        expiresAt: data.expiresAt || null,
        distribution: data.distribution,
        note: data.note,
        createdAt: new Date().toISOString()
    });
}

export async function updateInventoryStatus(id: number, status: string) {
    await db.update(inventoryItems).set({ status: status as any }).where(eq(inventoryItems.id, id));
}

export async function updateInventoryItem(id: number, data: {
    service?: string;
    secretPayload?: string;
    cost?: number;
    expiresAt?: string | null;
    note?: string;
    distribution?: string;
}) {
    const updateData: any = {};
    if (data.service !== undefined) updateData.service = data.service;
    if (data.secretPayload !== undefined) {
        updateData.secretPayload = data.secretPayload;
        updateData.secretMasked = '***'; // Reset mask
    }
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;
    if (data.note !== undefined) updateData.note = data.note;
    if (data.distribution !== undefined) updateData.distribution = data.distribution;

    await db.update(inventoryItems).set(updateData).where(eq(inventoryItems.id, id));
}

export async function deleteInventoryItem(id: number) {
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
}

export async function createWarranty(data: any) {
    await db.insert(warranties).values({
        subscriptionId: data.subscriptionId,
        issueDate: data.issueDate,
        issueDescription: data.issueDescription,
        note: data.note,
        warrantyStatus: 'pending',
        createdAt: new Date().toISOString()
    });
}

export async function resolveWarranty(id: number, service: string, data?: any) {
    let replacementInventoryId: number | null = null;
    let accountInfo: string | null = null;

    if (!data?.accountInfo) {
        // Auto select inventory
        const item = await db.select().from(inventoryItems)
            .where(and(eq(inventoryItems.service, service), eq(inventoryItems.status, 'available')))
            .limit(1).get();

        if (item) {
            replacementInventoryId = item.id;
            accountInfo = item.secretPayload;
            await updateInventoryStatus(item.id, 'delivered');
        }
    } else {
        accountInfo = data.accountInfo;
    }

    await db.update(warranties).set({
        warrantyStatus: 'resolved',
        resolvedDate: new Date().toISOString(),
        cost: data?.cost || 0,
        replacementInventoryId: replacementInventoryId,
        note: accountInfo // Store info in note as requested
    }).where(eq(warranties.id, id));

    // Get sub ID
    const warranty = await db.select().from(warranties).where(eq(warranties.id, id)).get();
    if (warranty) {
        const updateSubData: any = {};
        if (accountInfo) updateSubData.accountInfo = accountInfo;
        if (data?.cost) updateSubData.cost = { operation: 'add', value: data.cost };

        await updateSubscription(warranty.subscriptionId, updateSubData);
    }

    return { success: true };
}

export async function rejectWarranty(id: number, note?: string) {
    await db.update(warranties).set({
        warrantyStatus: 'rejected',
        note: note
    }).where(eq(warranties.id, id));
}

// Helpers needed for Actions
export async function getCustomerById(id: number) {
    return db.select().from(customers).where(eq(customers.id, id)).get();
}

export async function getSubscriptionsByCustomer(id: number) {
    const subs = await getSubscriptions(); // Re-use main join query
    return subs.filter(s => s.customerId === id);
}

export async function quickRenew(id: number) {
    const sub = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).get();
    if (sub) {
        await updateSubscription(id, { renewalStatus: 'renewed' });
        // Return dummy new sub, actual creation happens in action logic usually?
        // Logic in action.ts seems to expect return
        return sub;
    }
    return null;
}

export async function deliverItem(subscriptionId: number, service: string, note?: string, inventoryId?: number) {
    const deliveryNote = inventoryId && inventoryId > 0
        ? `Delivered [Inventory #${inventoryId}]: ${note || ''}`
        : `Delivered: ${note || ''}`;

    await updateSubscription(subscriptionId, { note: deliveryNote });

    // Only create delivery record for real inventory items (id > 0)
    // Skip for manual entries (id = -1 or undefined)
    if (inventoryId && inventoryId > 0) {
        await db.insert(deliveries).values({
            subscriptionId,
            inventoryId,
            deliveredAt: new Date().toISOString(),
            deliveryNote: note
        });
    }

    return { success: true, item: { secretPayload: 'See Inventory' } };
}

export async function importInventoryItems(items: any[], batch: any) {
    let successCount = 0;
    for (const item of items) {
        try {
            await createInventoryItem(item);
            successCount++;
        } catch (error) {
            console.error(`[Import Error] Failed to import item: ${item.secretPayload?.slice(0, 10)}...`, error);
        }
    }
    return { success: true, count: successCount };
}

// ==================== SYSTEM CONFIG (Simple JSON Store -> DB) ====================

export async function getSystemConfig(key: string): Promise<string | null> {
    const res = await db.select().from(systemConfig).where(eq(systemConfig.key, key)).get();
    return res ? res.value : null;
}

export async function setSystemConfig(key: string, value: string): Promise<void> {
    await db.insert(systemConfig).values({ key, value }).onConflictDoUpdate({ target: systemConfig.key, set: { value, updatedAt: sql`CURRENT_TIMESTAMP` } });
}

// ==================== STATS HELPERS ====================

export async function getReportStats(start?: string, end?: string) {
    const subs = await getSubscriptions();
    const allWarranties = await getWarranties();

    let filtered = subs;
    if (start && end) {
        filtered = subs.filter(s => s.startDate >= start && s.startDate <= end);
    }

    const totalRevenue = filtered.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const totalCost = filtered.reduce((sum, s) => sum + (s.cost || 0), 0);
    const totalProfit = totalRevenue - totalCost;

    const byService: Record<string, { revenue: number; cost: number; profit: number; count: number }> = {};
    filtered.forEach(s => {
        const cur = byService[s.service] || { revenue: 0, cost: 0, profit: 0, count: 0 };
        cur.revenue += (s.revenue || 0);
        cur.cost += (s.cost || 0);
        cur.profit += ((s.revenue || 0) - (s.cost || 0));
        cur.count += 1;
        byService[s.service] = cur;
    });

    return {
        totalRevenue,
        totalCost,
        totalProfit,
        subscriptionCount: filtered.length,
        byService,
        warrantyCount: allWarranties.length,
        pendingWarranties: allWarranties.filter(w => w.warrantyStatus === 'pending').length
    };
}

export async function getTodayCompletedSubscriptions() {
    const subs = await getSubscriptions();
    // Use Vietnam timezone so "today" matches user's calendar day (fixes 30th vs 31st)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    // Created today AND paid today (or completedAt is today)
    // Created today AND paid today (or completedAt is today)
    const todaySubs = subs.filter(s => {
        // s.startDate is YYYY-MM-DD (typically set as VN date)
        const startedToday = s.startDate === today;

        // Check completedAt in VN timezone
        let completedToday = false;
        if ((s as any).completedAt) {
            const compDateVN = new Date((s as any).completedAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
            if (compDateVN === today) {
                completedToday = true;
            }
        }

        return (startedToday || completedToday) && s.paymentStatus === 'paid';
    });

    const todayRevenue = todaySubs.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const todayProfit = todaySubs.reduce((sum, s) => sum + ((s.revenue || 0) - (s.cost || 0)), 0);

    return {
        subscriptions: todaySubs,
        todayRevenue,
        todayProfit
    };
}

export async function getGrowthStats(months = 12) {
    // Optimized: Use SQL Aggregation instead of fetching all rows
    const result = await db.select({
        monthStr: sql<string>`strftime('%Y-%m', ${subscriptions.startDate})`,
        revenue: sql<number>`sum(${subscriptions.revenue})`,
        cost: sql<number>`sum(${subscriptions.cost})`,
        count: sql<number>`count(*)`
    })
        .from(subscriptions)
        .groupBy(sql`strftime('%Y-%m', ${subscriptions.startDate})`)
        .orderBy(desc(sql`strftime('%Y-%m', ${subscriptions.startDate})`))
        .limit(months);

    // SQL returns DESC (newest first), but charts usually want ASC (oldest first)
    // Also need to map to format 'MM/yyyy'
    return result.map((row: { monthStr: string; revenue: number | null; cost: number | null; count: number | null }) => ({
        name: format(new Date(row.monthStr + '-01'), 'MM/yyyy'),
        revenue: row.revenue || 0,
        profit: (row.revenue || 0) - (row.cost || 0),
        orders: row.count || 0
    })).reverse();
}

export async function getMonthlyServiceStats(months = 3) {
    const subs = await getSubscriptions();
    const result: any[] = [];

    // Use VN timezone
    const now = new Date();
    const vnYear = parseInt(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }));
    const vnMonth = parseInt(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', month: 'numeric' })); // 1-12

    for (let i = 0; i < months; i++) {
        // Construct date for 1st of month (vnMonth is 1-based, Date takes 0-based)
        // (vnMonth - 1) - i handles back-calculation correctly via Date constructor
        const d = new Date(vnYear, (vnMonth - 1) - i, 1);
        const monthKey = format(d, 'yyyy-MM');

        const monthlySubs = subs.filter(s => s.startDate.startsWith(monthKey));
        const totalRevenue = monthlySubs.reduce((sum, s) => sum + (s.revenue || 0), 0);

        const servicesMap = new Map<string, { revenue: number, profit: number, count: number }>();

        monthlySubs.forEach(s => {
            const current = servicesMap.get(s.service) || { revenue: 0, profit: 0, count: 0 };
            current.revenue += (s.revenue || 0);
            current.profit += ((s.revenue || 0) - (s.cost || 0));
            current.count += 1;
            servicesMap.set(s.service, current);
        });

        const services = Array.from(servicesMap.entries()).map(([name, data]) => ({
            name,
            ...data
        })).sort((a, b) => b.revenue - a.revenue);

        result.push({
            month: format(d, 'MM/yyyy'),
            totalRevenue,
            services
        });
    }
    return result;
}

export async function getProjectedRevenue() {
    const subs = await getSubscriptions();

    // Match "Now" to VN Timezone date string YYYY-MM-DD for comparison
    const nowUTC = new Date();
    const todayStr = nowUTC.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    // Construct "Next Month" date boundary
    // If today is 2026-02-01, we want up to 2026-03-01
    const vnYear = parseInt(nowUTC.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }));
    const vnMonth = parseInt(nowUTC.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', month: 'numeric' }));

    // Forecast 1 month
    const currentDate = new Date(vnYear, vnMonth - 1, parseInt(nowUTC.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', day: 'numeric' })));
    const forecastDate = addMonths(currentDate, 1);
    const forecastStr = format(forecastDate, 'yyyy-MM-dd');

    // Find active subs expiring in next 1 month (and not marked as "not_renewing")
    const expiringSubs = subs.filter(s => {
        if (!s.endDate) return false;
        if (s.renewalStatus === 'not_renewing') return false;

        // Compare strings YYYY-MM-DD
        return s.endDate >= todayStr && s.endDate <= forecastStr;
    });

    const projectedRevenue = expiringSubs.reduce((sum, s) => sum + (s.revenue || 0), 0);

    // Breakdown by service for Bar Chart
    const byServiceMap = new Map<string, number>();
    expiringSubs.forEach(s => {
        const current = byServiceMap.get(s.service) || 0;
        byServiceMap.set(s.service, current + (s.revenue || 0));
    });

    const byService = Array.from(byServiceMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
        projectedRevenue,
        expiringCount: expiringSubs.length,
        next30Days: expiringSubs,
        byService
    };
}

// ==================== DELIVERIES QUERY ====================

export async function getDeliveriesBySubscription(subscriptionId: number) {
    return db.select().from(deliveries).where(eq(deliveries.subscriptionId, subscriptionId)).orderBy(desc(deliveries.deliveredAt));
}

// ==================== SERVICES ====================

export async function getServices() {
    // Unique services from inventory + subscriptions
    const subs = await db.selectDistinct({ service: subscriptions.service }).from(subscriptions);
    const invs = await db.selectDistinct({ service: inventoryItems.service }).from(inventoryItems);

    const set = new Set<string>();
    subs.forEach((s: { service: string }) => set.add(s.service));
    invs.forEach((i: { service: string }) => set.add(i.service));

    return Array.from(set).map((s: string) => ({ name: s }));
}


// ==================== OPTIMIZED DASHBOARD QUERIES ====================

export async function getTodayDashboardData() {
    // 1. Get relevant lists (Active, Unpaid, Recent)
    // Filter: EndDate >= (Today - 90 days) OR Payment = 'unpaid' OR Note has content
    // Limiting historical data significantly speeds up the query and hydration.
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    // Date cutoff: 3 months ago (Vietnam timezone for consistency).
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 3);
    const cutoffStr = cutoffDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    const subs = await db.select({
        sub: subscriptions,
        cust: customers
    })
        .from(subscriptions)
        .innerJoin(customers, eq(subscriptions.customerId, customers.id))
        .where(
            or(
                gte(subscriptions.endDate, cutoffStr), // Not too old
                eq(subscriptions.paymentStatus, 'unpaid'), // Always show unpaid
                eq(subscriptions.renewalStatus, 'pending') // Always show pending renewals
            )
        )
        .orderBy(desc(subscriptions.endDate));

    // 2. Aggregate Today's Stats via JS (Correct Timezone)
    // We reuse the fetched 'subs' list which covers recent date range
    const todayStatsCalc = subs.reduce((acc, { sub }) => {
        let isToday = false;
        if (sub.completedAt) {
            const compDateVN = new Date(sub.completedAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
            if (compDateVN === todayStr) {
                isToday = true;
            }
        }

        if (isToday) {
            acc.revenue += (sub.revenue || 0);
            acc.cost += (sub.cost || 0);
            acc.count += 1;
        }
        return acc;
    }, { revenue: 0, cost: 0, count: 0 });

    const todayRevenue = todayStatsCalc.revenue;
    const todayCost = todayStatsCalc.cost;
    const completedCount = todayStatsCalc.count;
    const todayProfit = todayRevenue - todayCost;

    const fullList = subs.map(({ sub, cust }: { sub: Subscription, cust: Customer }) => ({
        ...sub,
        customerName: cust.name,
        customerContact: cust.contact,
        customerSource: cust.source,
        daysUntilEnd: calculateDaysUntilEnd(sub.endDate),
        overallStatus: calculateOverallStatus(sub.startDate, sub.endDate, sub.renewalStatus as any, sub.paymentStatus as any, sub.contactCount || 0, sub.reminderDate),
        hasWarranty: false
    }));

    return {
        fullList,
        todayStats: {
            todayRevenue,
            todayProfit,
            subscriptions: completedCount
        }
    };
}
