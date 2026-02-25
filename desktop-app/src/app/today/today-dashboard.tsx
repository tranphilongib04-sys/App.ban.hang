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
import { sellInventoryItemAction } from '@/app/actions';

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
    currentDateStr?: string;
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
    customers,
    currentDateStr
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
    // Manual entry state & Extended Form
    const [manualService, setManualService] = useState('');
    const [manualSecret, setManualSecret] = useState('');
    const [manualCost, setManualCost] = useState('0');

    // Full form state (borrowed from SalesDialog)
    const [customerName, setCustomerName] = useState('');
    const [contact, setContact] = useState('');
    const [price, setPrice] = useState('0');
    // Date states for manual entry
    const today = new Date();
    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    const formatDateForInput = (d: Date) => d.toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(formatDateForInput(today));
    const [endDate, setEndDate] = useState(formatDateForInput(oneMonthLater));
    const [note, setNote] = useState('');
    const [source, setSource] = useState('Fb TPL');
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

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

    const handleExecuteManualSale = async () => {
        if (!manualService.trim() || !customerName.trim()) {
            toast.error('Vui lòng nhập Tên sản phẩm và Khách hàng');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            // ID = -1 for virtual item
            formData.append('inventoryId', '-1');

            // Manual overrides for virtual item
            formData.append('virtualService', manualService);
            formData.append('virtualSecret', manualSecret || 'Manually added');
            formData.append('virtualCost', manualCost);

            // Standard fields
            formData.append('customerName', customerName);
            formData.append('contact', contact);
            formData.append('salePrice', price);
            formData.append('startDate', startDate);
            formData.append('endDate', endDate);
            formData.append('note', note);
            formData.append('source', source);
            formData.append('paymentStatus', paymentStatus);

            const result = await sellInventoryItemAction(formData);

            if (result.success) {
                toast.success('Đã tạo đơn hàng thành công!');
                setIsNewOrderOpen(false);
                router.refresh();

                // Cleanup
                setManualService('');
                setManualSecret('');
                setCustomerName('');
                setPrice('0');
            } else {
                toast.error('Lỗi: ' + result.error);
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        } finally {
            setIsSubmitting(false);
        }
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
            {/* Quick Sell Action - Visible on both Mobile and Desktop */}
            <div className="flex justify-end mb-4 md:mb-6">
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
                        <Button className="w-full md:w-auto h-14 md:h-12 text-lg md:text-base font-bold bg-green-600 hover:bg-green-700 shadow-lg rounded-2xl md:rounded-xl animate-pulse-subtle md:animate-none flex items-center justify-center md:px-8">
                            <Plus className="h-6 w-6 md:h-5 md:w-5 mr-2" />
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
                                {/* Product Info */}
                                <div className="p-3 bg-gray-50 rounded-lg border space-y-3">
                                    <div>
                                        <Label className="text-xs text-gray-500 uppercase">Sản phẩm</Label>
                                        <Input
                                            value={manualService}
                                            onChange={(e) => setManualService(e.target.value)}
                                            placeholder="Tên dịch vụ (VD: Giao sau)..."
                                            className="h-9 mt-1 bg-white"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs text-gray-500 uppercase">Giá vốn</Label>
                                            <Input
                                                type="number"
                                                value={manualCost}
                                                onChange={(e) => setManualCost(e.target.value)}
                                                placeholder="0"
                                                className="h-9 mt-1 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-500 uppercase">Tài khoản</Label>
                                            <Input
                                                value={manualSecret}
                                                onChange={(e) => setManualSecret(e.target.value)}
                                                placeholder="User/Pass..."
                                                className="h-9 mt-1 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Label>Khách hàng</Label>
                                        <Input
                                            value={customerName}
                                            onChange={(e) => {
                                                setCustomerName(e.target.value);
                                                setShowSuggestions(true);
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                            placeholder="Tên khách hàng..."
                                            required
                                            className="mt-1"
                                        />
                                        {showSuggestions && customerName && (
                                            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-auto">
                                                {customers
                                                    .filter(c => c.name.toLowerCase().includes(customerName.toLowerCase()))
                                                    .slice(0, 5)
                                                    .map(customer => (
                                                        <div
                                                            key={customer.id}
                                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                            onClick={() => {
                                                                setCustomerName(customer.name);
                                                                setContact(customer.contact || '');
                                                                setShowSuggestions(false);
                                                            }}
                                                        >
                                                            <div className="font-medium">{customer.name}</div>
                                                            {customer.contact && <div className="text-xs text-gray-500">{customer.contact}</div>}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Liên hệ</Label>
                                            <Input
                                                value={contact}
                                                onChange={(e) => setContact(e.target.value)}
                                                placeholder="SĐT/Facebook..."
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Kênh bán</Label>
                                            <Input
                                                value={source}
                                                onChange={(e) => setSource(e.target.value)}
                                                placeholder="Nguồn..."
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Sales Info */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Ngày bắt đầu</Label>
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Ngày kết thúc</Label>
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Giá bán (VNĐ)</Label>
                                    <Input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Thanh toán</Label>
                                        <Select value={paymentStatus} onValueChange={(v: any) => setPaymentStatus(v)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="paid">Đã thanh toán</SelectItem>
                                                <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Ghi chú</Label>
                                        <Input
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="..."
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleExecuteManualSale}
                                    className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-sm mt-2"
                                    disabled={isSubmitting || !manualService || !customerName}
                                >
                                    {isSubmitting ? 'Đang xử lý...' : 'Tạo đơn hàng'}
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
                <div className="stat-card bg-orange-50 border border-orange-200 rounded-xl p-4 cursor-pointer">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Bell className="h-5 w-5 text-orange-500" />
                        </div>
                        <span className="text-sm font-medium text-orange-700">Cần nhắc</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900 mt-2">{needsReminder.length}</p>
                </div>
                <div className="stat-card bg-indigo-50 border border-indigo-200 rounded-xl p-4 cursor-pointer">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <MessageCircle className="h-5 w-5 text-indigo-500" />
                        </div>
                        <span className="text-sm font-medium text-indigo-700">Đã liên hệ</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-900 mt-2">{contacted.length}</p>
                </div>
                <div className="stat-card bg-blue-50 border border-blue-200 rounded-xl p-4 cursor-pointer">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <CreditCard className="h-5 w-5 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-blue-700">Chờ thanh toán</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 mt-2">{awaitingPayment.length}</p>
                </div>
                <div className="stat-card bg-green-50 border border-green-200 rounded-xl p-4 cursor-pointer">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <span className="text-sm font-medium text-green-700">Hoàn tất hôm nay</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 mt-2">{completedToday.length}</p>
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
                                    inventoryItems={inventoryItems}
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
