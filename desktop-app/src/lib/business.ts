import { differenceInDays, parseISO } from 'date-fns';
import { OverallStatus, RenewalStatus, PaymentStatus } from '@/types';

// Calculate overall status based on business rules
export function calculateOverallStatus(
    endDate: string,
    renewalStatus: RenewalStatus,
    paymentStatus: PaymentStatus,
    contactCount?: number
): OverallStatus {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let end = new Date(endDate);
    if (isNaN(end.getTime())) {
        return 'active'; // Default to active if date is invalid to avoid crash
    }
    end.setHours(0, 0, 0, 0);

    const daysUntilEnd = differenceInDays(end, today);

    // Closed if not renewing or not paying
    if (renewalStatus === 'not_renewing' || paymentStatus === 'not_paying') {
        return 'closed';
    }

    // Completed if renewed and paid
    if (renewalStatus === 'renewed' && paymentStatus === 'paid') {
        return 'completed';
    }

    // Overdue if past end date and still pending renewal
    if (daysUntilEnd < 0 && renewalStatus === 'pending') {
        return 'overdue';
    }

    // Needs reminder if expiring in next 3 days (inclusive of today) and pending renewal
    if (daysUntilEnd >= 0 && daysUntilEnd <= 3 && renewalStatus === 'pending') {
        return 'needs_reminder';
    }

    // Awaiting payment if Unpaid AND (Renewed OR Contacted)
    if (paymentStatus === 'unpaid') {
        if (renewalStatus === 'renewed') return 'awaiting_payment';
        if (contactCount && contactCount > 0) return 'awaiting_payment';
    }

    // Active - includes tomorrow (1 day), next week, etc.
    return 'active';
}

// Calculate days until end date
export function calculateDaysUntilEnd(endDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let end = new Date(endDate);
    if (isNaN(end.getTime())) {
        // Try parsing DD/MM/YYYY manually if needed, or just fail
        // For now, return a value that indicates error or just 0 (active)
        // But better to return a value that won't crash UI. 
        // If we return 0, it triggers "needs reminder".
        // Let's try to parse ISO if new Date fails? No, new Date covers ISO.
        return 0;
    }

    end.setHours(0, 0, 0, 0);

    return differenceInDays(end, today);
}

// Mask secret payload for display (show first 4 and last 2 chars)
export function maskSecret(secret: string): string {
    if (secret.length <= 8) {
        return '****';
    }
    const parts = secret.split('|');
    if (parts.length === 2) {
        // Format: email|password
        const email = parts[0];
        const password = parts[1];
        const maskedEmail = email.slice(0, 4) + '****' + (email.includes('@') ? email.slice(email.indexOf('@')) : '');
        const maskedPassword = '****';
        return `${maskedEmail}|${maskedPassword}`;
    }
    // Single key format
    return secret.slice(0, 4) + '****' + secret.slice(-2);
}

// Format currency (VND)
export function formatCurrency(amount: number | null): string {
    if (amount === null || amount === undefined) return '0đ';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
    }).format(amount);
}

// Calculate profit
export function calculateProfit(revenue: number | null, cost: number | null): number {
    return (revenue || 0) - (cost || 0);
}

// Status display configs
export const statusConfig = {
    overall: {
        needs_reminder: { label: '🔔 Cần nhắc', color: 'bg-orange-100 text-orange-800' },
        overdue: { label: '⚠️ Quá hạn', color: 'bg-red-100 text-red-800' },
        awaiting_payment: { label: '💸 Chờ thanh toán', color: 'bg-blue-100 text-blue-800' },
        completed: { label: '✅ Hoàn tất', color: 'bg-green-100 text-green-800' },
        closed: { label: '❌ Đóng', color: 'bg-gray-100 text-gray-800' },
        active: { label: '🟢 Đang hoạt động', color: 'bg-emerald-100 text-emerald-800' },
    },
    renewal: {
        pending: { label: 'Chưa gia hạn', color: 'bg-yellow-100 text-yellow-800' },
        renewed: { label: 'Đã gia hạn', color: 'bg-green-100 text-green-800' },
        not_renewing: { label: 'Không gia hạn', color: 'bg-gray-100 text-gray-800' },
    },
    payment: {
        unpaid: { label: 'Chưa thanh toán', color: 'bg-yellow-100 text-yellow-800' },
        paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
        not_paying: { label: 'Không thanh toán', color: 'bg-gray-100 text-gray-800' },
    },
    inventory: {
        available: { label: 'Còn hàng', color: 'bg-green-100 text-green-800' },
        delivered: { label: 'Đã giao', color: 'bg-blue-100 text-blue-800' },
        invalid: { label: 'Lỗi', color: 'bg-red-100 text-red-800' },
    },
    warranty: {
        pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
        resolved: { label: 'Đã xử lý', color: 'bg-green-100 text-green-800' },
        rejected: { label: 'Từ chối', color: 'bg-gray-100 text-gray-800' },
    },
};
