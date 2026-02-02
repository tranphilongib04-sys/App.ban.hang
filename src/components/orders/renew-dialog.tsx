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
import { format, addMonths } from 'date-fns';
import { toast } from 'sonner';
import { renewSubscriptionAction } from '@/app/actions';
import { Check, Loader2, Package } from 'lucide-react';
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

    // All available inventory; matching = same service (loose match)
    const availableItems = inventoryItems.filter(i => i.status === 'available');
    const matchingInventory = availableItems.filter(
        i => i.service.toLowerCase().includes(service.toLowerCase())
    );
    const otherInventory = availableItems.filter(
        i => !service || !i.service.toLowerCase().includes(service.toLowerCase())
    );

    const handleInventorySelect = (itemId: string) => {
        if (!itemId || itemId === '__none__') {
            setSelectedInventoryId('');
            setAccountInfo(subscription.accountInfo || '');
            setCost(subscription.cost || 0);
            setService(subscription.service);
            return;
        }
        const item = inventoryItems.find(i => i.id === parseInt(itemId));
        if (item) {
            setService(item.service);
            setAccountInfo(item.secretPayload);
            setCost(item.cost || 0);
            setSelectedInventoryId(itemId);
            toast.success(`Đã lấy hàng từ kho: ${item.service} #${item.id}`);
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

                {/* Lấy hàng từ kho - luôn hiển thị khi có hàng available */}
                {availableItems.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <Label className="text-blue-800 font-medium">Lấy hàng từ kho</Label>
                        </div>
                        <p className="text-sm text-blue-700 mb-2">
                            Chọn 1 mã từ kho để điền sẵn Tài khoản, Dịch vụ, Chi phí và trừ tồn kho khi xác nhận.
                        </p>
                        <Select value={selectedInventoryId || '__none__'} onValueChange={handleInventorySelect}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Chọn mã hàng từ kho..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">— Không lấy từ kho —</SelectItem>
                                {matchingInventory.length > 0 && (
                                    <>
                                        <SelectItem value="_label_match" disabled className="text-xs text-muted-foreground font-medium">
                                            Cùng dịch vụ ({matchingInventory.length})
                                        </SelectItem>
                                        {matchingInventory.map(item => (
                                            <SelectItem key={item.id} value={item.id.toString()}>
                                                #{item.id} · {item.service} · {item.secretPayload.substring(0, 25)}... · {formatCurrency(item.cost)}
                                            </SelectItem>
                                        ))}
                                    </>
                                )}
                                {otherInventory.length > 0 && (
                                    <>
                                        <SelectItem value="_label_other" disabled className="text-xs text-muted-foreground font-medium">
                                            Khác dịch vụ ({otherInventory.length})
                                        </SelectItem>
                                        {otherInventory.map(item => (
                                            <SelectItem key={item.id} value={item.id.toString()}>
                                                #{item.id} · {item.service} · {item.secretPayload.substring(0, 25)}... · {formatCurrency(item.cost)}
                                            </SelectItem>
                                        ))}
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                        {selectedInventoryId && (
                            <p className="text-xs text-blue-600 mt-2">Đã chọn mã #{selectedInventoryId} — sẽ trừ tồn kho khi bấm Xác nhận gia hạn.</p>
                        )}
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
                            <input type="hidden" name="inventoryId" value={selectedInventoryId && selectedInventoryId !== '__none__' ? selectedInventoryId : ''} />
                            {/* inventoryId được gửi lên server: đánh dấu item delivered và tạo bản ghi delivery */}
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
