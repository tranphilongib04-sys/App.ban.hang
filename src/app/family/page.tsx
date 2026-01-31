import { getFamiliesAction } from '@/app/actions';
import { FamilyClient } from './family-client';

export const dynamic = 'force-dynamic';

export default async function FamilyPage() {
    const families = await getFamiliesAction();

    return (
        <div className="max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Family</h1>
                <p className="text-gray-500 mt-1">Quản lý thành viên các gói Family (YouTube, Spotify, …)</p>
            </div>

            <FamilyClient families={families} />
        </div>
    );
}
