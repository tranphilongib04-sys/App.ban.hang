import { getInventoryItemsAction, getServicesAction, getCustomersAction } from '@/app/actions';
import { InventoryClient } from './inventory-client';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
    const [items, services, customers] = await Promise.all([
        getInventoryItemsAction(),
        getServicesAction(),
        getCustomersAction(),
    ]);

    return (
        <div className="max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
                <p className="text-gray-500 mt-1">Quản lý TK/MK và Keys</p>
            </div>

            <InventoryClient items={items} services={services.map(s => s.name)} customers={customers} />
        </div>
    );
}
