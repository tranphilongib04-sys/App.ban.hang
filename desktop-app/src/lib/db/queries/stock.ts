/**
 * Stock Management Queries (V3 - Unified Inventory System)
 * Uses: skus + stock_items tables
 */

import { db } from '@/lib/db';
import { skus, stockItems, SKU, StockItem, NewStockItem } from '@/lib/db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// ==================== SKUs ====================

export async function getSKUs(filter?: { category?: string; isActive?: boolean }): Promise<SKU[]> {
    const conditions = [];

    if (filter?.category) conditions.push(eq(skus.category, filter.category));
    if (filter?.isActive !== undefined) conditions.push(eq(skus.isActive, filter.isActive ? 1 : 0));

    if (conditions.length > 0) {
        return db.select().from(skus).where(and(...conditions)).orderBy(skus.category, skus.name);
    }

    return db.select().from(skus).orderBy(skus.category, skus.name);
}

export async function getSKUById(id: string): Promise<SKU | null> {
    const result = await db.select().from(skus).where(eq(skus.id, id)).get();
    return result || null;
}

export async function getSKUByCode(code: string): Promise<SKU | null> {
    const result = await db.select().from(skus).where(eq(skus.skuCode, code)).get();
    return result || null;
}

// ==================== STOCK ITEMS ====================

export async function getStockItems(filter?: {
    skuId?: string;
    status?: 'available' | 'reserved' | 'sold';
    category?: string;
}): Promise<Array<StockItem & { sku?: SKU }>> {
    // Join with SKUs to get SKU details
    const conditions = [];

    if (filter?.skuId) conditions.push(eq(stockItems.skuId, filter.skuId));
    if (filter?.status) conditions.push(eq(stockItems.status, filter.status));

    let query = db.select({
        stockItem: stockItems,
        sku: skus
    })
    .from(stockItems)
    .leftJoin(skus, eq(stockItems.skuId, skus.id));

    if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
    }

    const result = await query.orderBy(desc(stockItems.createdAt));

    return result.map(({ stockItem, sku }) => ({
        ...stockItem,
        sku: sku || undefined
    }));
}

export async function getStockItemById(id: string): Promise<(StockItem & { sku?: SKU }) | null> {
    const result = await db.select({
        stockItem: stockItems,
        sku: skus
    })
    .from(stockItems)
    .leftJoin(skus, eq(stockItems.skuId, skus.id))
    .where(eq(stockItems.id, id))
    .get();

    if (!result) return null;

    return {
        ...result.stockItem,
        sku: result.sku || undefined
    };
}

/**
 * Get inventory summary: count by SKU and status
 */
export async function getInventorySummary(): Promise<Array<{
    skuId: string;
    skuCode: string;
    skuName: string;
    category: string;
    available: number;
    reserved: number;
    sold: number;
    total: number;
}>> {
    const result = await db.select({
        skuId: skus.id,
        skuCode: skus.skuCode,
        skuName: skus.name,
        category: skus.category,
        available: sql<number>`COUNT(CASE WHEN ${stockItems.status} = 'available' THEN 1 END)`,
        reserved: sql<number>`COUNT(CASE WHEN ${stockItems.status} = 'reserved' THEN 1 END)`,
        sold: sql<number>`COUNT(CASE WHEN ${stockItems.status} = 'sold' THEN 1 END)`,
        total: sql<number>`COUNT(${stockItems.id})`
    })
    .from(skus)
    .leftJoin(stockItems, eq(skus.id, stockItems.skuId))
    .where(eq(skus.isActive, 1))
    .groupBy(skus.id, skus.skuCode, skus.name, skus.category)
    .orderBy(skus.category, skus.name);

    return result;
}

/**
 * Create a new stock item
 */
export async function createStockItem(data: {
    skuId: string;
    accountInfo?: string;
    secretKey?: string;
    note?: string;
}): Promise<StockItem> {
    const id = randomUUID();

    const result = await db.insert(stockItems).values({
        id,
        skuId: data.skuId,
        accountInfo: data.accountInfo || null,
        secretKey: data.secretKey || null,
        note: data.note || null,
        status: 'available',
    }).returning();

    return result[0];
}

/**
 * Bulk create stock items
 */
export async function bulkCreateStockItems(items: Array<{
    skuId: string;
    accountInfo?: string;
    secretKey?: string;
    note?: string;
}>): Promise<number> {
    if (items.length === 0) return 0;

    const values = items.map(item => ({
        id: randomUUID(),
        skuId: item.skuId,
        accountInfo: item.accountInfo || null,
        secretKey: item.secretKey || null,
        note: item.note || null,
        status: 'available' as const,
    }));

    await db.insert(stockItems).values(values);
    return values.length;
}

/**
 * Update stock item
 */
export async function updateStockItem(id: string, data: {
    accountInfo?: string;
    secretKey?: string;
    note?: string;
    status?: 'available' | 'reserved' | 'sold';
}): Promise<void> {
    const updateData: any = {};

    if (data.accountInfo !== undefined) updateData.accountInfo = data.accountInfo;
    if (data.secretKey !== undefined) updateData.secretKey = data.secretKey;
    if (data.note !== undefined) updateData.note = data.note;
    if (data.status !== undefined) updateData.status = data.status;

    await db.update(stockItems).set(updateData).where(eq(stockItems.id, id));
}

/**
 * Delete stock item
 */
export async function deleteStockItem(id: string): Promise<void> {
    await db.delete(stockItems).where(eq(stockItems.id, id));
}

/**
 * Bulk delete stock items
 */
export async function bulkDeleteStockItems(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    await db.delete(stockItems).where(inArray(stockItems.id, ids));
    return ids.length;
}

/**
 * Reserve stock for an order
 */
export async function reserveStock(skuId: string, quantity: number, orderId: number): Promise<string[]> {
    // Get available items
    const available = await db.select()
        .from(stockItems)
        .where(and(
            eq(stockItems.skuId, skuId),
            eq(stockItems.status, 'available')
        ))
        .limit(quantity);

    if (available.length < quantity) {
        throw new Error(`Insufficient stock: need ${quantity}, have ${available.length}`);
    }

    const ids = available.map(item => item.id);

    // Update to reserved
    await db.update(stockItems)
        .set({
            status: 'reserved',
            orderId: orderId
        })
        .where(inArray(stockItems.id, ids));

    return ids;
}

/**
 * Mark reserved items as sold
 */
export async function markAsSold(itemIds: string[]): Promise<void> {
    if (itemIds.length === 0) return;

    await db.update(stockItems)
        .set({
            status: 'sold',
            soldAt: new Date().toISOString()
        })
        .where(inArray(stockItems.id, itemIds));
}

/**
 * Release reserved items back to available
 */
export async function releaseReservedStock(itemIds: string[]): Promise<void> {
    if (itemIds.length === 0) return;

    await db.update(stockItems)
        .set({
            status: 'available',
            orderId: null
        })
        .where(inArray(stockItems.id, itemIds));
}
