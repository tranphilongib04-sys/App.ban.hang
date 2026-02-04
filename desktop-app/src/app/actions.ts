'use server';

import * as queries from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { customers, subscriptions } from '@/lib/db/schema';
import { generateTemplate, parseExcel } from '@/lib/import-utils';
import * as fs from 'fs';
import { addMonths, format } from 'date-fns';
import { inventoryItems, deliveries } from '@/lib/db/schema';
import { and, eq, inArray, desc } from 'drizzle-orm';
import { NewTemplate, Template } from '@/lib/db/schema';

// ==================== CUSTOMERS ====================

export async function getCustomersAction() {
  return queries.getCustomers();
}

export async function getCustomersWithStatsAction() {
  return queries.getCustomersWithStats();
}

export async function getCustomerByIdAction(id: number) {
  return queries.getCustomerById(id);
}

export async function createCustomerAction(formData: FormData) {
  const name = formData.get('name') as string;
  const source = formData.get('source') as string;
  const contact = formData.get('contact') as string;
  const tags = formData.get('tags') as string;
  const note = formData.get('note') as string;

  await queries.createCustomer({ name, source, contact, tags, note });
  revalidatePath('/customers');
  revalidatePath('/orders');
  revalidatePath('/today');
}

export async function updateCustomerAction(id: number, formData: FormData) {
  const name = formData.get('name') as string;
  const source = formData.get('source') as string;
  const contact = formData.get('contact') as string;
  const tags = formData.get('tags') as string;
  const note = formData.get('note') as string;

  await queries.updateCustomer(id, { name, source, contact, tags, note });
  revalidatePath('/customers');
  revalidatePath('/orders');
  revalidatePath('/today');
}

export async function deleteCustomerAction(id: number) {
  await queries.deleteCustomer(id);
  revalidatePath('/customers');
  revalidatePath('/orders');
  revalidatePath('/today');
}

export async function mergeCustomersAction(primaryId: number, secondaryIds: number[]) {
  // Merge all subscriptions from secondary customers to primary customer
  // Then delete the secondary customers

  if (secondaryIds.length === 0) {
    return { success: false, error: 'Không có khách hàng nào để gộp' };
  }

  if (secondaryIds.includes(primaryId)) {
    return { success: false, error: 'Khách hàng chính không thể nằm trong danh sách gộp' };
  }

  try {
    // Get primary customer info
    const allCustomers = await queries.getCustomers();
    const primaryCustomer = allCustomers.find(c => c.id === primaryId);

    if (!primaryCustomer) {
      return { success: false, error: 'Không tìm thấy khách hàng chính' };
    }

    // Update all subscriptions from secondary customers to point to primary
    for (const secondaryId of secondaryIds) {
      await db.update(subscriptions)
        .set({ customerId: primaryId })
        .where(eq(subscriptions.customerId, secondaryId));
    }

    // Delete secondary customers
    for (const secondaryId of secondaryIds) {
      await db.delete(customers).where(eq(customers.id, secondaryId));
    }

    revalidatePath('/customers');
    revalidatePath('/orders');
    revalidatePath('/today');

    return { success: true, mergedCount: secondaryIds.length };
  } catch (error: any) {
    console.error('Merge customers error:', error);
    return { success: false, error: error.message || 'Có lỗi xảy ra khi gộp khách hàng' };
  }
}

// ==================== SUBSCRIPTIONS ====================

export async function getSubscriptionsAction() {
  return queries.getSubscriptions();
}

export async function getSubscriptionsByCustomerAction(customerId: number) {
  return queries.getSubscriptionsByCustomer(customerId);
}

export async function createSubscriptionAction(formData: FormData) {
  const customerId = parseInt(formData.get('customerId') as string);
  const service = formData.get('service') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const distribution = formData.get('distribution') as string;
  const revenue = parseFloat(formData.get('revenue') as string) || 0;
  const cost = parseFloat(formData.get('cost') as string) || 0;
  const note = formData.get('note') as string;
  const accountInfo = formData.get('accountInfo') as string;

  await queries.createSubscription({
    customerId,
    service,
    startDate,
    endDate,
    distribution,
    revenue,
    cost,
    note,
    accountInfo,
  });
  revalidatePath('/orders');
  revalidatePath('/today');
  revalidatePath('/customers');
}

// Create order with customer name (search or create new)
export async function createOrderWithCustomerAction(formData: FormData) {
  const customerName = formData.get('customerName') as string;
  const customerContact = formData.get('customerContact') as string || '';
  const service = formData.get('service') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const distribution = formData.get('distribution') as string;
  const revenue = parseFloat(formData.get('revenue') as string) || 0;
  const cost = parseFloat(formData.get('cost') as string) || 0;
  const note = formData.get('note') as string;
  const accountInfo = formData.get('accountInfo') as string;
  const paymentStatus = (formData.get('paymentStatus') === 'on' ? 'paid' : 'unpaid') as 'paid' | 'unpaid';
  const source = formData.get('source') as string || 'Manual Order';

  if (!customerName) {
    throw new Error('Customer name is required');
  }

  // Create customer
  const newCustomer = await queries.createCustomer({
    name: customerName,
    contact: customerContact,
    source: source,
    note: `Created from Orders page`,
  });
  const customerId = newCustomer.id;

  // Create subscription
  // We need to pass customer Name too because Excel stores it flat
  await queries.createSubscription({
    customerId,
    customerName, // Added
    customerContact, // Added
    customerSource: source, // Use the provided channel/source
    service,
    startDate,
    endDate,
    distribution,
    revenue,
    cost,
    note,
    accountInfo,
    paymentStatus,
    // Fix: If paid immediately, set completedAt so it shows in Today's revenue
    completedAt: paymentStatus === 'paid' ? new Date().toISOString() : undefined
  });

  revalidatePath('/orders');
  revalidatePath('/today');
  revalidatePath('/customers');

  return { success: true, customerId, isNewCustomer: true };
}

