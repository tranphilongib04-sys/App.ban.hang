'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionCard } from '@/components/shared/subscription-card';
import { GrowthChart } from '@/components/reports/growth-chart';
import { SubscriptionWithCustomer, Customer } from '@/types';
import { InventoryItem } from '@/lib/db/schema';
import { Bell, AlertTriangle, CreditCard, MessageCircle, CheckCircle, TrendingUp, DollarSign, Wallet, Shield, Plus, Package, Edit3 } from 'lucide-react';
import { formatCurrency } from '@/lib/business';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SalesDialog } from '@/components/inventory/sales-dialog';
import { toast } from 'sonner';

interface TodayDashboardProps {
    needsReminder: SubscriptionWithCustomer[];
    overdue: SubscriptionWithCustomer[];
    awaitingPayment: SubscriptionWithCustomer[];
    contacted: SubscriptionWithCustomer[];
    completedToday: SubscriptionWithCustomer[];
    todayRevenue: number;
    todayProfit: number;
    growthStats: { name: string; revenue: number; profit: number }[];
    inventoryItems: InventoryItem[];
    customers: Customer[];
}

export function TodayDashboard({
    needsReminder,
    overdue,
    awaitingPayment,
    contacted,
    completedToday,
    todayRevenue,
    todayProfit,
    growthStats,
    inventoryItems,
    customers
}: TodayDashboardProps) {
    const router = useRouter();

    // Sales State
    const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
    const [selectedService, setSelectedService] = useState('');
    const [isSellOpen, setIsSellOpen] = useState(false);
    const [sellItem, setSellItem] = useState<InventoryItem | null>(null);

    // Tab state for quick sell dialog
    const [sellMode, setSellMode] = useState<'inventory' | 'manual'>('inventory');

    // Manual entry state
    const [manualService, setManualService] = useState('');
    const [manualSecret, setManualSecret] = useState('');
    const [manualCost, setManualCost] = useState('0');

    // Get unique services from available inventory
    const availableServices = [...new Set(inventoryItems.map(i => i.service))];

    const handleCreateNewOrder = () => {
        if (!selectedService) {
            toast.error('Vui lòng chọn dịch vụ');
            return;
        }

        // Find available item for this service (FIFO)
        const matches = inventoryItems
            .filter(i => i.service === selectedService && i.status === 'available')
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        const item = matches[0];

        if (!item) {
            toast.error(`Hết hàng trong kho cho dịch vụ "${selectedService}"`);
            return;
        }

        setSellItem(item);
        setIsNewOrderOpen(false);
        setIsSellOpen(true);
    };

    const handleCreateManualOrder = () => {
        if (!manualService.trim()) {
            toast.error('Vui lòng nhập tên sản phẩm');
            return;
        }
        if (!manualSecret.trim()) {
            toast.error('Vui lòng nhập thông tin tài khoản');
            return;
        }

        // Create a virtual inventory item for manual entry
        const manualItem: InventoryItem = {
            id: -1, // Virtual ID
            service: manualService.trim(),
            distribution: null,
            secretPayload: manualSecret.trim(),
            secretMasked: manualSecret.trim().substring(0, 20) + '...',
            status: 'available',
            importBatch: null,
            cost: parseFloat(manualCost) || 0,
            note: null,
            category: null,
            createdAt: new Date().toISOString(),
        };

        setSellItem(manualItem);
        setIsNewOrderOpen(false);
        setIsSellOpen(true);

        // Reset manual form
        setManualService('');
        setManualSecret('');
        setManualCost('0');
    };

    const handleUpdate = () => {
        router.refresh();
    };

    const pendingCount = needsReminder.length + overdue.length + awaitingPayment.length + contacted.length;

    const workflowSections = [
        {
            title: '🔔 Cần nhắc gia hạn',
            icon: Bell,
            color: 'text-orange-500',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            subscriptions: needsReminder,
            emptyMessage: 'Không có subscription nào cần nhắc',
        },
        {
            title: '💬 Đã liên hệ / Chờ phản hồi',
            icon: MessageCircle,
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-200',
            subscriptions: contacted,
            emptyMessage: 'Chưa có khách hàng nào đã liên hệ',
        },
        {
            title: '💸 Chờ thanh toán',
            icon: CreditCard,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            subscriptions: awaitingPayment,
            emptyMessage: 'Không có subscription nào chờ thanh toán',
        },
        {
            title: '⚠️ Quá hạn',
            icon: AlertTriangle,
            color: 'text-red-500',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            subscriptions: overdue,
            emptyMessage: 'Không có subscription nào quá hạn',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Quick Sell Action for Mobile */}
            <div className="md:hidden">
                <Dialog open={isNewOrderOpen} onOpenChange={(open) => {
                    setIsNewOrderOpen(open);
                    if (!open) {
                        // Reset state when closing
                        setSellMode('inventory');
                        setSelectedService('');
                        setManualService('');
                        setManualSecret('');
                        setManualCost('0');
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg mb-2 rounded-2xl animate-pulse-subtle">
                            <Plus className="h-6 w-6 mr-2" />
                            BÁN HÀNG NGAY
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Bán hàng nhanh</DialogTitle>
                        </DialogHeader>

                        {/* Tab Buttons */}
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setSellMode('inventory')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${sellMode === 'inventory'
                                    ? 'bg-white text-green-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Package className="h-4 w-4" />
                                Từ kho hàng
                            </button>
                            <button
                                type="button"
                                onClick={() => setSellMode('manual')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${sellMode === 'manual'
                                    ? 'bg-white text-blue-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Edit3 className="h-4 w-4" />
                                Thêm thủ công
                            </button>
                        </div>

                        {/* Inventory Mode */}
                        {sellMode === 'inventory' && (
                            <div className="space-y-5 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-base">Sản phẩm từ kho</Label>
                                    <Select value={selectedService} onValueChange={setSelectedService}>
                                        <SelectTrigger className="h-12 text-base">
                                            <SelectValue placeholder="Chọn sản phẩm..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableServices.length === 0 ? (
                                                <SelectItem value="empty" disabled>
                                                    Kho đang trống
                                                </SelectItem>
                                            ) : (
                                                availableServices.map((service) => {
                                                    const count = inventoryItems.filter(i => i.service === service && i.status === 'available').length;
                                                    return (
                                                        <SelectItem key={service} value={service} className="py-3 text-base">
                                                            {service} <span className="text-gray-500 text-xs ml-1">({count})</span>
                                                        </SelectItem>
                                                    );
                                                })
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={handleCreateNewOrder}
                                    className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 shadow-sm"
                                    disabled={!selectedService}
                                >
                                    Tiếp tục
                                </Button>
                            </div>
                        )}

                        {/* Manual Mode */}
                        {sellMode === 'manual' && (
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-base">Tên sản phẩm *</Label>
                                    <Input
                                        value={manualService}
                                        onChange={(e) => setManualService(e.target.value)}
                                        placeholder="VD: Netflix Premium, Spotify..."
                                        className="h-12 text-base"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-base">Thông tin tài khoản *</Label>
                                    <Textarea
                                        value={manualSecret}
                                        onChange={(e) => setManualSecret(e.target.value)}
                                        placeholder="Email: xxx@gmail.com&#10;Password: xxxxxx"
                                        rows={3}
                                        className="text-base resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-base">Giá vốn (VNĐ)</Label>
                                    <Input
                                        type="number"
                                        value={manualCost}
                                        onChange={(e) => setManualCost(e.target.value)}
                                        placeholder="0"
                                        className="h-12 text-base"
                                    />
                                </div>
                                <Button
                                    onClick={handleCreateManualOrder}
                                    className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-sm"
                                    disabled={!manualService.trim() || !manualSecret.trim()}
                                >
                                    Tiếp tục
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {/* Revenue Summary - Today */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-6 w-6" />
                    <h2 className="text-xl font-semibold">📊 Doanh thu hôm nay</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="liquid-card p-4 transition-all hover:scale-[1.02]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Daily Revenue</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayRevenue)}</p>
                    </div>

                    <div className="liquid-card p-4 transition-all hover:scale-[1.02]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Daily Profit</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayProfit)}</p>
                    </div>

                    <div className="liquid-card p-4 transition-all hover:scale-[1.02]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Completed</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{completedToday.length} orders</p>
                    </div>

                    <div className="liquid-card p-4 transition-all hover:scale-[1.02]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                <Shield className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Renewals</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{pendingCount} due</p>
                    </div>
                </div>
            </div>

            {/* Growth Chart */}


            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-orange-500" />
                        <span className="text-sm font-medium text-orange-700">Cần nhắc</span>
                    </div>
                    <p className="text-2xl font-semibold text-orange-900 mt-2">{needsReminder.length}</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-indigo-500" />
                        <span className="text-sm font-medium text-indigo-700">Đã liên hệ</span>
                    </div>
                    <p className="text-2xl font-semibold text-indigo-900 mt-2">{contacted.length}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700">Chờ thanh toán</span>
                    </div>
                    <p className="text-2xl font-semibold text-blue-900 mt-2">{awaitingPayment.length}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium text-green-700">Hoàn tất hôm nay</span>
                    </div>
                    <p className="text-2xl font-semibold text-green-900 mt-2">{completedToday.length}</p>
                </div>
            </div>

            {/* Workflow Sections */}
            {workflowSections.map((section) => (
                section.subscriptions.length > 0 && (
                    <div key={section.title}>
                        <div className={`flex items-center gap-2 mb-4 ${section.color}`}>
                            <section.icon className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">{section.title}</h2>
                            <span className={`text-sm px-2 py-0.5 rounded-full ${section.bgColor} ${section.color}`}>
                                {section.subscriptions.length}
                            </span>
                        </div>

                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {section.subscriptions.map((sub, index) => (
                                <SubscriptionCard
                                    key={sub.id}
                                    index={index}
                                    subscription={sub}
                                    onUpdate={handleUpdate}
                                />
                            ))}
                        </div>
                    </div>
                )
            ))}

            {/* Completed Today Section */}
            {completedToday.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">✅ Hoàn tất hôm nay</h2>
                        <span className="text-sm px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                            {completedToday.length}
                        </span>
                    </div>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {completedToday.map((sub, index) => (
                            <div
                                key={sub.id}
                                className="bg-green-50 border border-green-200 rounded-xl p-4"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-[10px] font-bold text-green-700 border border-green-200">
                                                {index + 1}
                                            </span>
                                            <h3 className="font-medium text-green-900">{sub.customerName}</h3>
                                        </div>
                                        <p className="text-sm text-green-700">{sub.service}</p>
                                    </div>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-green-600">Doanh thu</span>
                                    <span className="font-semibold text-green-800">{formatCurrency(sub.revenue || 0)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {pendingCount === 0 && completedToday.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <div className="text-4xl mb-4">🎉</div>
                    <h3 className="text-lg font-medium text-gray-900">Tuyệt vời!</h3>
                    <p className="text-gray-500 mt-1">Không có việc gì cần xử lý hôm nay</p>
                </div>
            )}
            {/* Sales Dialog */}
            <SalesDialog
                open={isSellOpen}
                onOpenChange={setIsSellOpen}
                item={sellItem}
                customers={customers}
                initialCustomerName=""
                initialContact=""
            />
        </div>
    );
}
