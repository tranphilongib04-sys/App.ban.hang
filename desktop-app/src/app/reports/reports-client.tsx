'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/business';
import {
    DollarSign,
    TrendingUp,
    ShoppingBag,
    Shield,
    AlertTriangle,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import { GrowthChart } from '@/components/reports/growth-chart';
import { ReportsPieChart } from '@/components/reports/pie-chart';
import { HorizontalBarChart } from '@/components/reports/horizontal-bar-chart';

interface ReportStats {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    subscriptionCount: number;
    byService: Record<string, { revenue: number; cost: number; profit: number; count: number }>;
    warrantyCount: number;
    pendingWarranties: number;
}

interface GrowthStats {
    name: string;
    revenue: number;
    profit: number;
}

interface ProjectedStats {
    projectedRevenue: number;
    expiringCount: number;
    next30Days: any[];
    byService: { name: string; value: number }[]; // Added for the new pie chart data
}

interface ReportsClientProps {
    stats: ReportStats;
    growthStats: GrowthStats[];
    projectedStats: ProjectedStats;
    monthlyServiceStats: {
        month: string;
        totalRevenue: number;
        services: { name: string; revenue: number; profit: number; count: number }[];
    }[];
}

export function ReportsClient({ stats, growthStats, projectedStats, monthlyServiceStats }: ReportsClientProps) {
    const profitMargin = stats.totalRevenue > 0
        ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)
        : '0';

    // Pie Data for Cost vs Profit
    const profitCostData = [
        { name: 'Lợi nhuận', value: stats.totalProfit },
        { name: 'Chi phí', value: stats.totalCost },
    ];

    return (
        <div className="space-y-8">
            {/* Row 1: Current Month Overview (Pie Chart + Key Metrics) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Financial Pie Chart */}
                <Card className="bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-blue-500" />
                            Cấu trúc tài chính (Tháng này)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-full md:w-1/2">
                                <ReportsPieChart data={profitCostData} />
                            </div>
                            <div className="w-full md:w-1/2 space-y-4">
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-sm text-gray-500 mb-1">Tổng doanh thu</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                            Lợi nhuận
                                        </p>
                                        <p className="font-semibold text-emerald-600">{formatCurrency(stats.totalProfit)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            Chi phí
                                        </p>
                                        <p className="font-semibold text-gray-900">{formatCurrency(stats.totalCost)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Forecast Card (1 Month) */}
                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-indigo-600" />
                            Dự báo tháng tới (30 ngày)
                        </CardTitle>
                        <p className="text-sm text-gray-500">Doanh thu dự kiến từ các gói sắp hết hạn</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Tổng doanh thu dự kiến</p>
                            <p className="text-4xl font-bold text-indigo-600">
                                {formatCurrency(projectedStats.projectedRevenue)}
                            </p>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Sắp hết hạn:</span>
                            <span className="font-semibold text-gray-900">{projectedStats.expiringCount} subscriptions</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Growth Chart */}
            <Card className="bg-white shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-500" />
                        Biểu đồ tăng trưởng (6 tháng qua)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pl-0">
                    <GrowthChart data={growthStats} />
                </CardContent>
            </Card>
        </div>
    );
}