export async function updateSubscriptionAction(id: number, data: {
  renewalStatus?: 'pending' | 'renewed' | 'not_renewing';
  paymentStatus?: 'unpaid' | 'paid' | 'not_paying';
  lastContactedAt?: string;
  contactCount?: number;
  accountInfo?: string;
  note?: string;
  reminderDate?: string;
  completedAt?: string;
  // Additional fields for edit form
  service?: string;
  revenue?: number;
  cost?: number;
  startDate?: string;
  endDate?: string;
  customerName?: string;
}) {
  // Handle customerName update - need to update customers table
  if (data.customerName) {
    const subs = await queries.getSubscriptions();
    const currentSub = subs.find(s => s.id === id);
    if (currentSub) {
      // Update the customer's name in the customers table
      await queries.updateCustomer(currentSub.customerId, { name: data.customerName });
    }
  }

  // Remove customerName from data since it's handled separately
  const { customerName, ...subscriptionData } = data;

  // Auto-set completedAt when order is completed
  const updateData: typeof subscriptionData & { completedAt?: string } = { ...subscriptionData };

  // If marking as paid or renewed, check if we should set completedAt
  if (subscriptionData.paymentStatus === 'paid' || subscriptionData.renewalStatus === 'renewed') {
    // Fetch current state to check if conditions are met
    const subs = await queries.getSubscriptions();
    const currentSub = subs.find(s => s.id === id);

    if (currentSub) {
      const willBePaid = subscriptionData.paymentStatus === 'paid' || currentSub.paymentStatus === 'paid';
      const willBeRenewed = subscriptionData.renewalStatus === 'renewed' || currentSub.renewalStatus === 'renewed';

      // Get today's date in YYYY-MM-DD format for comparison
      const todayDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
      const todayISOStr = new Date().toISOString();

      // Check if it's a new order (startDate >= today)
      const isNewOrder = currentSub.startDate >= todayDateStr;

      // Set completedAt if:
      // 1. BOTH paid AND renewed (renewal workflow), OR
      // 2. New order AND paid (quick sale workflow)
      if ((willBePaid && willBeRenewed) || (isNewOrder && willBePaid)) {
        updateData.completedAt = todayISOStr;
      }
    }
  }

  await queries.updateSubscription(id, updateData);
  revalidatePath('/orders');
  revalidatePath('/today');
  revalidatePath('/customers');
}

export async function deleteSubscriptionAction(id: number) {
  await queries.deleteSubscription(id);
  revalidatePath('/orders');
  revalidatePath('/today');
  revalidatePath('/customers');
}

export async function quickRenewAction(subscriptionId: number) {
  const newSub = await queries.quickRenew(subscriptionId);
  revalidatePath('/orders');
  revalidatePath('/today');
  revalidatePath('/customers');
  return newSub;
}

export async function renewSubscriptionAction(oldSubscriptionId: number, formData: FormData) {
  const customerName = formData.get('customerName') as string;
  const service = formData.get('service') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const revenue = parseFloat(formData.get('revenue') as string) || 0;
  const cost = parseFloat(formData.get('cost') as string) || 0;
  const note = formData.get('note') as string;
  const accountInfo = formData.get('accountInfo') as string;
  const paymentStatus = (formData.get('paymentStatus') === 'on' ? 'paid' : 'unpaid') as 'paid' | 'unpaid';
  const inventoryId = parseInt(formData.get('inventoryId') as string);

  // Get old subscription to get customerId and distribution
  const subs = await queries.getSubscriptions();
  const oldSub = subs.find(s => s.id === oldSubscriptionId);

  if (!oldSub) throw new Error('Subscription not found');

  const customerId = oldSub.customerId;
  const distribution = (oldSub as any).distribution; // Type might be loose

  // Validate Inventory if selected
  let inventoryItem = null;
  if (inventoryId && inventoryId > 0) {
    const items = await queries.getInventoryItems();
    inventoryItem = items.find(i => i.id === inventoryId);

    if (!inventoryItem) throw new Error('Inventory item not found');
    if (inventoryItem.status !== 'available') throw new Error(`Inventory item is ${inventoryItem.status}`);
  }

  // Update customer name if it changed
  if (customerName && customerName !== oldSub.customerName) {
    await queries.updateCustomer(customerId, { name: customerName });
  }

  // Create new subscription
  const result = await queries.createSubscription({
    customerId,
    customerName: customerName || oldSub.customerName, // Use new name if provided
    customerContact: oldSub.customerContact || '', // Needed
    service,
    startDate,
    endDate,
    distribution: distribution || undefined,
    revenue,
    cost,
    note,
    accountInfo,
    paymentStatus,
  });

  // Handle Inventory Consumption
  if (inventoryId && inventoryId > 0 && inventoryItem) {
    // 1. Mark inventory as delivered
    await queries.updateInventoryStatus(inventoryId, 'delivered');

    // 2. Create delivery record
    await queries.deliverItem(result.id, service, 'Renewed with Inventory Item #' + inventoryId, inventoryId);
  }

  // Update new subscription payment status/completedAt if paid
  if (paymentStatus === 'paid') {
    const updatePayload: any = { paymentStatus: 'paid' };
    // For renewals, if paid, it's considered completed today
    updatePayload.completedAt = new Date().toISOString();
    await queries.updateSubscription(result.id, updatePayload);
  }

  // Mark old subscription as renewed
  // We do NOT mark old subscription as paid automatically unless it was already paid. 
  // Usually renewal clears the 'pending' status.
  await queries.updateSubscription(oldSubscriptionId, {
    renewalStatus: 'renewed'
  });

  revalidatePath('/orders');
  revalidatePath('/today');
  revalidatePath('/customers');
  revalidatePath('/inventory');

  return result;
}

