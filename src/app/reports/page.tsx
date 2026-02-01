import { getReportStatsAction, getGrowthStatsAction, getProjectedRevenueAction, getMonthlyServiceStatsAction } from '@/app/actions';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ReportsClient = dynamic(() => import('./reports-client').then(mod => mod.ReportsClient), {
    loading: () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-[300px] rounded-lg" />
                <Skeleton className="h-[300px] rounded-lg" />
            </div>
            <Skeleton className="h-[400px] rounded-lg" />
        </div>
    ),
});



export default async function ReportsPage() {
    // Calculate current month range (VN Timezone)
    const now = new Date();
    const vnYear = parseInt(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }));
    const vnMonth = parseInt(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', month: 'numeric' }));

    // Start of month: YYYY-MM-01
    const startOfMonth = `${vnYear}-${String(vnMonth).padStart(2, '0')}-01`;

    // End of month: Last day of the current month
    // We create a date for the 0th day of the NEXT month to get the last day of THIS month
    // Note: Date constructor uses 0-indexed months (0=Jan, 1=Feb...). vnMonth is 1-based.
    // So new Date(vnYear, vnMonth, 0) gives last day of vnMonth.
    // We need to avoid timezone shift, so we just use the day component.
    const lastDay = new Date(vnYear, vnMonth, 0).getDate();
    const endOfMonth = `${vnYear}-${String(vnMonth).padStart(2, '0')}-${lastDay}`;

    const stats = await getReportStatsAction(startOfMonth, endOfMonth);
    const growthStats = await getGrowthStatsAction(6); // Show last 6 months growth
    const monthlyServiceStats = await getMonthlyServiceStatsAction(3);
    const projectedStats = await getProjectedRevenueAction();

    return (
        <div className="max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Boss Dashboard</h1>
                <p className="text-gray-500 mt-1">Tổng quan tình hình kinh doanh</p>
            </div>

            <ReportsClient
                stats={stats}
                growthStats={growthStats}
                projectedStats={projectedStats}
                monthlyServiceStats={monthlyServiceStats}
            />
        </div>
    );
}

