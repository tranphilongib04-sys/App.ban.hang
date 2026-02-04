import { getSubscriptionsAction, getCustomersAction, getInventoryItemsAction } from '@/app/actions';
import { OrdersClient } from './orders-client';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
    const [subscriptions, customers, inventoryItems] = await Promise.all([
        getSubscriptionsAction(),
        getCustomersAction(),
        getInventoryItemsAction({ status: 'available' }), // Only need available items
    ]);

    return (
        <div className="w-full px-4">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
                </div>
            </div>

            <OrdersClient
                subscriptions={subscriptions}
                customers={customers}
                inventoryItems={inventoryItems}
            />
        </div>
    );
}
