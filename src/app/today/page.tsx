import { getTodayDashboardDataAction, getGrowthStatsAction, getInventoryItemsAction, getCustomersAction } from '@/app/actions';
import { TodayDashboard } from './today-dashboard';
import { format } from 'date-fns';

import { SubscriptionWithCustomer } from '@/types';

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
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    const relevantSubs = subscriptions.filter(s => {
        // SNOOZE LOGIC:
        // If a specific reminder date is set for the FUTURE, hiding it from Today view until that date.
        // This allows users to "Snooze" expiring/overdue items to a later date.
        if (s.reminderDate && s.reminderDate > todayStr) {
            return false;
        }

        // Condition A: Explicit status matches
        const isStatusRelevant = ['needs_reminder', 'overdue', 'awaiting_payment'].includes(s.overallStatus);

        // Condition B: Reminder Date is due (regardless of status - though logic above handles snoozing)
        // If reminderDate <= todayStr, it falls through here. We want to show it.
        const isReminderDue = s.reminderDate && s.reminderDate <= todayStr;

        // Condition C: Unpaid - Removed to avoid flooding Today view with future items.
        // Unpaid items will only show if they started Today (via 'awaiting_payment' status)
        // OR if they are Overdue/Reminder.

        return isStatusRelevant || isReminderDue;
    });

    // Split into categories
    const contacted = relevantSubs.filter(s => (s.contactCount || 0) > 0 && s.overallStatus !== 'awaiting_payment' && s.paymentStatus !== 'unpaid');

    // Unpaid Group (High priority)
    // Filter from relevantSubs which now respects the stricter logic
    const awaitingPayment = relevantSubs.filter(s => s.paymentStatus === 'unpaid' && s.renewalStatus !== 'not_renewing');

    // Reminders (Expiring Today OR Explicit Reminder)
    // Exclude those already in awaitingPayment to avoid duplicates
    const needsReminder = relevantSubs.filter(s => {
        if (s.paymentStatus === 'unpaid') return false;
        return s.overallStatus === 'needs_reminder' || (s.reminderDate && s.reminderDate <= todayStr);
    });

    // Overdue (Expired)
    const overdue = relevantSubs.filter(s => {
        if (s.paymentStatus === 'unpaid') return false;
        return s.overallStatus === 'overdue';
    });

    // Completed Today (Paid & Started Today)
    const completedTodayList = subscriptions.filter(s =>
        s.startDate === todayStr && s.paymentStatus === 'paid'
    );

    return (
        <div className="max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Today</h1>
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
            />
        </div>
    );
}

