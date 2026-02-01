'use client';

import { useState } from 'react';
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
import { SubscriptionWithCustomer } from '@/types';
import { format, addMonths, addDays } from 'date-fns';
import { toast } from 'sonner';
import { renewSubscriptionAction } from '@/app/actions';
import { Check, Loader2 } from 'lucide-react';
import { InventoryItem } from '@/lib/db/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/business';

interface RenewDialogProps {
    subscription: SubscriptionWithCustomer;
    children: React.ReactNode;
    onSuccess?: () => void;
}

export function RenewDialog({ subscription, children, onSuccess, inventoryItems = [] }: RenewDialogProps & { inventoryItems?: InventoryItem[] }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form states for controlled inputs to allow auto-fill
    const [service, setService] = useState(subscription.service);
    const [accountInfo, setAccountInfo] = useState(subscription.accountInfo || '');
    const [cost, setCost] = useState(subscription.cost || 0);

    // Calculate default dates
    const defaultStartDate = format(new Date(), 'yyyy-MM-dd');
    const defaultEndDate = format(addMonths(new Date(), 1), 'yyyy-MM-dd');

    const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');

    // Filter available items for the current service (Loose match)
    const matchingInventory = inventoryItems.filter(
        i => i.status === 'available' && i.service.toLowerCase().includes(service.toLowerCase())
    );

    const handleInventorySelect = (itemId: string) => {
        const item = inventoryItems.find(i => i.id === parseInt(itemId));
        if (item) {
            setAccountInfo(item.secretPayload);
            setCost(item.cost || 0);
            setSelectedInventoryId(itemId);
            toast.success(`Đã lấy thông tin từ kho: ${item.service}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            await renewSubscriptionAction(subscription.id, formData);
            toast.success('Đã gia hạn thành công!');
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            toast.error('Có lỗi xảy ra khi gia hạn');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Gia hạn: {subscription.customerName}</DialogTitle>
                </DialogHeader>

                {/* Quick inventory pick */}
                {matchingInventory.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                        <Label className="text-blue-700 mb-1.5 block">Có {matchingInventory.length} tài khoản trong kho:</Label>
                        <Select onValueChange={handleInventorySelect}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Chọn tài khoản từ kho..." />
                            </SelectTrigger>
                            <SelectContent>
                                {matchingInventory.map(item => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                        #{item.id} - {item.secretPayload.substring(0, 30)}... ({formatCurrency(item.cost)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div>
                        <Label htmlFor="customerName">Tên khách hàng</Label>
                        <Input
                            name="customerName"
                            defaultValue={subscription.customerName}
                            placeholder="VD: Nguyễn Văn A"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="service">Dịch vụ</Label>
                        <Input
                            name="service"
                            value={service}
                            onChange={(e) => setService(e.target.value)}
                            placeholder="VD: ChatGPT Plus"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="startDate">Ngày bắt đầu</Label>
                            <Input
                                name="startDate"
                                type="date"
                                defaultValue={defaultStartDate}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="endDate">Ngày kết hạn</Label>
                            <Input
                                name="endDate"
                                type="date"
                                defaultValue={defaultEndDate}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="revenue">Doanh thu (VNĐ)</Label>
                            <Input
                                name="revenue"
                                type="number"
                                defaultValue={subscription.revenue || 0}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="cost">Chi phí (VNĐ)</Label>
                            <Input
                                name="cost"
                                type="number"
                                value={cost}
                                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="accountInfo">Tên tài khoản</Label>
                        <div className="relative">
                            <Input
                                name="accountInfo"
                                value={accountInfo}
                                onChange={(e) => setAccountInfo(e.target.value)}
                                placeholder="VD: email@gmail.com | pass"
                            />
                            <input type="hidden" name="inventoryId" value={selectedInventoryId} />
                            {/* Hidden input to pass inventory ID if we want to track it later, 
                                but current action doesn't support linking inventory on renew yet. 
                                For now just using data is enough. */}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="note">Ghi chú</Label>
                        <Input
                            name="note"
                            defaultValue={subscription.note || ''}
                            placeholder="Ghi chú thêm..."
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            name="paymentStatus"
                            id="paymentStatus"
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <Label htmlFor="paymentStatus" className="font-normal cursor-pointer text-gray-700">
                            Đã thanh toán (Hiện trong 'Hoàn tất hôm nay')
                        </Label>
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                        Xác nhận gia hạn
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
