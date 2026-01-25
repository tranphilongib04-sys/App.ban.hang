import { getReportStatsAction, getGrowthStatsAction, getProjectedRevenueAction, getMonthlyServiceStatsAction } from '@/app/actions';
import { ReportsClient } from './reports-client';


export default async function ReportsPage() {
    // Calculate current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

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
