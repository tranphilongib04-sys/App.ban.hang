import { getInventoryItemsAction, getServicesAction, getCustomersAction, getInventorySummaryAction } from '@/app/actions';
import { InventoryClient } from './inventory-client';


export default async function InventoryPage() {
    const [summary, items, services, customers] = await Promise.all([
        getInventorySummaryAction(),
        getInventoryItemsAction(),
        getServicesAction(),
        getCustomersAction(),
    ]);

    return (
        <div className="max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
                <p className="text-gray-500 mt-1">Quản lý Master SKUs và Stock Items</p>
            </div>

            <InventoryClient
                items={items}
                summary={summary.success ? summary.inventory : []}
                services={services.map(s => s.name)}
                customers={customers}
            />
        </div>
    );
}
