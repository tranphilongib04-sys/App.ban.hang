'use client';

import { CustomerWithStats, SubscriptionWithCustomer } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrdersTable } from '@/components/orders/orders-table';
import { ArrowLeft, Edit, Mail, Phone, Tag, Calendar, DollarSign, ShoppingCart, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/business';
import { useState } from 'react';
import { toast } from 'sonner';

interface CustomerDetailsClientProps {
    customer: CustomerWithStats;
    subscriptions: SubscriptionWithCustomer[];
}

export function CustomerDetailsClient({ customer, subscriptions }: CustomerDetailsClientProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<Record<number, string>>({});

    // Mock actions handler for OrdersTable
    const handleAction = async (id: number, action: string, fn: () => Promise<void>) => {
        setIsLoading(prev => ({ ...prev, [id]: action }));
        try {
            await fn();
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        } finally {
            setIsLoading(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            router.refresh();
        }
    };

    // Mock handler for delivery
    const handleDeliver = async (sub: SubscriptionWithCustomer) => {
        // Implement if needed or pass dummy
        toast.info('Tính năng giao hàng đang được cập nhật ở trang chi tiết');
    };

    const handleCopyMessage = async (sub: SubscriptionWithCustomer) => {
        // Implement if needed or pass dummy
        toast.info('Tính năng copy tin nhắn đang được cập nhật ở trang chi tiết');
    };

    const handleRenewWithInventory = (sub: SubscriptionWithCustomer) => {
        // Implement if needed or pass dummy
        toast.info('Tính năng gia hạn kho đang được cập nhật ở trang chi tiết');
    };

    return (
        <div className="space-y-6">
            {/* Header / Back Button */}
            <div className="flex items-center gap-4">
                <Link href="/customers">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {customer.name}
                        {customer.segment === 'vip' && <Badge className="bg-yellow-500 hover:bg-yellow-600">VIP</Badge>}
                        {customer.segment === 'priority' && <Badge className="bg-purple-500 hover:bg-purple-600">Priority</Badge>}
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Customer Info */}
                <div className="space-y-6 lg:col-span-1">
                    <Card className="border-white/40 shadow-sm bg-white/60 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-indigo-500" />
                                Thông tin khách hàng
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Liên hệ</div>
                                <div className="flex items-center gap-2 text-gray-900 font-medium">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    {customer.contact || '--'}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Nguồn</div>
                                <div className="flex items-center gap-2 text-gray-900">
                                    <Tag className="h-4 w-4 text-gray-400" />
                                    <Badge variant="outline" className="bg-slate-50 text-slate-700 font-normal">
                                        {customer.source || 'Unknown'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ghi chú</div>
                                <div className="p-3 bg-white/50 rounded-lg border border-gray-100 text-sm text-gray-600 italic">
                                    {customer.note || 'Không có ghi chú'}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-dashed border-gray-200 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-gray-500">Tổng chi tiêu</div>
                                    <div className="text-lg font-bold text-emerald-600">{formatCurrency(customer.totalRevenue)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Tổng đơn hàng</div>
                                    <div className="text-lg font-bold text-blue-600">{customer.totalOrders}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Order History */}
                <div className="space-y-6 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-indigo-500" />
                            Lịch sử đơn hàng
                        </h2>
                    </div>

                    <OrdersTable
                        subscriptions={subscriptions}
                        loading={isLoading}
                        onAction={handleAction}
                        onDeliver={handleDeliver}
                        onCopyMessage={handleCopyMessage}
                        onRenewWithInventory={handleRenewWithInventory}
                    />
                </div>
            </div>
        </div>
    );
}
