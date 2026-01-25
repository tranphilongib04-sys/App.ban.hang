'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { OrdersTable } from '@/components/orders/orders-table';
import { SubscriptionWithCustomer, Customer } from '@/types';
import { format, addDays } from 'date-fns';
import { Plus, Search, ShoppingBag, Ban, History, RefreshCw, UserPlus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { messages, copyToClipboard } from '@/lib/messages';
import {
    createOrderWithCustomerAction,
    updateSubscriptionAction,
    quickRenewAction,
    deliverItemAction,
} from '@/app/actions';
import { InventoryItem } from '@/lib/db/schema';
import { SalesDialog } from '@/components/inventory/sales-dialog';

interface OrdersClientProps {
    subscriptions: SubscriptionWithCustomer[];
    customers: Customer[];
    inventoryItems: InventoryItem[];
}

export function OrdersClient({ subscriptions, customers, inventoryItems }: OrdersClientProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isGrouped, setIsGrouped] = useState(true);
    const [loading, setLoading] = useState<Record<number, string>>({});
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Auto-refresh on visibility change (when user switches back to this tab)
    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        router.refresh();
        // Reset after a short delay (assume refresh completes)
        setTimeout(() => setIsRefreshing(false), 1500);
    }, [router]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                handleRefresh();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [handleRefresh]);

    // Auto-refresh every 60 seconds (reduced from 30s for better performance)
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 60000);
        return () => clearInterval(interval);
    }, [router]);

    // Sales Dialog State (for creating new order from inventory)
    const [isSellOpen, setIsSellOpen] = useState(false);
    const [sellItem, setSellItem] = useState<InventoryItem | null>(null);
    const [sellCustomerName, setSellCustomerName] = useState('');
    const [sellContact, setSellContact] = useState('');

    // New Order Dialog - select service from inventory
    const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
    const [selectedService, setSelectedService] = useState('');

    // Manual Order Form State
    const [manualCustomerName, setManualCustomerName] = useState('');
    const [manualCustomerContact, setManualCustomerContact] = useState('');
    const [manualSource, setManualSource] = useState('Fb TPL');
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

    // Filter customers for autocomplete
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(manualCustomerName.toLowerCase()) ||
        (c.contact && c.contact.toLowerCase().includes(manualCustomerName.toLowerCase()))
    ).slice(0, 8);

    const isNewCustomer = manualCustomerName.trim() !== '' &&
        !customers.some(c => c.name.toLowerCase() === manualCustomerName.toLowerCase());

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
        setSellCustomerName('');
        setSellContact('');
        setIsNewOrderOpen(false);
        setIsSellOpen(true);
    };

    const handleRenewWithInventory = (sub: SubscriptionWithCustomer) => {
        // Find available item for this service (FIFO)
        const matches = inventoryItems
            .filter(i => i.service.toLowerCase() === sub.service.toLowerCase() && i.status === 'available')
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // FIFO

        const item = matches[0];

        if (!item) {
            toast.error(`Hết hàng trong kho cho dịch vụ "${sub.service}"`);
            return;
        }

        setSellItem(item);
        setSellCustomerName(sub.customerName);
        setSellContact(sub.customerContact || '');
        setIsSellOpen(true);
    };

    // Filter by search
    const searchFiltered = subscriptions.filter((sub) => {
        const matchesSearch = sub.customerName.toLowerCase().includes(search.toLowerCase()) ||
            sub.service.toLowerCase().includes(search.toLowerCase());

        return matchesSearch;
    });

    // 1. Not Renewing Subscriptions
    const notRenewingSubs = searchFiltered.filter(sub => sub.renewalStatus === 'not_renewing');

    // Helper: Check if expiring this month (Robust)
    const isExpiringThisMonth = (dateStr: string) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const now = new Date();
        // Use local components to avoid UTC shift issues if dateStr is simple YYYY-MM-DD
        // Actually YYYY-MM-DD is UTC. If user is +7, it might shift day but Month usually stays unless 1st of month.
        // Safer: compare month index.
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };

    // 2. Renewed / Sold Successfully Subscriptions
    // User Request: Include Renewed, Manual, Inventory Sales (All Success)
    // EXCLUDE items expiring this month (they belong in Upcoming)
    const renewedSubs = searchFiltered.filter(sub => {
        const isRenewed = sub.renewalStatus === 'renewed';
        // Only Paid Active items go here (Unpaid always go to Upcoming)
        const isActivePaid = sub.overallStatus === 'active' && sub.paymentStatus === 'paid';

        // If it's active but expiring this month, it moves to "Upcoming", so exclude here
        if (isActivePaid && isExpiringThisMonth(sub.endDate)) return false;

        return isRenewed || isActivePaid;
    });

    // 3. Upcoming Subscriptions:
    // - Needs Reminder / Overdue / Awaiting Payment
    // - Active Paid (Expiring This Month)
    // - User Constraint: "Only see until 31/1" -> Exclude future months
    const upcomingSubs = searchFiltered.filter(sub => {
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of this month
        endOfMonth.setHours(23, 59, 59, 999);

        const subEndDate = new Date(sub.endDate);
        subEndDate.setHours(0, 0, 0, 0); // compare date part

        // Strict constraint: Must NOT be later than end of this month
        // (Unless it's active/renewed logic handled elsewhere, but for 'Need Action', we focus on current timeframe)
        // Actually, Overdue is < Now < EndOfMonth, so logic holds.
        // Future months (Feb, Mar) > EndOfMonth -> Exclude.
        if (subEndDate > endOfMonth) return false;

        const attentionStatuses = ['needs_reminder', 'overdue', 'awaiting_payment'];
        const isUnpaid = sub.paymentStatus === 'unpaid';
        const isActivePaidExpiringSoon = sub.overallStatus === 'active' &&
            sub.paymentStatus === 'paid' &&
            isExpiringThisMonth(sub.endDate);

        if (sub.reminderDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const reminder = new Date(sub.reminderDate);
            reminder.setHours(0, 0, 0, 0);
            if (reminder > today) return false;
        }

        return (attentionStatuses.includes(sub.overallStatus) || isUnpaid || isActivePaidExpiringSoon) &&
            sub.renewalStatus !== 'not_renewing' &&
            sub.renewalStatus !== 'renewed';
    }).sort((a, b) => {
        const getPriority = (sub: typeof a) => {
            // Priority 0: Overdue (Most Urgent)
            if (sub.daysUntilEnd < 0) return 0;
            // Priority 1: Today / Needs Reminder
            if (sub.daysUntilEnd === 0) return 1;
            // Priority 2: Future (Least Urgent)
            return 2;
        };

        const priA = getPriority(a);
        const priB = getPriority(b);

        if (priA !== priB) return priA - priB;

        const dateA = new Date(a.endDate).getTime();
        const dateB = new Date(b.endDate).getTime();

        // Sort by Date ASC (Earliest due date first is generally better for lists)
        return dateA - dateB;
    });

    // 2.5 Snoozed Subscriptions (Remind Later)
    const snoozedSubs = searchFiltered.filter(sub => {
        if (!sub.reminderDate) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reminder = new Date(sub.reminderDate);
        reminder.setHours(0, 0, 0, 0);

        // Include if reminder is today or in future
        return reminder >= today && sub.renewalStatus !== 'not_renewing' && sub.renewalStatus !== 'renewed';
    }).sort((a, b) => new Date(a.reminderDate!).getTime() - new Date(b.reminderDate!).getTime());

    // 4. History Subscriptions (All orders)
    const historySubs = searchFiltered.sort((a, b) => {
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
    });

    // Helper: Group subscriptions (Deduplicate)
    const applyGrouping = (subs: SubscriptionWithCustomer[]) => {
        // Step 1: Always deduplicate by ID first (Safety for React Keys)
        const uniqueById = Array.from(new Map(subs.map(s => [s.id, s])).values());

        if (!isGrouped) return uniqueById;

        // Step 2: Apply Business Grouping (Same Customer + Service)
        const groups = new Map<string, SubscriptionWithCustomer>();

        uniqueById.forEach(sub => {
            const key = `${sub.customerName.toLowerCase()}|${sub.service.toLowerCase()}`;
            const existing = groups.get(key);
            if (!existing) {
                groups.set(key, sub);
            } else {
                // Keep the one ending later
                if (new Date(sub.endDate) > new Date(existing.endDate)) {
                    groups.set(key, sub);
                }
            }
        });

        return Array.from(groups.values());
    };

    const handleAction = async (id: number, action: string, fn: () => Promise<void>) => {
        setLoading((prev) => ({ ...prev, [id]: action }));
        try {
            await fn();
            router.refresh();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
        setLoading((prev) => ({ ...prev, [id]: '' }));
    };

    const handleCopyMessage = async (sub: SubscriptionWithCustomer) => {
        const message = messages.reminder(sub.customerName, sub.service, sub.endDate, sub.accountInfo || undefined);
        const success = await copyToClipboard(message);
        if (success) toast.success('Đã copy tin nhắn');
    };

    const handleDeliver = async (sub: SubscriptionWithCustomer) => {
        setLoading((prev) => ({ ...prev, [sub.id]: 'deliver' }));
        const result = await deliverItemAction(sub.id, sub.service);
        if (result.success && 'item' in result) {
            const deliveryMessage = messages.delivery(sub.customerName, sub.service, result.item?.secretPayload || '');
            await copyToClipboard(deliveryMessage);
            toast.success('Đã giao hàng & copy tin nhắn!');
            router.refresh();
        } else {
            toast.error((result as any).error || 'Không thể giao hàng');
        }
        setLoading((prev) => ({ ...prev, [sub.id]: '' }));
    };

    const handleSelectCustomer = (customer: Customer) => {
        setManualCustomerName(customer.name);
        setManualCustomerContact(customer.contact || '');
        setShowCustomerSuggestions(false);
    };

    const handleAddSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set('customerName', manualCustomerName);
        formData.set('customerContact', manualCustomerContact);
        formData.set('source', manualSource);

        try {
            const result = await createOrderWithCustomerAction(formData);
            if (result.isNewCustomer) {
                toast.success('Đã tạo đơn hàng mới và thêm khách hàng vào danh sách!');
            } else {
                toast.success('Đã tạo đơn hàng mới');
            }
            setIsAddOpen(false);
            setManualCustomerName('');
            setManualCustomerContact('');
            router.refresh();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
    };

    const resetManualForm = () => {
        setManualCustomerName('');
        setManualCustomerContact('');
        setShowCustomerSuggestions(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-3 items-center flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm khách hàng hoặc dịch vụ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-sm"
                    />
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="h-9 w-9"
                    title="Làm mới dữ liệu"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>

                <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 h-9">
                    <Checkbox
                        id="grouping"
                        checked={isGrouped}
                        onCheckedChange={(c) => setIsGrouped(!!c)}
                    />
                    <Label htmlFor="grouping" className="text-xs sm:text-sm cursor-pointer font-medium text-gray-700">
                        Gộp khách hàng
                    </Label>
                </div>

                <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700 h-9 text-sm px-3">
                            <Plus className="h-4 w-4 mr-1.5" />
                            Tạo Đơn Hàng
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Tạo Đơn Hàng Mới từ Kho</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-5 pt-2">
                            <div className="space-y-2">
                                <Label className="text-base">Chọn dịch vụ</Label>
                                <Select value={selectedService} onValueChange={setSelectedService}>
                                    <SelectTrigger className="h-12 text-base">
                                        <SelectValue placeholder="Chọn dịch vụ từ kho..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableServices.length === 0 ? (
                                            <SelectItem value="empty" disabled>
                                                Không có sản phẩm trong kho
                                            </SelectItem>
                                        ) : (
                                            availableServices.map((service) => {
                                                const count = inventoryItems.filter(i => i.service === service).length;
                                                return (
                                                    <SelectItem key={service} value={service} className="py-3 text-base">
                                                        {service} ({count} trong kho)
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
                                disabled={!selectedService || availableServices.length === 0}
                            >
                                Tiếp tục
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isAddOpen} onOpenChange={(open) => {
                    setIsAddOpen(open);
                    if (!open) resetManualForm();
                }}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="h-9 text-sm px-3">
                            <Plus className="h-4 w-4 mr-1.5" />
                            Thêm thủ công
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md w-[95vw] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Thêm đơn hàng thủ công</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddSubscription} className="space-y-5 py-2">
                            <div className="space-y-2">
                                <Label className="text-base">Khách hàng</Label>
                                <div className="relative">
                                    <Input
                                        value={manualCustomerName}
                                        onChange={(e) => {
                                            setManualCustomerName(e.target.value);
                                            setShowCustomerSuggestions(true);
                                        }}
                                        onFocus={() => setShowCustomerSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                                        placeholder="Tìm hoặc nhập tên khách hàng mới..."
                                        required
                                        autoComplete="off"
                                        className="h-12 text-base"
                                    />
                                    {showCustomerSuggestions && manualCustomerName && (
                                        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                                            {filteredCustomers.length > 0 ? (
                                                filteredCustomers.map(customer => (
                                                    <div
                                                        key={customer.id}
                                                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-base border-b border-gray-50 last:border-0"
                                                        onClick={() => handleSelectCustomer(customer)}
                                                    >
                                                        <div className="font-medium">{customer.name}</div>
                                                        {customer.contact && (
                                                            <div className="text-xs text-gray-500">{customer.contact}</div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : null}
                                            {isNewCustomer && (
                                                <div className="px-4 py-3 bg-blue-50 border-t border-gray-200">
                                                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                                                        <UserPlus className="h-4 w-4" />
                                                        <span>Tạo khách hàng mới: <strong>{manualCustomerName}</strong></span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {isNewCustomer && !showCustomerSuggestions && manualCustomerName && (
                                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                        <UserPlus className="h-3 w-3" />
                                        Khách hàng mới sẽ được tạo
                                    </p>
                                )}
                            </div>

                            {isNewCustomer && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-base">Liên hệ (SĐT/Zalo)</Label>
                                        <Input
                                            value={manualCustomerContact}
                                            onChange={(e) => setManualCustomerContact(e.target.value)}
                                            placeholder="0912..."
                                            className="h-12 text-base"
                                            inputMode="tel"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-base">Kênh bán</Label>
                                        <Input
                                            value={manualSource}
                                            onChange={(e) => setManualSource(e.target.value)}
                                            placeholder="Fb TPL..."
                                            className="h-12 text-base"
                                        />
                                    </div>
                                </div>
                            )}

                            {!isNewCustomer && (
                                <div className="space-y-2">
                                    <Label className="text-base">Kênh bán</Label>
                                    <Input
                                        value={manualSource}
                                        onChange={(e) => setManualSource(e.target.value)}
                                        placeholder="Fb TPL..."
                                        className="h-12 text-base"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="service" className="text-base">Dịch vụ</Label>
                                <Input name="service" placeholder="VD: ChatGPT Plus" required className="h-12 text-base" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Ngày bắt đầu</Label>
                                    <Input
                                        name="startDate"
                                        type="date"
                                        defaultValue={format(new Date(), 'yyyy-MM-dd')}
                                        required
                                        className="h-12 text-base"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">Ngày kết hạn</Label>
                                    <Input
                                        name="endDate"
                                        type="date"
                                        defaultValue={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
                                        required
                                        className="h-12 text-base"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <Checkbox id="paymentStatus" name="paymentStatus" className="h-5 w-5" />
                                <Label htmlFor="paymentStatus" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Đã thanh toán (Paid)
                                </Label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="revenue">Doanh thu</Label>
                                    <Input name="revenue" type="number" placeholder="0" className="h-12 text-base" inputMode="numeric" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cost">Chi phí</Label>
                                    <Input name="cost" type="number" placeholder="0" className="h-12 text-base" inputMode="numeric" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountInfo">Tên tài khoản</Label>
                                <Input name="accountInfo" placeholder="VD: email@gmail.com | pass" className="h-12 text-base" />
                            </div>

                            <Button type="submit" className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-sm mt-4">
                                {isNewCustomer ? 'Tạo khách hàng & đơn hàng' : 'Tạo đơn hàng'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                <Button
                    variant="outline"
                    onClick={async () => {
                        if (!confirm('Bạn có chắc chắn muốn xóa các bản ghi trùng lặp?')) return;
                        setLoading((prev) => ({ ...prev, [-2]: 'cleanup' }));
                        try {
                            const { cleanupDuplicatesAction } = await import('@/app/actions');
                            await cleanupDuplicatesAction();
                            toast.success('Đã xóa dữ liệu trùng lặp');
                            router.refresh();
                        } catch {
                            toast.error('Có lỗi xảy ra');
                        }
                        setLoading((prev) => ({ ...prev, [-2]: '' }));
                    }}
                    disabled={loading[-2] === 'cleanup'}
                    className="border-orange-200 text-orange-600 hover:bg-orange-50 h-9 text-sm px-3"
                >
                    <RefreshCw className={`h-4 w-4 mr-1.5 ${loading[-2] === 'cleanup' ? 'animate-spin' : ''}`} />
                    Xóa Trùng Lặp
                </Button>
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="flex w-full max-w-[800px] h-10 glass-panel p-1 rounded-xl">
                    <TabsTrigger
                        value="upcoming"
                        className="flex-1 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm data-[state=active]:font-bold transition-all text-xs font-medium py-1"
                    >
                        <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                        Cần xử lý
                    </TabsTrigger>
                    <TabsTrigger
                        value="snoozed"
                        className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm transition-all text-xs font-medium py-1"
                    >
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        Hẹn ngày nhắc
                    </TabsTrigger>
                    <TabsTrigger
                        value="renewed"
                        className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm transition-all text-xs font-medium py-1"
                    >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Đã gia hạn
                    </TabsTrigger>
                    <TabsTrigger
                        value="not_renewing"
                        className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all text-xs font-medium py-1 hover:text-red-600/80"
                    >
                        <Ban className="w-3.5 h-3.5 mr-1.5" />
                        Không gia hạn
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-700 data-[state=active]:shadow-sm transition-all text-xs font-medium py-1"
                    >
                        <History className="w-3.5 h-3.5 mr-1.5" />
                        Lịch sử
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="mt-6">
                    <OrdersTable
                        subscriptions={upcomingSubs}
                        loading={loading}
                        onAction={handleAction}
                        onDeliver={handleDeliver}
                        onCopyMessage={handleCopyMessage}
                        onRenewWithInventory={handleRenewWithInventory}
                    />
                </TabsContent>

                <TabsContent value="snoozed" className="mt-6">
                    <OrdersTable
                        subscriptions={applyGrouping(snoozedSubs)}
                        loading={loading}
                        onAction={handleAction}
                        onDeliver={handleDeliver}
                        onCopyMessage={handleCopyMessage}
                        onRenewWithInventory={handleRenewWithInventory}
                        showReminderDate={true}
                    />
                </TabsContent>

                <TabsContent value="renewed" className="mt-6">
                    <OrdersTable
                        subscriptions={applyGrouping(renewedSubs)}
                        loading={loading}
                        onAction={handleAction}
                        onDeliver={handleDeliver}
                        onCopyMessage={handleCopyMessage}
                        onRenewWithInventory={handleRenewWithInventory}
                    />
                </TabsContent>

                <TabsContent value="not_renewing" className="mt-6">
                    <OrdersTable
                        subscriptions={applyGrouping(notRenewingSubs)}
                        loading={loading}
                        onAction={handleAction}
                        onDeliver={handleDeliver}
                        onCopyMessage={handleCopyMessage}
                        onRenewWithInventory={handleRenewWithInventory}
                    />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <OrdersTable
                        subscriptions={applyGrouping(historySubs)}
                        loading={loading}
                        onAction={handleAction}
                        onDeliver={handleDeliver}
                        onCopyMessage={handleCopyMessage}
                        onRenewWithInventory={handleRenewWithInventory}
                    />
                </TabsContent>
            </Tabs>

            <SalesDialog
                open={isSellOpen}
                onOpenChange={setIsSellOpen}
                item={sellItem}
                customers={customers}
                initialCustomerName={sellCustomerName}
                initialContact={sellContact}
            />
        </div>
    );
}
