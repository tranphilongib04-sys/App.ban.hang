import { getTodayDashboardDataAction, getGrowthStatsAction, getInventoryItemsAction, getCustomersAction } from '@/app/actions';
import { TodayDashboard } from './today-dashboard';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { SubscriptionWithCustomer } from '@/types';

export const dynamic = 'force-dynamic';

export default async function TodayPage() {
    const [{ fullList, todayStats }, growthStats, inventoryItems, customers] = await Promise.all([
        getTodayDashboardDataAction(),
        getGrowthStatsAction(),
        getInventoryItemsAction({ status: 'available' }), // Optimized fetch
        getCustomersAction(),
    ]);

    const subscriptions = fullList as SubscriptionWithCustomer[];

    // Filter relevant subscriptions for Today view
    // 1. Status is 'needs_reminder' (expiring today), 'overdue', or 'awaiting_payment'
    // 2. OR has a reminderDate that is due (today or past)
    const timeZone = 'Asia/Ho_Chi_Minh';
    const todayStr = formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd');

    const relevantSubs = subscriptions.filter(s => {
        // Exclude closed/not_renewing/renewed immediately
        if (s.renewalStatus === 'not_renewing') {
            return false;
        }

        // EXCLUDE RENEWED ITEMS - they are completed
        if (s.renewalStatus === 'renewed') {
            return false;
        }

        // SNOOZE LOGIC:
        if (s.reminderDate && s.reminderDate > todayStr) {
            return false;
        }

        // Include if status is relevant OR reminder due OR daysUntilEnd <= 0
        const isStatusRelevant = ['needs_reminder', 'overdue', 'awaiting_payment'].includes(s.overallStatus);
        const isReminderDue = s.reminderDate && s.reminderDate <= todayStr;
        const isExpiringOrOverdue = s.daysUntilEnd <= 0;

        return isStatusRelevant || isReminderDue || isExpiringOrOverdue;
    });

    // Split into categories

    // Unpaid Group (High priority)
    // STRICT RULE: Only show in "Awaiting Payment" if:
    // 1. It is explicitly "renewed" (User clicked "Renew")
    // 2. OR it is a NEW order (Start Date is Today/Future)
    const awaitingPayment = relevantSubs.filter(s => {
        if (s.paymentStatus !== 'unpaid') return false;
        if (s.renewalStatus === 'not_renewing') return false;

        const isNewOrder = s.startDate >= todayStr;
        return s.renewalStatus === 'renewed' || isNewOrder;
    });

    const awaitingPaymentIds = new Set(awaitingPayment.map(s => s.id));

    // Contacted (Takes priority over Reminder/Overdue)
    // Allow unpaid items here ONLY IF they are not in awaitingPayment
    const contacted = relevantSubs.filter(s => {
        if (awaitingPaymentIds.has(s.id)) return false;
        return (s.contactCount || 0) > 0;
    });

    const contactedIds = new Set(contacted.map(s => s.id));

    // Reminders (Expiring Today OR Explicit Reminder)
    const needsReminder = relevantSubs.filter(s => {
        if (s.renewalStatus === 'renewed') return false;
        if (awaitingPaymentIds.has(s.id)) return false; // STRICTLY exclude awaiting payment
        if (contactedIds.has(s.id)) return false;

        // Logic: Strictly show items expiring TODAY (0 days left) or having a specific reminder due today.
        // We ignore the broad 'needs_reminder' status (which includes 1-3 days upcoming) unless it is exactly today.

        return (s.daysUntilEnd === 0)
            || (s.reminderDate && s.reminderDate <= todayStr);
    });

    // Overdue (Expired)
    const overdue = relevantSubs.filter(s => {
        if (s.renewalStatus === 'renewed') return false;
        if (awaitingPaymentIds.has(s.id)) return false;
        if (contactedIds.has(s.id)) return false;

        // Logic: matches explicit status OR is expired (< 0 days)
        return s.overallStatus === 'overdue' || (s.daysUntilEnd < 0);
    });

    // Completed Today: ONLY orders that were explicitly marked as completed today (VN Time)
    const completedTodayList = subscriptions.filter(s => {
        if (!s.completedAt) return false;

        // Convert completion time to VN date string
        const compDateStr = formatInTimeZone(new Date(s.completedAt), timeZone, 'yyyy-MM-dd');

        return compDateStr === todayStr;
    });

    return (
        <div className="max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Today {todayStr && <span className="text-sm font-normal text-gray-500">({todayStr})</span>}</h1>
                <p className="text-gray-500 mt-1">Theo dõi subscription cần xử lý hôm nay</p>
            </div>

            <TodayDashboard
                needsReminder={needsReminder}
                overdue={overdue}
                awaitingPayment={awaitingPayment}
                contacted={contacted}
                completedToday={completedTodayList}
                todayRevenue={todayStats.todayRevenue}
                todayProfit={todayStats.todayProfit}
                growthStats={growthStats}
                inventoryItems={inventoryItems}
                customers={customers}
                currentDateStr={todayStr}
            />
        </div>
    );
}

