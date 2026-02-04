import { getWarrantiesAction, getSubscriptionsAction } from '@/app/actions';
import { WarrantyClient } from './warranty-client';

export const dynamic = 'force-dynamic';

export default async function WarrantyPage() {
    const [warranties, subscriptions] = await Promise.all([
        getWarrantiesAction(),
        getSubscriptionsAction(),
    ]);

    return (
        <div className="max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Warranty</h1>
                <p className="text-gray-500 mt-1">Quản lý bảo hành và xử lý sự cố</p>
            </div>

            <WarrantyClient warranties={warranties} subscriptions={subscriptions} />
        </div>
    );
}
