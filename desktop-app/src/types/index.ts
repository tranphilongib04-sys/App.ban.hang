// Overall status calculated from renewal and payment status
export type OverallStatus =
    | 'needs_reminder'
    | 'awaiting_payment'
    | 'completed'
    | 'closed'
    | 'overdue'
    | 'active';

export type RenewalStatus = 'pending' | 'renewed' | 'not_renewing';
export type PaymentStatus = 'unpaid' | 'paid' | 'not_paying';
export type InventoryStatus = 'available' | 'delivered' | 'invalid';
export type WarrantyStatus = 'pending' | 'resolved' | 'rejected';

// Import base types from schema
import {
    Customer,
    Subscription,
    InventoryItem,
    Delivery,
    Warranty
} from '@/lib/db/schema';

// Export base types
export type {
    Customer,
    Subscription,
    InventoryItem,
    Delivery,
    Warranty
};

export type CustomerSegment = 'vip' | 'priority' | 'regular' | 'new';

export interface CustomerWithStats extends Customer {
    accountInfo?: string | null;
    totalOrders: number;
    totalRevenue: number;
    totalProfit: number;
    segment: CustomerSegment;
}

// Extended subscription with customer info
export interface SubscriptionWithCustomer {
    id: number;
    customerId: number;
    customerName: string;
    customerContact: string | null;
    customerSource?: string | null;
    service: string;
    startDate: string;
    endDate: string;
    distribution: string | null;
    revenue: number | null;
    cost: number | null;
    renewalStatus: RenewalStatus;
    paymentStatus: PaymentStatus;
    overallStatus: OverallStatus;
    daysUntilEnd: number;
    lastContactedAt: string | null;
    contactCount: number | null;
    note: string | null;
    accountInfo: string | null;
    category: string | null;
    hasWarranty?: boolean;
    reminderDate?: string | null;
    completedAt?: string | null;
}

// Extended warranty with subscription info
export interface WarrantyWithDetails {
    id: number;
    subscriptionId: number;
    customerName: string;
    service: string;
    issueDate: string;
    issueDescription: string | null;
    warrantyStatus: WarrantyStatus;
    resolvedDate: string | null;
    replacementInventoryId: number | null;
    note: string | null;
    cost?: number | null;
    accountInfo?: string | null; // Added account info
}

// Extended delivery with details
export interface DeliveryWithDetails {
    id: number;
    subscriptionId: number;
    inventoryId: number;
    deliveredAt: string;
    deliveryNote: string | null;
    secretPayload: string;
    secretMasked: string;
    service: string;
}
