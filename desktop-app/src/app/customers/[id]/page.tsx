import { getCustomerByIdAction, getSubscriptionsByCustomerAction, updateSubscriptionAction, quickRenewAction, deliverItemAction, createOrderWithCustomerAction } from '@/app/actions';
import { notFound } from 'next/navigation';
import { CustomerDetailsClient } from './customer-details-client'; // Import client component

interface PageProps {
    params: Promise<{
        id: string;
    }>
}

export const dynamic = 'force-dynamic';

export default async function CustomerDetailsPage({ params }: PageProps) {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) notFound();

    const customer = await getCustomerByIdAction(id);
    if (!customer) notFound();

    const subscriptions = await getSubscriptionsByCustomerAction(id);

    const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const totalProfit = subscriptions.reduce((sum, s) => sum + ((s.revenue || 0) - (s.cost || 0)), 0);
    const totalOrders = subscriptions.length;

    let segment = 'new';
    if (totalRevenue > 1000000) segment = 'vip';
    else if (totalOrders > 5) segment = 'priority';
    else if (totalOrders > 1) segment = 'regular';

    const customerWithStats = {
        ...customer,
        totalOrders,
        totalRevenue,
        totalProfit,
        segment: segment as any,
        accountInfo: subscriptions.length > 0 ? subscriptions[0].accountInfo : null
    };

    return (
        <CustomerDetailsClient
            customer={customerWithStats}
            subscriptions={subscriptions}
        />
    );
}