import { FILES, getWorkbook, saveWorkbook } from '@/lib/excel/client';

// ==================== CLEANUP ====================

export async function cleanupDuplicatesAction() {
  // 1. Fetch all subscriptions from DB
  const allSubs = await db.select({
    sub: subscriptions,
    customerName: customers.name
  })
    .from(subscriptions)
    .leftJoin(customers, eq(subscriptions.customerId, customers.id))
    .orderBy(desc(subscriptions.id));

  const groups = new Map<string, number[]>(); // Key -> Array of IDs
  const toDelete: number[] = [];

  // 2. Iterate to find duplicates
  for (const { sub, customerName } of allSubs) {
    let key = '';

    // Strict Key: Name + Account + Service + Start + End
    // This ensures we only delete EXACT duplicates (e.g. double import), not renewals.
    const name = (customerName || '').trim().toLowerCase();
    const info = (sub.accountInfo || '').trim().toLowerCase();
    const service = (sub.service || '').trim().toLowerCase();
    const start = (sub.startDate || '').trim();
    const end = (sub.endDate || '').trim();

    key = `${name}|${info}|${service}|${start}|${end}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(sub.id);
  }

  // 3. Keep latest ID
  groups.forEach((ids) => {
    if (ids.length > 1) {
      ids.sort((a, b) => b - a); // DESC
      for (let i = 1; i < ids.length; i++) {
        toDelete.push(ids[i]);
      }
    }
  });

  // 4. Batch delete
  if (toDelete.length > 0) {
    const batchSize = 50;
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      await db.delete(subscriptions).where(inArray(subscriptions.id, batch));
    }
  }

  revalidatePath('/orders');
  revalidatePath('/today');
  revalidatePath('/customers');

  return { success: true, deletedCount: toDelete.length };
}

// ==================== INVENTORY ====================

export async function getInventoryItemsAction(filter?: { service?: string; status?: string }) {
  return queries.getInventoryItems(filter);
}

export async function createInventoryItemAction(formData: FormData) {
  const service = formData.get('service') as string;
  const distribution = formData.get('distribution') as string;
  const secretPayload = formData.get('secretPayload') as string;
  const cost = parseFloat(formData.get('cost') as string) || 0;
  const expiresAt = formData.get('expiresAt') as string || null;
  const note = formData.get('note') as string;

  await queries.createInventoryItem({ service, distribution, secretPayload, cost, expiresAt, note });
  revalidatePath('/inventory');
}

export async function importInventoryAction(items: Array<{
  service: string;
  distribution?: string;
  secretPayload: string;
  cost?: number;
  expiresAt?: string | null;
}>, batchName?: string) {
  const result = await queries.importInventoryItems(items, batchName);
  revalidatePath('/inventory');
  return result;
}

export async function updateInventoryStatusAction(id: number, status: 'available' | 'delivered' | 'invalid') {
  await queries.updateInventoryStatus(id, status);
  revalidatePath('/inventory');
}

export async function updateInventoryItemAction(id: number, data: {
  service?: string;
  secretPayload?: string;
  cost?: number;
  expiresAt?: string | null;
  note?: string;
  distribution?: string;
}) {
  await queries.updateInventoryItem(id, data);
  revalidatePath('/inventory');
}

export async function deleteInventoryItemAction(id: number) {
  await queries.deleteInventoryItem(id);
  revalidatePath('/inventory');
}

export async function sellInventoryItemAction(formData: FormData) {
  const inventoryId = parseInt(formData.get('inventoryId') as string);
  const customerName = formData.get('customerName') as string;
  const contact = formData.get('contact') as string;
  const salePrice = parseFloat(formData.get('salePrice') as string) || 0;
  // Use startDate/endDate instead of durationMonths
  const startDateStr = formData.get('startDate') as string;
  const endDateStr = formData.get('endDate') as string;
  const note = formData.get('note') as string;
  const source = formData.get('source') as string || 'Direct Sale';
  const paymentStatus = formData.get('paymentStatus') as 'paid' | 'unpaid' || 'unpaid';

  // Transaction-like safety: Validate ALL before making any changes
  try {
    // Step 1: Input Validation
    if (!customerName || customerName.trim() === '') {
      return { success: false, error: 'Tên khách hàng không được để trống' };
    }
    if (salePrice <= 0) {
      return { success: false, error: 'Giá bán phải lớn hơn 0' };
    }
    // Allow ID = -1 for virtual/manual items
    if (isNaN(inventoryId)) {
      return { success: false, error: 'ID sản phẩm không hợp lệ' };
    }
    // Validate dates
    if (!startDateStr || !endDateStr) {
      return { success: false, error: 'Ngày bắt đầu và kết thúc không được để trống' };
    }

    // Step 2: Pre-flight checks
    // If ID > 0, verify inventory exists
    let item: any = null;

    if (inventoryId > 0) {
      const items = await queries.getInventoryItems();
      item = items.find(i => i.id === inventoryId);

      if (!item) {
        return { success: false, error: 'Không tìm thấy sản phẩm trong kho' };
      }
      if (item.status !== 'available') {
        return { success: false, error: 'Sản phẩm không còn khả dụng (trạng thái: ' + item.status + ')' };
      }
    } else {
      // Virtual Item Construction for Manual Entry
      item = {
        id: -1,
        service: formData.get('virtualService') as string,
        secretPayload: formData.get('virtualSecret') as string,
        cost: parseFloat(formData.get('virtualCost') as string) || 0,
        distribution: 'Manual Input',
        status: 'available' // Virtual status
      };

      if (!item.service) return { success: false, error: 'Tên sản phẩm không được để trống' };
    }

    // All validations passed - proceed with transaction

    // Step 3: Get/Create Customer (with lookup to avoid duplicates)
    let customerId: number;
    try {
      const existingCustomer = await queries.findCustomerByNameAndContact(customerName, contact);

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const newCustomer = await queries.createCustomer({
          name: customerName,
          contact: contact,
          source: source,
          note: `Created from Inventory Sale of ${item.service}`,
        });
        customerId = newCustomer.id;
      }
    } catch (error: any) {
      return { success: false, error: 'Lỗi khi xử lý thông tin khách hàng: ' + error.message };
    }

    // Step 4: Create Subscription
    let sub;
    try {
      sub = await queries.createSubscription({
        customerId,
        customerName,
        customerContact: contact,
        customerSource: source,
        service: item.service,
        startDate: startDateStr,
        endDate: endDateStr,
        revenue: salePrice,
        cost: item.cost || 0,
        distribution: item.distribution || 'Stock',
        accountInfo: item.secretPayload,
        note: note,
      });
    } catch (error: any) {
      return { success: false, error: 'Lỗi khi tạo đơn hàng: ' + error.message };
    }

    // Step 5: Update Subscription metadata
    try {
      await queries.updateSubscription(sub.id, { contactCount: 1 });
      if (paymentStatus === 'paid') {
        // Set both paymentStatus AND completedAt so it shows in Today's "Hoàn tất hôm nay"
        await queries.updateSubscription(sub.id, {
          paymentStatus: 'paid',
          completedAt: new Date().toISOString()
        });
      }
    } catch (error: any) {
      // Non-critical, log but continue
      console.warn('Warning: Could not update subscription metadata:', error);
    }

    // Step 6: Create Delivery (with inventory tracking)
    try {
      await queries.deliverItem(sub.id, item.service, 'Sold directly from inventory', item.id);
    } catch (error: any) {
      // If delivery fails, try to rollback subscription (in real DB would use transaction)
      console.error('Error creating delivery, subscription already created:', error);
      // Note: In Excel-based system, we can't easily rollback, but we log the error
      return {
        success: false,
        error: 'Đã tạo đơn hàng nhưng lỗi khi tạo delivery. Vui lòng kiểm tra lại.',
        subscriptionId: sub.id
      };
    }

    // Step 7: Update Inventory Status (final step)
    // Only for real inventory items
    if (inventoryId > 0) {
      try {
        await queries.updateInventoryStatus(item.id, 'delivered');
      } catch (error: any) {
        // Critical: inventory should be marked as delivered
        console.error('Critical: Could not update inventory status:', error);
        return {
          success: false,
          error: 'Đã tạo đơn hàng nhưng lỗi khi cập nhật trạng thái kho. Vui lòng kiểm tra lại.',
          subscriptionId: sub.id
        };
      }
    }

    // All steps completed successfully
    revalidatePath('/inventory');
    revalidatePath('/orders');
    revalidatePath('/customers');
    revalidatePath('/today');

    return { success: true, subscriptionId: sub.id, secretPayload: item.secretPayload };
  } catch (error: any) {
    console.error('Unexpected error in sellInventoryItemAction:', error);
    return { success: false, error: 'Lỗi không mong đợi: ' + error.message };
  }
}

// ==================== DELIVERIES ====================

export async function getDeliveriesBySubscriptionAction(subscriptionId: number) {
  return queries.getDeliveriesBySubscription(subscriptionId);
}

export async function deliverItemAction(subscriptionId: number, service: string, note?: string, inventoryId?: number) {
  try {
    const result = await queries.deliverItem(subscriptionId, service, note, inventoryId);
    revalidatePath('/orders');
    revalidatePath('/customers');
    revalidatePath('/inventory');
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==================== WARRANTIES ====================

export async function getWarrantiesAction(filter?: { status?: string }) {
  return queries.getWarranties(filter);
}

export async function createWarrantyAction(formData: FormData) {
  const subscriptionId = parseInt(formData.get('subscriptionId') as string);
  const issueDate = formData.get('issueDate') as string;
  const issueDescription = formData.get('issueDescription') as string;
  const note = formData.get('note') as string;

  // Get subscription info to auto-fill customer name and service
  const subscriptions = await queries.getSubscriptions();
  const subscription = subscriptions.find(s => s.id === subscriptionId);

  await queries.createWarranty({
    subscriptionId,
    issueDate,
    issueDescription,
    note,
    customerName: subscription?.customerName,
    service: subscription?.service
  });
  revalidatePath('/warranty');
}

export async function resolveWarrantyAction(warrantyId: number, service: string, manualAccountInfo?: string, manualCost?: number) {
  try {
    // Validate warranty ID
    if (!warrantyId || warrantyId <= 0) {
      return { success: false, error: 'ID bảo hành không hợp lệ' };
    }

    // Validate cost if provided
    if (manualCost !== undefined && manualCost < 0) {
      return { success: false, error: 'Chi phí bảo hành không được âm' };
    }

    // Prepare manual input if provided
    const manualInput = manualAccountInfo || manualCost !== undefined
      ? {
        accountInfo: manualAccountInfo,
        cost: manualCost !== undefined ? manualCost : 0
      }
      : undefined;

    // Resolve warranty (includes auto inventory selection, subscription update, cost tracking)
    const result = await queries.resolveWarranty(warrantyId, service, manualInput);

    if (!result.success) {
      return { success: false, error: 'Không thể xử lý bảo hành. Vui lòng kiểm tra lại.' };
    }

    revalidatePath('/warranty');
    revalidatePath('/inventory');
    revalidatePath('/orders'); // Revalidate orders to show updated cost

    return result;
  } catch (error: any) {
    console.error('Error resolving warranty:', error);
    return { success: false, error: 'Lỗi khi xử lý bảo hành: ' + error.message };
  }
}

export async function resolveAllPendingWarrantiesAction() {
  try {
    // 1. Get all pending warranties
    const warranties = await queries.getWarranties({ status: 'pending' });

    if (warranties.length === 0) {
      return { success: true, count: 0, message: 'Không có yêu cầu nào cần duyệt' };
    }

    let successCount = 0;
    let failCount = 0;

    // 2. Loop and resolve each using 'auto' method
    for (const warranty of warranties) {
      try {
        const result = await resolveWarrantyAction(warranty.id, warranty.service);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        failCount++;
      }
    }

    revalidatePath('/warranty');
    revalidatePath('/inventory');
    revalidatePath('/orders');

    return {
      success: true,
      count: successCount,
      failCount,
      message: `Đã duyệt thành công ${successCount} yêu cầu. Thất bại ${failCount} (do hết kho hoặc lỗi).`
    };
  } catch (error: any) {
    return { success: false, error: 'Lỗi hệ thống: ' + error.message };
  }
}

export async function rejectWarrantyAction(warrantyId: number, note?: string) {
  await queries.rejectWarranty(warrantyId, note);
  revalidatePath('/warranty');
}

// ==================== REPORTS ====================

export async function getReportStatsAction(startDate?: string, endDate?: string) {
  return queries.getReportStats(startDate, endDate);
}

export async function getGrowthStatsAction(months = 12) {
  return queries.getGrowthStats(months);
}

export async function getMonthlyServiceStatsAction(months = 3) {
  return queries.getMonthlyServiceStats(months);
}

export async function getProjectedRevenueAction() {
  return queries.getProjectedRevenue();
}

// ==================== SERVICES ====================

export async function getServicesAction() {
  return queries.getServices();
}

// ==================== DATA IMPORT ====================

function parseCurrency(value: string): number {
  if (!value || value.trim() === '') return 0;
  // Remove "đ", spaces, dots, commas, negative signs (we'll handle separately)
  const cleaned = value.replace(/[đ\s.,]/g, '');
  const num = parseFloat(cleaned) || 0;
  // Handle negative values (like -100.000 đ)
  if (value.includes('-') && num > 0) return -num;
  return num;
}

function parseDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  const trimmed = dateStr.trim();

  // Format 0: Excel serial date (number)
  // Excel stores dates as days since 1899-12-30 (with a leap year bug)
  if (/^\d+$/.test(trimmed) || /^\d+\.\d+$/.test(trimmed)) {
    const serialNum = parseFloat(trimmed);
    if (serialNum > 40000 && serialNum < 50000) { // Reasonable range for 2010-2036
      // Excel serial date: days since Dec 30, 1899
      // But Excel incorrectly treats 1900 as leap year, so we subtract 1 for dates after Feb 28, 1900
      const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
      const date = new Date(excelEpoch.getTime() + (serialNum - 1) * 24 * 60 * 60 * 1000);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  }

  // Format 1: d/M/yyyy or dd/MM/yyyy (Common in VN)
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length !== 3) return '';

    let day = parts[0].trim();
    let month = parts[1].trim();
    let year = parts[2].trim();

    if (year.length === 2) year = '20' + year;
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');

    const date = new Date(`${year}-${month}-${day}`);
    if (isNaN(date.getTime())) return '';
    return `${year}-${month}-${day}`;
  }

  // Format 2: yyyy-MM-dd (ISO / Database)
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length !== 3) return '';
    // Validate it's a real date
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) return '';
    return trimmed;
  }

  return '';
}

export async function importDataAction(rawData: string) {
  return importDataInternal(rawData);
}

async function importDataInternal(rawData: string) {
  try {
    const lines = rawData.trim().split('\n').filter(line => line.trim() !== '');
    const customerMap = new Map<string, number>();
    let customersAdded = 0;
    let subscriptionsAdded = 0;
    let errors: string[] = [];

    // Cutoff date for historical data: 2026-01-23
    const cutoffDate = '2026-01-23';

    for (const line of lines) {
      const parts = line.split('\t');

      // Skip empty lines, summary lines, or lines that are clearly totals
      if (parts.length < 5) continue;

      const firstCol = parts[0]?.trim() || '';
      const secondCol = parts[1]?.trim() || '';

      // Skip summary/total lines
      if (
        firstCol.toLowerCase().includes('tổng') ||
        firstCol.toLowerCase().includes('total') ||
        secondCol.toLowerCase().includes('tổng') ||
        (!firstCol && !secondCol) ||
        (firstCol.match(/^\d+$/) && !secondCol)
      ) {
        continue;
      }

      try {
        let source = '';
        let customerName = '';
        let accountInfo = '';
        let service = '';
        let startDateStr = '';
        let endDateStr = '';
        let distribution = '';
        let revenueStr = '0 đ';
        let costStr = '0 đ';
        let note = '';

        // Check if first column is a number (row number)
        if (firstCol.match(/^\d+$/)) {
          // Format with row number
          source = parts[1]?.trim() || '';
          customerName = parts[2]?.trim() || '';
          accountInfo = parts[3]?.trim() || '';
          service = parts[4]?.trim() || '';
          startDateStr = parts[5]?.trim() || '';
          endDateStr = parts[6]?.trim() || '';
          distribution = parts[7]?.trim() || '';
          revenueStr = parts[8]?.trim() || '0 đ';
          costStr = parts[9]?.trim() || '0 đ';
          note = parts[11]?.trim() || '';
        } else {
          // Format without row number
          source = parts[0]?.trim() || '';
          customerName = parts[1]?.trim() || '';
          accountInfo = parts[2]?.trim() || '';
          service = parts[3]?.trim() || '';
          startDateStr = parts[4]?.trim() || '';
          endDateStr = parts[5]?.trim() || '';
          distribution = parts[6]?.trim() || '';
          revenueStr = parts[7]?.trim() || '0 đ';
          costStr = parts[8]?.trim() || '0 đ';
          note = parts[10]?.trim() || '';
        }

        // Skip if missing essential fields
        if (!customerName || !service || !startDateStr) {
          continue;
        }

        // If end_date is empty, skip (historical rows missing end date)
        if (!endDateStr || endDateStr.trim() === '') {
          continue;
        }

        // Parse dates
        const startDate = parseDate(startDateStr);
        const endDate = parseDate(endDateStr);

        if (!startDate || !endDate) {
          errors.push(`Invalid date format: ${customerName} - ${startDateStr}/${endDateStr}`);
          continue;
        }

        // Get or create customer
        // Key is name|source to distinguish same name but different source
        const customerKey = `${customerName}|${source}`;
        let customerId = customerMap.get(customerKey);

        if (!customerId) {
          // Since we are using Excel, we generally just blindly insert to separate sheets or trust Name?
          // Since existingCustomers check is hard, let's create new or reuse logic if migrated
          // We will preserve the logic of 'createCustomer' which returns a mock ID if simplified

          // Re-instating logic that might have been lost or simplified:
          // Just call createCustomer from queries
          const newCustomer = await queries.createCustomer({
            name: customerName,
            source: source,
            contact: accountInfo,
          });
          customerId = newCustomer.id;
          customersAdded++;
          customerMap.set(customerKey, customerId!);
        }

        // Parse revenue and cost
        const revenue = parseCurrency(revenueStr);
        const cost = parseCurrency(costStr);

        // Determine status: if end_date < cutoff, mark as completed
        const isHistorical = endDate < cutoffDate;
        const renewalStatus = isHistorical ? 'renewed' : 'pending';
        const paymentStatus = isHistorical ? 'paid' : 'unpaid';

        // Create subscription
        await queries.createSubscription({
          customerId: customerId!,
          customerName: customerName,
          customerContact: accountInfo,
          service,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: (endDate ? format(endDate, 'yyyy-MM-dd') : ''),
          distribution: distribution || null,
          revenue,
          cost,
          paymentStatus: isHistorical ? 'paid' : 'unpaid',
          note,
          accountInfo,
        });

        subscriptionsAdded++;
      } catch (error: any) {
        errors.push(`Error processing line: ${line.substring(0, 50)}... - ${error.message}`);
      }
    }

    // Revalidate all paths
    revalidatePath('/customers');
    revalidatePath('/orders');
    revalidatePath('/today');
    revalidatePath('/reports');

    return {
      success: true,
      customersAdded,
      subscriptionsAdded,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ==================== EXCEL IMPORT ACTIONS ====================

export async function downloadTemplateAction() {
  const buffer = generateTemplate();
  return buffer.toString('base64');
}

async function processExcelImport(buffer: Buffer) {
  try {
    const data = parseExcel(buffer);

    let customersAdded = 0;
    let subscriptionsAdded = 0;
    let errors: string[] = [];
    const customerMap = new Map<string, number>();

    // Cutoff date for historical data
    const cutoffDate = new Date().toISOString().split('T')[0];

    for (const row of data) {
      const r = row as any[];
      // [0] Name, [1] AccountInfo, [2] Source, [3] Service, [4] Start, [5] End, [6] Dist, [7] Rev, [8] Cost, [9] Note, [10] Contact, [11] Category
      const name = r[0]?.toString() || '';
      const accountInfo = r[1]?.toString() || '';
      const source = r[2]?.toString() || '';
      const service = r[3]?.toString() || '';
      const startDateStr = r[4]?.toString() || '';
      const endDateStr = r[5]?.toString() || '';
      const distribution = r[6]?.toString() || '';
      const revenue = parseFloat(r[7]?.toString() || '0');
      const cost = parseFloat(r[8]?.toString() || '0');
      const note = r[9]?.toString() || '';
      const contact = r[10]?.toString() || '';
      const category = r[11]?.toString() || '';

      if (!name) continue;

      // 1. Upsert Customer
      // Key is name|source
      const customerKey = `${name}|${source}`;
      let customerId = customerMap.get(customerKey);

      if (!customerId) {
        let existing: any[] = [];

        if (source) {
          existing = await db.select().from(customers).where(
            and(
              eq(customers.name, name),
              eq(customers.source, source)
            )
          ).limit(1);
        } else {
          // Fallback if no source in Excel: match by name
          existing = await db.select().from(customers).where(eq(customers.name, name)).limit(1);
        }

        if (existing.length > 0) {
          customerId = existing[0].id;
        } else {
          const newCustomer = await queries.createCustomer({
            name,
            source,
            contact,
            note: `Imported from Excel`,
          });
          customerId = newCustomer.id;
          customersAdded++;
        }
        customerMap.set(customerKey, customerId!);
      }

      // 2. Add Subscription
      if (service && startDateStr) {
        try {
          // Parse dates
          const startDate = parseDate(startDateStr);
          const endDate = parseDate(endDateStr);

          // Skip if dates are invalid
          if (!startDate) {
            // Try to be lenient? If start date is missing, we can't create sub.
            // If parseDate returns empty, it's invalid.
            continue;
          }

          const isHistorical = endDate && endDate < cutoffDate;

          await queries.createSubscription({
            customerId: customerId!,
            customerName: name,
            service,
            startDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
            endDate: endDate ? format(endDate, 'yyyy-MM-dd') : '',
            distribution,
            revenue,
            cost,
            paymentStatus: isHistorical ? 'paid' : 'unpaid',
            accountInfo,
            note
          });
          subscriptionsAdded++;
        } catch (e: any) {
          errors.push(`Error adding subscription for ${name}: ${e.message}`);
        }
      }
    }

    revalidatePath('/customers');
    revalidatePath('/orders');
    revalidatePath('/today');
    revalidatePath('/reports');

    return {
      success: true,
      customersAdded,
      subscriptionsAdded,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error: any) {
    console.error('Import Error:', error);
    return { success: false, error: 'Failed to process file: ' + error.message };
  }
}

export async function importCustomersExcelAction(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return processExcelImport(buffer);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==================== SYSTEM ACTIONS ====================

export async function getSystemConfigAction(key: string) {
  return queries.getSystemConfig(key);
}

export async function saveSystemConfigAction(key: string, value: string) {
  await queries.setSystemConfig(key, value);
  revalidatePath('/settings');
}

export async function syncFromLocalFileAction() {
  try {
    // Skip on Vercel / Cloud environment
    if (process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV) {
      return { success: true, skipped: true, message: 'Cloud environment - Auto sync disabled' };
    }

    const filePath = await queries.getSystemConfig('excel_file_path');
    if (!filePath) {
      // Silent fail if not configured
      return { success: false, error: 'Chưa cấu hình đường dẫn file Excel' };
    }

    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File không tồn tại. Vui lòng kiểm tra lại đường dẫn.' };
    }

    // Read file as buffer
    const buffer = fs.readFileSync(filePath);

    // Process Excel
    const result = await processExcelImport(buffer);

    return result;
  } catch (error: any) {
    console.error('Auto sync error:', error);
    return { success: false, error: error.message };
  }
}

// ==================== TODAY STATS ====================

export async function getTodayStatsAction() {
  return queries.getTodayCompletedSubscriptions();
}

export async function getTodayDashboardDataAction() {
  return queries.getTodayDashboardData();
}

// ==================== TEMPLATES (QUICK REPLIES) ====================

// import * as templates from '@/lib/templates'; // Deprecated

export async function getTemplatesAction() {
  return queries.getTemplates();
}

export async function addTemplateAction(template: NewTemplate) {
  const result = await queries.createTemplate(template);
  revalidatePath('/templates');
  return result;
}

export async function updateTemplateAction(id: number, updates: Partial<Template>) {
  await queries.updateTemplate(id, updates);
  revalidatePath('/templates');
}

export async function deleteTemplateAction(id: number) {
  await queries.deleteTemplate(id);
  revalidatePath('/templates');
}

// ==================== FAMILIES ====================

import { families, familyMembers } from '@/lib/db/schema';

export async function getFamiliesAction() {
  // Get all families with their members
  const allFamilies = await db.select().from(families).orderBy(families.service, families.name);
  const allMembers = await db.select().from(familyMembers).orderBy(familyMembers.slotNumber);

  // Group members by familyId
  const membersByFamily = new Map<number, typeof allMembers>();
  for (const member of allMembers) {
    if (!membersByFamily.has(member.familyId)) {
      membersByFamily.set(member.familyId, []);
    }
    membersByFamily.get(member.familyId)!.push(member);
  }

  // Return families with members
  return allFamilies.map(family => ({
    ...family,
    members: membersByFamily.get(family.id) || []
  }));
}

export async function createFamilyAction(formData: FormData) {
  const name = formData.get('name') as string;
  const service = formData.get('service') as string;
  const ownerAccount = formData.get('ownerAccount') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const paymentCard = formData.get('paymentCard') as string;
  const paymentDay = parseInt(formData.get('paymentDay') as string) || null;
  const note = formData.get('note') as string;

  const result = await db.insert(families).values({
    name,
    service,
    ownerAccount,
    startDate,
    endDate,
    paymentCard: paymentCard || null,
    paymentDay,
    note: note || null,
  }).returning();

  revalidatePath('/family');
  return result[0];
}

export async function updateFamilyAction(id: number, data: {
  name?: string;
  service?: string;
  ownerAccount?: string;
  startDate?: string;
  endDate?: string;
  paymentCard?: string;
  paymentDay?: number | null;
  note?: string;
}) {
  await db.update(families).set(data).where(eq(families.id, id));
  revalidatePath('/family');
}

export async function deleteFamilyAction(id: number) {
  // Delete all members first
  await db.delete(familyMembers).where(eq(familyMembers.familyId, id));
  // Delete family
  await db.delete(families).where(eq(families.id, id));
  revalidatePath('/family');
}

// Family Members

export async function addFamilyMemberAction(familyId: number, formData: FormData) {
  const slotNumber = parseInt(formData.get('slotNumber') as string) || 1;
  const memberName = formData.get('memberName') as string;
  const memberAccount = formData.get('memberAccount') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const note = formData.get('note') as string;

  const result = await db.insert(familyMembers).values({
    familyId,
    slotNumber,
    memberName: memberName || null,
    memberAccount: memberAccount || null,
    startDate: startDate || null,
    endDate: endDate || null,
    note: note || null,
  }).returning();

  revalidatePath('/family');
  return result[0];
}

export async function updateFamilyMemberAction(id: number, data: {
  slotNumber?: number;
  memberName?: string | null;
  memberAccount?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  note?: string | null;
}) {
  await db.update(familyMembers).set(data).where(eq(familyMembers.id, id));
  revalidatePath('/family');
}

export async function deleteFamilyMemberAction(id: number) {
  await db.delete(familyMembers).where(eq(familyMembers.id, id));
  revalidatePath('/family');
}

export async function getFamilyServicesAction() {
  // Get distinct services from families
  const result = await db.selectDistinct({ service: families.service }).from(families);
  return result.map(r => r.service);
}

export async function confirmFamilyPaymentAction(id: number) {
  // Get current family
  const family = await db.select().from(families).where(eq(families.id, id)).limit(1);
  if (!family.length) return;

  const current = family[0];

  // Add 1 month to start and end dates
  const startDate = new Date(current.startDate);
  const endDate = new Date(current.endDate);

  startDate.setMonth(startDate.getMonth() + 1);
  endDate.setMonth(endDate.getMonth() + 1);

  await db.update(families).set({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }).where(eq(families.id, id));

  revalidatePath('/family');
}

// ==================== ACCOUNTS ====================

import { getAccounts, addAccount, updateAccount, deleteAccount, AccountItem } from '@/lib/my-accounts';

export async function getAccountsAction() {
  return getAccounts();
}

export async function addAccountAction(data: Omit<AccountItem, 'id' | 'updatedAt'>) {
  const result = await addAccount(data);
  revalidatePath('/accounts');
  return result;
}

export async function updateAccountAction(id: string, data: Partial<AccountItem>) {
  await updateAccount(id, data);
  revalidatePath('/accounts');
}

export async function deleteAccountAction(id: string) {
  await deleteAccount(id);
  revalidatePath('/accounts');
}
