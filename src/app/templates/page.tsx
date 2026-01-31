import { getTemplatesAction } from '@/app/actions';
import { TemplatesPageClient } from './templates-page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
    title: 'Templates | TPB Manage',
    description: 'Manage quick reply templates',
};

export default async function TemplatesPage() {
    const templates = await getTemplatesAction();

    return (
        <div className="container mx-auto py-6">
            <TemplatesPageClient templates={templates} />
        </div>
    );
}
