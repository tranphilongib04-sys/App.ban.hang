import { getCustomersWithStatsAction } from '@/app/actions';
import { CustomersClient } from './customers-client';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
    const customers = await getCustomersWithStatsAction();

    return (
        <div className="max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
                <p className="text-gray-500 mt-1">Quản lý danh sách khách hàng</p>
            </div>

            <CustomersClient customers={customers} />
        </div>
    );
}
