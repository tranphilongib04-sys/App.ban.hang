import { getAccountsAction } from '@/app/actions';
import { AccountsPageClient } from './accounts-page';

export const metadata = {
    title: 'Kho Tài Khoản | TPB Manage',
    description: 'Quản lý bảo mật các tài khoản',
};

export default async function AccountsPage() {
    const accounts = await getAccountsAction();

    return (
        <div className="container mx-auto py-6">
            <AccountsPageClient accounts={accounts} />
        </div>
    );
}
